
export function extractNotesFromOSMD(osmd) {
    const result = [];

    const FALLBACK_BPM = 120;

    const rawBpm =
        osmd?.Sheet?.DefaultStartTempoInBpm ??
        osmd?.sheet?.DefaultStartTempoInBpm ??
        FALLBACK_BPM;

    const bpm = getCorrectedQuarterNoteBpm(osmd, rawBpm);
    const secondsPerWholeNote = (60 / bpm) * 4;

    const iterator = osmd.cursor.Iterator;

    while (!iterator.EndReached) {
        const timestampInOsmdUnits = iterator.currentTimeStamp.RealValue;
        const startTimeSeconds = timestampInOsmdUnits * secondsPerWholeNote;

        const voiceEntries = iterator.CurrentVoiceEntries ?? [];

        for (const voiceEntry of voiceEntries) {

            if (!hasLyrics(voiceEntry)) {
                continue;
            }
            if (!globalThis.__loggedLyricSample) {
    const entry = Object.values(voiceEntry.LyricsEntries.table)[0];
    console.log("Wpis (entry):", entry);
    console.log("Wartość (entry.value):", entry.value);
    globalThis.__loggedLyricSample = true;
}
            const notes = voiceEntry.Notes ?? [];

            for (const note of notes) {
                if (note.isRest?.() || !note.Pitch) {
                    continue;
                }

                const pitch = note.ToStringShortGet ?? note.Pitch.ToString();
                const halfTone = note.halfTone;

                const durationInOsmdUnits = note.Length.RealValue;
                const durationSeconds = durationInOsmdUnits * secondsPerWholeNote;
                let lyricText = null;
                const lyricsTable = voiceEntry.LyricsEntries?.table;
                if (lyricsTable) {
                    const entries = Object.values(lyricsTable);
                    if (entries.length > 0) {
                    lyricText = entries[0].value?.Text ?? null;
                    }
                }   
                result.push({
                    pitch,
                    halfTone,
                    startTimeSeconds,
                    durationSeconds,
                    lyricText,
});
            }
        }

        iterator.moveToNext();
    }
    console.log(result.map(n => n.lyricText))
    return result;
}

function hasLyrics(voiceEntry) {
    const lyricsEntries = voiceEntry.LyricsEntries;

    if (!lyricsEntries) {
        return false;
    }

    if (typeof lyricsEntries.size === "function") {
        return lyricsEntries.size() > 0;
    }

    if (typeof lyricsEntries.nElements === "number") {
        return lyricsEntries.nElements > 0;
    }

    if (Array.isArray(lyricsEntries)) {
        return lyricsEntries.length > 0;
    }

    return false;
}

function getCorrectedQuarterNoteBpm(osmd, rawBpm) {
    try {
        const firstMeasure = osmd?.Sheet?.SourceMeasures?.[0];
        const timeSignature = firstMeasure?.ActiveTimeSignature;

        if (!timeSignature) {
            return rawBpm;
        }

        const numerator = timeSignature.Numerator;
        const denominator = timeSignature.Denominator;

        const isCompoundMeter =
            denominator === 8 && numerator >= 6 && numerator % 3 === 0;

        if (isCompoundMeter) {
            return rawBpm * 1.5;
        }

        return rawBpm;
    } catch (error) {
        console.warn("Nie udało się sprawdzić metrum, używam surowego BPM:", error);
        return rawBpm;
    }
}
