import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import ScoreViewer from "../components/ScoreViewer";
import NoteHighway from "../components/NoteHighway";
import LyricsTeleprompter from "../components/LyricsTeleprompter";
import { songs, exercises } from "../components/Carousel";
import CentDeviationMeter from "../components/CentDeviationMeter";
import { usePitchDetection } from "../hooks/usePitchDetection";

export default function ExercisePage() {
  const { exercise_slug } = useParams();

  const allItems = [...exercises, ...songs];
  const item = allItems.find((entry) => entry.slug === exercise_slug);

  const MUSICXML_URL = item?.musicXmlUrl;
  const AUDIO_URL = item?.audioUrl;

  const [notes, setNotes] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const [deviationSamples, setDeviationSamples] = useState([]);
  const [timeInTuneFrames, setTimeInTuneFrames] = useState(0);
  const [totalPitchFrames, setTotalPitchFrames] = useState(0);

  const audioRef = useRef(null);
  const lastFrameTimeRef = useRef(null);

  const {
    frequency,
    note,
    cents,
    clarity,
    isListening,
    error,
    start: startMicrophone,
    stop: stopMicrophone,
  } = usePitchDetection();

  const handleStart = async () => {
    if (!isListening) {
      await startMicrophone();
    }

    if (audioRef.current) {
      await audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsPlaying(false);
    stopMicrophone();
  };

  useEffect(() => {
    if (
      cents === null ||
      clarity < 0.9 ||
      !Number.isFinite(frequency)
    ) {
      return;
    }

    const now = performance.now();

    if (
      lastFrameTimeRef.current &&
      now - lastFrameTimeRef.current < 80
    ) {
      return;
    }

    lastFrameTimeRef.current = now;

    const absoluteDeviation = Math.abs(cents);

    setDeviationSamples((previous) => [
      ...previous,
      absoluteDeviation,
    ]);

    setTotalPitchFrames((previous) => previous + 1);

    if (absoluteDeviation <= 20) {
      setTimeInTuneFrames((previous) => previous + 1);
    }
  }, [cents, clarity, frequency]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      stopMicrophone();
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      stopMicrophone();
    };
  }, [stopMicrophone]);

  const averageDeviation =
    deviationSamples.length > 0
      ? deviationSamples.reduce(
          (sum, value) => sum + value,
          0
        ) / deviationSamples.length
      : 0;

  const timeInTune =
    totalPitchFrames > 0
      ? (timeInTuneFrames / totalPitchFrames) * 100
      : 0;

  const deviationStatus =
    cents === null
      ? "Waiting for pitch"
      : Math.abs(cents) <= 10
        ? "Excellent"
        : Math.abs(cents) <= 20
          ? "Good"
          : cents > 0
            ? "Too high"
            : "Too low";

  return (
    <main className="page-container">
      <header className="page-header">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "var(--color-primary)",
                fontWeight: 800,
                fontSize: "15px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              INTONA
            </div>

            <h1
              style={{
                marginBottom: "6px",
              }}
            >
              {item?.title ?? "Exercise"}
            </h1>

            <p
              className="page-subtitle"
              style={{
                marginBottom: 0,
              }}
            >
              Listen, sing and follow your pitch in real time.
            </p>
          </div>

          <div
            className="app-card"
            style={{
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: isListening
                  ? "#35a66f"
                  : "var(--color-border)",
              }}
            />

            <strong>
              {isListening
                ? "Microphone active"
                : "Microphone inactive"}
            </strong>
          </div>
        </div>
      </header>

      <section
        className="app-card"
        style={{
          padding: "20px",
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
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        <div
          className="app-card"
          style={{
            padding: "22px",
          }}
        >
          <h3>Live pitch</h3>

          {error && (
            <div
              style={{
                padding: "10px 12px",
                marginBottom: "16px",
                borderRadius: "var(--radius-small)",
                background: "#fff0f0",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            <Metric
              label="Note"
              value={note ?? "-"}
            />

            <Metric
              label="Frequency"
              value={
                frequency
                  ? `${frequency.toFixed(2)} Hz`
                  : "-"
              }
            />

            <Metric
              label="Clarity"
              value={clarity.toFixed(2)}
            />

            <Metric
              label="Status"
              value={
                isListening ? "Listening" : "Idle"
              }
            />
          </div>
        </div>

        <div
          className="app-card"
          style={{
            padding: "22px",
          }}
        >
          <h3>Pitch deviation</h3>
            <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
                <CentDeviationMeter cents={cents} isListening={isListening} />
            </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <Metric
              label="Average deviation"
              value={`${averageDeviation.toFixed(2)} ¢`}
            />

            <Metric
              label="Time in tune"
              value={`${timeInTune.toFixed(1)}%`}
            />
          </div>
        </div>
      </section>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px",
          marginTop: "24px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handlePause}
          disabled={!isPlaying}
        >
          Pause
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleStart}
        >
          {isPlaying ? "Playing" : "Start"}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleStop}
        >
          Stop
        </button>
      </div>

      <p
        className="page-subtitle"
        style={{
          textAlign: "center",
          marginTop: "14px",
        }}
      >
        Start the exercise and sing along with the notes.
      </p>

      <div
        style={{
          visibility: "hidden",
          height: 0,
          overflow: "hidden",
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
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div
      style={{
        padding: "12px",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-small)",
        background: "var(--color-background)",
      }}
    >
      <div
        className="page-subtitle"
        style={{
          fontSize: "12px",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>

      <strong>{value}</strong>
    </div>
  );
}