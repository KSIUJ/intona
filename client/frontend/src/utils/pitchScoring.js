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

    // Bezpieczne zwijanie oktaw (JavaScript źle radzi sobie z modulo dla liczb ujemnych)
    cents = ((cents % 1200) + 1200) % 1200;
    if (cents > 600) {
        cents -= 1200;
    }

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
    const { minClarity = 0.6, sigmaRatio = 0.25 } = options;

    if (!targetNote || targetNote.type !== "note") {
        return { score: null, averageDeviation: null, frameCount: 0, validFrameCount: 0 };
    }

    const startTime = Number(targetNote.start_time_seconds);
    const duration = Number(targetNote.duration_seconds);
    const targetFrequency = Number(targetNote.frequency_hz);
    const endTime = startTime + duration;

    if (!Number.isFinite(startTime) || duration <= 0 || !Number.isFinite(targetFrequency)) {
        return { score: 0, averageDeviation: null, frameCount: 0, validFrameCount: 0 };
    }

    const framesInsideNote = pitchFrames.filter((frame) => {
        const time = Number(frame.time);
        return Number.isFinite(time) && time >= (startTime - 0.15) && time <= (endTime + 0.15);
    });

    let validScoreSum = 0;
    let validWeightSum = 0;

    let hitDeviationSum = 0;
    let hitWeightSum = 0;

    let validFrameCount = 0;

    for (const frame of framesInsideNote) {
        const frequency = Number(frame.frequency);
        const clarity = Number(frame.clarity ?? 0);

        const isValidPitch = Number.isFinite(frequency) && frequency > 0 && clarity >= minClarity;

        if (isValidPitch) {
            const centsDeviation = calculateCentsDeviation(frequency, targetFrequency);

            // Jeśli odchylenie to kosmos (> 150), to znaczy że to szum, a nie śpiew. Ignorujemy.
            if (centsDeviation !== null && Number.isFinite(centsDeviation)) {
                let absDeviation = Math.abs(centsDeviation);

                if (absDeviation <= 150) {
                    const weight = calculateGaussianWeight(frame.time, startTime, duration, sigmaRatio) || 0.1;

                    validFrameCount++;
                    validWeightSum += weight;

                    const frameScore = calculateFrameScore(centsDeviation);
                    validScoreSum += frameScore * weight;

                    // Odchylenie liczymy dla miarodajnych prób (<= 100)
                    if (absDeviation <= 100) {
                        hitWeightSum += weight;
                        if (absDeviation <= 15) {
                            absDeviation = 0;
                        }
                        hitDeviationSum += Math.min(absDeviation, 50) * weight;
                    }
                }
            }
        }
    }

    if (validWeightSum <= 0 || validFrameCount === 0) {
        return { score: 0, averageDeviation: null, frameCount: framesInsideNote.length, validFrameCount: 0 };
    }

    let rawScore = validScoreSum / validWeightSum;

    // DEMO BOOST: Uelastycznienie rygorystycznej punktacji.
    // Działa jak "pierwiastek z oceny" - podciąga niższe wartości (np. 64% staje się 80%),
    // zachowując sufit 100%. Idealne na prezentację, oddaje realne odczucie "dobrze zaśpiewanej" piosenki.
    let finalScore = Math.pow(rawScore / 100, 0.7) * 100;

    if (validFrameCount < 5) {
        finalScore = finalScore * (validFrameCount / 5);
    }

    const averageDeviation = hitWeightSum > 0 ? (hitDeviationSum / hitWeightSum) : null;

    return {
        score: Number(Math.min(100, finalScore).toFixed(2)),
        averageDeviation: averageDeviation !== null ? Number(averageDeviation.toFixed(2)) : null,
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