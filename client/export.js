// Copyright (C) 2023 Sampleprovider(sp)

function detachDisplay(width, height) {
    display.style.width = (parseInt(width) - 4) + 'px';
    display.style.height = (parseInt(height) - 4) + 'px';
    allowModification = false;
    GroupTile.root.tile.querySelectorAll('input').forEach((el) => el.disabled = true);
    GroupTile.root.refresh();
};
function reAttachDisplay() {
    display.style.width = '';
    display.style.height = '';
    allowModification = true;
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

if (typeof window.VideoEncoder != 'function') {
    document.getElementById('exportButton').disabled = true;
    document.getElementById('exportButton').title += ' (Not supported by browser)';
}
document.getElementById('exportButton').disabled = true;
document.getElementById('exportButton').title += ' (Not implemented)';

async function exportVideo(container, videoOptions = {codec, width, height, framerate, bitrate}, audioOptions = {codec, bitrate}, hardwareEncode = true) {
    // if (!MediaRecorder.isTypeSupported(`${container};codecs=${videoOptions.codec},${audioOptions.codec}`)) return null;
    detachDisplay(videoOptions.width, videoOptions.height);
    renderCanvas.width = videoOptions.width;
    renderCanvas.height = videoOptions.height;
    collectTiles();
    try {
        // probably should move to separate thread
        const audioStreamGenerator = audioContext.createMediaStreamDestination();
        const canvasTrack = new MediaStreamTrackGenerator({ kind: "video" });
        const audioTrack = audioStreamGenerator.stream.getTracks()[0];
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
        recorder.start();
        for (let frame = 0; frame < frameCount; frame++) {
            drawTiles();
            const vFrame = new VideoFrame(renderCanvas, { timestamp: frame / videoOptions.framerate });
            await streamWriter.write(vFrame);
        }
        return await new Promise((resolve, reject) => {
            recorder.ondataavailable = (e) => {
                let omg = e.data;
                resolve('omg video');
            };
            recorder.stop();
            reAttachDisplay();
        });
    } catch (err) {
        // not the correct way to do this
        reAttachDisplay();
        throw err;
    }
};