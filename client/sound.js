// Copyright (C) 2023 Sampleprovider(sp)

const audioContext = new (window.AudioContext ?? window.webkitAudioContext ?? Error)();
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

    buffer = null;
    canvas = null;
    ctx = null;
    playingSource = null;
    analyzer = audioContext.createAnalyser();
    color = 'white';
    mode = 0;
    barWidthPercent = 0.80;
    ready = new Promise((res, rej) => { });
    constructor(arrbuf, ctx) {
        if (!(arrbuf instanceof ArrayBuffer)) throw new TypeError('Visualizer buf must be an ArrayBuffer');
        if (!(ctx instanceof CanvasRenderingContext2D)) throw new TypeError('Visualizer ctx must be an CanvasRenderingContext2D');
        this.ready = audioContext.decodeAudioData(arrbuf, buf => {
            this.buffer = buf;
            Visualizer.#onUpdate();
        });
        this.canvas = ctx.canvas;
        this.ctx = ctx;
        this.analyzer.connect(globalVolume);
        this.analyzer.fftSize = 512;
        Visualizer.#list.add(this);
    }
    start(time = 0) {
        this.stop();
        this.playingSource = audioContext.createBufferSource();
        this.playingSource.buffer = this.buffer;
        this.playingSource.connect(this.analyzer);
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
    draw() {
        let width = this.canvas.width;
        let height = this.canvas.height;
        this.ctx.clearRect(0, 0, width, height);
        if (this.buffer == null) {
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            let r = Math.min(width, height) / 3;
            this.ctx.translate(width / 2, height / 2);
            this.ctx.rotate((Date.now() / 100) % (4 * Math.PI)); // modulo probably not necessary
            this.ctx.arc(0, 0, r, 0, 4 * Math.PI / 3);
            this.ctx.lineTo(Math.cos(4 * Math.PI / 3) * (r * 0.8), Math.sin(4 * Math.PI / 3) * (r * 0.8));
            this.ctx.arc(0, 0, r * 0.8, 4 * Math.PI / 3, 0, true);
            this.ctx.lineTo(r, 0);
            this.ctx.fill();
            this.ctx.resetTransform();
            return;
        }
        if (this.mode == 0) {
            let barSpace = (width / this.analyzer.frequencyBinCount);
            let barWidth = barSpace * this.barWidthPercent;
            let barShift = (barSpace - barWidth) / 2;
            const data = new Uint8Array(this.analyzer.frequencyBinCount);
            this.analyzer.getByteFrequencyData(data);
            this.ctx.fillStyle = this.color;
            let yScale = (height) / 256;
            for (let i = 0; i < data.length; i++) {
                let barHeight = (data[i] + 1) * yScale;
                this.ctx.fillRect(i * barSpace + barShift, height - barHeight, barWidth, barHeight);
            }
        } else if (this.mode == 1) {
            let barSpace = (width / this.analyzer.frequencyBinCount);
            let barWidth = barSpace * this.barWidthPercent;
            let barShift = (barSpace - barWidth) / 2;
            const data = new Uint8Array(this.analyzer.frequencyBinCount);
            this.analyzer.getByteFrequencyData(data);
            this.ctx.fillStyle = this.color;
            let yScale = (height) / 256;
            for (let i = 0; i < data.length; i++) {
                let barHeight = (data[i] + 1) * yScale;
                this.ctx.fillRect(i * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
            }
        } else if (this.mode == 2) {
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Not Implemented', width / 2, height / 2);
        } else {
            this.ctx.fillStyle = 'red';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Invalid mode ' + this.mode, width / 2, height / 2);
        }
    }
    destroy() {
        this.stop();
        this.analyzer.disconnect();
        Visualizer.#list.delete(this);
        Visualizer.#onUpdate();
    }

    static startAll(time = 0) {
        Visualizer.#list.forEach(visualizer => visualizer.start(time));
    }
    static stopAll() {
        Visualizer.#list.forEach(visualizer => visualizer.stop());
    }

    set fftSize(size) {
        this.analyzer.fftSize = size;
    }
    static get duration() {
        let duration = 0;
        Visualizer.#list.forEach(visualizer => { if (visualizer.buffer.duration > duration) duration = visualizer.buffer.duration });
        return duration;
    }

    static #onUpdate = () => {};
    static set onUpdate(cb) {
        if (typeof cb !== 'function') throw new TypeError('"cb" is not a function');
        Visualizer.#onUpdate = () => cb();
    }

    static draw() {
        Visualizer.#list.forEach(visualizer => visualizer.draw());
    }
}

async function startDraw() {
    delete startDraw;
    while (true) {
        await new Promise((resolve, reject) => {
            window.requestAnimationFrame(() => {
                Visualizer.draw();
                resolve();
            });
        });
    }
};
startDraw();