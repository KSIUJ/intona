import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import {useMutation} from "@tanstack/react-query";

const ExercisePage = () => {
    const {id, exercise_slug} = useParams();
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const verifyUser = async (id, exercise_slug) => {
        try {
            const api_response = await fetch(`/api/exercises/${id}/start`, {
                method: "POST",
                credentials: 'include'
            })
            // console.log("api_response")
            if (!api_response.ok) {
                const api_error = new Error(`${api_response.statusText}`)
                console.log(api_error.statusText)
                console.log(api_error.status)
                api_error.status = api_response.status
                throw api_error;
            }
            // console.log("api_response2")

            const api_response_json = await api_response.json()
            api_response_json.id = id
            api_response_json.exercise_slug = exercise_slug
            // console.log("api_response3")
            return api_response_json;
        } catch (e) {
            console.log(e.statusText)
            throw e;
        }
    }

    const {mutate} = useMutation({
        mutationFn: (data) => verifyUser(data.id, data.exercise_slug),
        onSuccess: (data) => {
            localStorage.removeItem('exercise_access_token')
            localStorage.removeItem('time')
            localStorage.removeItem('time_in_tune')
            localStorage.removeItem('average_deviation')
            navigate(`/exercises/${data.id}/${data.exercise_slug}/start`, {
                state: {
                    presigned_url: data.presigned_url,
                    processed_data: data.processed_data,
                    log_id: data.log_id,
                    exercise_access_token: data.exercise_access_token
                }
            })
        },
        onError: () => {
            console.log("error with starting exercise")
            navigate('/')
        }
    });
    const handleClick = (e) => {
        e.preventDefault()
        mutate({id: id, exercise_slug: exercise_slug})

    }
    return (
        <main>
            <h1>{searchParams.get("type")} page</h1>
            <p>Selected {searchParams.get("type")}: {exercise_slug}</p>
            <button onClick={handleClick}>Start</button>
        </main>
    );
};

export default ExercisePage;