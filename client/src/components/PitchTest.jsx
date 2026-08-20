import { usePitchDetection } from "../hooks/usePitchDetection";

export default function PitchTest() {
  const { frequency, note, clarity, isListening, error, start, stop } =
    usePitchDetection();

  return (
    <div style={{ padding: "40px" }}>
      <h1>Microphone + Pitchy test</h1>

      <button onClick={isListening ? stop : start}>
        {isListening ? "Stop microphone" : "Start microphone"}
      </button>

      {error && <p>{error}</p>}

      <h2>Note: {note ?? "-"}</h2>
      <p>Frequency: {frequency ? `${frequency.toFixed(2)} Hz` : "-"}</p>
      <p>Clarity: {clarity.toFixed(2)}</p>
    </div>
  );
}