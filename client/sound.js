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

    rawBuffer = null;
    buffer = null;
    canvas = null;
    ctx = null;
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
    constructor(arrbuf, ctx) {
        if (!(arrbuf instanceof ArrayBuffer)) throw new TypeError('Visualizer arrbuf must be an ArrayBuffer');
        if (!(ctx instanceof CanvasRenderingContext2D)) throw new TypeError('Visualizer ctx must be an CanvasRenderingContext2D');
        this.rawBuffer = new Uint8Array(new Uint8Array(arrbuf)).buffer;
        audioContext.decodeAudioData(arrbuf, buf => {
            this.buffer = buf;
            this.ready = true;
            Visualizer.#onUpdate();
        });
        this.canvas = ctx.canvas;
        this.ctx = ctx;
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
            const data = new Uint8Array(this.analyzer.frequencyBinCount);
            this.analyzer.getByteFrequencyData(data);
            this.ctx.fillStyle = this.color;
            let croppedFreq = this.analyzer.frequencyBinCount * this.barCrop;
            let barSpace = (width / croppedFreq);
            let barWidth = barSpace * this.barWidthPercent;
            let barShift = (barSpace - barWidth) / 2;
            let yScale = height / 256;
            for (let i = 0; i < croppedFreq; i++) {
                let barHeight = (data[i] + 1) * yScale;
                this.ctx.fillRect(i * barSpace + barShift, height - barHeight, barWidth, barHeight);
            }
        } else if (this.mode == 1) {
            const data = new Uint8Array(this.analyzer.frequencyBinCount);
            this.analyzer.getByteFrequencyData(data);
            this.ctx.fillStyle = this.color;
            let croppedFreq = this.analyzer.frequencyBinCount * this.barCrop;
            let barSpace = (width / croppedFreq);
            let barWidth = barSpace * this.barWidthPercent;
            let barShift = (barSpace - barWidth) / 2;
            let yScale = height / 256;
            for (let i = 0; i < croppedFreq; i++) {
                let barHeight = (data[i] + 1) * yScale;
                this.ctx.fillRect(i * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
            }
        } else if (this.mode == 2) {
            const data = new Uint8Array(this.analyzer.frequencyBinCount);
            let croppedFreq = this.analyzer.frequencyBinCount * this.barCrop;
            this.analyzer.getByteFrequencyData(data);
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.lineWidth;
            let xStep = width / (croppedFreq - 1);
            let yScale = (height - (this.lineWidth / 2)) / 255;
            let yOffset = this.lineWidth / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, height - (data[0] * yScale));
            for (let i = 0; i < croppedFreq; i++) {
                this.ctx.lineTo(i * xStep, height - (data[i] * yScale + yOffset));
            }
            this.ctx.stroke();
        } else if (this.mode == 3) {
            const data = new Uint8Array(this.analyzer.frequencyBinCount);
            let croppedFreq = this.analyzer.frequencyBinCount * this.barCrop;
            this.analyzer.getByteFrequencyData(data);
            this.ctx.strokeStyle = this.color;
            this.ctx.fillStyle = this.color;
            this.ctx.lineWidth = this.lineWidth;
            let xStep = width / (croppedFreq - 1);
            let yScale = (height - (this.lineWidth / 2)) / 255;
            let yOffset = this.lineWidth / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, height - yOffset);
            this.ctx.lineTo(0, height - (data[0] * yScale));
            for (let i = 0; i < croppedFreq; i++) {
                this.ctx.lineTo(i * xStep, height - (data[i] * yScale + yOffset));
            }
            this.ctx.lineTo((croppedFreq - 1) * xStep, height - yOffset);
            this.ctx.lineTo(0, height - yOffset);
            this.ctx.stroke();
            this.ctx.fill();
        } else if (this.mode == 4) {
            const data = new Uint8Array(this.analyzer.frequencyBinCount);
            this.analyzer.getByteTimeDomainData(data);
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.lineWidth;
            let xStep = width / (this.analyzer.frequencyBinCount - 1);
            let yOffset = height * (this.scale - 1) * 0.5;
            let yScale = ((height) / 255) * this.scale;
            this.ctx.beginPath();
            this.ctx.moveTo(0, data[0] * yScale - yOffset);
            for (let i = 1; i < data.length; i++) {
                this.ctx.lineTo(i * xStep, data[i] * yScale - yOffset);
            }
            this.ctx.stroke();
        } else {
            this.ctx.fillStyle = 'red';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Invalid mode ' + this.mode, width / 2, height / 2);
        }
    }

    set fftSize(size) {
        this.analyzer.fftSize = size;
    }
    set volume(v) {
        this.gain.gain.setValueAtTime(v, audioContext.currentTime);
    }

    getData() {
        return {
            buffer: this.rawBuffer,
            mode: this.mode,
            fftSize: this.analyzer.fftSize,
            color: this.color,
            barWidthPercent: this.barWidthPercent,
            barCrop: this.barCrop,
            scale: this.scale,
            lineWidth: this.lineWidth,
            volume: this.gain.gain.value
        };
    }
    static fromData(data, ctx) {
        const visualizer = new Visualizer(data.buffer, ctx);
        visualizer.mode = data.mode;
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

    static draw() {
        Visualizer.#list.forEach(visualizer => visualizer.draw());
    }
    static startAll(time = 0) {
        Visualizer.#list.forEach(visualizer => visualizer.start(time));
    }
    static stopAll() {
        Visualizer.#list.forEach(visualizer => visualizer.stop());
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