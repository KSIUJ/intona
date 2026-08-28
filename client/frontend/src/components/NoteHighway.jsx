import { useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { extractNotesFromOSMD } from "../utils/extractNotesFromOSMD";


const COLOR_PRIMARY = "#7c4fe0";
const COLOR_BORDER = "rgba(124, 79, 224, 0.25)";
const COLOR_TEXT = "#18171a";
const COLOR_GRID_LINE = "rgba(24, 23, 26, 0.10)";
const COLOR_GRID_LABEL = "rgba(24, 23, 26, 0.45)";
const HIGHWAY_HEIGHT = 520;
const NOTE_HEIGHT = 40;
const MIN_NOTE_WIDTH = 50;
const NATURAL_NOTE_NAMES = {
    0: "C",
    2: "D",
    4: "E",
    5: "F",
    7: "G",
    9: "A",
    11: "B",
};
function halfToneToNoteName(halfTone) {
    const rounded = Math.round(halfTone);
    const midi = rounded + 12;
    const chromaIndex = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    const naturalName = NATURAL_NOTE_NAMES[chromaIndex];
    return naturalName ? `${naturalName}${octave}` : null;
}
export default function NoteHighway({ musicXmlUrl, audioRef }) {
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);
    const hiddenOsmdContainerRef = useRef(null);
    const [notes, setNotes] = useState([]);
    const [loadError, setLoadError] = useState(null);

  
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

useEffect(() => {
        if (!canvasRef.current || !wrapperRef.current) return;

        const canvas = canvasRef.current;
        const wrapper = wrapperRef.current;

        function resizeCanvas() {
            const dpr = window.devicePixelRatio || 1;
            const cssWidth = wrapper.clientWidth;

            canvas.width = Math.round(cssWidth * dpr);
            canvas.height = Math.round(HIGHWAY_HEIGHT * dpr);
            canvas.style.width = `${cssWidth}px`;
            canvas.style.height = `${HIGHWAY_HEIGHT}px`;

            const context = canvas.getContext("2d");
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        resizeCanvas();

        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(wrapper);

        return () => resizeObserver.disconnect();
    }, []);
    useEffect(() => {
        if (!canvasRef.current) return;
        if (!notes || notes.length === 0) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        const pixelsPerSecond = 180;
        const playheadX = 120;
        const topY = 40;
        const bottomY = canvas.height - 24;
        const verticalMargin = NOTE_HEIGHT / 2 + 40;
        let animationFrameId = null;

        const halfTones = notes.map((note) => note.halfTone);
        const minHalfTone = Math.min(...halfTones) - 2;
        const maxHalfTone = Math.max(...halfTones) + 2;
        function getCssSize() {
            const dpr = window.devicePixelRatio || 1;
            return {
                width: canvas.width / dpr,
                height: canvas.height / dpr,
            };
        }
        function mapPitchToY(halfTone, topY, bottomY) {
            if (maxHalfTone === minHalfTone) return (topY + bottomY) / 2;
            const proportion = (halfTone - minHalfTone) / (maxHalfTone - minHalfTone);
            return bottomY - proportion * (bottomY - topY);
        }

        function drawPitchGrid(cssWidth, cssHeight, topY, bottomY) {
            context.save();

            for (let halfTone = Math.ceil(minHalfTone); halfTone <= Math.floor(maxHalfTone); halfTone++) {
                const noteName = halfToneToNoteName(halfTone);
                if (!noteName) continue;

                const y = Math.round(mapPitchToY(halfTone, topY, bottomY));

                context.strokeStyle = COLOR_GRID_LINE;
                context.lineWidth = 1;
                context.beginPath();
                context.moveTo(0, y);
                context.lineTo(cssWidth, y);
                context.stroke();

                const labelY = Math.min(cssHeight - 4, Math.max(12, y - 2));

                context.fillStyle = COLOR_GRID_LABEL;
                context.font = "11px Inter, sans-serif";
                context.textAlign = "left";
                context.textBaseline = "bottom";
                context.fillText(noteName, 6, labelY);
            }

            context.restore();
        }

        function draw() {
            const { width: cssWidth, height: cssHeight } = getCssSize();
            const topY = verticalMargin;
            const bottomY = cssHeight - verticalMargin;
            const elapsedSeconds = audioRef?.current?.currentTime ?? 0;

            context.clearRect(0, 0, cssWidth, cssHeight);

            drawPitchGrid(cssWidth, cssHeight, topY, bottomY);
            
            for (let i = 0; i < notes.length; i++) {
                const note = notes[i];
                const noteEnd = note.startTimeSeconds + note.durationSeconds;
                const noteX = Math.round(playheadX + (note.startTimeSeconds - elapsedSeconds) * pixelsPerSecond);
                const noteWidth = Math.max(MIN_NOTE_WIDTH, Math.round(note.durationSeconds * pixelsPerSecond));
                const centerY = mapPitchToY(note.halfTone, topY, bottomY);
                const rawY = centerY - NOTE_HEIGHT / 2;
                const y = Math.round(Math.max(0, Math.min(cssHeight - NOTE_HEIGHT, rawY)));

                if (noteX + noteWidth < -50 || noteX > cssWidth + 50) continue;

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
                context.roundRect(noteX, y, noteWidth, NOTE_HEIGHT, 10);
                context.fill();
                context.stroke();
                context.restore();

                const label = note.lyricText ?? "";
                if (label && label.trim() !== "") {
                    context.fillStyle = COLOR_TEXT;
                    context.font = isActive ? "bold 14px Inter, sans-serif" : "14px Inter, sans-serif";
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
        <div ref={wrapperRef} style={{ width: "100%", height: `${HIGHWAY_HEIGHT}px` }}>
            {loadError && <p style={{ color: "red" }}>Błąd: {loadError}</p>}

            <div ref={hiddenOsmdContainerRef} style={{ display: "none" }} />

            <canvas
                ref={canvasRef}
                className="app-card"
                style={{
                    display: "block",
                    width: "100%",
                    height: `${HIGHWAY_HEIGHT}px`,
                    borderRadius: "var(--radius-medium)",
                }}
            />
        </div>
    );
}


