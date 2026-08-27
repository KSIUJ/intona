import {useRef, useState} from "react";
import ScoreViewer from "../components/ScoreViewer";
import NoteHighway from "../components/NoteHighway";
import LyricsTeleprompter from "../components/LyricsTeleprompter";
import {useParams} from "react-router-dom";
import PlaceholderBox from "../components/PlaceholderBox";
import CentDeviationMeter from "../components/CentDeviationMeter";
import {usePitchDetection} from "../hooks/usePitchDetection";
import {useQuery} from "@tanstack/react-query";


export default function ExercisePage() {
    const {id} = useParams();

    const getData = async (id) => {
        const api_response = await fetch(`/api/exercises/${id}/start`, {
            method: "POST",
            credentials: "include"
        });

        if (!api_response.ok) {
            const api_text = await api_response.text();
            throw new Error(`Error loading exercise ${api_text}`);
        }

        return await api_response.json();
    };

    const {
        data: item,
        isLoading,
        isError
    } = useQuery({
        queryKey: ["exercise", id],
        queryFn: () => getData(id),
        staleTime: Infinity,
        refetchOnWindowFocus: false
    });

    const [notes, setNotes] = useState([]);
    const audioRef = useRef(null);

    const {
        frequency,
        note,
        cents,
        clarity,
        isListening,
        error,
        start: startMicrophone,
        stop: stopMicrophone
    } = usePitchDetection();

    const MUSICXML_URL = item?.source_presigned_url;
    const AUDIO_URL = item?.piano_presigned_url;

    if (isLoading) {
        return <p>Loading exercise...</p>;
    }

    if (isError) {
        return <p>Something went wrong!</p>;
    }

    async function handleStart() {
        try {
            if (!isListening) {
                await startMicrophone();
            }

            await audioRef.current?.play();
        } catch (startError) {
            console.error("Could not start exercise:", startError);
        }
    }

    function handlePause() {
        audioRef.current?.pause();
        stopMicrophone();
    }

    function handleStop() {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        stopMicrophone();
    }

    return (
        <div
            style={{
                width: "100%",
                maxWidth: "800px",
                margin: "0 auto",
                padding: "40px 16px 0",
                boxSizing: "border-box"
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                    gap: "12px"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "44px",
                        flexWrap: "wrap"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontWeight: 800,
                            fontSize: "24px",
                            color: "#0d9488",
                            letterSpacing: "0.5px"
                        }}
                    >
                        <span role="img" aria-label="logo">
                            🎤
                        </span>
                        INTONA
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            fontSize: "24px",
                            fontWeight: 600,
                            color: "#1a1c1f"
                        }}
                    >
                        <span role="img" aria-label="song">
                            🎵
                        </span>
                        {item?.title ?? "Exercise"}
                    </div>
                </div>
            </div>

            <div
                style={{
                    background: "white",
                    borderRadius: "16px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    padding: "16px"
                }}
            >
                <NoteHighway
                    notes={notes}
                    audioRef={audioRef}
                />

                <LyricsTeleprompter
                    notes={notes}
                    audioRef={audioRef}
                />
            </div>

            <div
                style={{
                    display: "flex",
                    gap: "16px",
                    marginTop: "16px"
                }}
            >
                <div style={{flex: 2}}>
                    <PlaceholderBox
                        label="Pitch curve"
                        height="140px"
                    />
                </div>

                <div style={{flex: 1}}>
                    <CentDeviationMeter
                        cents={cents}
                        isListening={isListening}
                    />
                </div>
            </div>

            <div
                style={{
                    marginTop: "16px",
                    padding: "16px",
                    background: "white",
                    borderRadius: "16px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)"
                }}
            >
                <div>
                    Microphone:{" "}
                    <strong>
                        {isListening ? "active" : "inactive"}
                    </strong>
                </div>

                <div style={{marginTop: "8px"}}>
                    Note:{" "}
                    <strong>
                        {note ?? "-"}
                    </strong>
                </div>

                <div style={{marginTop: "8px"}}>
                    Frequency:{" "}
                    <strong>
                        {frequency
                            ? `${frequency.toFixed(2)} Hz`
                            : "-"}
                    </strong>
                </div>

                <div style={{marginTop: "8px"}}>
                    Clarity:{" "}
                    <strong>
                        {clarity.toFixed(2)}
                    </strong>
                </div>

                <div style={{marginTop: "8px"}}>
                    Deviation:{" "}
                    <strong>
                        {cents !== null
                            ? `${cents > 0 ? "+" : ""}${cents} cents`
                            : "-"}
                    </strong>
                </div>

                {error && (
                    <div
                        style={{
                            marginTop: "8px",
                            color: "#b91c1c"
                        }}
                    >
                        {error}
                    </div>
                )}
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "16px",
                    marginTop: "20px",
                    flexWrap: "wrap"
                }}
            >
                <button
                    onClick={handlePause}
                    style={{
                        padding: "14px 28px",
                        borderRadius: "999px",
                        border: "1px solid #d0d3d9",
                        background: "white",
                        fontWeight: 600,
                        cursor: "pointer"
                    }}
                >
                    Pause
                </button>

                <button
                    onClick={handleStart}
                    style={{
                        padding: "14px 40px",
                        borderRadius: "999px",
                        border: "none",
                        background: "#0d9488",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "16px",
                        cursor: "pointer"
                    }}
                >
                    Start
                </button>

                <button
                    onClick={handleStop}
                    style={{
                        padding: "14px 28px",
                        borderRadius: "999px",
                        border: "1px solid #d0d3d9",
                        background: "white",
                        fontWeight: 600,
                        cursor: "pointer"
                    }}
                >
                    Stop
                </button>
            </div>

            <div
                style={{
                    visibility: "hidden",
                    height: "1px",
                    overflow: "hidden"
                }}
            >
                <ScoreViewer
                    musicXmlUrl={MUSICXML_URL}
                    onNotesLoaded={setNotes}
                />
            </div>

            <audio
                ref={audioRef}
                src={AUDIO_URL}
            />
        </div>
    );
}