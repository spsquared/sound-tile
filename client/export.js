// Copyright (C) 2023 Sampleprovider(sp)

function detachDisplay(width, height) {
    display.style.width = (parseInt(width) - 4) + 'px';
    display.style.height = (parseInt(height) - 4) + 'px';
    allowDrag = false;
    GroupTile.root.tile.querySelectorAll('input').forEach((el) => el.disabled = true);
    GroupTile.root.refresh();
};
function reAttachDisplay() {
    display.style.width = '';
    display.style.height = '';
    allowDrag = true;
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

async function exportVideo(codec, width, height, framerate, bitrate, hardwareEncode = true) {
    // make sure encoding settings are supported first!!!
    // make sure encoding settings are supported first!!!
    // make sure encoding settings are supported first!!!
    // make sure encoding settings are supported first!!!
    // make sure encoding settings are supported first!!!
    detachDisplay(width, height);
    renderCanvas.width = width;
    renderCanvas.height = height;
    collectTiles();
    try {
        // prepare encoder with settings and create MediaStream with tracks
        const encoder = new VideoEncoder({
            output: (chunk, metadata) => {
                console.log(chunk.timestamp, chunk.byteLength);
            },
            error: (err) => {
                reAttachDisplay();
                throw err;
            }
        });
        await encoder.configure({
            codec: codec,
            width: width,
            height: height,
            displayWidth: width,
            displayHeight: height,
            framerate: framerate,
            bitrate: bitrate,
            hardwareAcceleration: hardwareEncode ? 'prefer-hardware' : 'prefer-software'
        });
        const canvasTrack = renderCanvas.captureStream(0).getTracks()[0];
        const audioTrack = audioContext.createMediaStreamDestination().stream.getTracks()[0];
        const renderStream = new MediaStream();
        renderStream.addTrack(canvasTrack);
        renderStream.addTrack(audioTrack);
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
        canvasTrack.stop();
        audioTrack.stop();
        return 'oof';
    } catch (err) {
        // not the correct way to do this
        reAttachDisplay();
        throw err;
    }
};