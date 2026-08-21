import numpy as np
from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from src.auth.dependencies import CurrentUser
from src.database import SessionDep
from src.exercises.models import Exercise
from src.logs.models import ExerciseLogs
from src.vocal_analysis.schemas import ExerciseSubmission, ExerciseEvaluationResponse, NoteScoreResult
from src.vocal_analysis.scoring import score_note, calculate_cents_deviation
from src.vocal_analysis.utils import add_exercise_result, fetch_target_notes_from_s3

router = APIRouter()

@router.post("/submit", response_model=ExerciseEvaluationResponse, status_code=status.HTTP_201_CREATED)
async def evaluate_and_save_exercise(
    submission: ExerciseSubmission,
    session: SessionDep,
    user: CurrentUser,
):
    # Calculates the result based on the provided frequencies (Pitchy) and the `results.json` file downloaded from S3.

    # validation of the existence and processing status of the exercise in the database
    result = await session.exec(select(Exercise).where(Exercise.id == submission.exercise_id))
    exercise = result.first()

    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with id {submission.exercise_id} not found",
        )

    if not exercise.processed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Exercise is not processed yet",
        )

    # Downloading reference scores directly from S3 (results.json)
    target_notes = fetch_target_notes_from_s3(exercise.id)

    performed_map = {p.note_index: p.detected_pitches for p in submission.performed_notes}
    notes_breakdown = []
    all_cents_deviations = []

    # Evaluation of recorded frequencies against reference notes from S3
    for idx, target_note in enumerate(target_notes):
        detected_pitches = performed_map.get(idx, [])
        target_freq = target_note["target_freq_hz"]
        expected_duration = target_note["expected_duration_sec"]

        note_score = score_note(
            detected_pitches=detected_pitches,
            target_freq_hz=target_freq,
            expected_duration_sec=expected_duration,
        )

        for pitch in detected_pitches:
            if pitch > 0:
                dev = calculate_cents_deviation(pitch, target_freq)
                all_cents_deviations.append(abs(dev))

        notes_breakdown.append(
            NoteScoreResult(
                note_index=idx,
                target_freq_hz=target_freq,
                score=note_score,
            )
        )

    # Calculating the summary
    overall_score = round(float(np.mean([n.score for n in notes_breakdown])), 2) if notes_breakdown else 0.0
    average_deviation = round(float(np.mean(all_cents_deviations)), 2) if all_cents_deviations else 0.0

    # Database write and statistics update
    new_log = ExerciseLogs(
        exercise_id=exercise.id,
        exercise_duration=submission.exercise_duration_ms,
        time_in_tune=overall_score,
        average_deviation=average_deviation,
        attempting_user_id=user.id,
    )

    session.add(new_log)
    await session.commit()
    await session.refresh(new_log)

    await add_exercise_result(user_id=user.id, exerciseLog=new_log, db=session)

    return ExerciseEvaluationResponse(
        log_id=new_log.id,
        exercise_id=exercise.id,
        overall_score=overall_score,
        average_cents_deviation=average_deviation,
        exercise_duration_ms=submission.exercise_duration_ms,
        notes_breakdown=notes_breakdown,
    )