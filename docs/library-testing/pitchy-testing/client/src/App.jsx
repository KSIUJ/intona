import { useEffect, useRef, useState } from 'react'
import { useMediaStream } from '@react-hooks-library/core'
import { PitchDetector } from 'pitchy'

function Demo() {
  const { play, stop, stream, isPlaying } = useMediaStream({
    videoDeviceId: false,
    audioDeviceId: undefined,
  })

  const audioContextRef = useRef(null)
  const animationFrameRef = useRef(null)

  const [pitch, setPitch] = useState(null)
  const [clarity, setClarity] = useState(null)

  const BUFFER_SIZE = 2048

  function getMediaStream() {
    return stream?.current ?? stream
  }

  function startPitchDetection(mediaStream) {
    if (!mediaStream) {
      console.warn('Brak MediaStream')
      return
    }

    if (audioContextRef.current) {
      console.warn('Pitch detection już działa')
      return
    }

    const audioContext = new AudioContext()
    audioContextRef.current = audioContext

    const source = audioContext.createMediaStreamSource(mediaStream)

    const analyser = audioContext.createAnalyser()
    analyser.fftSize = BUFFER_SIZE

    source.connect(analyser)

    const detector = PitchDetector.forFloat32Array(BUFFER_SIZE)
    const input = new Float32Array(BUFFER_SIZE)

    function updatePitch() {
      analyser.getFloatTimeDomainData(input)

      const [detectedPitch, detectedClarity] = detector.findPitch(
        input,
        audioContext.sampleRate
      )

      setClarity(detectedClarity)

      if (detectedClarity > 0.8 && detectedPitch > 0) {
        setPitch(detectedPitch)
      } else {
        setPitch(null)
      }

      animationFrameRef.current = requestAnimationFrame(updatePitch)
    }

    updatePitch()
  }

  function stopPitchDetection() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    setPitch(null)
    setClarity(null)
  }

  async function handleStart() {
    await play()
  }

  function handleStop() {
    stop()
    stopPitchDetection()
  }

  useEffect(() => {
    if (!isPlaying) return

    const mediaStream = getMediaStream()

    if (!mediaStream) return

    startPitchDetection(mediaStream)

    return () => {
      stopPitchDetection()
    }
  }, [isPlaying, stream])

  return (
    <div>
      <p>{isPlaying ? 'Recording' : 'Stopped Recording'}</p>

      <button onClick={handleStart}>Start</button>
      <button onClick={handleStop}>Stop</button>

      <p>
        Pitch:{' '}
        {pitch ? `${pitch.toFixed(2)} Hz` : 'brak stabilnego dźwięku'}
      </p>

      <p>
        Clarity:{' '}
        {clarity !== null ? clarity.toFixed(3) : '-'}
      </p>
    </div>
  )
}

export default Demo


