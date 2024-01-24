// Copyright (C) 2024 Sampleprovider(sp)

// THIS CODE IS BAD DON'T USE IT

function detachDisplay(width, height) {
    display.style.width = (parseInt(width) - 4) + 'px';
    display.style.height = (parseInt(height) - 4) + 'px';
    allowModification = false;
    drawVisualizers = false;
    GroupTile.root.tile.querySelectorAll('input').forEach((el) => el.disabled = true);
    GroupTile.root.refresh();
};
function reAttachDisplay() {
    display.style.width = '';
    display.style.height = '';
    allowModification = true;
    drawVisualizers = true;
    GroupTile.root.tile.querySelectorAll('input').forEach((el) => el.disabled = false);
    GroupTile.root.refresh();
};

const renderCanvas = document.getElementById('renderCanvas');
const renderCtx = renderCanvas.getContext('2d');

const tiles = [];
const borders = [];
function collectTiles() {
    // collect tiles to draw and borders
    let addRect = (src) => {
        const rect = src.getBoundingClientRect();
        tiles.push({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            src: src
        });
    };
    // reset the lists and add outer borders
    tiles.length = 0;
    borders.length = 0;
    borders.push([2, 2, renderCanvas.width - 2, 2]);
    borders.push([2, 2, 2, renderCanvas.height - 2]);
    borders.push([renderCanvas.width - 2, 2, renderCanvas.width - 2, renderCanvas.height - 2]);
    borders.push([2, renderCanvas.height - 2, renderCanvas.width - 2, renderCanvas.height - 2]);
    // use DFS to search the tile tree
    let stack = [];
    stack.push(GroupTile.root);
    while (stack.length > 0) {
        const curr = stack.pop();
        if (curr.children) {
            // DFS, also add borders between children (optimal?)
            for (let child of curr.children) stack.push(child);
            for (let i = 1; i < curr.children.length; i++) {
                // top and left borders
                const rect = curr.children[i].tile.getBoundingClientRect();
                if (curr.orientation) borders.push([rect.left, rect.top, rect.right, rect.top]);
                else borders.push([rect.left, rect.top, rect.left, rect.bottom]);
            }
            continue;
        }
        if (curr.canvas !== undefined) addRect(curr.canvas);
        if (curr.img !== undefined) addRect(curr.img);
        if (curr.canvas2 !== undefined) addRect(curr.canvas2);
    }
};
function drawTiles() {
    renderCtx.fillStyle = '#000000';
    renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
    for (const tile of tiles) {
        renderCtx.drawImage(tile.src, tile.x, tile.y, tile.width, tile.height);
    }
    renderCtx.strokeStyle = '#ffffff';
    renderCtx.setLineDash([]);
    renderCtx.lineWidth = 4;
    renderCtx.lineCap = 'butt';
    renderCtx.beginPath();
    for (const border of borders) {
        renderCtx.moveTo(border[0], border[1]);
        renderCtx.lineTo(border[2], border[3]);
    }
    renderCtx.stroke();
};

const exportButton = document.getElementById('exportButton');
if (window.MediaRecorder == undefined) {
    exportButton.disabled = true;
    exportButton.title += ' (Not supported by browser)';
}
exportButton.onclick = async (e) => {
    if (!window.confirm('Exporting is a very unfinished feature!!! Screen record playback instead!!!')) return;
    const video = exportVideo('video/x-matroska', {
        codec: 'avc1',
        width: 1920,
        height: 1080,
        framerate: 24,
        bitrate: 24_000_000
    }, {
        codec: 'opus',
        bitrate: 160_000
    });
    if (video === null) return;
    await video.promise;
    const download = document.createElement('a');
    let current = new Date();
    download.download = `${current.getHours()}-${current.getMinutes()}_${current.getMonth()}-${current.getDay()}-${current.getFullYear()}.mkv`;
    download.href = window.URL.createObjectURL(video.result);
    download.click();
};

function exportVideo(container, videoOptions = { codec, width, height, framerate, bitrate }, audioOptions = { codec, bitrate }, hardwareEncode = true) {
    if (!MediaRecorder.isTypeSupported(`${container};codecs=${videoOptions.codec},${audioOptions.codec}`)) return null;
    detachDisplay(videoOptions.width, videoOptions.height);
    renderCanvas.width = videoOptions.width;
    renderCanvas.height = videoOptions.height;
    collectTiles();
    const ret = {
        promise: null,
        result: null,
        progress: 0
    };
    ret.promise = new Promise(async (resolve, reject) => {
        try {
            // probably should move to separate thread
            const audioStreamGenerator = audioContext.createMediaStreamDestination();
            const canvasTrack = new MediaStreamTrackGenerator({ kind: "video" });
            const audioTrack = audioStreamGenerator.stream.getTracks()[0];
            globalVolume.connect(audioStreamGenerator);
            const renderStream = new MediaStream();
            renderStream.addTrack(canvasTrack);
            renderStream.addTrack(audioTrack);
            const recorder = new MediaRecorder(renderStream, {
                mimeType: `${container};codecs=${videoOptions.codec},${audioOptions.codec}`,
                videoBitsPerSecond: videoOptions.bitrate,
                audioBitsPerSecond: audioOptions.bitrate
            });
            const streamWriter = canvasTrack.writable.getWriter();
            const frameCount = Math.ceil(Visualizer.duration * videoOptions.framerate);
            drawVisualizers = false;
            recorder.start();
            for (let frame = 0; frame < frameCount; frame++) {
                // playback for some duration, account for processing delay
                audioContext.baseLatency;
                drawTiles();
                await new Promise((resolve, reject) => {
                    window.requestAnimationFrame(() => {
                        Visualizer.draw();
                        resolve();
                    });
                });
                const vFrame = new VideoFrame(renderCanvas, { timestamp: (frame / videoOptions.framerate) * 1000000 });
                await streamWriter.write(vFrame);
                ret.progress = (frame + 1) / frameCount;
            }
            recorder.ondataavailable = (e) => {
                const blob = new Blob([e.data], { type: `${container};codecs=${videoOptions.codec},${audioOptions.codec}` });
                ret.result = blob;
                resolve(blob);
            };
            recorder.stop();
            reAttachDisplay();
            drawVisualizers = true;
        } catch (err) {
            // not the correct way to do this
            reAttachDisplay();
            reject(err);
        }
    });
    return ret;
};