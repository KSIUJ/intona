import {useState, useRef, useEffect} from "react";
import mitt from "mitt";

export default function useAudio(presigned_url) {
    const [isPlaying, setPlaying] = useState(false);

    const audio = useRef(null);
    const intervalId = useRef(null);
    const time = useRef(0);
    const toggleRef = useRef(null);

    const hasEndedEventEmitter = useRef(mitt());
    const setTime = (value) => {
        time.current = value;
    };


    useEffect(() => {
        console.log(`Presigned url: ${presigned_url}`)
        const handleEndEvent = () => {
            hasEndedEventEmitter.current.emit("end");
            audio.current.pause();
            setPlaying(false);
            if (intervalId.current) {
                clearInterval(intervalId.current);
            }
        };

        if (!audio.current) audio.current = new Audio(presigned_url);

        audio.current.loop = false;
        audio.current.addEventListener("ended", handleEndEvent);

        return () => {
            audio.current.removeEventListener("ended", handleEndEvent);
            audio.current.pause();
            audio.current = null;
            if (intervalId.current) {
                clearInterval(intervalId.current);
            }
        };
    }, [presigned_url]);

    async function Start() {
        console.log('START')
        if (!audio.current) {
            return;
        }

        if (!audio.current.paused) {
            return;
        }

        try {
            await audio.current.play();
        } catch (e) {
            console.log("too early pressed play");
            return;
        }

        if (!audio.current) {
            return;
        }

        if (intervalId.current) {
            clearInterval(intervalId.current);
            intervalId.current = null;
        }

        intervalId.current = setInterval(() => {
            if (audio.current) {
                time.current = audio.current.currentTime * 1000;
            }
        }, 10);

        setPlaying(true);
    }

    function Stop() {
        console.log('STOP')
        if (!audio.current) {
            return;
        }
        audio.current.pause();
        if (intervalId.current) {
            clearInterval(intervalId.current);
            intervalId.current = null;
        }
        setPlaying(false);
    }


    async function Toggle() {
        if (isPlaying || (audio.current && !audio.current.paused)) {
            Stop();
        } else {
            await Start();
        }
    }


    function ChangeVolume(step) {
        if (step > 0) {
            step = 0.05;
            audio.current.volume = Math.min(1, audio.current.volume + step);
        } else {
            step = -0.05;
            audio.current.volume = Math.max(0, audio.current.volume + step);
        }
    }

    function FastForward(time_to) {
        audio.current.currentTime = time_to;
    }

    toggleRef.current = Toggle;

    return {
        audioRef: audio,
        hasEndedEventEmitter,
        FastForward,
        ChangeVolume,
        Toggle: toggleRef,
        isPlaying,
        time,
        setTime,
    };
}