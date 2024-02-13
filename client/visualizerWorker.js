// Copyright (C) 2024 Sampleprovider(sp)

const isWorker = this.window === undefined;

class VisualizerWorker {
    static #persistentData = new Map(); // memory leak when web workers unavailable

    static setColor(color, target, cid) {
        const persistentData = VisualizerWorker.#persistentData.get(this.persistenceId);
        if (persistentData.colors === undefined) persistentData.colors = [];
        if (this.colorChanged || this.resized || persistentData.colors[cid] === undefined) {
            if (color.mode == 0) {
                persistentData.colors[cid] = color.value;
                this.ctx[target] = color.value;
            } else if (color.mode == 1) {
                let width = this.canvas.width;
                let height = this.canvas.height;
                if (this.rotated) {
                    let w = width;
                    width = height;
                    height = w;
                }
                let angle = color.value.angle * Math.PI / 180;
                let halfWidth = width / 2;
                let halfHeight = height / 2;
                let edgeX = ((Math.abs(Math.tan(angle)) > width / height) ? (halfWidth * Math.sign(Math.sin(angle))) : (Math.tan(angle) * halfHeight * Math.sign(Math.cos(angle))));
                let edgeY = ((Math.abs(Math.tan(angle)) < width / height) ? (halfHeight * Math.sign(Math.cos(angle))) : (((angle % 180) == 0) ? (halfHeight * Math.sign(Math.cos(angle))) : (halfWidth / Math.tan(angle * Math.sign(Math.sin(angle))))));
                const gradient = color.value.type == 0
                    ? this.ctx.createLinearGradient(halfWidth - edgeX, halfHeight - edgeY, halfWidth + edgeX, halfHeight + edgeY)
                    : (color.value.type == 1
                        ? this.ctx.createRadialGradient(color.value.x * width, color.value.y * height, 0, color.value.x * width, color.value.y * height, color.value.r * Math.min(width, height))
                        : this.ctx.createConicGradient(color.value.angle * Math.PI / 180, color.value.x * width, color.value.y * height));
                for (let stop of color.value.stops) {
                    gradient.addColorStop(...stop);
                }
                persistentData.colors[cid] = gradient;
                this.ctx[target] = gradient;
            } else {
                this.ctx[target] = '#00ffff';
            }
        } else {
            this.ctx[target] = persistentData.colors[cid];
        }
    }

    /**
     * @param {Uint8Array | Float32Array} data 
     */
    static draw(data) {
        let width = this.canvas.width;
        let height = this.canvas.height;
        this.ctx.resetTransform();
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
        if (!isWorker) this.ctx.clearRect(0, 0, width, height);
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
        if (VisualizerWorker.#persistentData.get(this.persistenceId) === undefined) VisualizerWorker.#persistentData.set(this.persistenceId, {});
        const persistentData = VisualizerWorker.#persistentData.get(this.persistenceId);
        if (this.mode != 9) persistentData.lastWaveform = null;
        if (this.mode != 10) {
            persistentData.lastSpectrogramFrame = null;
            persistentData.lastSpectrogramContext = null;
            if (!this.ctx.imageSmoothingEnabled) this.ctx.imageSmoothingEnabled = true;
        }
        // it's-a spaghetti time!
        if (data === null) { // Loading spinner
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
        } else if (this.mode == 0) { // Frequency 1x bar
            VisualizerWorker.setColor.call(this, this.color, 'fillStyle', 0);
            let croppedFreq = Math.ceil(data.length * this.barCrop);
            let barSpace = (width / (croppedFreq * (this.symmetry ? 2 : 1)));
            let barWidth = Math.max(1, barSpace * this.barWidthPercent);
            let barShift = (barSpace - barWidth) / 2;
            let stepMultiplier = 256 / (this.barLEDEffect ? this.barLEDCount : 256);
            let yScale = height / 257 * stepMultiplier;
            switch (this.symmetry) {
                default:
                case 0:
                    for (let i = 0; i < croppedFreq; i++) {
                        let barHeight = Math.max(1, Math.ceil((data[i] * this.barScale + 1) / stepMultiplier) * yScale);
                        this.ctx.fillRect(i * barSpace + barShift, height, barWidth, -barHeight);
                    }
                    break;
                case 1:
                    for (let i = 0; i < croppedFreq; i++) {
                        let barHeight = Math.max(1, Math.ceil((data[i] * this.barScale + 1) / stepMultiplier) * yScale);
                        this.ctx.fillRect((croppedFreq - i - 1) * barSpace + barShift, height, barWidth, -barHeight);
                        this.ctx.fillRect((croppedFreq + i) * barSpace + barShift, height, barWidth, -barHeight);
                    }
                    break;
                case 2:
                    for (let i = 0; i < croppedFreq; i++) {
                        let barHeight = Math.max(1, Math.ceil((data[i] * this.barScale + 1) / stepMultiplier) * yScale);
                        this.ctx.fillRect(i * barSpace + barShift, height, barWidth, -barHeight);
                        this.ctx.fillRect((2 * croppedFreq - i - 1) * barSpace + barShift, height, barWidth, -barHeight);
                    }
                    break;
            }
            if (this.barLEDEffect) {
                this.ctx.globalCompositeOperation = 'destination-out';
                let blockStep = height / this.barLEDCount;
                let blockHeight = blockStep * (1 - this.barLEDSize);
                for (let i = -blockHeight / 2; i < height; i += blockStep) {
                    this.ctx.fillRect(0, i, width, blockHeight);
                }
            }
        } else if (this.mode == 1) { // Frequency 2x bar
            VisualizerWorker.setColor.call(this, this.color, 'fillStyle', 0);
            let croppedFreq = Math.ceil(data.length * this.barCrop);
            let barSpace = (width / (croppedFreq * (this.symmetry ? 2 : 1)));
            let barWidth = Math.max(1, barSpace * this.barWidthPercent);
            let barShift = (barSpace - barWidth) / 2;
            let stepMultiplier = 256 / (this.barLEDEffect ? this.barLEDCount : 256);
            let yScale = height / (256 + stepMultiplier / 2);
            switch (this.symmetry) {
                default:
                case 0:
                    for (let i = 0; i < croppedFreq; i++) {
                        let barHeight = Math.max(1, ((Math.ceil(data[i] * this.barScale / stepMultiplier) + 0.5) * stepMultiplier) * yScale);
                        this.ctx.fillRect(i * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                    }
                    break;
                case 1:
                    for (let i = 0; i < croppedFreq; i++) {
                        let barHeight = Math.max(1, ((Math.ceil(data[i] * this.barScale / stepMultiplier) + 0.5) * stepMultiplier) * yScale);
                        this.ctx.fillRect((croppedFreq - i - 1) * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                        this.ctx.fillRect((croppedFreq + i) * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                    }
                    break;
                case 2:
                    for (let i = 0; i < croppedFreq; i++) {
                        let barHeight = Math.max(1, ((Math.ceil(data[i] * this.barScale / stepMultiplier) + 0.5) * stepMultiplier) * yScale);
                        this.ctx.fillRect(i * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                        this.ctx.fillRect((2 * croppedFreq - i - 1) * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                    }
                    break;
            }
            if (this.barLEDEffect) {
                this.ctx.globalCompositeOperation = 'destination-out';
                let blockStep = height / (this.barLEDCount * 2 + 1);
                let blockHeight = blockStep * (1 - this.barLEDSize);
                for (let i = -blockHeight / 2 - blockStep; i < height; i += blockStep) {
                    this.ctx.fillRect(0, i, width, blockHeight);
                }
            }
        } else if (this.mode == 2) { // Frequency 1x line
            VisualizerWorker.setColor.call(this, this.color, 'strokeStyle', 0);
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineJoin = 'round';
            let croppedFreq = Math.ceil(data.length * this.barCrop);
            let xStep = width / ((croppedFreq * (this.symmetry ? 2 : 1)) - 1);
            let yScale = (height - this.lineWidth) / 256 * this.barScale;
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
        } else if (this.mode == 7) { // Frequency 2x line
            VisualizerWorker.setColor.call(this, this.color, 'strokeStyle', 0);
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineJoin = 'round';
            let croppedFreq = Math.ceil(data.length * this.barCrop);
            let xStep = width / ((croppedFreq * (this.symmetry ? 2 : 1)) - 1);
            let yScale = (height - this.lineWidth) / 256 * this.barScale;
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
        } else if (this.mode == 3) { // Frequency 1x fill
            VisualizerWorker.setColor.call(this, this.color, 'strokeStyle', 0);
            VisualizerWorker.setColor.call(this, this.color2, 'fillStyle', 1);
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineJoin = 'round';
            let croppedFreq = Math.ceil(data.length * this.barCrop);
            let xStep = (width - this.lineWidth) / ((croppedFreq * (this.symmetry ? 2 : 1)) - 1);
            let yScale = (height - this.lineWidth) / 256 * this.barScale;
            let xOffset = this.lineWidth / 2;
            let yOffset = this.lineWidth / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(xOffset, height - yOffset);
            switch (this.symmetry) {
                default:
                case 0:
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo(i * xStep + xOffset, height - (data[i] * yScale + yOffset));
                    }
                    break;
                case 1:
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo(i * xStep + xOffset, height - (data[croppedFreq - i - 1] * yScale + yOffset));
                    }
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo((croppedFreq + i) * xStep + xOffset, height - (data[i] * yScale + yOffset));
                    }
                    break;
                case 2:
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo(i * xStep + xOffset, height - (data[i] * yScale + yOffset));
                    }
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo((croppedFreq + i) * xStep + xOffset, height - (data[croppedFreq - i - 1] * yScale + yOffset));
                    }
                    break;
            }
            this.ctx.lineTo(width - xOffset, height - yOffset);
            this.ctx.lineTo(xOffset, height - yOffset);
            this.ctx.lineTo(this.lineWidth, height - yOffset);
            this.ctx.globalAlpha = this.fillAlpha;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            this.ctx.stroke();
        } else if (this.mode == 5) { // Frequency 2x fill
            VisualizerWorker.setColor.call(this, this.color, 'strokeStyle', 0);
            VisualizerWorker.setColor.call(this, this.color2, 'fillStyle', 1);
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineJoin = 'round';
            let croppedFreq = Math.ceil(data.length * this.barCrop);
            let xStep = (width - this.lineWidth) / ((croppedFreq * (this.symmetry ? 2 : 1)) - 1);
            let yScale = (height - this.lineWidth) / 256 * this.barScale;
            let xOffset = this.lineWidth / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(xOffset, height / 2);
            switch (this.symmetry) {
                default:
                case 0:
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo(i * xStep + xOffset, (height - (data[i] * yScale)) / 2);
                    }
                    for (let i = croppedFreq - 1; i >= 0; i--) {
                        this.ctx.lineTo(i * xStep + xOffset, (height + (data[i] * yScale)) / 2);
                    }
                    break;
                case 1:
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo(i * xStep + xOffset, (height - (data[croppedFreq - i - 1] * yScale)) / 2);
                    }
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo((croppedFreq + i) * xStep + xOffset, (height - (data[i] * yScale)) / 2);
                    }
                    for (let i = croppedFreq - 1; i >= 0; i--) {
                        this.ctx.lineTo((croppedFreq + i) * xStep + xOffset, (height + (data[i] * yScale)) / 2);
                    }
                    for (let i = croppedFreq - 1; i >= 0; i--) {
                        this.ctx.lineTo(i * xStep + xOffset, (height + (data[croppedFreq - i - 1] * yScale)) / 2);
                    }
                    break;
                case 2:
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo(i * xStep + xOffset, (height - (data[i] * yScale)) / 2);
                    }
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.lineTo((croppedFreq + i) * xStep + xOffset, (height - (data[croppedFreq - i - 1] * yScale)) / 2);
                    }
                    for (let i = croppedFreq - 1; i >= 0; i--) {
                        this.ctx.lineTo((croppedFreq + i) * xStep + xOffset, (height + (data[croppedFreq - i - 1] * yScale)) / 2);
                    }
                    for (let i = croppedFreq - 1; i >= 0; i--) {
                        this.ctx.lineTo(i * xStep + xOffset, (height + (data[i] * yScale)) / 2);
                    }
                    break;
            }
            this.ctx.lineTo(xOffset, height / 2);
            this.ctx.globalAlpha = this.fillAlpha;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            this.ctx.stroke();
        } else if (this.mode == 8) { // Frequency luminance bars
            VisualizerWorker.setColor.call(this, this.color, 'fillStyle', 0);
            let croppedFreq = Math.ceil(data.length * this.barCrop);
            let barSpace = (width / (croppedFreq * (this.symmetry ? 2 : 1)));
            let barWidth = Math.max(1, barSpace * this.barWidthPercent);
            let barShift = (barSpace - barWidth) / 2;
            let lumiScale = this.barScale / 256;
            switch (this.symmetry) {
                default:
                case 0:
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.globalAlpha = Math.min(1, data[i] * lumiScale);
                        this.ctx.fillRect(i * barSpace + barShift, 0, barWidth, height);
                    }
                    break;
                case 1:
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.globalAlpha = Math.min(1, data[i] * lumiScale);
                        this.ctx.fillRect((croppedFreq - i - 1) * barSpace + barShift, 0, barWidth, height);
                        this.ctx.fillRect((croppedFreq + i) * barSpace + barShift, 0, barWidth, height);
                    }
                    break;
                case 2:
                    for (let i = 0; i < croppedFreq; i++) {
                        this.ctx.globalAlpha = Math.min(1, data[i] * lumiScale);
                        this.ctx.fillRect(i * barSpace + barShift, 0, barWidth, height);
                        this.ctx.fillRect((2 * croppedFreq - i - 1) * barSpace + barShift, 0, barWidth, height);
                    }
                    break;
            }
            if (this.barLEDEffect) {
                this.ctx.globalAlpha = 1;
                this.ctx.globalCompositeOperation = 'destination-out';
                let blockStep = height / this.barLEDCount;
                let blockHeight = blockStep * (1 - this.barLEDSize);
                for (let i = -blockHeight / 2; i < height; i += blockStep) {
                    this.ctx.fillRect(0, i, width, blockHeight);
                }
            }
        } else if (this.mode == 4) { // Direct waveform
            VisualizerWorker.setColor.call(this, this.color, 'strokeStyle', 0);
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
        } else if (this.mode == 9) { // Correlated waveform
            // only shift if audio is playing
            let windowSize = data.length / 2;
            let bestShift = persistentData.lastShift ?? 0;
            if (bestShift > windowSize) bestShift = 0;
            if (this.playing) {
                // find lowest error by subtracting shifted window of buffer from smoothed temporal data
                if (persistentData.lastWaveform == undefined || persistentData.lastWaveform.length != windowSize) persistentData.lastWaveform = new Float32Array(data.slice(Math.floor((data.length - windowSize) / 2), data.length - windowSize / 2));
                let samples = Math.min(windowSize, this.corrSamples);
                let bestError = Infinity;
                let lastShift = Infinity;
                for (let i = 0; i < samples; i++) {
                    let shift = Math.round(windowSize * i / (samples - 1));
                    if (samples == 1) shift = Math.floor((data.length - windowSize) / 2);
                    if (shift == lastShift) continue;
                    lastShift = shift;
                    let error = 0;
                    for (let j = 0; j < windowSize; j++) {
                        error += Math.abs(persistentData.lastWaveform[j] - data[shift + j]);
                    }
                    if (error < bestError) {
                        bestError = error;
                        bestShift = shift;
                    }
                }
                // do gradient descent on the lowest error to reduce it even more
                for (let i = 0; i < 16; i++) {
                    let adjError = 0;
                    if (bestShift == windowSize) {
                        for (let j = 0; j < windowSize; j++) {
                            adjError -= Math.abs(persistentData.lastWaveform[j] - data[bestShift - 1 + j]);
                        }
                    } else {
                        for (let j = 0; j < windowSize; j++) {
                            adjError += Math.abs(persistentData.lastWaveform[j] - data[bestShift + 1 + j]);
                        }
                    }
                    if (Math.abs(bestError - adjError) < 0.1) break;
                    let newShift = Math.min(windowSize, Math.max(0, bestShift + Math.ceil(Math.abs((bestError - adjError) * this.corrWeight * (1 - i / 16))) * Math.sign(bestError - adjError)));
                    let newError = 0;
                    for (let j = 0; j < windowSize; j++) {
                        newError += Math.abs(persistentData.lastWaveform[j] - data[newShift + j]);
                    }
                    if (newError < bestError) {
                        bestError = newError;
                        bestShift = newShift;
                    }
                }
                // average the shifted buffer with previous buffer
                for (let i = 0; i < windowSize; i++) {
                    persistentData.lastWaveform[i] = this.corrSmoothing * persistentData.lastWaveform[i] + (1 - this.corrSmoothing) * data[bestShift + i];
                }
            }
            persistentData.lastShift = bestShift;
            // draw only the window portion
            VisualizerWorker.setColor.call(this, this.color, 'strokeStyle', 0);
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineJoin = 'round';
            let xStep = width / (windowSize - 1);
            let yOffset = height / 2;
            let yScale = this.scale * 128;
            this.ctx.beginPath();
            this.ctx.moveTo(0, data[bestShift] * yScale + yOffset);
            for (let i = 0; i < windowSize; i++) {
                this.ctx.lineTo(i * xStep, data[bestShift + i] * yScale + yOffset);
            }
            this.ctx.stroke();
        } else if (this.mode == 10) { // Spectrogram
            // create a history canvas of frequency height and time width (each pixel is 1x1)
            let forceRedraw = false;
            if (persistentData.lastSpectrogramFrame == null || persistentData.lastSpectrogramFrame.width != this.spectHistoryLength || persistentData.lastSpectrogramFrame.height != data.length * (1 + (this.symmetry > 0))) {
                persistentData.lastSpectrogramFrame = new OffscreenCanvas(this.spectHistoryLength, data.length * (1 + (this.symmetry > 0)));
                persistentData.lastSpectrogramContext = persistentData.lastSpectrogramFrame.getContext('2d');
                persistentData.lastSpectrogramContext.imageSmoothingEnabled = false;
                forceRedraw = true;
            }
            const spectFrame = persistentData.lastSpectrogramFrame;
            const spectCtx = persistentData.lastSpectrogramContext;
            if (this.ctx.imageSmoothingEnabled) this.ctx.imageSmoothingEnabled = false;
            let croppedFreq = Math.ceil(data.length * this.barCrop);
            if (this.playing || forceRedraw) {
                spectCtx.globalAlpha = 1;
                spectCtx.globalCompositeOperation = 'copy';
                spectCtx.drawImage(spectFrame, -1, 0);
                spectCtx.globalCompositeOperation = 'source-over';
                let scale = this.barScale / 255;
                if (this.color.mode == 0) {
                    spectCtx.fillStyle = this.color.value;
                    if (Math.floor(this.spectDiscreteVals) > 1) {
                        let discreteVals = Math.round(this.spectDiscreteVals) - 1;
                        // batch draws by intensity and then consecutive indices
                        const data2 = Array.from(data).map((v, i) => [Math.floor(Math.min(1, v * scale) * discreteVals), i]).sort((a, b) => (a[0] * data.length + a[1]) - (b[0] * data.length + b[1]));
                        for (let i = 0; i < data2.length;) {
                            let intensity = data2[i][0];
                            spectCtx.globalAlpha = intensity / discreteVals;
                            while (i < data2.length && data2[i][0] == intensity) {
                                let height = 0;
                                do i++, height++;
                                while (i < data2.length && data2[i][1] - data2[i - 1][1] == 1 && data2[i][0] == intensity);
                                spectCtx.fillRect(this.spectHistoryLength, data2[i - 1][1] + 1, -1, -height);
                            }
                        }
                    } else {
                        for (let i = 0; i < croppedFreq; i++) {
                            spectCtx.globalAlpha = data[i] * scale;
                            spectCtx.fillRect(this.spectHistoryLength, i, -1, 1);
                        }
                    }
                } else if (this.color.mode == 1) {
                    // batch draws by color and then consecutive indices
                    let discreteVals = Math.floor(this.spectDiscreteVals) > 1 ? Math.round(this.spectDiscreteVals) - 1 : 255;
                    const data2 = Array.from(data).map((v, i) => [Math.floor(Math.min(1, v * scale) * discreteVals), i]).sort((a, b) => (a[0] * data.length + a[1]) - (b[0] * data.length + b[1]));
                    const colorStops = this.color.value.stops.sort((a, b) => a[0] - b[0]);
                    for (let i = 0; i < data2.length;) {
                        let intensity = data2[i][0];
                        // interpolate the color (i should use binary search or interval tree if for some reason there's thousands of stops)
                        let interpTarget = intensity / discreteVals;
                        for (let j = 0; ; j++) {
                            if (j == colorStops.length - 1) {
                                if (interpTarget == colorStops[colorStops.length - 1][0]) spectCtx.fillStyle = colorStops[colorStops.length - 1][1];
                                else spectCtx.fillStyle = colorStops[0][1];
                                break;
                            }
                            if (colorStops[j][0] <= interpTarget && colorStops[j + 1][0] > interpTarget) {
                                if (colorStops[j][0] == interpTarget) {
                                    spectCtx.fillStyle = colorStops[j][1];
                                } else {
                                    let before = [parseInt(colorStops[j][1].slice(1, 3), 16), parseInt(colorStops[j][1].slice(3, 5), 16), parseInt(colorStops[j][1].slice(5, 7), 16)];
                                    let after = [parseInt(colorStops[j + 1][1].slice(1, 3), 16), parseInt(colorStops[j + 1][1].slice(3, 5), 16), parseInt(colorStops[j + 1][1].slice(5, 7), 16)];
                                    let t = (interpTarget - colorStops[j][0]) / (colorStops[j + 1][0] - colorStops[j][0]);
                                    spectCtx.fillStyle = `rgb(${Math.round(before[0] * (1 - t) + after[0] * t)}, ${Math.round(before[1] * (1 - t) + after[1] * t)}, ${Math.round(before[2] * (1 - t) + after[2] * t)})`;
                                }
                                break;
                            }
                        }
                        while (i < data2.length && data2[i][0] == intensity) {
                            let height = 0;
                            do i++, height++;
                            while (i < data2.length && data2[i][1] - data2[i - 1][1] == 1 && data2[i][0] == intensity);
                            spectCtx.fillRect(this.spectHistoryLength, data2[i - 1][1] + 1, -1, -height);
                        }
                    }
                }
            }
            // draw scaled canvas (upside down)
            this.ctx.scale(1, -1);
            this.ctx.drawImage(spectFrame, 0, 0, this.spectHistoryLength, croppedFreq, 0, -height, width, height);
        } else if (this.mode == 6) { // Channel peak
            persistentData.lastFrames = persistentData.lastFrames ?? [];
            let peaks = [];
            if (this.playing || persistentData.lastFrames.length == 0) {
                for (let i in data) {
                    let channel = data[i];
                    let max = 0;
                    for (let i = 0; i < channel.length; i++) {
                        let v = Math.abs(channel[i] - 128);
                        if (v > max) max = v;
                    }
                    let last = persistentData.lastFrames[i] ?? max;
                    let smoothed = max * (1 - this.smoothing) + last * this.smoothing;
                    peaks.push(smoothed);
                    persistentData.lastFrames[i] = smoothed;
                }
            } else {
                for (let i in data) {
                    peaks.push(persistentData.lastFrames[i]);
                }
            }
            VisualizerWorker.setColor.call(this, this.color, 'fillStyle', 0);
            let barSpace = (width / peaks.length);
            let barWidth = Math.max(1, barSpace * this.barWidthPercent);
            let barShift = (barSpace - barWidth) / 2;
            let stepMultiplier = 128 / (this.barLEDEffect ? (this.barLEDCount) : 128);
            let yScale = height / 128 * stepMultiplier;
            for (let i = 0; i < peaks.length; i++) {
                let barHeight = Math.ceil((peaks[i] * this.barScale + 1) / stepMultiplier) * yScale;
                this.ctx.fillRect(i * barSpace + barShift, height - barHeight, barWidth, barHeight);
            }
            if (this.barLEDEffect) {
                this.ctx.fillStyle = '#000000';
                let blockStep = height / this.barLEDCount;
                let blockHeight = blockStep * (1 - this.barLEDSize);
                for (let i = -blockHeight / 2; i < height; i += blockStep) {
                    this.ctx.fillRect(0, i, width, blockHeight);
                }
            }
        } else {
            this.ctx.fillStyle = 'red';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Invalid mode ' + this.mode, width / 2, height / 2);
        }
        persistentData.lastMode = this.mode;
    }
}

onmessage = (e) => {
    const canvas = e.data[0];
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    let resized = false;
    onmessage = (e) => {
        if (e.data[0] == 0) {
            try {
                VisualizerWorker.draw.call({ canvas, ctx, resized, ...e.data[1] }, e.data[2]);
                resized = false;
                const bitmap = canvas.transferToImageBitmap();
                postMessage([bitmap], [bitmap]);
            } catch (err) {
                console.error(err);
                postMessage([null]);
            }
        } else if (e.data[0] == 1) {
            canvas.width = e.data[1];
            canvas.height = e.data[2];
            resized = true;
            postMessage([]);
        }
    };
    postMessage([]);
};