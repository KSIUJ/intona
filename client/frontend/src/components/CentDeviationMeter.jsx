import React, { useEffect, useRef, useState } from "react";
import "./CentDeviationMeter.css";

export default function CentDeviationMeter({ cents, isListening }) {
    const [displayCents, setDisplayCents] = useState(0);
    const smoothedRef = useRef(0);

    useEffect(() => {
        if (cents === null || cents === undefined || !isListening) {
            return;
        }

        const alpha = 0.05;
        const nextValue = smoothedRef.current + alpha * (cents - smoothedRef.current);
        smoothedRef.current = nextValue;
        setDisplayCents(Math.round(nextValue));
    }, [cents, isListening]);

    const isValueValid = cents !== null && cents !== undefined && isListening;
    const clampedCents = isValueValid ? Math.max(-50, Math.min(50, displayCents)) : 0;
    const bottomPercentage = ((clampedCents + 50) / 100) * 100;
    const absCents = Math.abs(clampedCents);

    let statusClass = "far-off";
    if (absCents <= 10) {
        statusClass = "in-tune";
    } else if (absCents <= 20) {
        statusClass = "slight-off";
    }

    const formattedValue = isValueValid
        ? `${displayCents > 0 ? "+" : ""}${displayCents}`
        : "-";

    return (
        <div className="cents-meter-vertical-container vertical_bar">
            <div className="cents-meter-vertical-wrapper">
                <div className="cents-meter-vertical-labels">
                    <span>+50</span>
                    <span>0</span>
                    <span>-50</span>
                </div>

                <div className="cents-meter-vertical-bar">
                    <div className="cents-meter-vertical-target-zone" />
                    <div className="cents-meter-vertical-center-line" />
                    {isValueValid && (
                        <div
                            className={`cents-meter-vertical-pointer ${statusClass}`}
                            style={{ bottom: `${bottomPercentage}%` }}
                        />
                    )}
                </div>
            </div>

            <div className="cents-meter-vertical-value">
                {formattedValue}
            </div>
        </div>
    );
}