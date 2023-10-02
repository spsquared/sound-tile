class VisualizerWorker {
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
        // const gradient = this.ctx.createLinearGradient(0, 0, width, height);
        // for (let i = 0; i <= 18; i++) {
        //     gradient.addColorStop(i / 18, `hsl(${i * 20}, 100%, 50%)`);
        // }
        // this.ctx.fillStyle = gradient;
        // this.ctx.fillRect(0, 0, width, height);
        if (data === null) {
            this.ctx.resetTransform();
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
            let barSpace = (width / croppedFreq);
            let barWidth = barSpace * this.barWidthPercent;
            let barShift = (barSpace - barWidth) / 2;
            let yScale = height / 256;
            for (let i = 0; i < croppedFreq; i++) {
                let barHeight = (data[i] + 1) * yScale;
                this.ctx.fillRect(i * barSpace + barShift, height - barHeight, barWidth, barHeight);
            }
        } else if (this.mode == 1) {
            this.ctx.fillStyle = this.color;
            let croppedFreq = Math.ceil(data.length * this.barCrop);
            let barSpace = (width / croppedFreq);
            let barWidth = barSpace * this.barWidthPercent;
            let barShift = (barSpace - barWidth) / 2;
            let yScale = height / 256;
            for (let i = 0; i < croppedFreq; i++) {
                let barHeight = (data[i] + 1) * yScale;
                this.ctx.fillRect(i * barSpace + barShift, (height - barHeight) / 2, barWidth, barHeight);
            }
        } else if (this.mode == 2) {
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineJoin = 'round';
            let croppedFreq = Math.ceil(data.length * this.barCrop);
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
            this.ctx.strokeStyle = this.color;
            this.ctx.fillStyle = this.color;
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineJoin = 'round';
            let croppedFreq = Math.ceil(data.length * this.barCrop);
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
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineJoin = 'miter';
            let xStep = width / (data.length - 1);
            let yOffset = height / 2;
            let yScale = this.scale * 128;
            this.ctx.beginPath();
            this.ctx.moveTo(0, data[0] * yScale + yOffset);
            for (let i = 1; i < data.length; i++) {
                this.ctx.lineTo(i * xStep, data[i] * yScale + yOffset);
            }
            this.ctx.stroke();
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
            VisualizerWorker.draw.call({canvas, ctx, ...e.data[1]}, e.data[2]);
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