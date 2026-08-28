const DEFAULT_MIN_CLARITY = 0.9;
const PERFECT_CENTS = 15;
const MAX_CENTS_ERROR = 50;
const DEFAULT_SIGMA_RATIO = 0.25;

const MAX_CORRECTION_DISTANCE_CENTS = 120;
const MIN_HARMONIC_CHECK_HZ = 900;
const HARMONIC_DIVISORS = [3, 5];
const OCTAVE_SHIFTS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];


export function normalizeTargetNotes(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.notes)) {
        return data.notes;
    }

    if (
        Array.isArray(
            data?.["processed data"]?.notes
        )
    ) {
        return data["processed data"].notes;
    }

    return [];
}


function rawCentsDeviation(
    detectedFrequency,
    targetFrequency
) {
    return (
        1200 *
        Math.log2(
            detectedFrequency /
            targetFrequency
        )
    );
}


function getOctaveCandidates(
    frequency
) {
    return OCTAVE_SHIFTS.map(
        (shift) =>
            frequency *
            Math.pow(2, shift)
    );
}


/*
 * Pitchy may detect:
 *
 * - the correct fundamental,
 * - the same pitch in another octave,
 * - a strong 3rd / 5th harmonic.
 *
 * For scoring we select the plausible candidate
 * closest to the expected target frequency.
 *
 * A completely unrelated frequency is NOT forced
 * onto the target note. Correction is used only
 * if a candidate is within 120 cents.
 */
export function normalizeDetectedFrequencyToTarget(
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

    const originalDeviation =
        Math.abs(
            rawCentsDeviation(
                detectedFrequency,
                targetFrequency
            )
        );

    let bestFrequency =
        detectedFrequency;

    let bestDeviation =
        originalDeviation;


    /*
     * Always allow octave normalization.
     *
     * This makes the exercise usable by people
     * with different vocal ranges while still
     * requiring the same musical pitch class.
     */
    const octaveCandidates =
        getOctaveCandidates(
            detectedFrequency
        );

    for (
        const candidate
        of octaveCandidates
    ) {
        if (
            !Number.isFinite(candidate) ||
            candidate <= 0
        ) {
            continue;
        }

        const deviation =
            Math.abs(
                rawCentsDeviation(
                    candidate,
                    targetFrequency
                )
            );

        if (
            deviation <
            bestDeviation
        ) {
            bestFrequency =
                candidate;

            bestDeviation =
                deviation;
        }
    }


    /*
     * Very high Pitchy results may represent
     * strong vocal harmonics instead of the
     * fundamental frequency.
     */
    if (
        detectedFrequency >=
        MIN_HARMONIC_CHECK_HZ
    ) {
        for (
            const divisor
            of HARMONIC_DIVISORS
        ) {
            const fundamentalCandidate =
                detectedFrequency /
                divisor;

            const harmonicCandidates =
                getOctaveCandidates(
                    fundamentalCandidate
                );

            for (
                const candidate
                of harmonicCandidates
            ) {
                if (
                    !Number.isFinite(
                        candidate
                    ) ||
                    candidate <= 0
                ) {
                    continue;
                }

                const deviation =
                    Math.abs(
                        rawCentsDeviation(
                            candidate,
                            targetFrequency
                        )
                    );

                if (
                    deviation <
                    bestDeviation
                ) {
                    bestFrequency =
                        candidate;

                    bestDeviation =
                        deviation;
                }
            }
        }
    }


    /*
     * Never convert arbitrary noise into
     * a valid musical note.
     */
    if (
        bestDeviation >
        MAX_CORRECTION_DISTANCE_CENTS
    ) {
        return detectedFrequency;
    }

    return bestFrequency;
}


export function calculateCentsDeviation(
    detectedFrequency,
    targetFrequency
) {
    const normalizedFrequency =
        normalizeDetectedFrequencyToTarget(
            detectedFrequency,
            targetFrequency
        );

    if (
        normalizedFrequency === null
    ) {
        return null;
    }

    return rawCentsDeviation(
        normalizedFrequency,
        targetFrequency
    );
}


export function calculateFrameScore(
    centsDeviation
) {
    if (
        centsDeviation === null ||
        centsDeviation === undefined ||
        !Number.isFinite(
            centsDeviation
        )
    ) {
        return 0;
    }

    const absoluteDeviation =
        Math.abs(
            centsDeviation
        );

    if (
        absoluteDeviation <=
        PERFECT_CENTS
    ) {
        return 100;
    }

    if (
        absoluteDeviation >=
        MAX_CENTS_ERROR
    ) {
        return 0;
    }

    return (
        100 *
        (
            1 -
            (
                absoluteDeviation -
                PERFECT_CENTS
            ) /
            (
                MAX_CENTS_ERROR -
                PERFECT_CENTS
            )
        )
    );
}


export function calculateGaussianWeight(
    timeSeconds,
    startTimeSeconds,
    durationSeconds,
    sigmaRatio =
        DEFAULT_SIGMA_RATIO
) {
    if (
        !Number.isFinite(timeSeconds) ||
        !Number.isFinite(
            startTimeSeconds
        ) ||
        !Number.isFinite(
            durationSeconds
        ) ||
        durationSeconds <= 0
    ) {
        return 0;
    }

    const endTimeSeconds =
        startTimeSeconds +
        durationSeconds;

    if (
        timeSeconds <
            startTimeSeconds ||
        timeSeconds >
            endTimeSeconds
    ) {
        return 0;
    }

    const center =
        startTimeSeconds +
        durationSeconds / 2;

    const sigma =
        durationSeconds *
        sigmaRatio;

    if (sigma <= 0) {
        return 1;
    }

    const distance =
        (
            timeSeconds -
            center
        ) /
        sigma;

    return Math.exp(
        -0.5 *
        distance *
        distance
    );
}


export function findActiveTargetNote(
    targetNotes,
    timeSeconds
) {
    if (
        !Array.isArray(
            targetNotes
        ) ||
        !Number.isFinite(
            timeSeconds
        )
    ) {
        return null;
    }

    return (
        targetNotes.find(
            (note) => {
                if (
                    note?.type !==
                    "note"
                ) {
                    return false;
                }

                const start =
                    Number(
                        note.start_time_seconds
                    );

                const duration =
                    Number(
                        note.duration_seconds
                    );

                if (
                    !Number.isFinite(
                        start
                    ) ||
                    !Number.isFinite(
                        duration
                    ) ||
                    duration <= 0
                ) {
                    return false;
                }

                const end =
                    start +
                    duration;

                return (
                    timeSeconds >=
                        start &&
                    timeSeconds <
                        end
                );
            }
        ) ?? null
    );
}


export function calculateNoteScore(
    targetNote,
    pitchFrames,
    options = {}
) {
    const {
        minClarity =
            DEFAULT_MIN_CLARITY,

        sigmaRatio =
            DEFAULT_SIGMA_RATIO,
    } = options;

    if (
        !targetNote ||
        !Array.isArray(
            pitchFrames
        )
    ) {
        return {
            score: 0,
            averageDeviation: null,
            frameCount: 0,
            validFrameCount: 0,
        };
    }

    if (
        targetNote.type !==
        "note"
    ) {
        return {
            score: null,
            averageDeviation: null,
            frameCount: 0,
            validFrameCount: 0,
        };
    }

    const startTime =
        Number(
            targetNote.start_time_seconds
        );

    const duration =
        Number(
            targetNote.duration_seconds
        );

    const targetFrequency =
        Number(
            targetNote.frequency_hz
        );

    if (
        !Number.isFinite(
            startTime
        ) ||
        !Number.isFinite(
            duration
        ) ||
        duration <= 0 ||
        !Number.isFinite(
            targetFrequency
        ) ||
        targetFrequency <= 0
    ) {
        return {
            score: 0,
            averageDeviation: null,
            frameCount: 0,
            validFrameCount: 0,
        };
    }

    const endTime =
        startTime +
        duration;

    const framesInsideNote =
        pitchFrames.filter(
            (frame) => {
                const time =
                    Number(
                        frame.time
                    );

                return (
                    Number.isFinite(
                        time
                    ) &&
                    time >=
                        startTime &&
                    time <
                        endTime
                );
            }
        );

    if (
        framesInsideNote.length ===
        0
    ) {
        return {
            score: 0,
            averageDeviation: null,
            frameCount: 0,
            validFrameCount: 0,
        };
    }

    let weightedScoreSum = 0;
    let totalWeight = 0;

    let weightedDeviationSum = 0;
    let validDeviationWeight = 0;

    let validFrameCount = 0;

    for (
        const frame
        of framesInsideNote
    ) {
        const weight =
            calculateGaussianWeight(
                Number(
                    frame.time
                ),
                startTime,
                duration,
                sigmaRatio
            );

        if (
            weight <= 0
        ) {
            continue;
        }

        /*
         * Missing / unclear frames still count
         * in the denominator and therefore
         * lower the final score.
         */
        totalWeight +=
            weight;

        const frequency =
            Number(
                frame.frequency
            );

        const clarity =
            Number(
                frame.clarity ??
                0
            );

        const isValidPitch =
            Number.isFinite(
                frequency
            ) &&
            frequency > 0 &&
            clarity >=
                minClarity;

        if (
            !isValidPitch
        ) {
            continue;
        }

        validFrameCount +=
            1;

        const centsDeviation =
            calculateCentsDeviation(
                frequency,
                targetFrequency
            );

        const frameScore =
            calculateFrameScore(
                centsDeviation
            );

        weightedScoreSum +=
            frameScore *
            weight;

        if (
            centsDeviation !==
                null &&
            Number.isFinite(
                centsDeviation
            )
        ) {
            weightedDeviationSum +=
                Math.abs(
                    centsDeviation
                ) *
                weight;

            validDeviationWeight +=
                weight;
        }
    }

    const score =
        totalWeight > 0
            ? weightedScoreSum /
              totalWeight
            : 0;

    const averageDeviation =
        validDeviationWeight > 0
            ? weightedDeviationSum /
              validDeviationWeight
            : null;

    return {
        score:
            Number(
                score.toFixed(2)
            ),

        averageDeviation:
            averageDeviation ===
            null
                ? null
                : Number(
                    averageDeviation.toFixed(
                        2
                    )
                ),

        frameCount:
            framesInsideNote.length,

        validFrameCount,
    };
}


export function calculateExerciseScore(
    jsonData,
    pitchFrames,
    options = {}
) {
    const allEntries =
        normalizeTargetNotes(
            jsonData
        );

    const targetNotes =
        allEntries.filter(
            (entry) =>
                entry?.type ===
                    "note" &&
                Number.isFinite(
                    Number(
                        entry.frequency_hz
                    )
                ) &&
                Number(
                    entry.frequency_hz
                ) >
                    0
        );

    if (
        targetNotes.length ===
        0
    ) {
        return {
            score: 0,
            averageDeviation: null,
            totalNotes: 0,
            notesWithDetectedPitch: 0,
            noteScores: [],
        };
    }

    const noteScores =
        targetNotes.map(
            (
                targetNote,
                noteIndex
            ) => {
                const result =
                    calculateNoteScore(
                        targetNote,
                        pitchFrames,
                        options
                    );

                return {
                    noteIndex,

                    pitch:
                        targetNote.pitch ??
                        null,

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

                    ...result,
                };
            }
        );

    const score =
        noteScores.reduce(
            (
                sum,
                note
            ) =>
                sum +
                note.score,
            0
        ) /
        noteScores.length;

    const deviations =
        noteScores
            .map(
                (note) =>
                    note.averageDeviation
            )
            .filter(
                (value) =>
                    value !==
                        null &&
                    Number.isFinite(
                        value
                    )
            );

    const averageDeviation =
        deviations.length > 0
            ? deviations.reduce(
                (
                    sum,
                    value
                ) =>
                    sum +
                    value,
                0
            ) /
              deviations.length
            : null;

    const notesWithDetectedPitch =
        noteScores.filter(
            (note) =>
                note.validFrameCount >
                0
        ).length;

    return {
        score:
            Number(
                score.toFixed(2)
            ),

        averageDeviation:
            averageDeviation ===
            null
                ? null
                : Number(
                    averageDeviation.toFixed(
                        2
                    )
                ),

        totalNotes:
            targetNotes.length,

        notesWithDetectedPitch,

        noteScores,
    };
}