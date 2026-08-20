import { useCallback, useEffect, useRef, useState } from "react";
import { PitchDetector } from "pitchy";

const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
];

function frequencyToNote(frequency) {
  if (!frequency || frequency <= 0) {
    return null;
  }

  const midiNote = Math.round(69 + 12 * Math.log2(frequency / 440));
  const noteName = NOTE_NAMES[((midiNote % 12) + 12) % 12];
  const octave = Math.floor(midiNote / 12) - 1;

  return `${noteName}${octave}`;
}

export function usePitchDetection() {
  const [frequency, setFrequency] = useState(null);
  const [note, setNote] = useState(null);
  const [clarity, setClarity] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsListening(false);
    setFrequency(null);
    setNote(null);
    setClarity(0);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) {
      return;
    }

    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;

      source.connect(analyser);

      const input = new Float32Array(analyser.fftSize);
      const detector = PitchDetector.forFloat32Array(analyser.fftSize);

      streamRef.current = stream;
      audioContextRef.current = audioContext;

      const detectPitch = () => {
        analyser.getFloatTimeDomainData(input);

        const [pitch, pitchClarity] = detector.findPitch(
          input,
          audioContext.sampleRate
        );

        setClarity(pitchClarity);

        if (pitchClarity > 0.9 && Number.isFinite(pitch)) {
          setFrequency(pitch);
          setNote(frequencyToNote(pitch));
        } else {
          setFrequency(null);
          setNote(null);
        }

        animationFrameRef.current = requestAnimationFrame(detectPitch);
      };

      setIsListening(true);
      detectPitch();
    } catch (err) {
      console.error(err);
      stop();
      setError("Could not access the microphone.");
    }
  }, [stop]);

  useEffect(() => {
    return stop;
  }, [stop]);

  return {
    frequency,
    note,
    clarity,
    isListening,
    error,
    start,
    stop,
  };
}