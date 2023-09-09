// Copyright (C) 2023 Sampleprovider(sp)

const audioContext = new AudioContext();
const globalVolume = audioContext.createGain();
globalVolume.connect(audioContext.destination);

if (navigator.userActivation) {
    let waitForInteraction = setInterval(() => {
        if (navigator.userActivation.hasBeenActive) {
            audioContext.resume();
            clearInterval(waitForInteraction);
        }
    }, 100);
} else {
    document.addEventListener('click', function click(e) {
        document.removeEventListener('click', click);
        audioContext.resume();
    });
}

class Visualizer {
    static #list = new Set();

    rawBuffer = null;
    buffer = null;
    canvas = null;
    ctx = null;
    worker = (Worker !== undefined && OffscreenCanvas !== undefined) ? new Worker('./visualizerWorker.js') : null;
    playingSource = null;
    analyzer = audioContext.createAnalyser();
    gain = audioContext.createGain();
    color = 'white';
    mode = 0;
    barWidthPercent = 0.80;
    barCrop = 1;
    scale = 1;
    lineWidth = 2;
    ready = false;
    constructor(arrbuf, canvas) {
        if (!(arrbuf instanceof ArrayBuffer)) throw new TypeError('Visualizer arrbuf must be an ArrayBuffer');
        if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError('Visualizer canvas must be a HTMLCanvasElement');
        this.rawBuffer = new Uint8Array(new Uint8Array(arrbuf)).buffer;
        this.canvas = (OffscreenCanvas !== undefined) ? canvas.transferControlToOffscreen() : canvas;
        if (this.worker !== null) this.worker.postMessage([this.canvas], [this.canvas]);
        else {
            this.ctx = canvas.getContext('2d');
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.webkitImageSmoothingEnabled = false;
        }
        audioContext.decodeAudioData(arrbuf, buf => {
            this.buffer = buf;
            this.ready = true;
            Visualizer.#onUpdate();
        });
        this.analyzer.connect(globalVolume);
        this.analyzer.fftSize = 512;
        this.gain.connect(this.analyzer);
        Visualizer.#list.add(this);
    }
    start(time = 0) {
        this.stop();
        this.playingSource = audioContext.createBufferSource();
        this.playingSource.buffer = this.buffer;
        this.playingSource.connect(this.gain);
        this.playingSource.onended = this.playingSource.disconnect;
        this.playingSource.start(audioContext.currentTime, time);
    }
    stop() {
        if (this.playingSource !== null) {
            this.playingSource.stop();
            this.playingSource.disconnect();
        }
        this.playingSource = null;
    }
    async draw() {
        await new Promise((resolve, reject) => {
            this.worker.onmessage = (e) => resolve();
            if (this.buffer === null) {
                if (this.worker !== null) this.worker.postMessage([0, this.#workerData, null]);
                else VisualizerWorker.draw.call(this, data);
            } else if (this.mode >= 0 && this.mode <= 3) {
                const data = new Uint8Array(this.analyzer.frequencyBinCount);
                this.analyzer.getByteFrequencyData(data);
                if (this.worker !== null) this.worker.postMessage([0, this.#workerData, data], [data.buffer]);
                else VisualizerWorker.draw.call(this, data);
            } else if (this.mode == 4) {
                const data = new Float32Array(this.analyzer.frequencyBinCount);
                this.analyzer.getFloatTimeDomainData(data);
                if (this.worker !== null) this.worker.postMessage([0, this.#workerData, data], [data.buffer]);
                else VisualizerWorker.draw.call(this, data);
            } else {
                if (this.worker !== null) this.worker.postMessage([0, this.#workerData, null]);
                else VisualizerWorker.draw.call(this, data);
            }
        });
    }
    resize(w, h) {
        if (this.worker !== null) this.worker.postMessage([1, w, h]);
        else {
            this.canvas.width = w;
            this.canvas.height = h;
        }
    }
    get #workerData() {
        return {
            color: this.color,
            mode: this.mode,
            barWidthPercent: this.barWidthPercent,
            barCrop: this.barCrop,
            scale: this.scale,
            lineWidth: this.lineWidth
        };
    }

    set smoothingTimeConstant(c) {
        this.analyzer.smoothingTimeConstant = c;
    }
    get smoothingTimeConstant() {
        return this.analyzer.smoothingTimeConstant;
    }
    set fftSize(size) {
        this.analyzer.fftSize = size;
    }
    get fftSize() {
        return this.analyzer.fftSize;
    }
    set volume(v) {
        this.gain.gain.setValueAtTime(v, audioContext.currentTime);
    }
    get volume() {
        return this.gain.gain.value;
    }

    getData() {
        return {
            buffer: this.rawBuffer,
            mode: this.mode,
            smoothing: this.analyzer.smoothingTimeConstant,
            fftSize: this.analyzer.fftSize,
            color: this.color,
            barWidthPercent: this.barWidthPercent,
            barCrop: this.barCrop,
            scale: this.scale,
            lineWidth: this.lineWidth,
            volume: this.gain.gain.value
        };
    }
    static fromData(data, canvas) {
        const visualizer = new Visualizer(data.buffer, canvas);
        visualizer.mode = data.mode;
        visualizer.smoothingTimeConstant = data.smoothing ?? 0.8;
        visualizer.fftSize = data.fftSize;
        visualizer.color = data.color;
        visualizer.barWidthPercent = data.barWidthPercent;
        visualizer.barCrop = data.barCrop;
        visualizer.scale = data.scale;
        visualizer.lineWidth = data.lineWidth;
        visualizer.volume = data.volume ?? 1;
        return visualizer;
    }
    destroy() {
        this.stop();
        this.analyzer.disconnect();
        Visualizer.#list.delete(this);
        Visualizer.#onUpdate();
    }

    static async draw() {
        for (let visualizer of Visualizer.#list) {
            await visualizer.draw();
        }
    }
    static startAll(time = 0) {
        Visualizer.#list.forEach(visualizer => visualizer.start(time));
        audioContext.resume();
    }
    static stopAll() {
        Visualizer.#list.forEach(visualizer => visualizer.stop());
        audioContext.suspend();
    }
    static get duration() {
        let duration = 0;
        Visualizer.#list.forEach(visualizer => { if (visualizer.ready && visualizer.buffer.duration > duration) duration = visualizer.buffer.duration });
        return duration;
    }

    static #onUpdate = () => {};
    static set onUpdate(cb) {
        if (typeof cb !== 'function') throw new TypeError('"cb" is not a function');
        Visualizer.#onUpdate = () => cb();
    }
    
    static destroyAll() {
        Visualizer.#list.forEach(visualizer => visualizer.destroy());
    }
}

let drawVisualizers = true;
async function startDraw() {
    delete startDraw;
    while (true) {
        await new Promise((resolve, reject) => {
            if (drawVisualizers) window.requestAnimationFrame(async () => {
                await Visualizer.draw();
                resolve();
            });
            else setTimeout(resolve, 200);
        });
    }
};
startDraw();