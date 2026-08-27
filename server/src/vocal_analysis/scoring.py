import numpy as np


def calculate_frame_score(freq_hz: float, target_freq_hz: float) -> float:
    """
    Calculates a score [0–100] for a single audio frame based on the deviation in cents.
    - ideal zone (0–15 cents)
    - linear decline zone (15–50 cents)
    - error zone (>50 cents – more than a semitone)
    """
    if freq_hz <= 0 or target_freq_hz <= 0:
        return 0.0
    cents_error = abs(1200 * np.log2(freq_hz / target_freq_hz))

    if cents_error <= 15:
        return 100.0
    elif cents_error <= 50:
        return 100.0 - (cents_error - 15) * (100.0 / 35.0)
    else:
        return 0.0


def calculate_cents_deviation(freq_hz: float, target_freq_hz: float) -> float:
    # Returns the deviation in cents, including the sign (+ for higher, - for lower).
    if freq_hz <= 0 or target_freq_hz <= 0:
        return 0.0
    return float(1200 * np.log2(freq_hz / target_freq_hz))


def score_note(
    detected_pitches: list[float],
    target_freq_hz: float,
    expected_duration_sec: float,
    frame_rate_fps: float = 50.0,
) -> float:
    # Calculates the result for a single note using Gaussian weighting.
    if not detected_pitches:
        return 0.0

    n_frames = len(detected_pitches)
    frame_scores = np.array([calculate_frame_score(f, target_freq_hz) for f in detected_pitches])

    if n_frames == 1:
        weights = np.array([1.0])
    else:
        x = np.linspace(-1, 1, n_frames)
        sigma = 0.5
        weights = np.exp(-0.5 * (x / sigma) ** 2)

    pitch_score = np.sum(frame_scores * weights) / np.sum(weights)

    expected_frames = expected_duration_sec * frame_rate_fps
    actual_sung_frames = sum(1 for f in detected_pitches if f > 0)

    duration_factor = min(1.0, actual_sung_frames / expected_frames) if expected_frames > 0 else 0.0
    final_note_score = pitch_score * duration_factor

    return round(float(final_note_score), 2)


def score_exercise(notes_data: list[dict], frame_rate_fps: float = 50.0) -> float:
    # Calculates the final result of the entire exercise based on the notes played.
    if not notes_data:
        return 0.0

    scores = [
        score_note(
            note["detected_pitches"],
            note["target_freq_hz"],
            note["expected_duration_sec"],
            frame_rate_fps,
        )
        for note in notes_data
    ]
    return round(float(np.mean(scores)), 2)