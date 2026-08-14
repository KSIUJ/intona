import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import useAudio from '../hooks/useAudio'


const fetchURL = async (id) => {

    const response = await fetch(`/api/exercises/${id}/start`, {
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch presigned url');
    return response.json();
}

export default function OngoingExercise() {
    const params = useParams();

    const { data, isError, isLoading } = useQuery({
        queryKey: ["exercises", params.id],
        queryFn: () => fetchURL(params.id),
        staleTime: 1000 * 60 * 5,
    })

    const audio = useAudio(data?.presigned_url)

    useEffect(() => {
        const handleKeyDownEvent = (event) => {
            const key = event.code;
            console.log(key)
            if (key === "Space")
                audio.Toggle();
        }

        const handleMouseWheelEvent = (event) => {
            audio.ChangeVolume(event.wheelDeltaY)
        }

        window.addEventListener("keydown", handleKeyDownEvent)
        window.addEventListener("wheel", handleMouseWheelEvent)

        return () => {
            window.removeEventListener("keydown", handleKeyDownEvent)
            window.removeEventListener("wheel", handleMouseWheelEvent)
        }
    }, [audio])

    if (isLoading) {
        return "Loading"
    }
    if (isError) {
        return "Error"
    }


    return (<></>)

}