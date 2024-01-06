// Copyright (C) 2024 Sampleprovider(sp)

class VisualizerWorker {
    static #persistentData = new Map();

    static draw(data) {
        let width = this.canvas.width;
        let height = this.canvas.height;
        this.ctx.resetTransform();
        this.ctx.scale(this.flippedX * -2 + 1, this.flippedY * -2 + 1);
        this.ctx.translate(this.flippedX * -width, this.flippedY * -height);
        if (this.rotated) {
            let w = width;
            width = height;
            height = w;
            this.ctx.rotate(Math.PI / 2);
            this.ctx.scale(-1, 1);
            this.ctx.translate(-width, -height);
        }
        // it's-a spaghetti time!
        if (data === null) {
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
        } else if (this.mode == 0) {
            this.ctx.fillStyle = this.color;
            let croppedFreq = Math.ceil(data.length * this.barCrop);
            let barSpace = (width / (croppedFreq * (this.symmetry ? 2 : 1)));
            let barWidth = Math.max(1, barSpace * this.barWidthPercent);
            let barShift = (barSpace - barWidth) / 2;
            let yScale = height / 256 * this.barScale;
            switch (this.symmetry) {
                default:
                case 0:
                    for (let i = 0; i < croppedFreq; i++) {
                        let barHeight = (data[i] + 1) * yScale;
                        this.ctx.fillRect(i * barSpace + barShift, height, barWidth, -barHeight);
                    }
                    break;
                case 1:
                    for (let i = 0; i < croppedFreq; i++) {
                        let barHeight = (data[i] + 1) * yScale;
                        this.ctx.fillRect((croppedFreq - i - 1) * barSpace + barShift, height, barWidth, -barHeight);
                        this.ctx.fillRect((croppedFreq + i) * barSpace + barShift, height, barWidth, -barHeight);
                    }
                    break;
                case 2:
                    for (let i = 0; i < croppedFreq; i++) {
                        let barHeight = (data[i] + 1) * yScale;
                        this.ctx.fillRect(i * barSpace + barShift, height, barWidth, -barHeight);
                        this.ctx.fillRect((2 * croppedFreq - i - 1) * barSpace + barShift, height, barWidth, -barHeight);
                    }
                    break;
            }
        } else if (this.mode == 1) {
            this.ctx.fillStyle = this.color;
            let croppedFreq = Math.ceil(data.length * this.barCrop);
            let barSpace = (width / (croppedFreq * (this.symmetry ? 2 : 1)));
            let barWidth = Math.max(1, barSpace * this.barWidthPercent);
            let barShift = (barSpace - barWidth) / 2;
            let yScale = height / 256 * this.barScale;
            switch (this.symmetry) {
                default:
                case 0:
                    for (let i = 0; i < croppedFreq; i++) {
                        let barHeight = (data[i] + 1) * yScale;
                        this.ctx.fillRect(i * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                    }
                    break;
                case 1:
                    for (let i = 0; i < croppedFreq; i++) {
                        let barHeight = (data[i] + 1) * yScale;
                        this.ctx.fillRect((croppedFreq - i - 1) * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                        this.ctx.fillRect((croppedFreq + i) * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                    }
                    break;
                case 2:
                    for (let i = 0; i < croppedFreq; i++) {
                        let barHeight = (data[i] + 1) * yScale;
                        this.ctx.fillRect(i * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                        this.ctx.fillRect((2 * croppedFreq - i - 1) * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                    }
                    break;
            }
        } else if (this.mode == 2) {
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineJoin = 'round';
            let croppedFreq = Math.ceil(data.length * this.barCrop);
            let xStep = width / ((croppedFreq * (this.symmetry ? 2 : 1)) - 1);
            let yScale = (height - (this.lineWidth / 2)) / 255 * this.barScale;
            let yOffset = this.lineWidth / 2;
            this.ctx.beginPath();
            switch (this.symmetry) {
                default:
                    case 0:
                    this.ctx.moveTo(0, height - (data[0] * yScale + yOffset));
                    for (let i = 1; i < croppedFreq; i++) {
                        this.ctx.lineTo(i * xStep, height - (data[i] * yScale + yOffset));
                    }
                    break;
                case 1:
                    this.ctx.moveTo(0, height - (data[croppedFreq - 1] * yScale + yOffset));
                    for (let i = 1; i < croppedFreq; i++) {
                        this.ctx.lineTo(i * xStep, height - (data[croppedFreq - i - 1] * yScale + yOffset));
                    }
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo((croppedFreq + i) * xStep, height - (data[i] * yScale + yOffset));
                    }
                    break;
                case 2:
                    this.ctx.moveTo(0, height - (data[0] * yScale + yOffset));
                    for (let i = 1; i < croppedFreq; i++) {
                        this.ctx.lineTo(i * xStep, height - (data[i] * yScale + yOffset));
                    }
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo((croppedFreq + i) * xStep, height - (data[croppedFreq - i - 1] * yScale + yOffset));
                    }
                    break;
            }
            this.ctx.stroke();
        } else if (this.mode == 3) {
            this.ctx.strokeStyle = this.color;
            this.ctx.fillStyle = this.color;
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineJoin = 'round';
            let croppedFreq = Math.ceil(data.length * this.barCrop);
            let xStep = width / ((croppedFreq * (this.symmetry ? 2 : 1)) - 1);
            let yScale = (height - (this.lineWidth / 2)) / 255 * this.barScale;
            let yOffset = this.lineWidth / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, height - yOffset);
            switch (this.symmetry) {
                default:
                    case 0:
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo(i * xStep, height - (data[i] * yScale + yOffset));
                    }
                    break;
                case 1:
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo(i * xStep, height - (data[croppedFreq - i - 1] * yScale + yOffset));
                    }
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo((croppedFreq + i) * xStep, height - (data[i] * yScale + yOffset));
                    }
                    break;
                case 2:
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo(i * xStep, height - (data[i] * yScale + yOffset));
                    }
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo((croppedFreq + i) * xStep, height - (data[croppedFreq - i - 1] * yScale + yOffset));
                    }
                    break;
            }
            this.ctx.lineTo(width, height - yOffset);
            this.ctx.lineTo(0, height - yOffset);
            this.ctx.stroke();
            this.ctx.fill();
        } else if (this.mode == 5) {
            this.ctx.strokeStyle = this.color;
            this.ctx.fillStyle = this.color;
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineJoin = 'round';
            let croppedFreq = Math.ceil(data.length * this.barCrop);
            let xStep = width / ((croppedFreq * (this.symmetry ? 2 : 1)) - 1);
            let yScale = (height - (this.lineWidth / 2)) / 255 * this.barScale;
            this.ctx.beginPath();
            this.ctx.moveTo(0, height / 2);
            switch (this.symmetry) {
                default:
                    case 0:
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo(i * xStep, (height - (data[i] * yScale)) / 2);
                    }
                    for (let i = croppedFreq - 1; i >= 0; i--) {
                        this.ctx.lineTo(i * xStep, (height + (data[i] * yScale)) / 2);
                    }
                    break;
                case 1:
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo(i * xStep, (height - (data[croppedFreq - i - 1] * yScale)) / 2);
                    }
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo((croppedFreq + i) * xStep, (height - (data[i] * yScale)) / 2);
                    }
                    for (let i = croppedFreq - 1; i >= 0; i--) {
                        this.ctx.lineTo((croppedFreq + i) * xStep, (height + (data[i] * yScale)) / 2);
                    }
                    for (let i = croppedFreq - 1; i >= 0; i--) {
                        this.ctx.lineTo(i * xStep, (height + (data[croppedFreq - i - 1] * yScale)) / 2);
                    }
                    break;
                case 2:
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo(i * xStep, (height - (data[i] * yScale)) / 2);
                    }
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo((croppedFreq + i) * xStep, (height - (data[croppedFreq - i - 1] * yScale)) / 2);
                    }
                    for (let i = croppedFreq - 1; i >= 0; i--) {
                        this.ctx.lineTo((croppedFreq + i) * xStep, (height + (data[croppedFreq - i - 1] * yScale)) / 2);
                    }
                    for (let i = croppedFreq - 1; i >= 0; i--) {
                        this.ctx.lineTo(i * xStep, (height + (data[i] * yScale)) / 2);
                    }
                    break;
            }
            this.ctx.lineTo(0, height / 2);
            this.ctx.stroke();
            this.ctx.fill();
        } else if (this.mode == 4) {
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineJoin = 'round';
            let xStep = width / (data.length - 1);
            let yOffset = height / 2;
            let yScale = this.scale * 128;
            this.ctx.beginPath();
            this.ctx.moveTo(0, data[0] * yScale + yOffset);
            for (let i = 1; i < data.length; i++) {
                this.ctx.lineTo(i * xStep, data[i] * yScale + yOffset);
            }
            this.ctx.stroke();
        } else if (this.mode == 6) {
            if (VisualizerWorker.#persistentData.get(this.persistenceId) == undefined) VisualizerWorker.#persistentData.set(this.persistenceId, []);
            let peaks = [];
            for (let i in data) {
                let channel = data[i];
                let max = 0;
                for (let i = 0; i < channel.length; i++) {
                    let v = Math.abs(channel[i] - 128);
                    if (v > max) max = v;
                }
                let last = VisualizerWorker.#persistentData.get(this.persistenceId)[i] ?? max;
                let smoothed = max * (1 - this.smoothing) + last * this.smoothing;
                peaks.push(smoothed);
                VisualizerWorker.#persistentData.get(this.persistenceId)[i] = smoothed;
            }
            this.ctx.fillStyle = this.color;
            let barSpace = (width / peaks.length);
            let barWidth = Math.max(1, barSpace * this.barWidthPercent);
            let barShift = (barSpace - barWidth) / 2;
            let yScale = height / 127 * this.barScale;
            for (let i = 0; i < peaks.length; i++) {
                let barHeight = peaks[i] * yScale + 1;
                this.ctx.fillRect(i * barSpace + barShift, height - barHeight, barWidth, barHeight);
            }
        } else {
            this.ctx.fillStyle = 'red';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Invalid mode ' + this.mode, width / 2, height / 2);
            this.ctx.clearRect(0, 0, width, height);
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, width, height);
        }
    }
}

onmessage = (e) => {
    const canvas = e.data[0];
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    postMessage([]);
    onmessage = (e) => {
        if (e.data[0] == 0) {
            VisualizerWorker.draw.call({ canvas, ctx, ...e.data[1] }, e.data[2]);
            try {
                const bitmap = canvas.transferToImageBitmap();
                postMessage([bitmap], [bitmap]);
            } catch (err) {
                console.error(err);
                postMessage([null]);
            }
        } else if (e.data[0] == 1) {
            canvas.width = e.data[1];
            canvas.height = e.data[2];
            postMessage([]);
        }
    };
};