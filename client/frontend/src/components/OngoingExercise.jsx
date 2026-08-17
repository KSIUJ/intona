import {useEffect} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import {useMutation} from "@tanstack/react-query";

import useAudio from '../hooks/useAudio'


export default function OngoingExercise() {
    const navigate = useNavigate();
    const location_data = useLocation()
    const {state} = location_data
    const audio = useAudio(state.presigned_url)

    const {mutate} = useMutation({
        mutationFn: (data) => communicateExerciseEnd(data.log_id, data.exercise_duration, data.time_in_tune, data.average_deviation),
        onSuccess() {
            console.log("successfully ended exercise")
            navigate("/home")
        },
        onError(error) {
            console.log("UNsuccessfully ended exercise")
            console.log(error)
            navigate("/home")
        }
    })

    const communicateExerciseEnd = async (log_id, exercise_duration, time_in_tune, average_deviation) => {
        try {
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
                    average_deviation: average_deviation
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


    const imitateEndOfExercise = () => {
        const random_exercise_duration = Math.random() * (Math.random() * 200)
        const random_time_in_tune = Math.random() * 100
        const random_average_deviation = Math.random() * 100
        mutate({
            log_id: state.log_id,
            exercise_duration: random_exercise_duration,
            time_in_tune: random_time_in_tune,
            average_deviation: random_average_deviation
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

        window.addEventListener("keydown", handleKeyDownEvent)
        window.addEventListener("wheel", handleMouseWheelEvent)

        return () => {
            window.removeEventListener("keydown", handleKeyDownEvent)
            window.removeEventListener("wheel", handleMouseWheelEvent)
        }
    }, [audio])


    return (<>
        <button onClick={imitateEndOfExercise}>Zakoncz zadanie (testowe)</button>
    </>)

}