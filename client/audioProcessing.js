const MicrophonePermissionState = {
    UNDEFINED: undefined, PROMPT: 'prompt', GRANTED: 'granted', DENIED: 'denied', NOTFOUND: 'not-found'
}
let controller = null;
document.getElementById('start').addEventListener("click", async () => {
    const localStorage = window.localStorage;
    let bestMatch = "";

    if (controller !== null) {
        controller.abort();
    }
    controller = new AbortController();
    let signal = controller.signal;

    try {
        const currentPermission = await navigator.permissions.query({name: "microphone"});

        if (currentPermission.state === MicrophonePermissionState.PROMPT || localStorage.getItem("defaultDeviceLabel") === null) {
            const tempStream = await navigator.mediaDevices.getUserMedia({
                audio: true
            })
            if (signal.aborted) {
                tempStream.getTracks().forEach(track => {
                    track.stop()
                })
                return;
            }


            let defaultDevice = tempStream.getAudioTracks()[0];

            // Adding only label to localStorage not label with technical details
            localStorage.setItem("defaultDeviceLabel", defaultDevice.label.replace(/\s*\((?:[0-9a-f]+[-:][0-9a-f]+|Default|\d+-\d+)\)$/i, '').trim())

            tempStream.getTracks().forEach(track => {
                track.stop()
            })

            bestMatch = defaultDevice.getSettings().deviceId;
        } else if (currentPermission.state === MicrophonePermissionState.GRANTED) {
            let bestScore = -10;
            let savedLabel = localStorage.getItem("defaultDeviceLabel");
            console.log(savedLabel)
            const tempStream = await navigator.mediaDevices.getUserMedia({
                audio: true
            })

            if (signal.aborted) {
                tempStream.getTracks().forEach(track => {
                    track.stop()
                })
                return;
            }

            const availableDevices = await navigator.mediaDevices.enumerateDevices();


            for (const device of availableDevices) {
                const savedWords = savedLabel.toLowerCase().split(/\s+/)
                const deviceWords = device.label.toLowerCase().split(/\s+/)

                const sharedCount = savedWords.filter(word =>
                    deviceWords.some(dw => dw.includes(word) || word.includes(dw))
                ).length

                const score = sharedCount / savedWords.length

                if (score === 1) {
                    bestMatch = device.deviceId;
                    break;
                }

                // Require at least 50% word similarity
                if (score >= 0.5 && score > bestScore) {
                    bestMatch = device.deviceId;
                }
            }

            tempStream.getTracks().forEach(track => {
                track.stop()
            })
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: bestMatch,
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: false,
                autoGainControl: false,
                noiseSuppression: true
            }
        });

        if (signal.aborted) {
            stream.getAudioTracks().forEach((track) => {
                track.stop()
            })
            return;
        }


        const socket = new WebSocket("wss://intona-production.up.railway.app/api/vocal_analysis/audio-data");
        let audioContext = new AudioContext({sampleRate: 16000});
        await audioContext.audioWorklet.addModule("realtime_audio_processor.js")

        if (signal.aborted) {
            stream.getAudioTracks().forEach(track => track.stop());
            if (audioContext && audioContext.state !== 'closed') {
                await audioContext.close();
            }
            return;
        }
        const source = audioContext.createMediaStreamSource(stream);
        const workletNode = new AudioWorkletNode(audioContext, "RealTimeAudioProcessor")
        const gainNode = audioContext.createGain();

        gainNode.gain.value = 3;
        source.connect(gainNode);
        gainNode.connect(workletNode);
        gainNode.connect(audioContext.destination);

        let chunksCount = 0;

        workletNode.port.onmessage = (event) => {
            const audioChunk = event.data;
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(audioChunk.slice());
            }
        };


        const interval = setInterval(() => {
            if (chunksCount > 0) {
                console.log(`Prędkość: ${chunksCount} paczek/sekundę `);
                chunksCount = 0;
            }
        }, 1000);

        socket.addEventListener("message", (event) => {
            console.log("Serwer odpowiada:", event.data);
            document.getElementById("currentResult").innerHTML = "<b>" + event.data + "</b>";
            chunksCount++;
        });

        controller.signal.addEventListener("abort", () => {
            if (socket && (socket.readyState === socket.OPEN || socket.readyState === socket.CONNECTING)) {
                socket.close(1000, "user made multiple another request");
            }
            if (workletNode) workletNode.disconnect();
            if (gainNode) gainNode.disconnect();
            if (source) source.disconnect();
            if (interval) clearInterval(interval)
            if (audioContext && audioContext.state !== 'closed') {
                audioContext.close();
            }
        })
    } catch (permissionDeniedError) {
        console.log(permissionDeniedError.message)
        console.log("Denied")
    }
});

