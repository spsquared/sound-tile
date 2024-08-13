// Copyright (C) 2024 Sampleprovider(sp)

const isWorker = this.window === undefined;

class VisualizerWorker {
    static #persistentData = new Map(); // memory leak when web workers unavailable

    static setColor(color, target, cid) {
        const persistentData = VisualizerWorker.#persistentData.get(this.persistenceId);
        persistentData.colors = persistentData.colors ?? [];
        if (this.colorChanged || this.resized || persistentData.colors[cid] === undefined) {
            if (color.mode == 0) {
                persistentData.colors[cid] = color.value;
                this.ctx[target] = color.value;
            } else if (color.mode == 1) {
                const width = this.rotated ? this.canvas.height : this.canvas.width;
                const height = this.rotated ? this.canvas.width : this.canvas.height;
                const angle = color.value.angle * Math.PI / 180;
                const halfWidth = width / 2;
                const halfHeight = height / 2;
                const edgeX = ((Math.abs(Math.tan(angle)) > width / height) ? (halfWidth * Math.sign(Math.sin(angle))) : (Math.tan(angle) * halfHeight * Math.sign(Math.cos(angle))));
                const edgeY = ((Math.abs(Math.tan(angle)) < width / height) ? (halfHeight * Math.sign(Math.cos(angle))) : (((angle % 180) == 0) ? (halfHeight * Math.sign(Math.cos(angle))) : (halfWidth / Math.tan(angle * Math.sign(Math.sin(angle))))));
                const gradient = color.value.type == 0
                    ? this.ctx.createLinearGradient(halfWidth - edgeX, halfHeight - edgeY, halfWidth + edgeX, halfHeight + edgeY)
                    : (color.value.type == 1
                        ? this.ctx.createRadialGradient(color.value.x * width, color.value.y * height, 0, color.value.x * width, color.value.y * height, color.value.r * Math.min(width, height))
                        : this.ctx.createConicGradient(angle, color.value.x * width, color.value.y * height));
                for (const stop of color.value.stops) {
                    gradient.addColorStop(...stop);
                }
                persistentData.colors[cid] = gradient;
                this.ctx[target] = gradient;
            } else {
                this.ctx[target] = '#ff00ff';
            }
        } else {
            this.ctx[target] = persistentData.colors[cid];
        }
    }
    static parseStops(stops, cid) {
        const persistentData = VisualizerWorker.#persistentData.get(this.persistenceId);
        persistentData.colorStops = persistentData.colorStops ?? [];
        if (this.colorChanged || this.resized || persistentData.colorStops[cid] === undefined) {
            const sorted = stops.sort((a, b) => a[0] - b[0]);
            const parsedStops = [];
            for (const stop of sorted) {
                parsedStops.push([stop[0], parseInt(stop[1].slice(1, 3), 16), parseInt(stop[1].slice(3, 5), 16), parseInt(stop[1].slice(5, 7), 16)]);
            }
            persistentData.colorStops[cid] = parsedStops;
        }
    }
    static interpGradientColor(cid, target) {
        const persistentData = VisualizerWorker.#persistentData.get(this.persistenceId);
        const stops = persistentData?.colorStops?.at(cid);
        if (stops !== undefined) {
            if (target <= stops[0][0]) return `rgb(${stops[0][1]}, ${stops[0][2]}, ${stops[0][3]})`;
            for (let j = 0, k = 1; ; j++, k++) {
                if (j == stops.length - 1) {
                    if (target >= stops[j][0]) return `rgb(${stops[j][1]}, ${stops[j][2]}, ${stops[j][3]})`;
                    else return `rgb(${stops[0][1]}, ${stops[0][2]}, ${stops[0][3]})`;
                }
                if (stops[j][0] <= target && stops[k][0] > target) {
                    if (stops[j][0] == target) {
                        return stops[j][1];
                    } else {
                        const t = (target - stops[j][0]) / (stops[k][0] - stops[j][0]);
                        return `rgb(${Math.round(stops[j][1] * (1 - t) + stops[k][1] * t)}, ${Math.round(stops[j][2] * (1 - t) + stops[k][2] * t)}, ${Math.round(stops[j][3] * (1 - t) + stops[k][3] * t)})`;
                    }
                }
            }
        }
    }

    /**
     * @param {Uint8Array | Float32Array} data 
     */
    static draw(data) {
        const start = performance.now();
        const width = this.rotated ? this.canvas.height : this.canvas.width;
        const height = this.rotated ? this.canvas.width : this.canvas.height;
        this.ctx.resetTransform();
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
        if (!isWorker) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.scale(this.flippedX * -2 + 1, this.flippedY * -2 + 1);
        this.ctx.translate(this.flippedX * -this.canvas.width, this.flippedY * -this.canvas.height);
        if (this.rotated) {
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
        this.resolution = Math.max(1, Math.round(this.resolution));
        // it's-a spaghetti time!
        if (data === null) { // Loading spinner
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            const r = Math.min(width, height) / 3;
            this.ctx.translate(width / 2, height / 2);
            this.ctx.rotate((Date.now() / 100) % (4 * Math.PI)); // modulo probably not necessary
            this.ctx.arc(0, 0, r, 0, 4 * Math.PI / 3);
            this.ctx.lineTo(Math.cos(4 * Math.PI / 3) * (r * 0.8), Math.sin(4 * Math.PI / 3) * (r * 0.8));
            this.ctx.arc(0, 0, r * 0.8, 4 * Math.PI / 3, 0, true);
            this.ctx.lineTo(r, 0);
            this.ctx.fill();
            this.ctx.resetTransform();
        } else if (this.mode == 0) { // Frequency 1x bar
            if (this.altColor && this.color.mode == 1) VisualizerWorker.parseStops.call(this, this.color.value.stops, 0);
            else VisualizerWorker.setColor.call(this, this.color, 'fillStyle', 0);
            const croppedFreq = Math.ceil(data.length * this.barCrop);
            const barSpace = (width / (croppedFreq * (this.symmetry ? 2 : 1)));
            const barWidth = Math.max(1, barSpace * this.barWidthPercent);
            const barShift = (barSpace - barWidth) / 2;
            const stepMultiplier = 256 / (this.barLEDEffect ? this.barLEDCount : 256);
            const yScale = height / 256 * stepMultiplier;
            if (this.altColor && this.color.mode == 1) {
                const yScale2 = stepMultiplier / 256;
                switch (this.symmetry) {
                    default:
                    case 0:
                        for (let i = 0; i < croppedFreq; i++) {
                            this.ctx.fillStyle = VisualizerWorker.interpGradientColor.call(this, 0, Math.ceil((data[i] * this.barScale + 1) / stepMultiplier) * yScale2);
                            const barHeight = Math.max(1, Math.ceil((data[i] * this.barScale + 1) / stepMultiplier) * yScale);
                            this.ctx.fillRect(i * barSpace + barShift, height, barWidth, -barHeight);
                        }
                        break;
                    case 1:
                        for (let i = 0; i < croppedFreq; i++) {
                            this.ctx.fillStyle = VisualizerWorker.interpGradientColor.call(this, 0, Math.ceil((data[i] * this.barScale + 1) / stepMultiplier) * yScale2);
                            const barHeight = Math.max(1, Math.ceil((data[i] * this.barScale + 1) / stepMultiplier) * yScale);
                            this.ctx.fillRect((croppedFreq - i - 1) * barSpace + barShift, height, barWidth, -barHeight);
                            this.ctx.fillRect((croppedFreq + i) * barSpace + barShift, height, barWidth, -barHeight);
                        }
                        break;
                    case 2:
                        for (let i = 0; i < croppedFreq; i++) {
                            this.ctx.fillStyle = VisualizerWorker.interpGradientColor.call(this, 0, Math.ceil((data[i] * this.barScale + 1) / stepMultiplier) * yScale2);
                            const barHeight = Math.max(1, Math.ceil((data[i] * this.barScale + 1) / stepMultiplier) * yScale);
                            this.ctx.fillRect(i * barSpace + barShift, height, barWidth, -barHeight);
                            this.ctx.fillRect((2 * croppedFreq - i - 1) * barSpace + barShift, height, barWidth, -barHeight);
                        }
                        break;
                }
            } else {
                switch (this.symmetry) {
                    default:
                    case 0:
                        for (let i = 0; i < croppedFreq; i++) {
                            const barHeight = Math.max(1, Math.ceil((data[i] * this.barScale + 1) / stepMultiplier) * yScale);
                            this.ctx.fillRect(i * barSpace + barShift, height, barWidth, -barHeight);
                        }
                        break;
                    case 1:
                        for (let i = 0; i < croppedFreq; i++) {
                            const barHeight = Math.max(1, Math.ceil((data[i] * this.barScale + 1) / stepMultiplier) * yScale);
                            this.ctx.fillRect((croppedFreq - i - 1) * barSpace + barShift, height, barWidth, -barHeight);
                            this.ctx.fillRect((croppedFreq + i) * barSpace + barShift, height, barWidth, -barHeight);
                        }
                        break;
                    case 2:
                        for (let i = 0; i < croppedFreq; i++) {
                            const barHeight = Math.max(1, Math.ceil((data[i] * this.barScale + 1) / stepMultiplier) * yScale);
                            this.ctx.fillRect(i * barSpace + barShift, height, barWidth, -barHeight);
                            this.ctx.fillRect((2 * croppedFreq - i - 1) * barSpace + barShift, height, barWidth, -barHeight);
                        }
                        break;
                }
            }
            if (this.barLEDEffect) {
                this.ctx.globalCompositeOperation = 'destination-out';
                const blockStep = height / this.barLEDCount;
                const blockHeight = blockStep * (1 - this.barLEDSize);
                for (let i = -blockHeight / 2; i < height; i += blockStep) {
                    this.ctx.fillRect(0, i, width, blockHeight);
                }
            }
        } else if (this.mode == 1) { // Frequency 2x bar
            if (this.altColor && this.color.mode == 1) VisualizerWorker.parseStops.call(this, this.color.value.stops, 0);
            else VisualizerWorker.setColor.call(this, this.color, 'fillStyle', 0);
            const croppedFreq = Math.ceil(data.length * this.barCrop);
            const barSpace = (width / (croppedFreq * (this.symmetry ? 2 : 1)));
            const barWidth = Math.max(1, barSpace * this.barWidthPercent);
            const barShift = (barSpace - barWidth) / 2;
            const stepMultiplier = 256 / (this.barLEDEffect ? this.barLEDCount : 256);
            const yScale = height / (256 + stepMultiplier / 2);
            if (this.altColor && this.color.mode == 1) {
                const yScale2 = stepMultiplier / 256;
                switch (this.symmetry) {
                    default:
                    case 0:
                        for (let i = 0; i < croppedFreq; i++) {
                            this.ctx.fillStyle = VisualizerWorker.interpGradientColor.call(this, 0, Math.ceil((data[i] * this.barScale + 1) / stepMultiplier) * yScale2);
                            const barHeight = Math.max(1, ((Math.ceil(data[i] * this.barScale / stepMultiplier) + 0.5) * stepMultiplier) * yScale);
                            this.ctx.fillRect(i * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                        }
                        break;
                    case 1:
                        for (let i = 0; i < croppedFreq; i++) {
                            this.ctx.fillStyle = VisualizerWorker.interpGradientColor.call(this, 0, Math.ceil((data[i] * this.barScale + 1) / stepMultiplier) * yScale2);
                            const barHeight = Math.max(1, ((Math.ceil(data[i] * this.barScale / stepMultiplier) + 0.5) * stepMultiplier) * yScale);
                            this.ctx.fillRect((croppedFreq - i - 1) * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                            this.ctx.fillRect((croppedFreq + i) * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                        }
                        break;
                    case 2:
                        for (let i = 0; i < croppedFreq; i++) {
                            this.ctx.fillStyle = VisualizerWorker.interpGradientColor.call(this, 0, Math.ceil((data[i] * this.barScale + 1) / stepMultiplier) * yScale2);
                            const barHeight = Math.max(1, ((Math.ceil(data[i] * this.barScale / stepMultiplier) + 0.5) * stepMultiplier) * yScale);
                            this.ctx.fillRect(i * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                            this.ctx.fillRect((2 * croppedFreq - i - 1) * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                        }
                        break;
                }
            } else {
                switch (this.symmetry) {
                    default:
                    case 0:
                        for (let i = 0; i < croppedFreq; i++) {
                            const barHeight = Math.max(1, ((Math.ceil(data[i] * this.barScale / stepMultiplier) + 0.5) * stepMultiplier) * yScale);
                            this.ctx.fillRect(i * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                        }
                        break;
                    case 1:
                        for (let i = 0; i < croppedFreq; i++) {
                            const barHeight = Math.max(1, ((Math.ceil(data[i] * this.barScale / stepMultiplier) + 0.5) * stepMultiplier) * yScale);
                            this.ctx.fillRect((croppedFreq - i - 1) * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                            this.ctx.fillRect((croppedFreq + i) * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                        }
                        break;
                    case 2:
                        for (let i = 0; i < croppedFreq; i++) {
                            const barHeight = Math.max(1, ((Math.ceil(data[i] * this.barScale / stepMultiplier) + 0.5) * stepMultiplier) * yScale);
                            this.ctx.fillRect(i * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                            this.ctx.fillRect((2 * croppedFreq - i - 1) * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
                        }
                        break;
                }
            }
            if (this.barLEDEffect) {
                this.ctx.globalCompositeOperation = 'destination-out';
                const blockStep = height / (this.barLEDCount * 2 + 1);
                const blockHeight = blockStep * (1 - this.barLEDSize);
                for (let i = -blockHeight / 2 - blockStep; i < height; i += blockStep) {
                    this.ctx.fillRect(0, i, width, blockHeight);
                }
            }
        } else if (this.mode == 2) { // Frequency 1x line
            VisualizerWorker.setColor.call(this, this.color, 'strokeStyle', 0);
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineJoin = 'round';
            const croppedFreq = Math.ceil(data.length * this.barCrop);
            const xStep = width / ((croppedFreq * (this.symmetry ? 2 : 1)) - 1);
            const yScale = (height - this.lineWidth) / 256 * this.barScale;
            const yOffset = this.lineWidth / 2;
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
            const croppedFreq = Math.ceil(data.length * this.barCrop);
            const xStep = width / ((croppedFreq * (this.symmetry ? 2 : 1)) - 1);
            const yScale = (height - this.lineWidth) / 256 * this.barScale;
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
            const croppedFreq = Math.ceil(data.length * this.barCrop);
            const xStep = (width - this.lineWidth) / ((croppedFreq * (this.symmetry ? 2 : 1)) - 1);
            const yScale = (height - this.lineWidth) / 256 * this.barScale;
            const xOffset = this.lineWidth / 2;
            const yOffset = this.lineWidth / 2;
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
            const croppedFreq = Math.ceil(data.length * this.barCrop);
            const xStep = (width - this.lineWidth) / ((croppedFreq * (this.symmetry ? 2 : 1)) - 1);
            const yScale = (height - this.lineWidth) / 256 * this.barScale;
            const xOffset = this.lineWidth / 2;
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
            if (this.altColor && this.color.mode == 1) VisualizerWorker.parseStops.call(this, this.color.value.stops, 0);
            else VisualizerWorker.setColor.call(this, this.color, 'fillStyle', 0);
            const croppedFreq = Math.ceil(data.length * this.barCrop);
            const barSpace = (width / (croppedFreq * (this.symmetry ? 2 : 1)));
            const barWidth = Math.max(1, barSpace * this.barWidthPercent);
            const barShift = (barSpace - barWidth) / 2;
            const lumiScale = this.barScale / 256;
            if (this.altColor && this.color.mode == 1) {
                switch (this.symmetry) {
                    default:
                    case 0:
                        for (let i = 0; i < croppedFreq; i++) {
                            this.ctx.fillStyle = VisualizerWorker.interpGradientColor.call(this, 0, (data[i] * this.barScale + 1) / 256);
                            this.ctx.globalAlpha = Math.min(1, data[i] * lumiScale);
                            this.ctx.fillRect(i * barSpace + barShift, 0, barWidth, height);
                        }
                        break;
                    case 1:
                        for (let i = 0; i < croppedFreq; i++) {
                            this.ctx.fillStyle = VisualizerWorker.interpGradientColor.call(this, 0, (data[i] * this.barScale + 1) / 256);
                            this.ctx.globalAlpha = Math.min(1, data[i] * lumiScale);
                            this.ctx.fillRect((croppedFreq - i - 1) * barSpace + barShift, 0, barWidth, height);
                            this.ctx.fillRect((croppedFreq + i) * barSpace + barShift, 0, barWidth, height);
                        }
                        break;
                    case 2:
                        for (let i = 0; i < croppedFreq; i++) {
                            this.ctx.fillStyle = VisualizerWorker.interpGradientColor.call(this, 0, (data[i] * this.barScale + 1) / 256);
                            this.ctx.globalAlpha = Math.min(1, data[i] * lumiScale);
                            this.ctx.fillRect(i * barSpace + barShift, 0, barWidth, height);
                            this.ctx.fillRect((2 * croppedFreq - i - 1) * barSpace + barShift, 0, barWidth, height);
                        }
                        break;
                }
            } else {
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
            }
            if (this.barLEDEffect) {
                this.ctx.globalAlpha = 1;
                this.ctx.globalCompositeOperation = 'destination-out';
                const blockStep = height / this.barLEDCount;
                const blockHeight = blockStep * (1 - this.barLEDSize);
                for (let i = -blockHeight / 2; i < height; i += blockStep) {
                    this.ctx.fillRect(0, i, width, blockHeight);
                }
            }
        } else if (this.mode == 4) { // Direct waveform
            VisualizerWorker.setColor.call(this, this.color, 'strokeStyle', 0);
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineJoin = 'round';
            const xStep = width / (data.length - 1);
            const yOffset = height / 2;
            const yScale = this.scale * 128;
            this.ctx.beginPath();
            this.ctx.moveTo(0, data[0] * yScale + yOffset);
            for (let i = 1; i < data.length; i += this.resolution) {
                this.ctx.lineTo(i * xStep, data[i] * yScale + yOffset);
            }
            this.ctx.stroke();
        } else if (this.mode == 9) { // Correlated waveform
            // only shift if audio is playing
            const windowSize = data.length / 2;
            let bestShift = persistentData.lastShift ?? 0;
            if (bestShift > windowSize) bestShift = 0;
            if (this.playing) {
                // find lowest error by subtracting shifted window of buffer from smoothed temporal data
                if (persistentData.lastWaveform == undefined || persistentData.lastWaveform.length != windowSize) persistentData.lastWaveform = new Float32Array(data.slice(Math.floor((data.length - windowSize) / 2), data.length - windowSize / 2));
                const samples = Math.min(windowSize, this.corrSamples);
                let bestError = Infinity;
                let lastShift = Infinity;
                for (let i = 0; i < samples; i++) {
                    const shift = Math.round(windowSize * i / (samples - 1));
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
                    const newShift = Math.min(windowSize, Math.max(0, bestShift + Math.ceil(Math.abs((bestError - adjError) * this.corrWeight * (1 - i / 16))) * Math.sign(bestError - adjError)));
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
            const xStep = width / (windowSize - 1);
            const yOffset = height / 2;
            const yScale = this.scale * 128;
            this.ctx.beginPath();
            this.ctx.moveTo(0, data[bestShift] * yScale + yOffset);
            for (let i = 0; i < windowSize; i += this.resolution) {
                this.ctx.lineTo(i * xStep, data[bestShift + i] * yScale + yOffset);
            }
            this.ctx.stroke();
        } else if (this.mode == 10) { // Spectrogram
            // create a history canvas of frequency height and time width (each pixel is 1x1)
            let forceRedraw = false;
            if (persistentData.lastSpectrogramFrame == null || persistentData.lastSpectrogramFrame.width != this.spectHistoryLength || persistentData.lastSpectrogramFrame.height != data.length) {
                persistentData.lastSpectrogramFrame = new OffscreenCanvas(this.spectHistoryLength, data.length);
                persistentData.lastSpectrogramContext = persistentData.lastSpectrogramFrame.getContext('2d');
                persistentData.lastSpectrogramContext.imageSmoothingEnabled = false;
                forceRedraw = true;
            }
            const spectFrame = persistentData.lastSpectrogramFrame;
            const spectCtx = persistentData.lastSpectrogramContext;
            if (this.ctx.imageSmoothingEnabled) this.ctx.imageSmoothingEnabled = false;
            const croppedFreq = Math.ceil(data.length * this.barCrop);
            if (this.playing || forceRedraw) {
                spectCtx.globalAlpha = 1;
                spectCtx.globalCompositeOperation = 'copy';
                spectCtx.drawImage(spectFrame, -1, 0);
                spectCtx.globalCompositeOperation = 'source-over';
                const scale = this.barScale / 255;
                if (this.color.mode == 0) {
                    spectCtx.fillStyle = this.color.value;
                    if (Math.floor(this.spectDiscreteVals) > 1) {
                        const discreteVals = Math.round(this.spectDiscreteVals) - 1;
                        // batch draws by intensity and then consecutive indices
                        const data2 = Array.from(data).map((v, i) => [Math.floor(Math.min(1, v * scale) * discreteVals), i]).sort((a, b) => (a[0] * data.length + a[1]) - (b[0] * data.length + b[1]));
                        for (let i = 0; i < data2.length;) {
                            const intensity = data2[i][0];
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
                            spectCtx.globalAlpha = Math.min(1, data[i] * scale);
                            spectCtx.fillRect(this.spectHistoryLength, i, -1, 1);
                        }
                    }
                } else if (this.color.mode == 1) {
                    // batch draws by color and then consecutive indices
                    const discreteVals = Math.floor(this.spectDiscreteVals) > 1 ? Math.round(this.spectDiscreteVals) - 1 : 255;
                    const data2 = Array.from(data).map((v, i) => [Math.floor(Math.min(1, v * scale) * discreteVals), i]).sort((a, b) => (a[0] * data.length + a[1]) - (b[0] * data.length + b[1]));
                    VisualizerWorker.parseStops.call(this, this.color.value.stops, 0);
                    for (let i = 0; i < data2.length;) {
                        const intensity = data2[i][0];
                        // interpolate the color (i should use binary search or interval tree if for some reason there's thousands of stops)
                        const interpTarget = intensity / discreteVals;
                        spectCtx.fillStyle = VisualizerWorker.interpGradientColor.call(this, 0, interpTarget);
                        while (i < data2.length && data2[i][0] == intensity) {
                            let height = 0;
                            do i++, height++;
                            while (i < data2.length && data2[i][1] - data2[i - 1][1] == 1 && data2[i][0] == intensity);
                            spectCtx.fillRect(this.spectHistoryLength, data2[i - 1][1] + 1, -1, -height);
                        }
                    }
                }
            }
            // draw scaled canvas (upside down and with other transformations)
            this.ctx.scale(1, -1);
            switch (this.symmetry) {
                case 0:
                    this.ctx.drawImage(spectFrame, 0, 0, this.spectHistoryLength, croppedFreq, 0, -height, width, height);
                    break;
                case 1:
                    this.ctx.drawImage(spectFrame, 0, 0, this.spectHistoryLength, croppedFreq, 0, -height / 2, width, height / 2);
                    this.ctx.scale(1, -1);
                    this.ctx.drawImage(spectFrame, 0, 0, this.spectHistoryLength, croppedFreq, 0, height / 2, width, height / 2);
                    break;
                case 2:
                    this.ctx.drawImage(spectFrame, 0, 0, this.spectHistoryLength, croppedFreq, 0, -height, width, height / 2);
                    this.ctx.scale(1, -1);
                    this.ctx.drawImage(spectFrame, 0, 0, this.spectHistoryLength, croppedFreq, 0, 0, width, height / 2);
                    break;
            }
        } else if (this.mode == 6) { // Channel peak
            persistentData.lastFrames ??= [];
            const peaks = [];
            if (this.playing || persistentData.lastFrames.length == 0) {
                for (const i in data) {
                    const channel = data[i];
                    let max = 0;
                    for (let i = 0; i < channel.length; i++) {
                        const v = Math.abs(channel[i] - 128);
                        if (v > max) max = v;
                    }
                    const smoothed = max * (1 - this.smoothing) + (persistentData.lastFrames[i] ?? max) * this.smoothing;
                    peaks.push(smoothed);
                    persistentData.lastFrames[i] = smoothed;
                }
            } else {
                for (const i in data) {
                    peaks.push(persistentData.lastFrames[i]);
                }
            }
            VisualizerWorker.setColor.call(this, this.color, 'fillStyle', 0);
            const barSpace = (width / peaks.length);
            const barWidth = Math.max(1, barSpace * this.barWidthPercent);
            const barShift = (barSpace - barWidth) / 2;
            const stepMultiplier = 128 / (this.barLEDEffect ? (this.barLEDCount) : 128);
            const yScale = height / 128 * stepMultiplier;
            for (let i = 0; i < peaks.length; i++) {
                const barHeight = Math.ceil((peaks[i] * this.barScale + 1) / stepMultiplier) * yScale;
                this.ctx.fillRect(i * barSpace + barShift, height - barHeight, barWidth, barHeight);
            }
            if (this.barLEDEffect) {
                this.ctx.fillStyle = '#000000';
                const blockStep = height / this.barLEDCount;
                const blockHeight = blockStep * (1 - this.barLEDSize);
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
        if (data === null) return null;
        let max = 0;
        if (Array.isArray(data)) {
            for (const channel of data) {
                for (let i = 0; i < channel.length; i++) {
                    const v = Math.abs(channel[i]);
                    if (v > max) max = v;
                }
            }
            max = max / 255;
        } else if (data instanceof Uint8Array) {
            for (let i = 0; i < data.length; i++) {
                const v = Math.abs(data[i]);
                if (v > max) max = v;
            }
            max = max / 255;
        } else if (data instanceof Float32Array) {
            for (let i = 0; i < data.length; i++) {
                const v = Math.abs(data[i]);
                if (v > max) max = v;
            }
        }
        return {
            peak: max,
            time: performance.now() - start
        };
    }
}

onmessage = (e) => {
    const canvas = e.data[0];
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    let resized = false;
    onmessage = (e) => {
        switch (e.data[0]) {
            case 0:
                try {
                    const data = VisualizerWorker.draw.call({ canvas, ctx, resized, ...e.data[1] }, e.data[2]);
                    resized = false;
                    const bitmap = canvas.transferToImageBitmap();
                    postMessage([bitmap, data], [bitmap]);
                } catch (err) {
                    console.error(err);
                    postMessage([null]);
                }
                break;
            case 1:
                canvas.width = e.data[1];
                canvas.height = e.data[2];
            case 2:
                resized = true;
                break;
        }
    };
    postMessage([]);
};