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

async function exportVideo(codec, width, height, framerate, bitrate, hardwareEncode = true) {
    const config = {
        codec: codec,
        width: width,
        height: height,
        displayWidth: width,
        displayHeight: height,
        framerate: framerate,
        bitrate: bitrate,
        hardwareAcceleration: hardwareEncode ? 'prefer-hardware' : 'prefer-software'
    };
    if (!await VideoEncoder.isConfigSupported(config)) return null;
    detachDisplay(width, height);
    renderCanvas.width = width;
    renderCanvas.height = height;
    collectTiles();
    try {
        // prepare encoder with settings and create MediaStream with tracks
        const encodedChunks = [];
        const encoder = new VideoEncoder({
            output: (chunk, metadata) => {
                const buffer = new ArrayBuffer(chunk.byteLength);
                chunk.copyTo(buffer);
                encodedChunks.push(buffer);
            },
            error: (err) => {
                reAttachDisplay();
                throw err;
            }
        });
        await encoder.configure(config);
        const canvasStream = renderCanvas.captureStream(0);
        const canvasTrack = canvasStream.getTracks()[0];
        // render the frames sequentially
        await new Promise((resolve, reject) => {
            // how to keep analyzers in sync?
            function frame() {
                // resolve when last frame is rendered
                canvasTrack.requestFrame();
            };
            encoder.addEventListener('dequeue', frame);
            frame();
        });
        await encoder.flush();
        encoder.close();
        // aaaaaaaaaaaaaaa muxing
        return encodedChunks; // oof no muxing
    } catch (err) {
        // not the correct way to do this
        reAttachDisplay();
        throw err;
    }
};