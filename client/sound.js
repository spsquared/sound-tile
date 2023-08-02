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
    constructor(buf, ctx) {
        if (!(buf instanceof AudioBuffer)) throw new TypeError('Visualizer buf must be an AudioBuffer');
        if (!(ctx instanceof CanvasRenderingContext2D)) throw new TypeError('Visualizer ctx must be an CanvasRenderingContext2D');
        this.buffer = buf;
        this.canvas = ctx.canvas;
        this.ctx = ctx;
        Visualizer.#list.add(this);
    }
    start(time) {
        this.stop();
        this.playingSource = audioContext.createBufferSource();
        this.playingSource.buffer = this.buffer;
        this.playingSource.connect(globalVolume);
        this.playingSource.onended = this.playingSource.disconnect;
        this.playingSource.start(audioContext.currentTime, time);
    }
    stop() {
        if (this.playingSource !== null) this.playingSource.stop();
        this.playingSource = null;
    }
    draw() {
        let width = this.canvas.width;
        let height = this.canvas.height;
        this.ctx.clearRect(0, 0, width, height);
    }
    destroy() {
        this.stop();
        Visualizer.#list.remove(this);
    }
}