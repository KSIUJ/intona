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

function stripOctave(noteName) {
    if (!noteName) return null;
    return noteName.replace(/-?\d+$/, "");
}

const RECENT_WINDOW_MS = 900;
const COLOR_HOLD_MS = 110;

const IN_TUNE_CENTS = 40;
const SLIGHT_OFF_CENTS = 60;

// DEMO BOOST: Wystarczy, że 15% Twojego śpiewu w oknie czasowym to dobra nuta, żeby kolor załapał
const MIN_MATCH_RATIO = 0.15;

const NATURAL_NOTE_NAMES = { 0: "C", 2: "D", 4: "E", 5: "F", 7: "G", 9: "A", 11: "B" };

function halfToneToNoteName(halfTone) {
    const rounded = Math.round(halfTone);
    const midi = rounded + 12;
    const chromaIndex = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    const naturalName = NATURAL_NOTE_NAMES[chromaIndex];
    return naturalName ? `${naturalName}${octave}` : null;
}

const CHROMATIC_NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function halfToneToFullNoteName(halfTone) {
    const rounded = Math.round(halfTone);
    const midi = rounded + 12;
    const chromaIndex = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    return `${CHROMATIC_NOTE_NAMES[chromaIndex]}${octave}`;
}

function pickNoteColor(isActive, colorInputs, targetNoteName) {
    if (!isActive || !targetNoteName) return COLOR_DEFAULT;
    if (!colorInputs.hasSignal) return COLOR_DEFAULT;

    if (colorInputs.matchRatio < MIN_MATCH_RATIO || colorInputs.averagedCents === null) {
        return COLOR_OFF;
    }

    const centsDeviation = Math.abs(colorInputs.averagedCents);

    if (centsDeviation <= IN_TUNE_CENTS) return COLOR_IN_TUNE;
    if (centsDeviation <= SLIGHT_OFF_CENTS) return COLOR_SLIGHT_OFF;
    return COLOR_OFF;
}

export default function NoteHighway({ musicXmlUrl, audioRef, liveNote, liveCents, liveClarity, notes: notesProp }) {
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);
    const hiddenOsmdContainerRef = useRef(null);
    const [parsedNotes, setParsedNotes] = useState([]);
    const [loadError, setLoadError] = useState(null);

    const notes = notesProp ?? parsedNotes;

    const liveNoteRef = useRef(liveNote);
    const liveCentsRef = useRef(liveCents);
    const liveClarityRef = useRef(liveClarity);

    useEffect(() => {
        liveNoteRef.current = liveNote;
        liveCentsRef.current = liveCents;
        liveClarityRef.current = liveClarity;
    }, [liveNote, liveCents, liveClarity]);

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

        const recentReadingsRef = [];
        const noteColorHoldRef = new Map();

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

        function pushRecentReading(noteName, cents) {
            const now = performance.now();
            recentReadingsRef.push({ note: noteName, cents, time: now });

            while (recentReadingsRef.length && now - recentReadingsRef[0].time > RECENT_WINDOW_MS) {
                recentReadingsRef.shift();
            }
        }

        function getColorInputsForNote(targetNoteName) {
            // KLUCZOWA ZMIANA 1: Filtrujemy null'e (ciszę z mikrofonu)
            const validReadings = recentReadingsRef.filter(
                (reading) => reading.note !== null && Number.isFinite(reading.cents)
            );

            if (validReadings.length === 0) {
                return { hasSignal: false, totalCount: 0, matchedCount: 0, matchRatio: 0, averagedCents: null };
            }

            const totalCount = validReadings.length;
            const targetChroma = stripOctave(targetNoteName);

            const matching = validReadings.filter(
                (reading) => stripOctave(reading.note) === targetChroma
            );

            const matchedCount = matching.length;
            const matchRatio = matchedCount / totalCount;

            const averagedCents =
                matchedCount > 0
                    ? matching.reduce((acc, reading) => acc + reading.cents, 0) / matchedCount
                    : null;

            return { hasSignal: true, totalCount, matchedCount, matchRatio, averagedCents };
        }

        function getStableColor(noteIndex, isActive, candidateColor) {
            if (!isActive) {
                noteColorHoldRef.delete(noteIndex);
                return COLOR_DEFAULT;
            }

            const now = performance.now();
            const entry = noteColorHoldRef.get(noteIndex);

            if (!entry) {
                noteColorHoldRef.set(noteIndex, { displayed: candidateColor, candidate: candidateColor, since: now });
                return candidateColor;
            }

            if (candidateColor === entry.displayed) {
                entry.candidate = candidateColor;
                return entry.displayed;
            }

            if (entry.candidate !== candidateColor) {
                entry.candidate = candidateColor;
                entry.since = now;
                return entry.displayed;
            }

            if (now - entry.since >= COLOR_HOLD_MS) {
                entry.displayed = candidateColor;
            }

            return entry.displayed;
        }

        function draw() {
            const { width: cssWidth, height: cssHeight } = getCssSize();
            const playheadX = cssWidth * 0.1;
            const topY = verticalMargin;
            const bottomY = cssHeight - verticalMargin;
            const elapsedSeconds = audioRef?.current?.currentTime ?? 0;

            pushRecentReading(liveNoteRef.current, liveCentsRef.current);

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

                const targetNoteName = halfToneToFullNoteName(note.halfTone);
                const colorInputs = getColorInputsForNote(targetNoteName);

                const candidateColor = pickNoteColor(isActive, colorInputs, targetNoteName);
                const fillColor = getStableColor(i, isActive, candidateColor);

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