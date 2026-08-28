import {useEffect, useRef, useState} from "react";
import {useNavigate, useLocation, useParams} from "react-router-dom";
import {useMutation, useQueryClient} from "@tanstack/react-query";

import useAudio from "../hooks/useAudio";
import {usePitchDetection} from "../hooks/usePitchDetection";
import NoteHighway from "../components/NoteHighway";
import CentDeviationMeter from "./CentDeviationMeter.jsx";

const ENDING_STATUS = {
    ONGOING: "Ongoing",
    STOPPED: "Stopped",
    ENDED: "Ended",
};

export default function OngoingExercise() {
    const queryClient = useQueryClient();
    const {id, exercise_slug} = useParams();
    const navigate = useNavigate();
    const location_data = useLocation();
    const {state} = location_data;

    // Audio (fortepian) gra z piano_presigned_url - osobny link od pliku z nutami
    const audio = useAudio(state.piano_presigned_url);

    const {
        frequency,
        note,
        cents,
        clarity,
        isListening,
        error,
        start: startMicrophone,
        stop: stopMicrophone,
    } = usePitchDetection();

    const [time_in_tune, setTimeInTune] = useState(0);
    const [average_deviation, setAverageDeviation] = useState(0);

    const back_up_interval_id = useRef(0);
    const deviationSamplesRef = useRef([]);
    const timeInTuneFramesRef = useRef(0);
    const totalPitchFramesRef = useRef(0);
    const lastFrameTimeRef = useRef(null);

    const deleteExerciseAccess = async (log_id, exercise_access_token) => {
        const api_response = await fetch(`/api/exercises/${log_id}/end`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "content-type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                secret_exercise_token: exercise_access_token,
            }),
        });

        if (!api_response.ok) {
            const errorText = await api_response.text();
            console.error("error message:", errorText);

            const api_response_error = new Error(errorText);
            api_response_error.status = api_response.status;
            throw api_response_error;
        }
    };

    const communicateExerciseEnd = async (
        log_id,
        exercise_duration,
        time_in_tune,
        average_deviation,
        exercise_end_status
    ) => {
        console.log(`BODYYYYYY: ${log_id}, ${exercise_duration}, ${time_in_tune}, ${average_deviation}, ${exercise_end_status}`)
        const api_response = await fetch(`/api/exercises/${log_id}/end`, {
            method: "POST",
            credentials: "include",
            headers: {
                "content-type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                exercise_duration,
                time_in_tune,
                average_deviation,
                exercise_end_status,
            }),
        });

        if (!api_response.ok) {
            const errorText = await api_response.text();
            console.error("error message:", errorText);

            const api_response_error = new Error(errorText);
            api_response_error.status = api_response.status;
            throw api_response_error;
        }

        return api_response.json();
    };

    const mutateEnd = useMutation({
        mutationFn: (variables) =>
            communicateExerciseEnd(
                variables.log_id,
                variables.exercise_duration,
                variables.time_in_tune,
                variables.average_deviation,
                variables.exercise_end_status
            ),
        onSuccess(data) {
            localStorage.removeItem("exercise_access_token")
            console.log("successfully ended exercise");
            queryClient.invalidateQueries({queryKey: ["dashboard"]});
            navigate(`/exercises/${id}/${exercise_slug}/summary`, {
                state: {
                    time_in_tune: data.time_in_tune,
                    average_deviation: data.average_deviation,
                    exercise_duration: data.exercise_duration,
                    exercise_end_status: data.exercise_end_status
                }
            });
        },
        onError(error) {
            console.log("Unsuccessfully ended exercise");
            console.log(error);
            navigate("/");
        },
    });

    const mutateDelete = useMutation({
        mutationFn: (variables) =>
            deleteExerciseAccess(variables.log_id, variables.exercise_access_token),
        onSuccess(data, variables) {
            mutateEnd.mutate({
                log_id: variables.log_id,
                exercise_duration: variables.exercise_duration,
                time_in_tune: variables.time_in_tune,
                average_deviation: variables.average_deviation,
                exercise_end_status: variables.exercise_end_status,
            });
        },
        onError(error) {
            console.log(error);
            navigate("/");
        },
    });

    const handleEndOfExercise = (
        log_id,
        exercise_access_token,
        time,
        exercise_end_status
    ) => {
        stopMicrophone();
        localStorage.removeItem("time")
        localStorage.removeItem("time_in_tune")
        localStorage.removeItem("average_deviation")

        if (back_up_interval_id.current) {
            clearInterval(back_up_interval_id.current);
        }

        const finalAverageDeviation =
            deviationSamplesRef.current.length > 0
                ? deviationSamplesRef.current.reduce((sum, value) => sum + value, 0) /
                deviationSamplesRef.current.length
                : 0;

        const finalTimeInTune =
            totalPitchFramesRef.current > 0
                ? (timeInTuneFramesRef.current / totalPitchFramesRef.current) * 100
                : 0;

        mutateDelete.mutate({
            log_id,
            exercise_access_token,
            exercise_duration: Math.round(time.current / 1000),
            time_in_tune: finalTimeInTune,
            average_deviation: finalAverageDeviation,
            exercise_end_status,
        });
    };

    const handleKeyDownEvent = async (event) => {
        const key = event.code;
        if (key === "Space") {
            event.preventDefault();
            await audio.Toggle.current()
        }
    };

    const handleMouseWheelEvent = (event) => {
        audio.ChangeVolume(-event.deltaY);
    };

    const onSongEnd = () => {
        handleEndOfExercise(
            state.log_id,
            state.exercise_access_token,
            audio.time,
            ENDING_STATUS.ENDED
        );
    };

    useEffect(() => {
        startMicrophone();
        return () => {
            stopMicrophone();
        };
    }, [startMicrophone, stopMicrophone]);

    useEffect(() => {
        if (cents === null || clarity < 0.9 || !Number.isFinite(frequency)) {
            return;
        }

        const now = performance.now();
        if (lastFrameTimeRef.current && now - lastFrameTimeRef.current < 80) {
            return;
        }
        lastFrameTimeRef.current = now;

        const absoluteDeviation = Math.abs(cents);
        deviationSamplesRef.current.push(absoluteDeviation);
        totalPitchFramesRef.current += 1;

        if (absoluteDeviation <= 20) {
            timeInTuneFramesRef.current += 1;
        }

        const currentAverage =
            deviationSamplesRef.current.reduce((sum, value) => sum + value, 0) /
            deviationSamplesRef.current.length;

        const currentTimeInTune =
            (timeInTuneFramesRef.current / totalPitchFramesRef.current) * 100;

        setAverageDeviation(currentAverage);
        setTimeInTune(currentTimeInTune);
    }, [cents, clarity, frequency]);

    useEffect(() => {
        console.log("auddio toggle event")
        if (back_up_interval_id.current) {
            clearInterval(back_up_interval_id.current);
        }

        const exercise_access_token = localStorage.getItem("exercise_access_token");

        if (exercise_access_token !== null) {
            if (localStorage.getItem("time") !== null) {
                audio.setTime(parseFloat(localStorage.getItem("time")));
            } else {
                audio.setTime(0);
            }

            const storedAverageDeviation = parseFloat(
                localStorage.getItem("average_deviation")
            );
            const storedTimeInTune = parseFloat(localStorage.getItem("time_in_tune"));

            if (Number.isFinite(storedAverageDeviation)) {
                setAverageDeviation(storedAverageDeviation);
            }
            if (Number.isFinite(storedTimeInTune)) {
                setTimeInTune(storedTimeInTune);
            }

            audio.FastForward(audio.time.current / 1000);
        } else {
            localStorage.setItem("exercise_access_token", state.exercise_access_token);
            localStorage.setItem("time", "0");
            localStorage.setItem("average_deviation", "0");
            localStorage.setItem("time_in_tune", "0");
        }

        audio.hasEndedEventEmitter.current.on("end", onSongEnd);

        back_up_interval_id.current = setInterval(() => {
            localStorage.setItem("time", `${audio.time.current.toFixed(2)}`);
            localStorage.setItem("average_deviation", `${average_deviation.toFixed(2)}`);
            localStorage.setItem("time_in_tune", `${time_in_tune.toFixed(2)}`);
        }, 5000);

        window.addEventListener("keydown", handleKeyDownEvent);
        window.addEventListener("wheel", handleMouseWheelEvent);

        return () => {
            window.removeEventListener("keydown", handleKeyDownEvent);
            window.removeEventListener("wheel", handleMouseWheelEvent);

            if (back_up_interval_id.current) {
                clearInterval(back_up_interval_id.current);
            }

            audio.hasEndedEventEmitter.current.off("end", onSongEnd);
        };
    }, []);

    return (
        <main className="page-container">
            <header className="page-header">
                <h1>Exercise</h1>
                <p className="page-subtitle">
                    Sing along and keep your pitch as close to the target note as possible.
                </p>
            </header>
            <section style={{display: 'flex', flexDirection: 'row', height: '560px'}} className={"ongoing"}>
                <section className="app-card ongoing" style={{padding: "24px", marginBottom: "24px"}} >
                    <div style={{display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px"}}>
                        <button type="button" className="btn btn-primary" onClick={() => audio.Toggle.current()}>
                            {audio.isPlaying ? "Pause" : "Start"}
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

                    <NoteHighway musicXmlUrl={state.source_presigned_url} audioRef={audio.audioRef}/>

                    <div style={{marginTop: "20px"}}>
                        <p>
                            Microphone: <strong>{isListening ? "active" : "inactive"}</strong>
                        </p>

                        {error && <p>{error}</p>}

                        <p>
                            Note: <strong>{note ?? "-"}</strong>
                        </p>

                        <p>
                            Frequency: <strong>{frequency ? `${frequency.toFixed(2)} Hz` : "-"}</strong>
                        </p>

                        <p>
                            Deviation:{" "}
                            <strong>{cents !== null ? `${cents > 0 ? "+" : ""}${cents} cents` : "-"}</strong>
                        </p>

                        <p>
                            Clarity: <strong>{clarity.toFixed(2)}</strong>
                        </p>
                    </div>
                </section>
                <CentDeviationMeter cents={cents} isListening={isListening}/>
            </section>
            <section className="app-card ongoing" style={{padding: "24px"}}>
                <h2>Live results</h2>

                <p>
                    Average deviation: <strong>{average_deviation.toFixed(2)} cents</strong>
                </p>

                <p>
                    Time in tune: <strong>{time_in_tune.toFixed(1)}%</strong>
                </p>
            </section>
        </main>
    );
}
