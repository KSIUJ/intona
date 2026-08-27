import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function ExercisePage() {
    const { exercise_slug, id } = useParams();
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

    const { data: item, isLoading, isError } = useQuery({
        queryKey: ["exercise", id],
        queryFn: () => getData(id),
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });

    const handleStart = () => {
        if (!item) return;
        navigate(`/exercises/${id}/${exercise_slug}/start`, {
            state: {
                piano_presigned_url: item.piano_presigned_url,
                source_presigned_url: item.source_presigned_url,
                processed_data: item.processed_data,
                log_id: item.log_id,
                exercise_access_token: item.exercise_access_token,
            },
        });
    };

    if (isLoading) return <p>Ładowanie ćwiczenia...</p>;
    if (isError) return <p>Wystąpił błąd!</p>;

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
                    ← Powrót
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                    <h1 style={{ margin: 0 }}>{item?.title ?? "Ćwiczenie"}</h1>
                </div>
            </div>

            <div className="app-card" style={{ padding: "22px" }}>
                <h3>Gotowy do rozpoczęcia?</h3>

                <p className="page-subtitle" style={{ marginBottom: "20px" }}>
                    Po kliknięciu Start uruchomi się mikrofon i utwór — śpiewaj wzdłuż wyświetlanych nut.
                </p>

                <div style={{ display: "flex", justifyContent: "center" }}>
                    <button type="button" className="btn btn-primary" onClick={handleStart}>
                        Start
                    </button>
                </div>
            </div>
        </div>
    );
}