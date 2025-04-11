// Copyright (C) 2025 Sampleprovider(sp)

const audioContext = new AudioContext();
const globalVolume = audioContext.createGain();
globalVolume.connect(audioContext.destination);

if (navigator.userActivation) {
    const waitForInteraction = setInterval(() => {
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
    static #persistenceIdCounter = 0;

    #persistenceId = 0;
    rawBuffer = null;
    buffer = null;
    canvas = null;
    workerCanvas = (Worker !== undefined) ? new (OffscreenCanvas !== undefined ? OffscreenCanvas : HTMLCanvasElement)(1, 1) : null;
    ctx = null;
    worker = (Worker !== undefined && OffscreenCanvas !== undefined) ? new Worker('./visualizerWorker.js') : null;
    playingSource = null;
    analyzer = audioContext.createAnalyser();
    gain = audioContext.createGain();
    #color = { mode: 0, value: '#ffffff' };
    #color2 = { mode: 0, value: '#ffffff' };
    fillAlpha = 100;
    altColor = false;
    mode = 0;
    barWidthPercent = 0.8;
    barCrop = 1;
    barScale = 1;
    barLEDEffect = false;
    barLEDCount = 16;
    barLEDSize = 0.8;
    symmetry = 0;
    scale = 1;
    resolution = 1;
    lineWidth = 2;
    corrSamples = 32;
    corrWeight = 0.5;
    corrSmoothing = 0.9;
    spectHistoryLength = 120;
    spectDiscreteVals = 0;
    flippedX = false;
    flippedY = false;
    #rotated = false;
    ready = false;
    colorChanged = false;
    resized = false;
    drawing = false;
    loadPromise = new Promise(() => { });
    #drawCallback = null;

    constructor(arrbuf, canvas, oncreate, ondraw) {
        if (!(arrbuf instanceof ArrayBuffer)) throw new TypeError('Visualizer arrbuf must be an ArrayBuffer');
        if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError('Visualizer canvas must be a HTMLCanvasElement');
        this.#persistenceId = Visualizer.#persistenceIdCounter++;
        this.rawBuffer = new Uint8Array(new Uint8Array(arrbuf)).buffer;
        // create new canvas instead to prevent bugs
        this.canvas = canvas;
        if (this.worker !== null) {
            if (typeof oncreate == 'function') {
                const res = (e) => {
                    this.worker.removeEventListener('message', res);
                    oncreate();
                };
                this.worker.addEventListener('message', res);
                this.worker.addEventListener('error', (err) => { throw err; });
            }
            this.worker.postMessage([this.workerCanvas], [this.workerCanvas]);
            this.ctx = canvas.getContext('bitmaprenderer');
        } else {
            this.ctx = canvas.getContext('2d');
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.webkitImageSmoothingEnabled = false;
        }
        this.#drawCallback = ondraw;
        this.loadPromise = new Promise((resolve, reject) => {
            audioContext.decodeAudioData(arrbuf, buf => {
                this.buffer = buf;
                this.ready = true;
                Visualizer.#onUpdate();
                resolve();
            });
        });
        this.analyzer.connect(globalVolume);
        this.analyzer.fftSize = 512;
        this.analyzer.maxDecibels = -15;
        this.gain.connect(this.analyzer);
        Visualizer.#list.add(this);
    }
    start(time = 0) {
        this.stop();
        this.playingSource = audioContext.createBufferSource();
        this.playingSource.buffer = this.buffer;
        this.playingSource.connect(this.gain);
        this.playingSource.onended = this.playingSource.disconnect;
        this.playingSource.start(audioContext.currentTime, Math.max(time, 0));
    }
    stop() {
        this.playingSource?.stop();
        this.playingSource?.disconnect();
        this.playingSource = null;
    }
    async draw() {
        if (this.drawing) return;
        const data = await new Promise((resolve, reject) => {
            this.drawing = true;
            if (this.worker !== null) this.worker.onmessage = (e) => {
                if (e.data[0] !== null) this.ctx.transferFromImageBitmap(e.data[0]);
                this.drawing = false;
                resolve(e.data[1]);
            };
            if (this.buffer === null) {
                if (this.worker !== null) this.worker.postMessage([0, this.#workerData, null]);
                else VisualizerWorker.draw.call(this, null);
            } else if (this.mode <= 3 || this.mode == 5 || this.mode == 7 || this.mode == 8 || this.mode == 10) {
                const data = new Uint8Array(this.analyzer.frequencyBinCount);
                this.analyzer.getByteFrequencyData(data);
                if (this.worker !== null) this.worker.postMessage([0, this.#workerData, data], [data.buffer]);
                else VisualizerWorker.draw.call(this, data);
            } else if (this.mode == 4 || this.mode == 9) {
                const data = new Float32Array(this.analyzer.frequencyBinCount);
                this.analyzer.getFloatTimeDomainData(data);
                if (this.worker !== null) this.worker.postMessage([0, this.#workerData, data], [data.buffer]);
                else VisualizerWorker.draw.call(this, data);
            } else {
                if (this.worker !== null) this.worker.postMessage([0, this.#workerData, new Uint8Array()]);
                else VisualizerWorker.draw.call(this, null);
            }
            if (this.worker === null) this.drawing = false;
            this.colorChanged = false;
            this.resized = false;
        });
        if (data !== null && typeof this.#drawCallback == 'function') this.#drawCallback(data);
    }
    resize(w, h) {
        if (w <= 0 || h <= 0 || !isFinite(w) || !isFinite(h)) return;
        if (this.worker !== null) this.worker.postMessage([1, w, h]);
        else {
            this.canvas.width = w;
            this.canvas.height = h;
            this.resized = true;
        }
    }
    get #workerData() {
        return {
            persistenceId: this.#persistenceId,
            color: this.#color,
            color2: this.#color2,
            fillAlpha: this.fillAlpha,
            altColor: this.altColor,
            colorChanged: this.colorChanged,
            mode: this.mode,
            barWidthPercent: this.barWidthPercent,
            barCrop: this.barCrop,
            barScale: this.barScale,
            barLEDEffect: this.barLEDEffect,
            barLEDCount: this.barLEDCount,
            barLEDSize: this.barLEDSize,
            symmetry: this.symmetry,
            scale: this.scale,
            resolution: this.resolution,
            lineWidth: this.lineWidth,
            corrSamples: this.corrSamples,
            corrWeight: this.corrWeight,
            corrSmoothing: this.corrSmoothing,
            spectHistoryLength: this.spectHistoryLength,
            spectDiscreteVals: this.spectDiscreteVals,
            flippedX: this.flippedX,
            flippedY: this.flippedY,
            rotated: this.#rotated,
            playing: this.playing
        };
    }

    get persistenceId() {
        return this.#persistenceId;
    }
    get playing() {
        return audioContext.state == 'running';
    }

    set fftSize(size) {
        this.analyzer.fftSize = size;
    }
    get fftSize() {
        return this.analyzer.fftSize;
    }
    set barMinDecibels(db) {
        this.analyzer.minDecibels = Math.min(db, -16);
    }
    get barMinDecibels() {
        return this.analyzer.minDecibels;
    }
    set smoothing(c) {
        this.analyzer.smoothingTimeConstant = Math.max(0, Math.min(1, c));
    }
    get smoothing() {
        return this.analyzer.smoothingTimeConstant;
    }
    set spectHistoryLength(len) {
        this.spectHistoryLength = Math.max(1, len);
    }
    set muteOutput(mute) {
        if (mute) this.analyzer.disconnect(globalVolume);
        else this.analyzer.connect(globalVolume);
    }
    get muteOutput() {
        try {
            this.analyzer.disconnect(globalVolume);
            this.analyzer.connect(globalVolume);
            return false;
        } catch {
            return true;
        }
    }
    set volume(v) {
        this.gain.gain.setValueAtTime(v, audioContext.currentTime);
    }
    get volume() {
        return this.gain.gain.value;
    }
    set color(c) {
        this.#color = c;
        this.colorChanged = true;
    }
    get color() {
        return this.#color;
    }
    set color2(c) {
        this.#color2 = c;
        this.colorChanged = true;
    }
    get color2() {
        return this.#color2;
    }
    set rotated(r) {
        this.#rotated = r;
        if (this.worker !== null) this.worker.postMessage([2]);
        else this.resized = true;
    }
    get rotated() {
        return this.#rotated;
    }
    get sampleRate() {
        return this.buffer.sampleRate;
    }

    getData() {
        return {
            buffer: this.rawBuffer,
            mode: this.mode,
            smoothing: this.analyzer.smoothingTimeConstant,
            fftSize: this.analyzer.fftSize,
            color: this.#color,
            color2: this.#color2,
            fillAlpha: this.fillAlpha,
            altColor: this.altColor,
            barWidthPercent: this.barWidthPercent,
            barCrop: this.barCrop,
            barScale: this.barScale,
            barMinDecibels: this.barMinDecibels,
            barLEDEffect: this.barLEDEffect,
            barLEDCount: this.barLEDCount,
            barLEDSize: this.barLEDSize,
            symmetry: this.symmetry,
            scale: this.scale,
            resolution: this.resolution,
            lineWidth: this.lineWidth,
            corrSamples: this.corrSamples,
            corrWeight: this.corrWeight,
            corrSmoothing: this.corrSmoothing,
            spectHistoryLength: this.spectHistoryLength,
            spectDiscreteVals: this.spectDiscreteVals,
            flippedX: this.flippedX,
            flippedY: this.flippedY,
            rotated: this.#rotated,
            volume: this.gain.gain.value,
            muted: this.muteOutput
        };
    }
    static fromData(data, canvas, oncreate, ondraw) {
        const visualizer = new Visualizer(data.buffer, canvas, oncreate, ondraw);
        visualizer.mode = data.mode;
        visualizer.fftSize = data.fftSize;
        if (typeof data.color == 'string') {
            visualizer.color = {
                mode: 0,
                value: data.color
            };
            visualizer.color2 = {
                mode: 0,
                value: data.color
            };
        } else {
            visualizer.color = data.color;
            visualizer.color2 = data.color2;
            visualizer.altColor = data.altColor ?? false;
        }
        visualizer.fillAlpha = data.fillAlpha ?? 1;
        visualizer.barWidthPercent = data.barWidthPercent;
        visualizer.barCrop = data.barCrop;
        visualizer.barScale = data.barScale ?? 1;
        visualizer.smoothing = data.smoothing ?? 0.8;
        visualizer.barLEDEffect = data.barLEDEffect ?? false;
        visualizer.barLEDCount = data.barLEDCount ?? 16;
        visualizer.barLEDSize = data.barLEDSize ?? 0.8;
        visualizer.symmetry = data.symmetry ?? 0;
        visualizer.scale = data.scale;
        visualizer.resolution = data.resolution ?? 1;
        visualizer.lineWidth = data.lineWidth;
        visualizer.corrSamples = data.corrSamples ?? 32;
        visualizer.corrWeight = data.corrWeight ?? 0.5;
        visualizer.corrSmoothing = data.corrSmoothing ?? 0.9;
        visualizer.spectHistoryLength = data.spectHistoryLength ?? 120;
        visualizer.spectDiscreteVals = data.spectDiscreteVals ?? 0;
        visualizer.barMinDecibels = data.barMinDecibels ?? -100;
        visualizer.flippedX = data.flippedX ?? false;
        visualizer.flippedY = data.flippedY ?? false;
        visualizer.rotated = data.rotated ?? false;
        visualizer.volume = data.volume ?? 1;
        visualizer.muteOutput = data.muted ?? false;
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
        for (const visualizer of Visualizer.#list) {
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
    smoothing = 0.5;

    /**
     * @param {ArrayBuffer} arrbuf 
     * @param {HTMLCanvasElement} canvas 
     * @param {Function | undefined} oncreate 
     */
    constructor(arrbuf, canvas, oncreate) {
        super(arrbuf, canvas, oncreate);
        this.mode = 6;
        delete this.color2;
        delete this.fillAlpha;
        delete this.altColor;
        delete this.barCrop;
        delete this.symmetry;
        delete this.scale;
        delete this.lineWidth;
        delete this.corrSamples;
        delete this.corrWeight;
        delete this.corrSmoothing;
        delete this.spectHistoryLength;
        delete this.spectDiscreteVals;
        this.analyzer.disconnect();
        delete this.analyzer;
        this.channelCount = 2;
        this.gain.connect(globalVolume);
    }
    async draw() {
        if (this.drawing) return;
        await new Promise((resolve, reject) => {
            this.drawing = true;
            if (this.worker !== null) this.worker.onmessage = (e) => {
                if (e.data[0] !== null) this.ctx.transferFromImageBitmap(e.data[0]);
                this.drawing = false;
                resolve();
            };
            if (this.buffer === null) {
                if (this.worker !== null) this.worker.postMessage([0, this.#workerData, null]);
                else VisualizerWorker.draw.call(this, null);
            } else {
                const dataArr = [];
                for (let i = 0; i < this.analyzers.length; i++) {
                    const data = new Uint8Array(this.analyzers[i].frequencyBinCount);
                    this.analyzers[i].getByteTimeDomainData(data);
                    dataArr.push(data);
                }
                if (this.worker !== null) this.worker.postMessage([0, this.#workerData, dataArr], [...dataArr.map(arr => arr.buffer)]);
                else VisualizerWorker.draw.call(this, dataArr);
            }
            if (this.worker === null) this.drawing = false;
            this.colorChanged = false;
            this.resized = false;
        });
    }
    get #workerData() {
        return {
            persistenceId: this.persistenceId,
            color: this.color,
            colorChanged: this.colorChanged,
            mode: this.mode,
            barWidthPercent: this.barWidthPercent,
            barScale: this.barScale,
            barLEDEffect: this.barLEDEffect,
            barLEDCount: this.barLEDCount,
            barLEDSize: this.barLEDSize,
            smoothing: this.smoothing,
            flippedX: this.flippedX,
            flippedY: this.flippedY,
            rotated: this.rotated,
            playing: this.playing
        };
    }

    set channelCount(c) {
        this.splitter.disconnect();
        this.splitter = audioContext.createChannelSplitter(c);
        for (const a of this.analyzers) a.disconnect();
        this.analyzers = [];
        for (let i = 0; i < c; i++) {
            const analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 1024;
            this.splitter.connect(analyzer, i);
            this.analyzers.push(analyzer);
        }
        this.gain.connect(this.splitter);
    }
    get channelCount() {
        return this.analyzers.length;
    }
    set fftSize(size) { }
    get fftSize() { }
    set barMinDecibels(db) { }
    get barMinDecibels() { }
    set smoothing(c) { }
    get smoothing() { }
    set muteOutput(mute) {
        if (mute) this.gain.disconnect(globalVolume);
        else this.gain.connect(globalVolume);
    }
    get muteOutput() {
        try {
            this.gain.disconnect(globalVolume);
            this.gain.connect(globalVolume);
            return false;
        } catch {
            return true;
        }
    }

    getData() {
        return {
            buffer: this.rawBuffer,
            color: this.color,
            smoothing: this.smoothing,
            channelCount: this.channelCount,
            barWidthPercent: this.barWidthPercent,
            barLEDEffect: this.barLEDEffect,
            barLEDCount: this.barLEDCount,
            barLEDSize: this.barLEDSize,
            flippedX: this.flippedX,
            flippedY: this.flippedY,
            rotated: this.rotated,
            volume: this.gain.gain.value,
            muteOutput: this.muteOutput
        };
    }
    static fromData(data, canvas) {
        const visualizer = new ChannelPeakVisualizer(data.buffer, canvas);
        if (typeof data.color == 'string') visualizer.color = {
            mode: 0,
            value: data.color
        };
        else visualizer.color = data.color;
        visualizer.smoothing = data.smoothing ?? 3;
        visualizer.channelCount = data.channelCount;
        visualizer.barWidthPercent = data.barWidthPercent;
        visualizer.barLEDEffect = data.barLEDEffect ?? false;
        visualizer.barLEDCount = data.barLEDCount ?? 16;
        visualizer.barLEDSize = data.barLEDSize ?? 0.8;
        visualizer.flippedX = data.flippedX ?? false;
        visualizer.flippedY = data.flippedY ?? false;
        visualizer.rotated = data.rotated ?? false;
        visualizer.volume = data.volume ?? 1;
        visualizer.muteOutput = data.muteOutput ?? false;
        return visualizer;
    }
    destroy() {
        for (const a of this.analyzers) a.disconnect();
        super.destroy();
    }
}

let drawVisualizers = true;
async function startDraw() {
    delete startDraw;
    while (true) {
        await new Promise((resolve, reject) => {
            if (drawVisualizers || (pipWindow !== null && !pipWindow.document.hidden)) window.requestAnimationFrame(async () => {
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