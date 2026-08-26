import { useEffect, useRef, useState } from "react";

export default function LyricsTeleprompter({ notes, audioRef }) {
    const [activeIndex, setActiveIndex] = useState(-1);
    const wordRefs = useRef([]);

    const lyricNotes = notes.filter((note) => note.lyricText);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        function handleTimeUpdate() {
            const t = audio.currentTime;
            const index = lyricNotes.findIndex(
                (note) => t >= note.startTimeSeconds && t < note.startTimeSeconds + note.durationSeconds
            );
            if (index !== -1 && index !== activeIndex) {
                setActiveIndex(index);
                wordRefs.current[index]?.scrollIntoView({
                    behavior: "smooth",
                    inline: "center",
                    block: "nearest",
                });
            }
        }

        audio.addEventListener("timeupdate", handleTimeUpdate);
        return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
    }, [lyricNotes, activeIndex, audioRef]);

    return (
        <div
    style={{
        display: "flex",
        gap: "10px",
        overflowX: "hidden",
        whiteSpace: "nowrap",
        padding: "16px",
        background: "white",
        width: "100%",
        boxSizing: "border-box",
    }}
>
            {lyricNotes.map((note, index) => (
                <span
                    key={index}
                    ref={(el) => (wordRefs.current[index] = el)}
                    style={{
                        color: index === activeIndex ? "blue" : "#666",
                        fontWeight: index === activeIndex ? "bold" : "normal",
                        fontSize: "22px",
                        transition: "color 0.2s, font-weight 0.2s",
                    }}
                >
                    {note.lyricText}
                </span>
            ))}
        </div>
    );
}