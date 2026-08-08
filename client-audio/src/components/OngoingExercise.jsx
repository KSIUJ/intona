import { useEffect } from "react";
import useAudio from "../hooks/useAudio";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";


const fetchURL = async (id) => {
    console.log(`${import.meta.env.VITE_API_URL}/exercises/${id}/start`)
    const token = localStorage.getItem("token");

    const response = await fetch(`${import.meta.env.VITE_API_URL}/exercises/${id}/start`, {
        headers: {
            "Authorization": token
        }
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