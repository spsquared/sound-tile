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
    workerCanvas = (Worker !== undefined) ? new (OffscreenCanvas !== undefined ? OffscreenCanvas : HTMLCanvasElement)(1, 1) : null;
    ctx = null;
    worker = (Worker !== undefined && OffscreenCanvas !== undefined) ? new Worker('./visualizerWorker.js') : null;
    playingSource = null;
    analyzer = audioContext.createAnalyser();
    gain = audioContext.createGain();
    color = '#ffffff';
    mode = 0;
    barWidthPercent = 0.80;
    barCrop = 1;
    scale = 1;
    lineWidth = 2;
    flippedX = false;
    flippedY = false;
    rotated = false;
    ready = false;
    drawing = false;
    constructor(arrbuf, canvas, oncreate) {
        if (!(arrbuf instanceof ArrayBuffer)) throw new TypeError('Visualizer arrbuf must be an ArrayBuffer');
        if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError('Visualizer canvas must be a HTMLCanvasElement');
        this.rawBuffer = new Uint8Array(new Uint8Array(arrbuf)).buffer;
        // create new canvas instead to prevent bugs
        this.canvas = canvas;
        if (this.worker !== null) {
            if (typeof oncreate == 'function') {
                let res = (e) => {
                    this.worker.removeEventListener('message', res);
                    oncreate();
                };
                this.worker.addEventListener('message', res);
            }
            this.worker.postMessage([this.workerCanvas], [this.workerCanvas]);
            this.ctx = canvas.getContext('bitmaprenderer');
        } else {
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
        if (this.drawing) return;
        await new Promise((resolve, reject) => {
            this.drawing = true;
            this.worker.onmessage = (e) => {
                if (e.data[0] !== null) this.ctx.transferFromImageBitmap(e.data[0]);
                this.drawing = false;
                resolve();
            };
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
                if (this.worker !== null) this.worker.postMessage([0, this.#workerData, []]);
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
            lineWidth: this.lineWidth,
            flippedX: this.flippedX,
            flippedY: this.flippedY,
            rotated: this.rotated
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
            flippedX: this.flippedX,
            flippedY: this.flippedY,
            rotated: this.rotated,
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
        visualizer.flippedX = data.flippedX ?? false;
        visualizer.flippedY = data.flippedY ?? false;
        visualizer.rotated = data.rotated ?? false;
        visualizer.volume = data.volume ?? 1;
        return visualizer;
    }
    destroy() {
        this.stop();
        if (this.analyzer) this.analyzer.disconnect();
        if (this.worker) this.worker.terminate();
        this.buffer = null;
        this.rawBuffer = null;
        Visualizer.#list.delete(this);
        Visualizer.#onUpdate();
    }

    static draw() {
        for (let visualizer of Visualizer.#list) {
            visualizer.draw();
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

    static #onUpdate = () => { };
    static set onUpdate(cb) {
        if (typeof cb !== 'function') throw new TypeError('"cb" is not a function');
        Visualizer.#onUpdate = () => cb();
    }

    static destroyAll() {
        Visualizer.#list.forEach(visualizer => visualizer.destroy());
    }
}
class ChannelPeakVisualizer extends Visualizer {
    splitter = audioContext.createChannelSplitter(2);
    analyzers = [];

    constructor(arrbuf, canvas, oncreate) {
        super(arrbuf, canvas, oncreate);
        this.mode = 5;
        delete this.barCrop;
        delete this.scale;
        delete this.lineWidth;
        this.analyzer.disconnect();
        delete this.analyzer;
        this.channelCount = 2;
        this.gain.connect(globalVolume);
    }
    async draw() {
        if (this.drawing) return;
        await new Promise((resolve, reject) => {
            this.drawing = true;
            this.worker.onmessage = (e) => {
                if (e.data[0] !== null) this.ctx.transferFromImageBitmap(e.data[0]);
                this.drawing = false;
                resolve();
            };
            if (this.buffer === null) {
                if (this.worker !== null) this.worker.postMessage([0, this.#workerData, null]);
                else VisualizerWorker.draw.call(this, data);
            } else {
                const dataArr = [];
                for (let i = 0; i < this.analyzers.length; i++) {
                    const data = new Uint8Array(this.analyzers[i].frequencyBinCount);
                    this.analyzers[i].getByteFrequencyData(data);
                    dataArr.push(data);
                }
                if (this.worker !== null) this.worker.postMessage([0, this.#workerData, dataArr], [...dataArr.map(arr => arr.buffer)]);
                else VisualizerWorker.draw.call(this, data);
            }
        });
    }
    get #workerData() {
        return {
            color: this.color,
            mode: this.mode,
            barWidthPercent: this.barWidthPercent,
            flippedX: this.flippedX,
            flippedY: this.flippedY,
            rotated: this.rotated
        };
    }

    set channelCount(c) {
        this.splitter.disconnect();
        this.splitter = audioContext.createChannelSplitter(c);
        let smoothing = this.analyzers.length ? this.analyzers[0].smoothingTimeConstant : 0.8;
        for (let a of this.analyzers) a.disconnect();
        this.analyzers = [];
        for (let i = 0; i < c; i++) {
            const analyzer = audioContext.createAnalyser();
            analyzer.smoothingTimeConstant = smoothing;
            this.splitter.connect(analyzer, i);
            this.analyzers.push(analyzer);
        }
        this.gain.connect(this.splitter);
    }
    get channelCount() {
        return this.analyzers.length;
    }
    set smoothingTimeConstant(c) {
        for (let a of this.analyzers) a.smoothingTimeConstant = c;
    }
    get smoothingTimeConstant() {
        return this.analyzers[0].smoothingTimeConstant;
    }
    set fftSize(size) { }
    get fftSize() { }

    getData() {
        return {
            buffer: this.rawBuffer,
            color: this.color,
            smoothing: this.smoothingTimeConstant,
            channelCount: this.channelCount,
            barWidthPercent: this.barWidthPercent,
            flippedX: this.flippedX,
            flippedY: this.flippedY,
            rotated: this.rotated,
            volume: this.gain.gain.value
        };
    }
    static fromData(data, canvas) {
        const visualizer = new ChannelPeakVisualizer(data.buffer, canvas);
        visualizer.color = data.color;
        visualizer.smoothingTimeConstant = data.smoothing ?? 0.8;
        visualizer.channelCount = data.channelCount;
        visualizer.barWidthPercent = data.barWidthPercent;
        visualizer.flippedX = data.flippedX ?? false;
        visualizer.flippedY = data.flippedY ?? false;
        visualizer.rotated = data.rotated ?? false;
        visualizer.volume = data.volume ?? 1;
        return visualizer;
    }
    destroy() {
        for (let a of this.analyzers) a.disconnect();
        super.destroy();
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
document.addEventListener('visibilitychange', (e) => {
    drawVisualizers = !document.hidden;
});
startDraw();