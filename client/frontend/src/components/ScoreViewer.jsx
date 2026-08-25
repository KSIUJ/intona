import { useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { extractNotesFromOSMD} from "../utils/extractNotesFromOSMD";


export default function ScoreViewer({ musicXmlUrl, onNotesLoaded }) {
    const osmdContainerRef = useRef(null);
    const osmdInstanceRef = useRef(null);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        if (!osmdContainerRef.current) {
            return;
        }
        let isCancelled = false;

        osmdContainerRef.current.innerHTML = "";

        const osmd = new OpenSheetMusicDisplay(osmdContainerRef.current, {
            backend: "svg",
            drawTitle: true,
        });
        osmdInstanceRef.current = osmd;

        osmd
            .load(musicXmlUrl)
            .then(() => {
                if (isCancelled) {
                    return;
                }

                osmd.render();
                console.log("Przykładowy VoiceEntry:", osmd.cursor.Iterator.CurrentVoiceEntries[0]);
                const extractedNotes = extractNotesFromOSMD(osmd);
                console.log("ScoreViewer: wyciągnięte nuty", extractedNotes);
                onNotesLoaded?.(extractedNotes);
                console.log("BPM z danych:", osmd.Sheet.DefaultStartTempoInBpm);
                
                
            })
            .catch((error) => {
                if (isCancelled) {
                    return;
                }
                console.error("ScoreViewer: błąd wczytywania nut", error);
                setLoadError(error.message ?? "Nie udało się wczytać nut.");
            });

        return () => {
    
            isCancelled = true;

            if (osmdInstanceRef.current?.cursor) {
                osmdInstanceRef.current.cursor.hide();
            }

            if (osmdContainerRef.current) {
                osmdContainerRef.current.innerHTML = "";
            }

            osmdInstanceRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [musicXmlUrl]);

    return (
        <div className="score-viewer">
            {loadError && <p style={{ color: "red" }}>Błąd: {loadError}</p>}
            <div className="osmd-container" ref={osmdContainerRef}></div>
        </div>
    );
}
