import {useEffect, useState, useRef} from "react";
import mitt from 'mitt'


export default function useAudio(presigned_url) {
    const [isPlaying, setPlaying] = useState(false);

    const audio = useRef(null);
    const intervalId = useRef(null)
    const time = useRef(0)

    const hasEndedEventEmitter = new mitt() // in this library constructor starts with lowercase


    useEffect(() => {
        if (!presigned_url) {
            return;
        }
        const handleEndEvent = () => {
            hasEndedEventEmitter.emit("end")
            audio.current.pause();
            clearInterval(intervalId.current)
            setPlaying(false);
        }
        audio.current = new Audio(presigned_url);

        audio.current.loop = false
        audio.current?.addEventListener("ended", handleEndEvent)

        return () => {
            audio.current.pause();
            audio.current.removeEventListener("ended", handleEndEvent);
            audio.current = null;
        }
    }, [presigned_url])

    async function Toggle() {
        if (!presigned_url) {
            return;
        }
        if (isPlaying) {
            audio.current.pause();
            clearInterval(intervalId.current)
        } else {
            await audio.current.play();
            intervalId.current = setInterval(() => {
                time.current += 10;
                console.log(time.current)
            }, 10)
        }
        setPlaying(!isPlaying);

    }

    function ChangeVolume(step) {
        if (!presigned_url) {
            return;
        }
        if (step > 0) {
            step = 0.05;
            audio.current.volume = Math.min(1, audio.current.volume + step);
        } else {
            step = -0.05;
            audio.current.volume = Math.max(0, audio.current.volume + step);

        }
        console.log(audio.current.volume)
    }

    return {hasEndedEventEmitter, Toggle, ChangeVolume, isPlaying, time};
}