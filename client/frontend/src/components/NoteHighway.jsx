import { useEffect, useRef } from "react";

// Kolory zgodne z :root w index.css
const COLOR_PRIMARY = "#7c4fe0";
const COLOR_UPCOMING = "#e1dee5";
const COLOR_UPCOMING_PAST_UNKNOWN = "#c9c4d6";
const COLOR_CLEAN = "#16a34a";
const COLOR_CLOSE = "#f59e0b";
const COLOR_OFF = "#dc2626";
const COLOR_GRID_LINE = "rgba(124, 79, 224, 0.12)";
const COLOR_TEXT_ACTIVE = "#18171a";
const COLOR_TEXT_UPCOMING = "#666168";

function accuracyColor(absCents) {
    if (absCents <= 15) return COLOR_CLEAN;
    if (absCents <= 35) return COLOR_CLOSE;
    return COLOR_OFF;
}

export default function NoteHighway({ notes, audioRef, cents = null }) {
    const canvasRef = useRef(null);
    const centsRef = useRef(cents);
    const accuracyRef = useRef(new Map()); // noteIndex -> { sum, count }

    useEffect(() => {
        centsRef.current = cents;
    }, [cents]);

    function mapPitchToY(halfTone, minHalfTone, maxHalfTone, topY, bottomY) {
        if (maxHalfTone === minHalfTone) return (topY + bottomY) / 2;
        const proportion = (halfTone - minHalfTone) / (maxHalfTone - minHalfTone);
        return bottomY - proportion * (bottomY - topY);
    }

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
        const uniqueHalfTones = [...new Set(halfTones)];

        function draw() {
            const elapsedSeconds = audioRef.current?.currentTime ?? 0;

            context.clearRect(0, 0, canvas.width, canvas.height);

            context.strokeStyle = COLOR_GRID_LINE;
            context.lineWidth = 1;
            uniqueHalfTones.forEach((halfTone) => {
                const y = mapPitchToY(halfTone, minHalfTone, maxHalfTone, topY, bottomY) + 10;
                context.beginPath();
                context.moveTo(0, y);
                context.lineTo(canvas.width, y);
                context.stroke();
            });

            for (let i = 0; i < notes.length; i++) {
                const note = notes[i];
                const noteStart = note.startTimeSeconds;
                const noteEnd = noteStart + note.durationSeconds;
                const noteX = playheadX + (noteStart - elapsedSeconds) * pixelsPerSecond;
                const noteWidth = note.durationSeconds * pixelsPerSecond;
                const y = mapPitchToY(note.halfTone, minHalfTone, maxHalfTone, topY, bottomY);

                const isActive = elapsedSeconds >= noteStart && elapsedSeconds <= noteEnd;
                const isPast = elapsedSeconds > noteEnd;
                const currentCents = centsRef.current;

                if (isActive && currentCents !== null && currentCents !== undefined) {
                    const record = accuracyRef.current.get(i) ?? { sum: 0, count: 0 };
                    record.sum += Math.abs(currentCents);
                    record.count += 1;
                    accuracyRef.current.set(i, record);
                }

                let fillColor = COLOR_UPCOMING;
                let strokeColor = "rgba(124, 79, 224, 0.25)";

                if (isActive) {
                    fillColor =
                        currentCents !== null && currentCents !== undefined
                            ? accuracyColor(Math.abs(currentCents))
                            : COLOR_PRIMARY;
                } else if (isPast) {
                    const record = accuracyRef.current.get(i);
                    fillColor =
                        record && record.count > 0
                            ? accuracyColor(record.sum / record.count)
                            : COLOR_UPCOMING_PAST_UNKNOWN;
                }

                context.save();
                if (isActive) {
                    context.shadowColor = fillColor;
                    context.shadowBlur = 14;
                }

                context.fillStyle = fillColor;
                context.strokeStyle = strokeColor;
                context.lineWidth = 1;
                context.beginPath();
                context.roundRect(noteX, y, noteWidth, 20, 6);
                context.fill();
                context.stroke();
                context.restore();

                const label = note.lyricText ?? "";
                if (label && label.trim() !== "") {
                    context.fillStyle = isActive ? COLOR_TEXT_ACTIVE : COLOR_TEXT_UPCOMING;
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
    );
}