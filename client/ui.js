// Copyright (C) 2023 Sampleprovider(sp)

// upload/download
const uploadButton = document.getElementById('uploadButton');
uploadButton.oninput = (e) => {
    if (allowModification && uploadButton.files.length > 0 && uploadButton.files[0].name.endsWith('.soundtile')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const tree = msgpack.decode(new Uint8Array(reader.result));
            // jank
            for (let child of GroupTile.root.children) {
                child.destroy();
            }
            Visualizer.destroyAll();
            GroupTile.root.tile.remove();
            GroupTile.root = new GroupTile(false);
            display.appendChild(GroupTile.root.tile);
            function dfs(treenode) {
                if (treenode.children !== undefined) {
                    let node = new GroupTile(treenode.orientation);
                    node.tile.style.flexGrow = treenode.flexGrow ?? 1;
                    for (let child of treenode.children) {
                        node.addChild(dfs(child));
                    }
                    return node;
                } else {
                    switch (treenode.type) {
                        case 'v':
                            return VisualizerTile.fromData(treenode);
                        case 'vi':
                            return VisualizerImageTile.fromData(treenode);
                        case 'vt':
                            return VisualizerTextTile.fromData(treenode);
                        case 'i':
                            return ImageTile.fromData(treenode);
                        case 't':
                            return TextTile.fromData(treenode);
                        case 'b':
                            return BlankTile.fromData(treenode);
                        default:
                            const tile = new TextTile();
                            tile.text = 'Unknown Tile';
                            tile.refresh();
                            return tile;
                    }
                }
            };
            GroupTile.root.addChild(dfs(tree.root));
            setTimeout(() => GroupTile.root.refresh(), 0);
        };
        reader.readAsArrayBuffer(uploadButton.files[0]);
        uploadButton.value = '';
    }
};
document.getElementById('downloadButton').onclick = (e) => {
    const tree = {
        version: 0,
        root: dfs(GroupTile.root)
    };
    function dfs(node) {
        if (node.children !== undefined) {
            let treenode = {
                orientation: node.orientation,
                flexGrow: node.tile.style.flexGrow,
                children: []
            };
            for (let child of node.children) {
                treenode.children.push(dfs(child));
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
    volumeControlInput.title = volumeControlInput.value + '%';
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
const loopToggle = document.getElementById('loopToggle');
const mediaControls = {
    startTime: 0,
    duration: 0,
    currentTime: 0,
    playing: false,
    loop: (window.localStorage.getItem('loop') ?? true) == 'true' ? true : false,
    setTime: (t) => {
        if (!allowModification) return;
        mediaControls.currentTime = parseFloat(t);
        timeSeekThumb.style.setProperty('--progress', (mediaControls.currentTime / mediaControls.duration) || 0);
        timeSeekInput.title = `${getTime(mediaControls.currentTime)}/${getTime(mediaControls.duration)}`;
        mediaControls.startTime = performance.now() - (mediaControls.currentTime * 1000);
        if (mediaControls.playing) Visualizer.startAll(mediaControls.currentTime);
    }
};
Visualizer.onUpdate = () => {
    mediaControls.duration = Visualizer.duration;
    timeSeekInput.max = mediaControls.duration;
    if (mediaControls.playing) Visualizer.startAll(mediaControls.currentTime);
    if (mediaControls.currentTime >= mediaControls.duration) {
        mediaControls.currentTime = mediaControls.duration;
        mediaControls.startTime = performance.now();
    }
    timeSeekThumb.style.setProperty('--progress', (mediaControls.currentTime / mediaControls.duration) || 0);
};
function getTime(s) {
    return `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${Math.floor(s) % 60}`;
};
setInterval(() => {
    let now = performance.now();
    if (mediaControls.currentTime >= mediaControls.duration) {
        if (mediaControls.duration == 0 || !mediaControls.loop) {
            mediaControls.playing = false;
            playButton.checked = false;
        } else if (mediaControls.playing) {
            mediaControls.setTime(0);
        }
    }
    if (mediaControls.playing) {
        mediaControls.currentTime = (now - mediaControls.startTime) / 1000;
        timeSeekInput.value = mediaControls.currentTime;
        timeSeekThumb.style.setProperty('--progress', (mediaControls.currentTime / mediaControls.duration) || 0);
        timeSeekInput.title = `${getTime(mediaControls.currentTime)}/${getTime(mediaControls.duration)}`;
    } else {
        mediaControls.startTime = now - (mediaControls.currentTime * 1000);
    }
    timeDisplay.innerText = getTime(mediaControls.currentTime);
}, 20);
timeSeekInput.oninput = (e) => {
    mediaControls.setTime(timeSeekInput.value);
};
playButton.onclick = (e) => {
    if (!allowModification) return;
    mediaControls.playing = playButton.checked;
    if (mediaControls.currentTime >= mediaControls.duration) {
        mediaControls.currentTime = 0;
        mediaControls.startTime = performance.now();
    }
    if (mediaControls.playing) Visualizer.startAll(mediaControls.currentTime);
    else Visualizer.stopAll();
};
loopToggle.onclick = (e) => {
    mediaControls.loop = loopToggle.checked;
    window.localStorage.setItem('loop', mediaControls.loop);
};
loopToggle.checked = mediaControls.loop;

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
createTileSource(VisualizerTextTile, './assets/visualizer-text-tile.png', 'New visualizer + text tile');
createTileSource(BlankTile, './assets/blank-tile.png', 'New blank tile');

// tree editor

// keys and stuff
const dropdownButton = document.getElementById('dropdownTab');
document.addEventListener('keypress', (e) => {
    if (e.target.matches('input[type=text]') || (e.target.matches('input[type=number]') && (!isNaN(parseInt(e.key)) || e.key == '.')) || e.target.matches('textarea')) return;
    if (e.target.matches('input')) e.target.blur();
    const key = e.key.toLowerCase();
    if (key == ' ' || key == 'p') {
        e.preventDefault();
        playButton.click();
    } else if (key == 'h') {
        e.preventDefault();
        dropdownButton.click();
        if (e.shiftKey) dropdownButton.classList.toggle('hidden');
    }
});
document.addEventListener('keydown', (e) => {
    if (e.target.matches('input[type=text]') || e.target.matches('input[type=number]')|| e.target.matches('textarea')) return;
    if (e.target.matches('input')) e.target.blur();
    const key = e.key.toLowerCase();
    if (key == 'arrowleft') {
        e.preventDefault();
        mediaControls.setTime(Math.max(0, mediaControls.currentTime - 5));
    } else if (key == 'arrowright') {
        e.preventDefault();
        mediaControls.setTime(Math.min(mediaControls.duration, mediaControls.currentTime + 5));
    }
});

// display welcome screen on first visit