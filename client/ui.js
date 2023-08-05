// Copyright (C) 2023 Sampleprovider(sp)

// upload/download
const uploadButton = document.getElementById('uploadButton');
uploadButton.oninput = (e) => {
    if (uploadButton.files.length > 0 && uploadButton.files[0].name.endsWith('.soundtile')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const tree = msgpack.decode(new Uint8Array(reader.result));
            // jank
            for (let child of GroupTile.root.children) {
                child.tile.remove();
                if (child.visualizer) child.visualizer.destroy();
                if (child.children) for (let child2 of child.children) {
                    child2.destroy();
                }
            }
            GroupTile.root.children = [];
            function bfs(treenode) {
                if (treenode.children !== undefined) {
                    let node = new GroupTile(treenode.orientation);
                    for (let child of treenode.children) {
                        node.addChild(bfs(child));
                    }
                    return node;
                } else {
                    switch (treenode.type) {
                        case 'v':
                            return VisualizerTile.fromData(treenode);
                        case 'vi':
                            return VisualizerImageTile.fromData(treenode);
                        case 'i':
                            return ImageTile.fromData(treenode);
                        case 't':
                            return TextTile.fromData(treenode);
                        case 'b':
                            return BlankTile.fromData(treenode);
                        default:
                            const tile = new TextTile();
                            tile.text.value = 'Unknown Tile';
                            return tile;
                    }
                }
            };
            GroupTile.root.addChild(bfs(tree.root));
            setTimeout(() => GroupTile.root.refresh(), 0);
        };
        reader.readAsArrayBuffer(uploadButton.files[0]);
    }
};
document.getElementById('downloadButton').onclick = (e) => {
    const tree = {
        version: 0,
        root: bfs(GroupTile.root)
    };
    function bfs(node) {
        if (node.children !== undefined) {
            let treenode = {
                orientation: node.orientation,
                children: []
            };
            for (let child of node.children) {
                treenode.children.push(bfs(child));
            }
            return treenode;
        } else return node.getData();
    };
    const download = document.createElement('a');
    let current = new Date();
    download.download = `${current.getHours()}-${current.getMinutes()}_${current.getMonth()}-${current.getDay()}-${current.getFullYear()}.soundtile`;
    download.href = window.URL.createObjectURL(new Blob([msgpack.encode(tree)], { type: 'application/octet-stream' }));
    download.click();
};

// volume
const volumeControlInput = document.getElementById('volume');
const volumeControlThumb = document.getElementById('volumeThumb');
volumeControlInput.oninput = (e) => {
    globalVolume.gain.setValueAtTime(parseInt(volumeControlInput.value) / 100, audioContext.currentTime);
    volumeControlThumb.style.setProperty('--volume', parseInt(volumeControlInput.value) / 100);
    window.localStorage.setItem('volume', volumeControlInput.value);
};
volumeControlInput.addEventListener('wheel', (e) => {
    volumeControlInput.value = parseInt(volumeControlInput.value) - Math.round(e.deltaY / 20);
    volumeControlInput.oninput();
}, { passive: true });
volumeControlInput.value = window.localStorage.getItem('volume') ?? 100;
volumeControlInput.oninput();

// media controls
const timeSeekInput = document.getElementById('seeker');
const timeSeekThumb = document.getElementById('seekerThumb');
const playButton = document.getElementById('playButton');
const timeDisplay = document.getElementById('timeDisplay');
const mediaControls = {
    startTime: 0,
    duration: 0,
    currentTime: 0,
    playing: false
};
Visualizer.onUpdate = () => {
    mediaControls.duration = Visualizer.duration;
    timeSeekInput.max = mediaControls.duration;
    if (mediaControls.playing) Visualizer.startAll(mediaControls.currentTime);
};
setInterval(() => {
    let now = Date.now();
    if (mediaControls.playing) {
        mediaControls.currentTime = (now - mediaControls.startTime) / 1000;
        timeSeekInput.value = mediaControls.currentTime;
        timeSeekThumb.style.setProperty('--progress', (mediaControls.currentTime / mediaControls.duration) || 0);
    } else {
        mediaControls.startTime = now - (mediaControls.currentTime * 1000);
    }
    timeDisplay.innerText = `${Math.floor(mediaControls.currentTime / 60)}:${mediaControls.currentTime % 60 < 10 ? '0' : ''}${Math.floor(mediaControls.currentTime) % 60}`;
    if (mediaControls.currentTime >= mediaControls.duration) {
        if (mediaControls.playing) {
            mediaControls.playing = false;
            playButton.checked = false;
        }
        mediaControls.currentTime = mediaControls.duration;
        timeSeekThumb.style.setProperty('--progress', (mediaControls.currentTime / mediaControls.duration) || 0);
    }
}, 20);
timeSeekInput.oninput = (e) => {
    mediaControls.currentTime = parseInt(timeSeekInput.value);
    timeSeekThumb.style.setProperty('--progress', (mediaControls.currentTime / mediaControls.duration) || 0);
    mediaControls.startTime = Date.now() - (mediaControls.currentTime * 1000);
    if (mediaControls.playing) Visualizer.startAll(mediaControls.currentTime);
};
playButton.onclick = (e) => {
    mediaControls.playing = playButton.checked;
    if (mediaControls.currentTime >= mediaControls.duration) {
        mediaControls.currentTime = 0;
        mediaControls.startTime = Date.now();
    }
    if (mediaControls.playing) Visualizer.startAll(mediaControls.currentTime);
    else Visualizer.stopAll();
};

// tile source
const tileSourceTemplate = document.getElementById('tileSourceTemplate');
const tileSourceContainer = document.getElementById('tileSource');
function createTileSource(tileClass, img, alt) {
    const source = tileSourceTemplate.content.cloneNode(true).children[0];
    source.querySelector('.tileSourceImg').src = img;
    source.querySelector('.tileSourceImg').alt = alt;
    source.querySelector('.tileSourcePopup').innerText = alt;
    source.addEventListener('mousedown', (e) => {
        if (drag.dragging || e.button != 0) return;
        const tile = new tileClass();
        drag.tile = tile;
        const rect = source.getBoundingClientRect();
        drag.dragX = e.clientX - rect.left;
        drag.dragY = 5;
        drag.container.style.top = e.clientY - drag.dragY + 'px';
        drag.container.style.left = e.clientX - drag.dragX + 'px';
        drag.container.style.width = rect.width + 'px';
        drag.container.style.height = rect.height + 'px';
        drag.container.appendChild(tile.tile);
        drag.container.style.display = 'flex';
        document.body.style.cursor = 'grabbing';
        drag.dragging = true;
    });
    tileSourceContainer.appendChild(source);
};
createTileSource(TextTile, './assets/text-tile.png', 'New text tile');
createTileSource(ImageTile, './assets/image-tile.png', 'New image tile');
createTileSource(VisualizerTile, './assets/visualizer-tile.png', 'New visualizer tile');
createTileSource(VisualizerImageTile, './assets/visualizer-image-tile.png', 'New visualizer + image tile');
createTileSource(BlankTile, './assets/blank-tile.png', 'New blank tile');

// keys and stuff
const dropdownButton = document.getElementById('dropdownTab');
document.addEventListener('keypress', (e) => {
    const key = e.key.toLowerCase();
    if (e.target.matches('input') && !e.target.matches('input[type=text]') && !e.target.matches('input[type=number]')) e.target.blur();
    if (key == ' ' || key == 'p') {
        e.preventDefault();
        playButton.click();
    } else if (key == 'h') {
        e.preventDefault();
        dropdownButton.click();
    }
});

// display welcome screen on first visit