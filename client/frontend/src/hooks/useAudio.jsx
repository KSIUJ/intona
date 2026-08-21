import {useEffect, useState, useRef} from "react";
import mitt from 'mitt'

export default function useAudio(presigned_url) {
    const [isPlaying, setPlaying] = useState(false);

    const audio = useRef(null);
    const intervalId = useRef(null)
    const time = useRef(0)

    const hasEndedEventEmitter = useRef(mitt()) // in this library constructor starts with lowercase


    useEffect(() => {
        const handleEndEvent = () => {
            hasEndedEventEmitter.current.emit("end")
            audio.current.pause()
            if (intervalId.current) {
                clearInterval(intervalId.current)
            }
        }
        if (!audio.current)
            audio.current = new Audio(presigned_url);

        audio.current.loop = false
        audio.current.addEventListener("ended", handleEndEvent)

        return () => {
            audio.current.removeEventListener("ended", handleEndEvent);
            audio.current.pause()
            audio.current = null;
            if (intervalId.current) {
                clearInterval(intervalId.current)
            }

        }
    }, [])

    async function Start() {
        if (!audio.current) {
            return
        }
        try {
            await audio.current.play()
        } catch (e) {
            console.log("too early pressed play")
            return;
        }

        if (!audio.current) {
            return;
        }
        intervalId.current = setInterval(() => {
            time.current = audio.current.currentTime * 1000
        }, 10)

    }

    function Stop() {
        if (!audio.current) {
            return
        }
        audio.current.pause();
        if (intervalId.current) {
            clearInterval(intervalId.current)
            intervalId.current = null;
        }
    }

    async function Toggle() {
        setPlaying(prev => !prev);
    }

    function ChangeVolume(step) {
        if (step > 0) {
            step = 0.05;
            audio.current.volume = Math.min(1, audio.current.volume + step);
        } else {
            step = -0.05;
            audio.current.volume = Math.max(0, audio.current.volume + step);

        }
        console.log(audio.current.volume)
    }

    function FastForward(time_to) {
        audio.current.currentTime = time_to
    }

    useEffect(() => {
        console.log("use effect from use audio 2")
        if (isPlaying) {
            Stop()
        } else {
            Start()
        }
    }, [isPlaying]);

    useEffect(() => {
        setPlaying(prev => !prev);
    }, []);

    return {hasEndedEventEmitter, FastForward, ChangeVolume, Toggle,  isPlaying, time};
}