import { useCallback, useEffect, useRef, useState } from "react";
import { PitchDetector } from "pitchy";

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const MIN_CLARITY = 0.7;
const MIN_VOICE_FREQ = 70;   
const MAX_VOICE_FREQ = 1100;
function frequencyToPitchData(frequency) {
  if (!frequency || frequency <= 0) {
    return {
      note: null,
      cents: null,
    };
  }

  const midiFloat =
    69 + 12 * Math.log2(frequency / 440);

  const nearestMidiNote =
    Math.round(midiFloat);

  const noteName =
    NOTE_NAMES[
      ((nearestMidiNote % 12) + 12) % 12
    ];

  const octave =
    Math.floor(nearestMidiNote / 12) - 1;

  const rawCents =
    (midiFloat - nearestMidiNote) * 100;

  const cents =
    Math.max(
      -50,
      Math.min(
        50,
        Math.round(rawCents)
      )
    );

  return {
    note: `${noteName}${octave}`,
    cents,
  };
}

/**
 * Detects microphone pitch using Pitchy.
 *
 * onFrame is called for EVERY analysed microphone frame,
 * including unclear / invalid frames.
 *
 * This is important for scoring:
 * silence or unreliable detection must not simply disappear.
 */
export function usePitchDetection(onFrame) {
  const [frequency, setFrequency] =
    useState(null);

  const [note, setNote] =
    useState(null);

  const [cents, setCents] =
    useState(null);

  const [clarity, setClarity] =
    useState(0);

  const [isListening, setIsListening] =
    useState(false);

  const [error, setError] =
    useState(null);

  const streamRef =
    useRef(null);

  const audioContextRef =
    useRef(null);

  const animationFrameRef =
    useRef(null);

  const lastStateUpdateRef = useRef(0);
  /*
   * Store the latest callback in a ref.
   *
   * This allows React to update the callback
   * without restarting the microphone.
   */
  const onFrameRef =
    useRef(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(
        animationFrameRef.current
      );

      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();

      audioContextRef.current = null;
    }

    setIsListening(false);
    setFrequency(null);
    setNote(null);
    setCents(null);
    setClarity(0);
  }, []);

  const start =
    useCallback(async () => {
      if (streamRef.current) {
        return;
      }

      try {
        setError(null);

        const stream =
          await navigator.mediaDevices
            .getUserMedia({
              audio: true,
            });

        const audioContext =
          new AudioContext();

        const source =
          audioContext
            .createMediaStreamSource(
              stream
            );

        const analyser =
          audioContext
            .createAnalyser();

        analyser.fftSize = 2048;

        source.connect(analyser);

        const input =
          new Float32Array(
            analyser.fftSize
          );

        const detector =
          PitchDetector
            .forFloat32Array(
              analyser.fftSize
            );

        streamRef.current =
          stream;

        audioContextRef.current =
          audioContext;
        
        const detectPitch = () => {
    analyser.getFloatTimeDomainData(input);
    const [pitch, pitchClarity] = detector.findPitch(input, audioContext.sampleRate);
    const validPitch =
        pitchClarity >= MIN_CLARITY &&
        Number.isFinite(pitch) &&
        pitch >= MIN_VOICE_FREQ &&
        pitch <= MAX_VOICE_FREQ;

    onFrameRef.current?.({
        frequency: validPitch ? pitch : null,
        clarity: Number.isFinite(pitchClarity) ? pitchClarity : 0,
        isValid: validPitch,
    });

    const now = performance.now();
    if (!lastStateUpdateRef.current || now - lastStateUpdateRef.current >= 80) {
        lastStateUpdateRef.current = now;

        setClarity(Number.isFinite(pitchClarity) ? pitchClarity : 0);

        if (validPitch) {
            const pitchData = frequencyToPitchData(pitch);
            setFrequency(pitch);
            setNote(pitchData.note);
            setCents(pitchData.cents);
        } else {
            setFrequency(null);
            setNote(null);
            setCents(null);
        }
    }

    animationFrameRef.current = requestAnimationFrame(detectPitch);
};
        setIsListening(true);

        detectPitch();
      } catch (err) {
        console.error(err);

        stop();

        setError(
          "Could not access the microphone."
        );
      }
    }, [stop]);

  useEffect(() => {
    return stop;
  }, [stop]);

  return {
    frequency,
    note,
    cents,
    clarity,
    isListening,
    error,
    start,
    stop,
  };
}