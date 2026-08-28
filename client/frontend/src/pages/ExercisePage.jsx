import {useNavigate, useParams} from "react-router-dom";
import {useMutation, useQuery} from "@tanstack/react-query";

export default function ExercisePage() {
    const {exercise_name, id} = useParams();
    const navigate = useNavigate();

    const getData = async (id) => {
        const api_response = await fetch(`/api/exercises/${id}/start`, {
            method: "POST",
            credentials: "include",
        });

        if (!api_response.ok) {
            const api_text = await api_response.text();
            throw new Error(`Error loading exercise ${api_text}`);
        }

        const api_response_json = await api_response.json()
        return api_response_json
    };

    const {mutate} = useMutation({
        mutationFn: () => getData(id),
        onSuccess(data) {
            console.log("successfully started exercise")
            localStorage.removeItem("average_deviation")
            localStorage.removeItem('exercise_access_token')
            localStorage.removeItem('time')
            localStorage.removeItem('time_in_tune')
            navigate(`/exercises/${id}/${exercise_name}/start`, {
                state: {
                    piano_presigned_url: data.piano_presigned_url,
                    source_presigned_url: data.source_presigned_url,
                    processed_data: data.processed_data,
                    log_id: data.log_id,
                    exercise_access_token: data.exercise_access_token,
                },
            });
            console.log("successfully started exercise2")

        },
        onError(error) {
            console.log("ERRRRRRRRRRRRRRRRRRRRRor")
            console.log(JSON.stringify(error))
            navigate("/")
        }
    })

    return (
        <div className="page-container">
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                    gap: "12px",
                }}
            >
                <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                    ← Back
                </button>

                <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                    <div
                        style={{
                            color: "var(--color-primary)",
                            fontWeight: 800,
                            fontSize: "15px",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                        }}
                    >
                        INTONA
                    </div>
                    <h1 style={{margin: 0}}>{exercise_name ?? "Exercise"}</h1>
                </div>
            </div>

            <div className="app-card" style={{padding: "22px"}}>
                <h3>Ready to start?</h3>

                <p className="page-subtitle" style={{marginBottom: "20px"}}>
                    Once you click Start, your microphone and the track will begin — sing along with the notes shown.
                </p>

                <div style={{display: "flex", justifyContent: "center"}}>
                    <button type="button" className="btn btn-primary" onClick={() => mutate(id)}>
                        Start
                    </button>
                </div>
            </div>
        </div>
    );
}