import {Link, useNavigate, useParams} from "react-router-dom";
import {useEffect} from "react";
import {useMutation} from "@tanstack/react-query";

const ExercisePage = () => {
    const {id, exerciseSlug} = useParams();
    const navigate = useNavigate()

    const veryfiUser = async (id, exerciseSlug) => {
        try {
            const api_response = await fetch(`/api/exercises/${id}/start`, {
                method: "POST",
                credentials: 'include'
            })

            if (!api_response.ok) {
                const api_error = new Error(`${api_response.statusText}`)
                api_error.status = api_response.status
                throw api_error;
            }

            const api_response_json = await api_response.json()
            api_response_json.id = id
            api_response_json.exerciseSlug = exerciseSlug
            return api_response_json;
        } catch (e) {
            throw e;
        }
    }

    const {mutate} = useMutation({
        mutationFn: (data) => veryfiUser(data.id, data.exerciseSlug),
        onSuccess: (data) => {
            navigate(`/exercises/${data.id}/${data.exerciseSlug}/start`, {
                state: {
                    presigned_url: data.presigned_url,
                    processed_data: data.processed_data,
                    log_id: data.log_id
                }
            })
        },
        onError: () => {
            navigate('/home')
        }
    });
    const handleClick = (e) => {
        e.preventDefault()
        mutate({id: id, exerciseSlug: exerciseSlug})
    }
    return (
        <main>
            <h1>Exercise page</h1>
            <p>Selected exercise: {exerciseSlug}</p>
            <button onClick={handleClick}>Start</button>
        </main>
    );
};

export default ExercisePage;