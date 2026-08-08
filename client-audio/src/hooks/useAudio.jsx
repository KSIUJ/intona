import { useEffect, useState, useRef } from "react";


export default function useAudio(presigned_url) {
    const [hasEnded, setEnded] = useState(false);
    const [isPlaying, setPlaying] = useState(false);

    const audio = useRef(null);

    useEffect(() => {
        const handleEndEvent = () => {
            setEnded(true);
            setPlaying(false);
        }
        audio.current = new Audio(presigned_url);

        audio.current?.addEventListener("ended", handleEndEvent)

        return () => {
            audio.current.pause();
            audio.current.removeEventListener("ended", handleEndEvent);
            audio.current = null;
        }
    }, [presigned_url])

    function Toggle() {

        if (isPlaying) {
            console.log("pause")
            audio.current.pause();
        } else {
            console.log("play")
            audio.current.play();
        }
        setPlaying(!isPlaying);

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

    return { Toggle, ChangeVolume, isPlaying, hasEnded };
}