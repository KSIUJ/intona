/**
 * Frontend pitch scoring for Intona.
 *
 * Scoring rules:
 * - reference notes come from results.json
 * - rests are ignored
 * - detected microphone frequency is compared with target frequency in cents
 * - frames near the middle of a target note have higher importance
 *   using a Gaussian time weight
 * - unclear / missing pitch frames count as 0 points
 */

const DEFAULT_MIN_CLARITY = 0.9;
const PERFECT_CENTS = 15;
const MAX_CENTS_ERROR = 50;
const DEFAULT_SIGMA_RATIO = 0.25;

/**
 * Extracts target note entries from supported JSON shapes.
 *
 * Supported:
 * - direct array
 * - { notes: [...] }
 * - { "processed data": { notes: [...] } }
 */
export function normalizeTargetNotes(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.notes)) {
        return data.notes;
    }

    if (Array.isArray(data?.["processed data"]?.notes)) {
        return data["processed data"].notes;
    }

    return [];
}

/**
 * Difference between detected and target frequency in cents.
 *
 * 0 cents  = exact pitch
 * positive = too high / sharp
 * negative = too low / flat
 */
export function calculateCentsDeviation(
    detectedFrequency,
    targetFrequency
) {
    if (
        !Number.isFinite(detectedFrequency) ||
        !Number.isFinite(targetFrequency) ||
        detectedFrequency <= 0 ||
        targetFrequency <= 0
    ) {
        return null;
    }

    let cents = 1200 * Math.log2(detectedFrequency / targetFrequency);

    // Zwijanie oktaw (Octave folding)
    cents = cents % 1200;
    if (cents > 600) cents -= 1200;
    if (cents < -600) cents += 1200;

    return cents;
}

/**
 * Converts pitch deviation into 0-100 points.
 *
 * 0-15 cents  -> 100 points
 * 15-50 cents -> linear decrease
 * >= 50 cents -> 0 points
 *
 * Gaussian weighting is intentionally NOT applied here.
 * Gaussian weighting is used for the position of the frame
 * inside the duration of the target note.
 */
export function calculateFrameScore(centsDeviation) {
    if (
        centsDeviation === null ||
        centsDeviation === undefined ||
        !Number.isFinite(centsDeviation)
    ) {
        return 0;
    }

    const absoluteDeviation = Math.abs(centsDeviation);

    if (absoluteDeviation <= PERFECT_CENTS) {
        return 100;
    }

    if (absoluteDeviation >= MAX_CENTS_ERROR) {
        return 0;
    }

    const range = MAX_CENTS_ERROR - PERFECT_CENTS;
    const distance = absoluteDeviation - PERFECT_CENTS;

    return 100 * (1 - distance / range);
}

/**
 * Gaussian weight based on the frame position inside a note.
 *
 * The middle of the note receives weight 1.
 * Frames close to the beginning/end receive much lower weights.
 *
 * With sigmaRatio = 0.25:
 *
 * start       middle        end
 * ~0.135        1.0        ~0.135
 */
export function calculateGaussianWeight(
    timeSeconds,
    startTimeSeconds,
    durationSeconds,
    sigmaRatio = DEFAULT_SIGMA_RATIO
) {
    if (
        !Number.isFinite(timeSeconds) ||
        !Number.isFinite(startTimeSeconds) ||
        !Number.isFinite(durationSeconds) ||
        durationSeconds <= 0
    ) {
        return 0;
    }

    const endTimeSeconds =
        startTimeSeconds + durationSeconds;

    if (
        timeSeconds < startTimeSeconds ||
        timeSeconds > endTimeSeconds
    ) {
        return 0;
    }

    const center =
        startTimeSeconds + durationSeconds / 2;

    const sigma =
        durationSeconds * sigmaRatio;

    if (sigma <= 0) {
        return 1;
    }

    const distance =
        (timeSeconds - center) / sigma;

    return Math.exp(
        -0.5 * distance * distance
    );
}

/**
 * Returns the reference note active at a specific audio time.
 *
 * Rests are ignored.
 */
export function findActiveTargetNote(
    targetNotes,
    timeSeconds
) {
    if (
        !Array.isArray(targetNotes) ||
        !Number.isFinite(timeSeconds)
    ) {
        return null;
    }

    return (
        targetNotes.find((note) => {
            if (note?.type !== "note") {
                return false;
            }

            const start =
                Number(note.start_time_seconds);

            const duration =
                Number(note.duration_seconds);

            const end = start + duration;

            return (
                timeSeconds >= start &&
                timeSeconds < end
            );
        }) ?? null
    );
}

/**
 * Scores one target note using all microphone frames
 * captured during its duration.
 *
 * IMPORTANT:
 * Invalid / unclear frames remain part of the weighted average
 * and receive 0 points.
 *
 * This means silence or unreliable microphone detection
 * cannot accidentally result in a perfect score.
 */
export function calculateNoteScore(
    targetNote,
    pitchFrames,
    options = {}
) {
    const { minClarity = 0.9, sigmaRatio = 0.25, currentTime = null } = options;

    if (!targetNote || targetNote.type !== "note") {
        return {
            score: null,
            averageDeviation: null,
            frameCount: 0,
            validFrameCount: 0
        };
    }

    const startTime = Number(targetNote.start_time_seconds);
    const duration = Number(targetNote.duration_seconds);
    const targetFrequency = Number(targetNote.frequency_hz);
    const endTime = startTime + duration;

    if (
        !Number.isFinite(startTime) ||
        duration <= 0 ||
        !Number.isFinite(targetFrequency) ||
        targetFrequency <= 0
    ) {
        return {
            score: 0,
            averageDeviation: null,
            frameCount: 0,
            validFrameCount: 0
        };
    }

    const framesInsideNote = pitchFrames.filter((frame) => {
        const time = Number(frame.time);
        return Number.isFinite(time) && time >= startTime && time < endTime;
    });

    let weightedScoreSum = 0;
    let totalWeight = 0;
    let weightedDeviationSum = 0;
    let validDeviationWeight = 0;
    let validFrameCount = 0;

    for (const frame of framesInsideNote) {
        const weight = calculateGaussianWeight(frame.time, startTime, duration, sigmaRatio);
        if (weight <= 0) continue;

        totalWeight += weight;

        const frequency = Number(frame.frequency);
        const clarity = Number(frame.clarity ?? 0);
        const isValidPitch = Number.isFinite(frequency) && frequency > 0 && clarity >= minClarity;

        if (!isValidPitch) continue;

        validFrameCount += 1;
        const centsDeviation = calculateCentsDeviation(frequency, targetFrequency);
        const frameScore = calculateFrameScore(centsDeviation);

        weightedScoreSum += frameScore * weight;

        if (centsDeviation !== null && Number.isFinite(centsDeviation)) {
            // Capping: Blokujemy drastyczne skoki odchylenia na maksymalnie 50 centach.
            const cappedDeviation = Math.min(Math.abs(centsDeviation), 50);
            weightedDeviationSum += cappedDeviation * weight;
            validDeviationWeight += weight;
        }
    }

    // Oczekujemy klatek tylko do momentu bieżącego czasu audio
    const timeToEvaluate = currentTime !== null ? Math.min(currentTime, endTime) : endTime;
    const elapsedDurationForNote = Math.max(0, timeToEvaluate - startTime);

    // ~80ms na klatkę z Pitchy
    const expectedFrameCount = Math.floor(elapsedDurationForNote / 0.08);
    const missingFrames = Math.max(0, expectedFrameCount - framesInsideNote.length);

    if (missingFrames > 0) {
        // Wypełniamy puste miejsca wagą z wynikiem 0
        const averageExpectedWeight = 0.5;
        totalWeight += (missingFrames * averageExpectedWeight);
    }

    const score = totalWeight > 0 ? weightedScoreSum / totalWeight : 0;
    const averageDeviation = validDeviationWeight > 0 ? weightedDeviationSum / validDeviationWeight : null;

    return {
        score: Number(score.toFixed(2)),
        averageDeviation: averageDeviation === null ? null : Number(averageDeviation.toFixed(2)),
        frameCount: framesInsideNote.length,
        validFrameCount
    };
}

/**
 * Scores the complete exercise.
 *
 * Each musical note receives one note score.
 * Rests are ignored.
 *
 * Final exercise score is the average of note scores.
 */
export function calculateExerciseScore(
    jsonData,
    pitchFrames,
    options = {}
) {
    const allEntries =
        normalizeTargetNotes(jsonData);

    const targetNotes =
        allEntries.filter(
            (entry) =>
                entry?.type === "note" &&
                Number.isFinite(
                    Number(entry.frequency_hz)
                )
        );

    if (targetNotes.length === 0) {
        return {
            score: 0,
            averageDeviation: null,
            totalNotes: 0,
            notesWithDetectedPitch: 0,
            noteScores: []
        };
    }

    const noteScores =
        targetNotes.map((targetNote, noteIndex) => {
            const result =
                calculateNoteScore(
                    targetNote,
                    pitchFrames,
                    options
                );

            return {
                noteIndex,

                pitch:
                    targetNote.pitch ?? null,

                targetFrequency:
                    Number(
                        targetNote.frequency_hz
                    ),

                startTime:
                    Number(
                        targetNote.start_time_seconds
                    ),

                duration:
                    Number(
                        targetNote.duration_seconds
                    ),

                ...result
            };
        });

    const score =
        noteScores.reduce(
            (sum, note) =>
                sum + note.score,
            0
        ) / noteScores.length;

    const deviations =
        noteScores
            .map(
                (note) =>
                    note.averageDeviation
            )
            .filter(
                (value) =>
                    value !== null &&
                    Number.isFinite(value)
            );

    const averageDeviation =
        deviations.length > 0
            ? deviations.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) / deviations.length
            : null;

    const notesWithDetectedPitch =
        noteScores.filter(
            (note) =>
                note.validFrameCount > 0
        ).length;

    return {
        score:
            Number(score.toFixed(2)),

        averageDeviation:
            averageDeviation === null
                ? null
                : Number(
                    averageDeviation.toFixed(2)
                ),

        totalNotes:
            noteScores.length,

        notesWithDetectedPitch,

        noteScores
    };
}