import { useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { extractNotesFromOSMD } from "../utils/extractNotesFromOSMD";

// Kolory zgodne z :root w index.css
const COLOR_PRIMARY = "#7c4fe0";
const COLOR_BORDER = "rgba(124, 79, 224, 0.25)";
const COLOR_TEXT = "#18171a";

export default function NoteHighway({ musicXmlUrl, audioRef }) {
    const canvasRef = useRef(null);
    const hiddenOsmdContainerRef = useRef(null);
    const [notes, setNotes] = useState([]);
    const [loadError, setLoadError] = useState(null);

    // Krok 1: pobierz i sparsuj MusicXML, zeby dostac liste nut
    useEffect(() => {
        if (!musicXmlUrl || !hiddenOsmdContainerRef.current) return;

        let isCancelled = false;
        hiddenOsmdContainerRef.current.innerHTML = "";

        const osmd = new OpenSheetMusicDisplay(hiddenOsmdContainerRef.current, {
            backend: "svg",
            drawTitle: false,
        });

        osmd
            .load(musicXmlUrl)
            .then(() => {
                if (isCancelled) return;
                osmd.render();
                const extractedNotes = extractNotesFromOSMD(osmd);
                console.log("NoteHighway: wyciagniete nuty", extractedNotes);
                setNotes(extractedNotes);
            })
            .catch((error) => {
                if (isCancelled) return;
                console.error("NoteHighway: blad wczytywania nut", error);
                setLoadError(error.message ?? "Nie udalo sie wczytac nut.");
            });

        return () => {
            isCancelled = true;
        };
    }, [musicXmlUrl]);

    // Krok 2: rysuj stylizowane prostokaty z tekstem nad nutami, bez kolorowania wg cents
    useEffect(() => {
        if (!canvasRef.current) return;
        if (!notes || notes.length === 0) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        const pixelsPerSecond = 180;
        const playheadX = 120;
        const topY = 40;
        const bottomY = canvas.height - 24;

        let animationFrameId = null;

        const halfTones = notes.map((note) => note.halfTone);
        const minHalfTone = Math.min(...halfTones);
        const maxHalfTone = Math.max(...halfTones);

        function mapPitchToY(halfTone) {
            if (maxHalfTone === minHalfTone) return (topY + bottomY) / 2;
            const proportion = (halfTone - minHalfTone) / (maxHalfTone - minHalfTone);
            return bottomY - proportion * (bottomY - topY);
        }

        function draw() {
            const elapsedSeconds = audioRef?.current?.currentTime ?? 0;

            context.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < notes.length; i++) {
                const note = notes[i];
                const noteEnd = note.startTimeSeconds + note.durationSeconds;
                const noteX = playheadX + (note.startTimeSeconds - elapsedSeconds) * pixelsPerSecond;
                const noteWidth = note.durationSeconds * pixelsPerSecond;
                const y = mapPitchToY(note.halfTone);

                const isActive = elapsedSeconds >= note.startTimeSeconds && elapsedSeconds <= noteEnd;

                context.save();
                if (isActive) {
                    context.shadowColor = COLOR_PRIMARY;
                    context.shadowBlur = 14;
                }

                context.fillStyle = COLOR_PRIMARY;
                context.strokeStyle = COLOR_BORDER;
                context.lineWidth = 1;
                context.beginPath();
                context.roundRect(noteX, y, noteWidth, 20, 6);
                context.fill();
                context.stroke();
                context.restore();

                const label = note.lyricText ?? "";
                if (label && label.trim() !== "") {
                    context.fillStyle = COLOR_TEXT;
                    context.font = isActive ? "bold 13px Inter, sans-serif" : "13px Inter, sans-serif";
                    context.textAlign = "center";
                    context.textBaseline = "bottom";
                    context.fillText(label, noteX + noteWidth / 2, y - 8);
                }
            }

            context.strokeStyle = COLOR_PRIMARY;
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(playheadX, 0);
            context.lineTo(playheadX, canvas.height);
            context.stroke();

            animationFrameId = requestAnimationFrame(draw);
        }

        animationFrameId = requestAnimationFrame(draw);

        return () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [notes, audioRef]);

    return (
        <div>
            {loadError && <p style={{ color: "red" }}>Błąd: {loadError}</p>}

            {/* Ukryty kontener, ktorego uzywa OSMD wewnetrznie do parsowania */}
            <div ref={hiddenOsmdContainerRef} style={{ display: "none" }} />

            <canvas
                ref={canvasRef}
                width={800}
                height={200}
                className="app-card"
                style={{
                    width: "100%",
                    maxWidth: "800px",
                    height: "auto",
                    aspectRatio: "800 / 200",
                    borderRadius: "var(--radius-medium)",
                    display: "block",
                }}
            />
        </div>
    );
}
