import {useEffect, useRef, useState} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import {useMutation} from "@tanstack/react-query";

import useAudio from '../hooks/useAudio'

const ENDING_STATUS = {
    ONGOING: 'Ongoing',
    STOPPED: 'Stopped',
    ENDED: 'Ended'
};
export default function OngoingExercise() {
    const navigate = useNavigate();
    const location_data = useLocation()
    const {state} = location_data
    const audio = useAudio(state.presigned_url)

    const [time_in_tune, setTimeInTune] = useState(0)
    const [average_deviation, setAverageDeviation] = useState(0)

    const back_up_interval_id = useRef(0)

    const mutateDelete = useMutation({
        mutationFn: (variables) => deleteExerciseAccess(variables.log_id, variables.exercise_access_token),
        onSuccess(data, variables) {
            mutateEnd.mutate({
                log_id: variables.log_id,
                // from milliseconds to seconds
                exercise_duration: variables.exercise_duration,
                time_in_tune: variables.time_in_tune,
                average_deviation: variables.average_deviation,
                // should be Stopped(I think I will delete stopped later), Exited (Forcefully before exercise completion), Ended (Whole exercise)
                exercise_end_status: variables.exercise_end_status
            })
        },
        onError(error) {
            console.log(error)
            navigate("/")
        }
    })


    const mutateEnd = useMutation({
        mutationFn: (variables) => communicateExerciseEnd(variables.log_id, variables.exercise_duration, variables.time_in_tune, variables.average_deviation, variables.exercise_end_status),
        onSuccess() {
            console.log("successfully ended exercise")
            navigate("/")
        },
        onError(error) {
            console.log("Unsuccessfully ended exercise")
            console.log(error)
            navigate("/")
        }
    })


    const deleteExerciseAccess = async (log_id, exercise_access_token) => {
        const api_response = await fetch(`/api/exercises/${log_id}/end`, {
            method: "DELETE",
            credentials: 'include',
            headers: {
                "content-type": "application/json",
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                secret_exercise_token: exercise_access_token
            })
        })

        if (!api_response.ok) {
            const errorText = await api_response.text();
            console.error("error message:", errorText);

            const api_response_error = new Error(errorText);
            api_response_error.status = api_response.status;
            throw api_response_error;
        }


    }
    const communicateExerciseEnd = async (log_id, exercise_duration, time_in_tune, average_deviation, exercise_end_status) => {
        const api_response = await fetch(`/api/exercises/${log_id}/end`, {
            method: "POST",
            credentials: 'include',
            headers: {
                "content-type": "application/json",
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                exercise_duration: exercise_duration,
                time_in_tune: time_in_tune,
                average_deviation: average_deviation,
                exercise_end_status: exercise_end_status
            })
        })

        if (!api_response.ok) {
            const errorText = await api_response.text();
            console.error("error message:", errorText);

            const api_response_error = new Error(errorText);
            api_response_error.status = api_response.status;
            throw api_response_error;
        }

        const api_response_json = await api_response.json()
        return api_response_json
    }


    const handleEndOfExercise = (log_id, exercise_access_token, time, exercise_end_status) => {
        // when we have more things in local storage maybe then i will think about deleting specific things
        localStorage.clear()
        if (back_up_interval_id.current) {
            clearInterval(back_up_interval_id.current)

        }

        const random_time_in_tune = Math.random() * 100
        const random_average_deviation = Math.random() * 100
        mutateDelete.mutate({
            log_id: log_id,
            exercise_access_token: exercise_access_token,
            // from milliseconds to seconds
            exercise_duration: Math.round(time.current / 1000),
            time_in_tune: random_time_in_tune,
            average_deviation: random_average_deviation,
            // should be Stopped(I think i will delete stopped later), Exited (Forcefully before exercise completion), Ended (Whole exercise)
            exercise_end_status: exercise_end_status
        })
    }

    const handleKeyDownEvent = (event) => {
        const key = event.code;
        console.log(key)
        if (key === "Space")
            audio.Toggle()
    }

    const handleMouseWheelEvent = (event) => {
        audio.ChangeVolume(event.wheelDeltaY)
    }

    const onSongEnd = () => {
        handleEndOfExercise(state.log_id, state.exercise_access_token, audio.time, ENDING_STATUS.ENDED)
    }

    useEffect(() => {
        if (back_up_interval_id.current) {
            clearInterval(back_up_interval_id.current)
        }

        const exercise_access_token = localStorage.getItem("exercise_access_token")
        if (exercise_access_token !== null) {
            if (localStorage.getItem("time") !== null)
                audio.time.current = parseFloat(localStorage.getItem("time"))
            else {
                audio.time.current = 0
            }
            setAverageDeviation(parseFloat(localStorage.getItem("average_deviation")))
            setTimeInTune(parseFloat(localStorage.getItem("time_in_tune")))
            audio.FastForward(audio.time.current / 1000)
        } else {
            localStorage.setItem("exercise_access_token", state.exercise_access_token)
            localStorage.setItem("time", "0")
            localStorage.setItem("average_deviation", "0")
            localStorage.setItem("time_in_tune", "0")
        }

        audio.hasEndedEventEmitter.current.on("end", onSongEnd)


        back_up_interval_id.current = setInterval(() => {
            localStorage.setItem("time", `${(audio.time.current).toFixed(2)}`)
            localStorage.setItem("average_deviation", `${(Math.random() * 100).toFixed(2)}`)
            localStorage.setItem("time_in_tune", `${(Math.random() * 100).toFixed(2)}`)
        }, 1000 * 5)


        window.addEventListener("keydown", handleKeyDownEvent)
        window.addEventListener("wheel", handleMouseWheelEvent)

        return () => {
            console.log("ending exercise testesttes")
            window.removeEventListener("keydown", handleKeyDownEvent)
            window.removeEventListener("wheel", handleMouseWheelEvent)
            if (back_up_interval_id.current)
                clearInterval(back_up_interval_id.current)
            audio.hasEndedEventEmitter.current.off("end", onSongEnd)
        }
    }, [])


    return (<>
        <button
            onClick={() => handleEndOfExercise(state.log_id, state.exercise_access_token, audio.time, ENDING_STATUS.STOPPED)}>Zakoncz
        </button>
    </>)

}