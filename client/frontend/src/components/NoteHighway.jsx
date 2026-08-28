import { useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { extractNotesFromOSMD } from "../utils/extractNotesFromOSMD";

const COLOR_DEFAULT = "#7c4fe0";
const COLOR_IN_TUNE = "#22c55e";
const COLOR_SLIGHT_OFF = "#eab308";
const COLOR_OFF = "#ef4444";

const COLOR_BORDER = "rgba(124, 79, 224, 0.25)";
const COLOR_TEXT = "#18171a";
const COLOR_GRID_LINE = "rgba(24, 23, 26, 0.10)";
const COLOR_GRID_LABEL = "rgba(24, 23, 26, 0.45)";

const HIGHWAY_HEIGHT = 520;
const NOTE_HEIGHT = 40;
const MIN_NOTE_WIDTH = 60;
const MIN_CLARITY_FOR_COLOR = 0.9;

const NATURAL_NOTE_NAMES = { 0: "C", 2: "D", 4: "E", 5: "F", 7: "G", 9: "A", 11: "B" };

function halfToneToNoteName(halfTone) {
    const rounded = Math.round(halfTone);
    const midi = rounded + 12;
    const chromaIndex = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    const naturalName = NATURAL_NOTE_NAMES[chromaIndex];
    return naturalName ? `${naturalName}${octave}` : null;
}

function halfToneToFrequency(halfTone) {
    return 440 * Math.pow(2, (halfTone - 57) / 12);
}

function pickNoteColor(isActive, liveFrequency, liveClarity, targetFrequency) {
    if (!isActive) return COLOR_DEFAULT;

    const hasValidSignal =
        Number.isFinite(liveFrequency) &&
        liveFrequency > 0 &&
        Number.isFinite(liveClarity) &&
        liveClarity >= MIN_CLARITY_FOR_COLOR;

    if (!hasValidSignal || !Number.isFinite(targetFrequency) || targetFrequency <= 0) {
        return COLOR_DEFAULT;
    }

    const centsDeviation = Math.abs(1200 * Math.log2(liveFrequency / targetFrequency));

    if (centsDeviation <= 30) return COLOR_IN_TUNE;
    if (centsDeviation <= 45) return COLOR_SLIGHT_OFF;
    return COLOR_OFF;
}

/**
 * NoteHighway
 *
 * Dwa sposoby zasilenia nutami:
 * 1) `notes` (preferowane) — gotowa tablica obiektów
 *    { startTimeSeconds, durationSeconds, halfTone, targetFrequencyHz?, lyricText? }
 *    np. znormalizowana z `state.processed_data` z serwera.
 * 2) `musicXmlUrl` (fallback / stary sposób) — komponent sam parsuje MusicXML przez OSMD.
 *
 * Jeśli `notes` jest podane, `musicXmlUrl` jest ignorowany.
 */
export default function NoteHighway({ musicXmlUrl, audioRef, liveFrequency, liveClarity, notes: notesProp }) {
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);
    const hiddenOsmdContainerRef = useRef(null);
    const [parsedNotes, setParsedNotes] = useState([]);
    const [loadError, setLoadError] = useState(null);

    const notes = notesProp ?? parsedNotes;

    const liveFrequencyRef = useRef(liveFrequency);
    const liveClarityRef = useRef(liveClarity);
    useEffect(() => {
        liveFrequencyRef.current = liveFrequency;
        liveClarityRef.current = liveClarity;
    }, [liveFrequency, liveClarity]);

    useEffect(() => {
        if (notesProp) return;
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
                setParsedNotes(extractedNotes);
            })
            .catch((error) => {
                if (isCancelled) return;
                setLoadError(error.message ?? "Nie udało się wczytać nut.");
            });

        return () => {
            isCancelled = true;
        };
    }, [musicXmlUrl, notesProp]);

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
        const verticalMargin = NOTE_HEIGHT / 2 + 40;

        let animationFrameId = null;

        const halfTones = notes.map((note) => note.halfTone).filter((h) => Number.isFinite(h));
        const minHalfTone = (halfTones.length ? Math.min(...halfTones) : 48) - 2;
        const maxHalfTone = (halfTones.length ? Math.max(...halfTones) : 72) + 2;

        function getCssSize() {
            const dpr = window.devicePixelRatio || 1;
            return { width: canvas.width / dpr, height: canvas.height / dpr };
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
            const playheadX = cssWidth * 0.1; 
            const topY = verticalMargin;
            const bottomY = cssHeight - verticalMargin;
            const elapsedSeconds = audioRef?.current?.currentTime ?? 0;

            context.clearRect(0, 0, cssWidth, cssHeight);
            drawPitchGrid(cssWidth, cssHeight, topY, bottomY);

            for (let i = 0; i < notes.length; i++) {
                const note = notes[i];
                if (!Number.isFinite(note.halfTone)) continue;

                const noteEnd = note.startTimeSeconds + note.durationSeconds;
                const noteX = Math.round(playheadX + (note.startTimeSeconds - elapsedSeconds) * pixelsPerSecond);
                const noteWidth = Math.max(MIN_NOTE_WIDTH, Math.round(note.durationSeconds * pixelsPerSecond));

                const centerY = mapPitchToY(note.halfTone, topY, bottomY);
                const rawY = centerY - NOTE_HEIGHT / 2;
                const y = Math.round(Math.max(0, Math.min(cssHeight - NOTE_HEIGHT, rawY)));

                if (noteX + noteWidth < -50 || noteX > cssWidth + 50) continue;

                const isActive = elapsedSeconds >= note.startTimeSeconds && elapsedSeconds <= noteEnd;

                // Jeśli mamy realną częstotliwość docelową z serwera (targetFrequencyHz),
                // użyj jej — jest dokładniejsza niż odtworzona z halfTone.
                const targetFrequency = Number.isFinite(note.targetFrequencyHz)
                    ? note.targetFrequencyHz
                    : halfToneToFrequency(note.halfTone);

                const fillColor = pickNoteColor(
                    isActive,
                    liveFrequencyRef.current,
                    liveClarityRef.current,
                    targetFrequency
                );

                context.save();
                if (isActive) {
                    context.shadowColor = fillColor;
                    context.shadowBlur = 14;
                }

                context.fillStyle = fillColor;
                context.strokeStyle = COLOR_BORDER;
                context.lineWidth = 1;
                context.beginPath();
                context.roundRect(noteX, y, noteWidth, NOTE_HEIGHT, 8);
                context.fill();
                context.stroke();
                context.restore();

                const label = note.lyricText ?? "";
                if (label && label.trim() !== "") {
                    const labelY = Math.max(12, y - 8);
                    context.fillStyle = COLOR_TEXT;
                    context.font = isActive ? "bold 13px Inter, sans-serif" : "13px Inter, sans-serif";
                    context.textAlign = "center";
                    context.textBaseline = "bottom";
                    context.fillText(label, Math.min(cssWidth - 8, Math.max(8, noteX + noteWidth / 2)), labelY);
                }
            }

            context.strokeStyle = COLOR_DEFAULT;
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(playheadX, 0);
            context.lineTo(playheadX, cssHeight);
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
            {!notesProp && <div ref={hiddenOsmdContainerRef} style={{ display: "none" }} />}
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
