import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import ScoreViewer from "../components/ScoreViewer";
import NoteHighway from "../components/NoteHighway";
import LyricsTeleprompter from "../components/LyricsTeleprompter";
import { songs, exercises } from "../components/Carousel";
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
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
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

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 16px",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: "24px",
              color: "#0d9488",
            }}
          >
            🎤 INTONA
          </div>

          <div
            style={{
              fontSize: "24px",
              fontWeight: 600,
            }}
          >
            🎵 {item?.title ?? "Exercise"}
          </div>
        </div>
      </header>

      <section
        style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          padding: "16px",
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
          display: "flex",
          gap: "16px",
          marginTop: "16px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: "2 1 420px",
            padding: "20px",
            borderRadius: "16px",
            background: "white",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          <h3>Live pitch</h3>

          <p>
            Microphone:{" "}
            <strong>
              {isListening ? "active" : "inactive"}
            </strong>
          </p>

          {error && <p>{error}</p>}

          <p>
            Note: <strong>{note ?? "-"}</strong>
          </p>

          <p>
            Frequency:{" "}
            <strong>
              {frequency
                ? `${frequency.toFixed(2)} Hz`
                : "-"}
            </strong>
          </p>

          <p>
            Clarity:{" "}
            <strong>{clarity.toFixed(2)}</strong>
          </p>
        </div>

        <div
          style={{
            flex: "1 1 220px",
            padding: "20px",
            borderRadius: "16px",
            background: "white",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          <h3>Deviation</h3>

          <div
            style={{
              fontSize: "32px",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            {cents !== null
              ? `${cents > 0 ? "+" : ""}${cents}`
              : "-"}
          </div>

          <p>cents</p>

          <p>
            Average:{" "}
            <strong>
              {averageDeviation.toFixed(2)}
            </strong>
          </p>

          <p>
            Time in tune:{" "}
            <strong>{timeInTune.toFixed(1)}%</strong>
          </p>
        </div>
      </section>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          marginTop: "24px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={handlePause}
          disabled={!isPlaying}
          style={{
            padding: "14px 28px",
            borderRadius: "999px",
            border: "1px solid #d0d3d9",
            background: "white",
            fontWeight: 600,
            cursor: "pointer",
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
            cursor: "pointer",
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
            cursor: "pointer",
          }}
        >
          Stop
        </button>
      </div>

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
    </div>
  );
}