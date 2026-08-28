import {useCallback, useEffect, useRef, useState} from "react";
import {useNavigate, useLocation, useParams} from "react-router-dom";
import {useMutation, useQueryClient} from "@tanstack/react-query";

import useAudio from "../hooks/useAudio";
import {usePitchDetection} from "../hooks/usePitchDetection.js";
import NoteHighway from "../components/NoteHighway";
import CentDeviationMeter from "./CentDeviationMeter.jsx";

import {
    calculateCentsDeviation,
    calculateExerciseScore,
    findActiveTargetNote,
    normalizeTargetNotes,
} from "../utils/pitchScoring";


const ENDING_STATUS = {
    ONGOING: "Ongoing",
    STOPPED: "Stopped",
    ENDED: "Ended",
};

const HIGHWAY_CARD_HEIGHT = 660;


function normalizeProcessedNotes(processedData) {
    const rawEntries =
        Array.isArray(processedData)
            ? processedData
            : Array.isArray(processedData?.notes)
                ? processedData.notes
                : Array.isArray(processedData?.["processed data"]?.notes)
                    ? processedData["processed data"].notes
                    : [];

    return rawEntries
        .filter((entry) => entry?.type === "note")
        .map((entry) => {
            const targetFrequencyHz =
                Number(entry.frequency_hz);

            const halfTone =
                Number.isFinite(targetFrequencyHz) &&
                targetFrequencyHz > 0
                    ? 12 *
                      Math.log2(
                          targetFrequencyHz / 440
                      ) +
                      57
                    : null;

            return {
                startTimeSeconds:
                    Number(
                        entry.start_time_seconds
                    ),

                durationSeconds:
                    Number(
                        entry.duration_seconds
                    ),

                halfTone,

                targetFrequencyHz,

                lyricText:
                    entry.lyric_text ?? null,
            };
        })
        .filter(
            (note) =>
                Number.isFinite(
                    note.startTimeSeconds
                ) &&
                Number.isFinite(
                    note.durationSeconds
                ) &&
                Number.isFinite(
                    note.halfTone
                )
        );
}


function clampDeviationForBackend(value) {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.min(
        100,
        Math.max(0, value)
    );
}


export default function OngoingExercise() {
    const queryClient =
        useQueryClient();

    const {
        id,
        exercise_slug
    } = useParams();

    const navigate =
        useNavigate();

    const locationData =
        useLocation();

    const {state} =
        locationData;

    const audio =
        useAudio(
            state.piano_presigned_url
        );


    /*
     * Raw results.json entries used by
     * Gaussian scoring.
     */
    const scoringEntriesRef =
        useRef(null);

    if (
        scoringEntriesRef.current ===
        null
    ) {
        scoringEntriesRef.current =
            normalizeTargetNotes(
                state.processed_data
            );
    }


    /*
     * Notes formatted for NoteHighway.
     */
    const targetNotesRef =
        useRef(null);

    if (
        targetNotesRef.current ===
        null
    ) {
        targetNotesRef.current =
            normalizeProcessedNotes(
                state.processed_data
            );
    }


    /*
     * Every microphone frame captured
     * while the backing track is playing.
     */
    const pitchFramesRef =
        useRef([]);

    const lastFrameTimeRef =
        useRef(null);

    const endingExerciseRef =
        useRef(false);

    const backUpIntervalId =
        useRef(0);

    const liveScoreRef =
        useRef(0);

    const liveDeviationRef =
        useRef(0);


    const [
        timeInTune,
        setTimeInTune
    ] = useState(0);

    const [
        averageDeviation,
        setAverageDeviation
    ] = useState(0);

    const [
        targetCents,
        setTargetCents
    ] = useState(null);


    /*
     * Receives every frame from Pitchy.
     *
     * We attach audio.currentTime here,
     * so each microphone frame can be
     * matched with the correct target note.
     */
    const handlePitchFrame =
        useCallback(
            (frame) => {
                const audioElement =
                    audio.audioRef.current;

                if (
                    !audioElement ||
                    audioElement.paused ||
                    audioElement.ended
                ) {
                    return;
                }


                /*
                 * Roughly 12 frames per second
                 * is enough for scoring and
                 * avoids unnecessary recalculation.
                 */
                const now =
                    performance.now();

                if (
                    lastFrameTimeRef.current &&
                    now -
                        lastFrameTimeRef.current <
                        80
                ) {
                    return;
                }

                lastFrameTimeRef.current =
                    now;


                const timeSeconds =
                    audioElement.currentTime;

                pitchFramesRef.current.push({
                    time:
                        timeSeconds,

                    frequency:
                        frame.frequency,

                    clarity:
                        frame.clarity,

                    isValid:
                        frame.isValid,
                });


                /*
                 * Live deviation is calculated
                 * against the CURRENT TARGET NOTE,
                 * not against the nearest chromatic note.
                 */
                const activeTargetNote =
                    findActiveTargetNote(
                        scoringEntriesRef.current,
                        timeSeconds
                    );

                if (
                    activeTargetNote &&
                    frame.isValid &&
                    Number.isFinite(
                        frame.frequency
                    )
                ) {
                    const deviation =
                        calculateCentsDeviation(
                            frame.frequency,
                            Number(
                                activeTargetNote.frequency_hz
                            )
                        );

                    if (
                        deviation !== null &&
                        Number.isFinite(
                            deviation
                        )
                    ) {
                        const meterDeviation =
                            Math.max(
                                -50,
                                Math.min(
                                    50,
                                    Math.round(
                                        deviation
                                    )
                                )
                            );

                        setTargetCents(
                            meterDeviation
                        );
                    }
                } else {
                    setTargetCents(null);
                }


                /*
                 * For LIVE scoring, exclude notes
                 * that have not started yet.
                 *
                 * Otherwise the beginning of the song
                 * would show a very low score because
                 * all future notes would count as zero.
                 */
                const elapsedEntries =
                    scoringEntriesRef.current
                        .filter((entry) => {
                            if (
                                entry?.type !==
                                "note"
                            ) {
                                return false;
                            }

                            const start =
                                Number(
                                    entry.start_time_seconds
                                );

                            return (
                                Number.isFinite(
                                    start
                                ) &&
                                start <=
                                    timeSeconds
                            );
                        });


                const liveResult =
                    calculateExerciseScore(
                        elapsedEntries,
                        pitchFramesRef.current
                    );


                const liveScore =
                    liveResult.score;

                const liveDeviation =
                    clampDeviationForBackend(
                        liveResult.averageDeviation ??
                            0
                    );


                liveScoreRef.current =
                    liveScore;

                liveDeviationRef.current =
                    liveDeviation;

                setTimeInTune(
                    liveScore
                );

                setAverageDeviation(
                    liveDeviation
                );
            },
            [audio.audioRef]
        );


    const {
        frequency,
        clarity,
        isListening,
        start: startMicrophone,
        stop: stopMicrophone,
    } =
        usePitchDetection(
            handlePitchFrame
        );


    const deleteExerciseAccess =
        async (
            logId,
            exerciseAccessToken
        ) => {
            const apiResponse =
                await fetch(
                    `/api/exercises/${logId}/end`,
                    {
                        method: "DELETE",
                        credentials:
                            "include",
                        headers: {
                            "content-type":
                                "application/json",
                            Accept:
                                "application/json",
                        },
                        body:
                            JSON.stringify({
                                secret_exercise_token:
                                    exerciseAccessToken,
                            }),
                    }
                );

            if (!apiResponse.ok) {
                const errorText =
                    await apiResponse.text();

                console.error(
                    "Could not remove exercise access:",
                    errorText
                );

                const apiError =
                    new Error(
                        errorText
                    );

                apiError.status =
                    apiResponse.status;

                throw apiError;
            }
        };


    const communicateExerciseEnd =
        async (
            logId,
            exerciseDuration,
            score,
            deviation,
            exerciseEndStatus
        ) => {
            const apiResponse =
                await fetch(
                    `/api/exercises/${logId}/end`,
                    {
                        method: "POST",
                        credentials:
                            "include",
                        headers: {
                            "content-type":
                                "application/json",
                            Accept:
                                "application/json",
                        },

                        /*
                         * Existing backend field
                         * time_in_tune stores our
                         * final 0-100 Gaussian score.
                         */
                        body:
                            JSON.stringify({
                                exercise_duration:
                                    exerciseDuration,

                                time_in_tune:
                                    score,

                                average_deviation:
                                    deviation,

                                exercise_end_status:
                                    exerciseEndStatus,
                            }),
                    }
                );

            if (!apiResponse.ok) {
                const errorText =
                    await apiResponse.text();

                console.error(
                    "Could not save exercise result:",
                    errorText
                );

                const apiError =
                    new Error(
                        errorText
                    );

                apiError.status =
                    apiResponse.status;

                throw apiError;
            }

            return (
                apiResponse.json()
            );
        };


    const mutateEnd =
        useMutation({
            mutationFn:
                (variables) =>
                    communicateExerciseEnd(
                        variables.logId,
                        variables.exerciseDuration,
                        variables.score,
                        variables.averageDeviation,
                        variables.exerciseEndStatus
                    ),

            onSuccess(data) {
                localStorage.removeItem(
                    "exercise_access_token"
                );

                console.log(
                    "Successfully ended exercise"
                );

                queryClient
                    .invalidateQueries({
                        queryKey: [
                            "dashboard"
                        ],
                    });

                navigate(
                    `/exercises/${id}/${exercise_slug}/summary`,
                    {
                        state: {
                            time_in_tune:
                                data.time_in_tune,

                            average_deviation:
                                data.average_deviation,

                            exercise_duration:
                                data.exercise_duration,

                            exercise_end_status:
                                data.exercise_end_status,
                        },
                    }
                );
            },

            onError(error) {
                console.error(
                    "Could not save exercise:",
                    error
                );

                navigate("/");
            },
        });


    const mutateDelete =
        useMutation({
            mutationFn:
                (variables) =>
                    deleteExerciseAccess(
                        variables.logId,
                        variables.exerciseAccessToken
                    ),

            onSuccess(
                _data,
                variables
            ) {
                mutateEnd.mutate({
                    logId:
                        variables.logId,

                    exerciseDuration:
                        variables.exerciseDuration,

                    score:
                        variables.score,

                    averageDeviation:
                        variables.averageDeviation,

                    exerciseEndStatus:
                        variables.exerciseEndStatus,
                });
            },

            onError(error) {
                console.error(
                    "Could not remove exercise access:",
                    error
                );

                endingExerciseRef.current =
                    false;

                navigate("/");
            },
        });


    const handleEndOfExercise =
        (
            logId,
            exerciseAccessToken,
            time,
            exerciseEndStatus
        ) => {
            if (
                endingExerciseRef.current
            ) {
                return;
            }

            endingExerciseRef.current =
                true;

            stopMicrophone();

            localStorage.removeItem(
                "time"
            );

            localStorage.removeItem(
                "time_in_tune"
            );

            localStorage.removeItem(
                "average_deviation"
            );

            if (
                backUpIntervalId.current
            ) {
                clearInterval(
                    backUpIntervalId.current
                );
            }


            const audioElement =
                audio.audioRef.current;

            const currentTimeSeconds =
                audioElement &&
                Number.isFinite(
                    audioElement.currentTime
                )
                    ? audioElement.currentTime
                    : time.current /
                      1000;


            /*
             * Completed song:
             * score ALL target notes.
             *
             * Manually stopped exercise:
             * score only notes that had
             * already started.
             */
            const finalScoringData =
                exerciseEndStatus ===
                ENDING_STATUS.ENDED
                    ? scoringEntriesRef.current
                    : scoringEntriesRef.current
                        .filter(
                            (entry) => {
                                if (
                                    entry?.type !==
                                    "note"
                                ) {
                                    return false;
                                }

                                const start =
                                    Number(
                                        entry.start_time_seconds
                                    );

                                return (
                                    Number.isFinite(
                                        start
                                    ) &&
                                    start <=
                                        currentTimeSeconds
                                );
                            }
                        );


            const finalResult =
                calculateExerciseScore(
                    finalScoringData,
                    pitchFramesRef.current
                );


            const finalScore =
                finalResult.score;

            const finalDeviation =
                clampDeviationForBackend(
                    finalResult.averageDeviation ??
                        0
                );


            liveScoreRef.current =
                finalScore;

            liveDeviationRef.current =
                finalDeviation;

            setTimeInTune(
                finalScore
            );

            setAverageDeviation(
                finalDeviation
            );


            console.log(
                "Final Gaussian scoring result:",
                finalResult
            );


            mutateDelete.mutate({
                logId,

                exerciseAccessToken,

                exerciseDuration:
                    Math.round(
                        currentTimeSeconds
                    ),

                score:
                    finalScore,

                averageDeviation:
                    finalDeviation,

                exerciseEndStatus,
            });
        };


    const handleKeyDownEvent =
        async (event) => {
            if (
                event.code ===
                "Space"
            ) {
                event.preventDefault();

                await audio
                    .Toggle
                    .current();
            }
        };


    const handleMouseWheelEvent =
        (event) => {
            audio.ChangeVolume(
                -event.deltaY
            );
        };


    const onSongEnd = () => {
        handleEndOfExercise(
            state.log_id,
            state.exercise_access_token,
            audio.time,
            ENDING_STATUS.ENDED
        );
    };


    /*
     * Microphone starts once when
     * OngoingExercise opens.
     *
     * Frames are only recorded while
     * the backing track is actually playing.
     */
    useEffect(() => {
        startMicrophone();

        return () => {
            stopMicrophone();
        };
    }, [
        startMicrophone,
        stopMicrophone
    ]);


    useEffect(() => {
        if (
            backUpIntervalId.current
        ) {
            clearInterval(
                backUpIntervalId.current
            );
        }


        const exerciseAccessToken =
            localStorage.getItem(
                "exercise_access_token"
            );


        if (
            exerciseAccessToken !==
            null
        ) {
            const storedTime =
                parseFloat(
                    localStorage.getItem(
                        "time"
                    )
                );

            if (
                Number.isFinite(
                    storedTime
                )
            ) {
                audio.setTime(
                    storedTime
                );

                audio.FastForward(
                    storedTime /
                        1000
                );
            }


            const storedDeviation =
                parseFloat(
                    localStorage.getItem(
                        "average_deviation"
                    )
                );

            const storedScore =
                parseFloat(
                    localStorage.getItem(
                        "time_in_tune"
                    )
                );


            if (
                Number.isFinite(
                    storedDeviation
                )
            ) {
                liveDeviationRef.current =
                    storedDeviation;

                setAverageDeviation(
                    storedDeviation
                );
            }


            if (
                Number.isFinite(
                    storedScore
                )
            ) {
                liveScoreRef.current =
                    storedScore;

                setTimeInTune(
                    storedScore
                );
            }
        } else {
            localStorage.setItem(
                "exercise_access_token",
                state.exercise_access_token
            );

            localStorage.setItem(
                "time",
                "0"
            );

            localStorage.setItem(
                "average_deviation",
                "0"
            );

            localStorage.setItem(
                "time_in_tune",
                "0"
            );
        }


        audio
            .hasEndedEventEmitter
            .current
            .on(
                "end",
                onSongEnd
            );


        backUpIntervalId.current =
            setInterval(() => {
                localStorage.setItem(
                    "time",
                    `${audio.time.current.toFixed(
                        2
                    )}`
                );

                localStorage.setItem(
                    "average_deviation",
                    `${liveDeviationRef.current.toFixed(
                        2
                    )}`
                );

                localStorage.setItem(
                    "time_in_tune",
                    `${liveScoreRef.current.toFixed(
                        2
                    )}`
                );
            }, 5000);


        window.addEventListener(
            "keydown",
            handleKeyDownEvent
        );

        window.addEventListener(
            "wheel",
            handleMouseWheelEvent
        );


        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDownEvent
            );

            window.removeEventListener(
                "wheel",
                handleMouseWheelEvent
            );

            if (
                backUpIntervalId.current
            ) {
                clearInterval(
                    backUpIntervalId.current
                );
            }

            audio
                .hasEndedEventEmitter
                .current
                .off(
                    "end",
                    onSongEnd
                );
        };
    }, []);


    return (
        <main className="page-container">
            <header className="page-header">
                <h1>
                    Exercise
                </h1>

                <p className="page-subtitle">
                    Sing along and keep your pitch as close to the target note as possible.
                </p>
            </header>


            <section
                className="ongoing"
                style={{
                    display:
                        "flex",

                    flexDirection:
                        "row",

                    gap:
                        "20px",

                    height:
                        `${HIGHWAY_CARD_HEIGHT}px`,

                    width:
                        "90vw",

                    maxWidth:
                        "90vw",

                    marginLeft:
                        "calc(50% - 45vw)",

                    marginRight:
                        "calc(50% - 45vw)",

                    marginBottom:
                        "24px",
                }}
            >
                <section
                    className="app-card ongoing"
                    style={{
                        padding:
                            "24px",

                        flex:
                            1,

                        minWidth:
                            0,

                        height:
                            "100%",

                        boxSizing:
                            "border-box",
                    }}
                >
                    <div
                        style={{
                            display:
                                "flex",

                            gap:
                                "12px",

                            flexWrap:
                                "wrap",

                            marginBottom:
                                "24px",
                        }}
                    >
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() =>
                                audio.Toggle.current()
                            }
                        >
                            {audio.isPlaying
                                ? "Pause"
                                : "Start"}
                        </button>


                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() =>
                                handleEndOfExercise(
                                    state.log_id,
                                    state.exercise_access_token,
                                    audio.time,
                                    ENDING_STATUS.STOPPED
                                )
                            }
                        >
                            Stop exercise
                        </button>
                    </div>


                    <NoteHighway
                        notes={
                            targetNotesRef.current
                        }
                        audioRef={
                            audio.audioRef
                        }
                        liveFrequency={
                            frequency
                        }
                        liveClarity={
                            clarity
                        }
                    />
                </section>


                <CentDeviationMeter
                    cents={
                        audio.isPlaying
                            ? targetCents
                            : null
                    }
                    isListening={
                        audio.isPlaying &&
                        isListening
                    }
                />
            </section>


            <section
                className="app-card ongoing"
                style={{
                    display:
                        "flex",

                    flexDirection:
                        "column",

                    gap:
                        "20px",

                    width:
                        "90vw",

                    maxWidth:
                        "90vw",

                    marginLeft:
                        "calc(50% - 45vw)",

                    marginRight:
                        "calc(50% - 45vw)",

                    marginBottom:
                        "24px",

                    padding:
                        "24px",

                    boxSizing:
                        "border-box",
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        textAlign:
                            "center",
                    }}
                >
                    Live results
                </h2>


                <div
                    style={{
                        display:
                            "flex",

                        gap:
                            "16px",

                        flexWrap:
                            "wrap",
                    }}
                >
                    <div
                        style={{
                            flex:
                                "1 1 200px",

                            backgroundColor:
                                "rgba(124, 79, 224, 0.06)",

                            border:
                                "1px solid rgba(124, 79, 224, 0.15)",

                            borderRadius:
                                "var(--radius-medium)",

                            padding:
                                "16px 20px",
                        }}
                    >
                        <p
                            style={{
                                margin:
                                    0,

                                fontSize:
                                    "13px",

                                color:
                                    "#6b6a70",

                                fontWeight:
                                    600,

                                textTransform:
                                    "uppercase",

                                letterSpacing:
                                    "0.03em",

                                textAlign:
                                    "center",
                            }}
                        >
                            Average deviation
                        </p>

                        <p
                            style={{
                                margin:
                                    "6px 0 0",

                                fontSize:
                                    "28px",

                                fontWeight:
                                    800,

                                color:
                                    "#18171a",

                                textAlign:
                                    "center",
                            }}
                        >
                            {averageDeviation.toFixed(
                                2
                            )}{" "}

                            <span
                                style={{
                                    fontSize:
                                        "15px",

                                    fontWeight:
                                        600,

                                    color:
                                        "#6b6a70",
                                }}
                            >
                                cents
                            </span>
                        </p>
                    </div>


                    <div
                        style={{
                            flex:
                                "1 1 200px",

                            backgroundColor:
                                "rgba(124, 79, 224, 0.06)",

                            border:
                                "1px solid rgba(124, 79, 224, 0.15)",

                            borderRadius:
                                "var(--radius-medium)",

                            padding:
                                "16px 20px",
                        }}
                    >
                        <p
                            style={{
                                margin:
                                    0,

                                fontSize:
                                    "13px",

                                color:
                                    "#6b6a70",

                                fontWeight:
                                    600,

                                textTransform:
                                    "uppercase",

                                letterSpacing:
                                    "0.03em",

                                textAlign:
                                    "center",
                            }}
                        >
                            Gaussian score
                        </p>

                        <p
                            style={{
                                margin:
                                    "6px 0 0",

                                fontSize:
                                    "28px",

                                fontWeight:
                                    800,

                                color:
                                    "#18171a",

                                textAlign:
                                    "center",
                            }}
                        >
                            {timeInTune.toFixed(
                                1
                            )}

                            <span
                                style={{
                                    fontSize:
                                        "15px",

                                    fontWeight:
                                        600,

                                    color:
                                        "#6b6a70",
                                }}
                            >
                                %
                            </span>
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}