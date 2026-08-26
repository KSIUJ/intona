import { useEffect, useRef } from "react";

export default function NoteHighway({ notes, audioRef}) {
    const canvasRef = useRef(null);
    function mapPitchToY(halfTone, minHalfTone, maxHalfTone, topY, bottomY) 
    {

    const proportion = (halfTone - minHalfTone) / (maxHalfTone - minHalfTone);
    const y = bottomY - proportion * (bottomY - topY);
    return y;


    }
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");


        const pixelsPerSecond = 180;


        const playheadX = 120;


        let startTimestamp = null;
        let animationFrameId = null;

        const halfTones = notes.map(note => note.halfTone);
        const minHalfTone = Math.min(...halfTones);
        const maxHalfTone = Math.max(...halfTones);


        function draw(timestamp) {
            if (startTimestamp === null) {
                startTimestamp = timestamp;
            }
            const elapsedSeconds = audioRef.current?.currentTime ?? 0;

            context.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const noteStart = note.startTimeSeconds;
    const noteX = playheadX + (noteStart - elapsedSeconds) * pixelsPerSecond;
    const noteLength = note.durationSeconds;
    const noteWidth = noteLength * pixelsPerSecond;
    const y = mapPitchToY(note.halfTone, minHalfTone, maxHalfTone, 20, 180);

    context.fillStyle = "navy";
    context.beginPath();
    context.roundRect(noteX, y, noteWidth, 20, 6);
    context.fill();
}
            context.strokeStyle = "cyan";
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(playheadX, 0);
            context.lineTo(playheadX, canvas.height);
            context.stroke();
            animationFrameId = requestAnimationFrame(draw);
        }

        animationFrameId = requestAnimationFrame(draw);

        return () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [notes,audioRef]);

    return (
        <canvas
    ref={canvasRef}
    width={800}
    height={200}
    style={{
        width: "100%",
        maxWidth: "800px",
        height: "auto",
        aspectRatio: "800 / 200",
        borderRadius: "12px",
        display: "block",
    }}
/>
    );
}