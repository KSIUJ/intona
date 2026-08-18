import {useEffect} from "react";
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

    const mutateDelete = useMutation({
        mutationFn: (variables) => deleteExerciseAccess(variables.log_id, variables.exercise_access_token),
        onSuccess(data, variables) {
            console.log("You have access to actualizing exercise")
            console.log(variables)
            mutateEnd.mutate({
                log_id: variables.log_id,
                // from milliseconds to seconds
                exercise_duration: variables.exercise_duration,
                time_in_tune: variables.time_in_tune,
                average_deviation: variables.average_deviation,
                // should be Stopped(I think I will delete stopped later), Exited (Forcefully before exercise completion), Ended (Whole exercise)
                exercise_end_status: variables.exercise_end_status
            })
            console.log("????")
        },
        onError(error) {
            console.log("Your access token was invalid or already used")
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
        try {
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
                const api_error = new Error(`${api_response.statusText}`)
                api_error.status = api_response.status
                throw api_error
            }

        } catch (error) {
            throw error
        }


    }
    const communicateExerciseEnd = async (log_id, exercise_duration, time_in_tune, average_deviation, exercise_end_status) => {
        try {
            console.log(log_id)
            console.log(exercise_duration)
            console.log(time_in_tune)
            console.log(average_deviation)
            console.log(exercise_end_status)
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
                const api_error = new Error(`${api_response.statusText}`)
                api_error.status = api_response.status
                throw api_error
            }

            const api_response_json = await api_response.json()
            return api_response_json
        } catch (error) {
            throw error
        }
    }


    const handleEndOfExercise = (log_id, exercise_access_token, time, exercise_end_status) => {
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


    useEffect(() => {
        const handleKeyDownEvent = (event) => {
            const key = event.code;
            console.log(key)
            if (key === "Space")
                audio.Toggle();
        }

        const handleMouseWheelEvent = (event) => {
            audio.ChangeVolume(event.wheelDeltaY)
        }

        audio.hasEndedEventEmitter.on("end", () => {
            handleEndOfExercise(state.log_id, state.exercise_access_token, audio.time, ENDING_STATUS.ENDED)
        })

        window.addEventListener("keydown", handleKeyDownEvent)
        window.addEventListener("wheel", handleMouseWheelEvent)

        return () => {
            window.removeEventListener("keydown", handleKeyDownEvent)
            window.removeEventListener("wheel", handleMouseWheelEvent)
        }
    }, [audio])


    return (<>
        <button
            onClick={() => handleEndOfExercise(state.log_id, state.exercise_access_token, audio.time, ENDING_STATUS.STOPPED)}>Zakoncz
        </button>
    </>)

}