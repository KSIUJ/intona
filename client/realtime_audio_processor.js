class RealTimeAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.dataBuffer= new Float32Array(1024);
    this.currentIndex = 0;
  }
  process(inputs, outputs, parameters) {
    if (!inputs[0] || !inputs[0][0]) {
      return true;
    }
    for (let i = 0; i < inputs[0][0].length; i++) {
      this.dataBuffer[this.currentIndex++] = inputs[0][0][i];
      outputs[0][0][i] = inputs[0][0][i];
      if (this.currentIndex === 1024) {
        this.port.postMessage(this.dataBuffer);
        this.currentIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor("RealTimeAudioProcessor", RealTimeAudioProcessor);