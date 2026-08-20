import { usePitchDetection } from "../hooks/usePitchDetection";

export default function PitchTest() {
  const {
    frequency,
    note,
    cents,
    clarity,
    isListening,
    error,
    start,
    stop,
  } = usePitchDetection();

  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>Pitch detection test</h1>

      <button onClick={isListening ? stop : start}>
        {isListening ? "Stop microphone" : "Start microphone"}
      </button>

      {error && <p>{error}</p>}

      <h2>Note: {note ?? "-"}</h2>

      <p>
        Frequency: {frequency ? `${frequency.toFixed(2)} Hz` : "-"}
      </p>

      <p>
        Cents:{" "}
        {cents !== null
          ? `${cents > 0 ? "+" : ""}${cents}`
          : "-"}
      </p>

      <p>Clarity: {clarity.toFixed(2)}</p>
    </main>
  );
}