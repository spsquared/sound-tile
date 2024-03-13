// Copyright (C) 2024 Sampleprovider(sp)

class ColorInput {
    static #template = document.getElementById('colorInputTemplate');
    static #container = document.getElementById('colorInputMasterContainer');
    static #copiedColor = null;

    // store input fields and current state
    #popup = null;
    #badge = null;
    #stopsContainer = null;
    #controlsParent = null;
    #inputs = {
        modeSelectors: [],
        solid: {
            input: null,
        },
        gradient: {
            pattern: null,
            x: null,
            y: null,
            r: null,
            angle: null,
            stops: []
        }
    }
    #state = {
        mode: 0,
    }
    #oninput = () => { };
    constructor(container) {
        if (!(container instanceof Element)) throw new TypeError('Container element must be a DOM element');
        const cloned = ColorInput.#template.content.cloneNode(true);
        this.#popup = cloned.children[0];
        this.#badge = cloned.children[1];
        container.appendChild(this.#badge);
        ColorInput.#container.appendChild(this.#popup);
        for (let curr = container; curr !== null && !curr.classList.contains('tileControls'); curr = curr.parentElement, this.#controlsParent = curr); // I hate this
        // opening/closing
        this.#badge.onclick = (e) => {
            this.#popup.classList.toggle('colorInputContainerHidden');
            if (!this.#popup.classList.contains('colorInputContainerHidden')) {
                const rect = this.#badge.getBoundingClientRect();
                if (rect.top < 242) this.#popup.style.bottom = (window.innerHeight - rect.bottom - 242) + 'px';
                else this.#popup.style.bottom = (window.innerHeight - rect.top - 2) + 'px';
                this.#popup.style.left = Math.min(window.innerWidth - 244, rect.left) + 'px';
                this.#controlsParent?.classList.add('tileControlsNoHide');
            } else {
                this.#controlsParent?.classList.remove('tileControlsNoHide');
            }
        };
        let hideOnClickOff = (e) => {
            if (!document.body.contains(container)) {
                this.#popup.remove();
                document.removeEventListener('mousedown', hideOnClickOff);
            }
            if (!this.#popup.contains(e.target) && e.target != this.#badge && !this.#popup.classList.contains('colorInputContainerHidden')) {
                this.#popup.classList.add('colorInputContainerHidden');
                if (!e.target.matches('.colorInputBadge') || !this.#controlsParent.contains(e.target)) this.#controlsParent?.classList.remove('tileControlsNoHide');
            }
        };
        document.addEventListener('mousedown', hideOnClickOff);
        // color type/mode
        this.#inputs.modeSelectors = [this.#popup.querySelector('.colorInputModeSolid'), this.#popup.querySelector('.colorInputModeGradient')];
        const modeContainers = [this.#popup.querySelector('.colorInputSolidContainer'), this.#popup.querySelector('.colorInputGradientContainer')];
        this.#inputs.modeSelectors.forEach((selector, i) => selector.onclick = (e) => {
            modeContainers.forEach(el => el.style.display = 'none');
            this.#inputs.modeSelectors.forEach(el => el.classList.remove('colorInputModeSelected'));
            modeContainers[i].style.display = '';
            selector.classList.add('colorInputModeSelected');
            this.#state.mode = i;
            this.#oninput(e);
            this.#refreshBadge();
        });
        // solid colors
        this.#inputs.solid.input = this.#popup.querySelector('.colorInputSolidColor');
        this.#inputs.solid.input.addEventListener('input', (e) => {
            this.#oninput(e);
            this.#refreshBadge();
        });
        this.#inputs.solid.input.value = '#ffffff';
        // gradient stuff
        this.#inputs.gradient.pattern = this.#popup.querySelector('.colorInputGradientPattern');
        this.#inputs.gradient.pattern.oninput = (e) => {
            switch (Number(this.#inputs.gradient.pattern.value)) {
                case 0:
                    this.#inputs.gradient.x.disabled = true;
                    this.#inputs.gradient.y.disabled = true;
                    this.#inputs.gradient.r.disabled = true;
                    this.#inputs.gradient.angle.disabled = false;
                    break;
                case 1:
                    this.#inputs.gradient.x.disabled = false;
                    this.#inputs.gradient.y.disabled = false;
                    this.#inputs.gradient.r.disabled = false;
                    this.#inputs.gradient.angle.disabled = true;
                    break;
                case 2:
                    this.#inputs.gradient.x.disabled = false;
                    this.#inputs.gradient.y.disabled = false;
                    this.#inputs.gradient.r.disabled = true;
                    this.#inputs.gradient.angle.disabled = false;
                    break;
            }
        };
        this.#inputs.gradient.x = this.#popup.querySelector('.colorInputGradientX');
        this.#inputs.gradient.y = this.#popup.querySelector('.colorInputGradientY');
        this.#inputs.gradient.r = this.#popup.querySelector('.colorInputGradientR');
        this.#inputs.gradient.angle = this.#popup.querySelector('.colorInputGradientAngle');
        for (let i in this.#inputs.gradient) {
            if (this.#inputs.gradient[i] instanceof Element) this.#inputs.gradient[i].addEventListener('input', (e) => {
                this.#oninput();
                this.#refreshBadge();
            });
        }
        this.#inputs.gradient.pattern.oninput();
        this.#stopsContainer = this.#popup.querySelector('.colorInputGradientStops');
        const addStopButton = this.#popup.querySelector('.colorInputGradientAddStop');
        addStopButton.onclick = (e) => this.#addGradientColorStop();
        this.#addGradientColorStop();
        // disable options that don't do anything
        this.#inputs.modeSelectors[0].onclick(); // forced reflow oof
        // copy/paste
        this.#popup.querySelector('.colorInputCopy').onclick = (e) => {
            ColorInput.#copiedColor = this.value;
        };
        this.#popup.querySelector('.colorInputPaste').onclick = (e) => {
            if (ColorInput.#copiedColor !== null) this.value = ColorInput.#copiedColor;
        };
    }
    #addGradientColorStop() {
        // maybe should use a template instead
        const item = document.createElement('div');
        item.classList.add('colorInputGradientStopContainer');
        const offset = document.createElement('input');
        offset.classList.add('numberBox');
        offset.classList.add('colorInputGradientStopOffset');
        offset.type = 'number';
        offset.min = 0;
        offset.max = 100;
        offset.step = 1;
        offset.value = 0;
        offset.addEventListener('input', (e) => {
            if (Number(offset.value) < 0 || Number(offset.value) > 100) offset.value = Math.max(0, Math.min(100, Number(offset.value)));
            else if (isNaN(Number(offset.value))) offset.value = 0;
            this.#oninput();
            this.#refreshBadge();
        });
        offset.addEventListener('blur', (e) => {
            offset.value = Number(offset.value);
        });
        const color = document.createElement('input');
        color.classList.add('colorInputGradientStopColor');
        color.type = 'color';
        color.value = '#ffffff';
        color.addEventListener('input', (e) => {
            this.#oninput();
            this.#refreshBadge();
        });
        const moveUp = document.createElement('input');
        moveUp.classList.add('colorInputGradientStopMoveUp');
        moveUp.type = 'button';
        moveUp.onclick = (e) => {
            let index = this.#inputs.gradient.stops.findIndex((stop) => stop[0] === offset);
            if (index > 0) {
                let val = color.value;
                let off = offset.value;
                color.value = this.#inputs.gradient.stops[index - 1][1].value;
                offset.value = this.#inputs.gradient.stops[index - 1][0].value;
                this.#inputs.gradient.stops[index - 1][1].value = val;
                this.#inputs.gradient.stops[index - 1][0].value = off;
                this.#oninput();
                this.#refreshBadge();
            }
        };
        const moveDown = document.createElement('input');
        moveDown.classList.add('colorInputGradientStopMoveDown');
        moveDown.type = 'button';
        moveDown.onclick = (e) => {
            let index = this.#inputs.gradient.stops.findIndex((stop) => stop[0] === offset);
            if (index < this.#inputs.gradient.stops.length - 1) {
                let val = color.value;
                let off = offset.value;
                color.value = this.#inputs.gradient.stops[index + 1][1].value;
                offset.value = this.#inputs.gradient.stops[index + 1][0].value;
                this.#inputs.gradient.stops[index + 1][1].value = val;
                this.#inputs.gradient.stops[index + 1][0].value = off;
                this.#oninput();
                this.#refreshBadge();
            }
        };
        const remove = document.createElement('input');
        remove.classList.add('colorInputGradientStopRemove');
        remove.type = 'button';
        remove.onclick = (e) => {
            if (this.#inputs.gradient.stops.length > 1) {
                item.remove();
                this.#inputs.gradient.stops.splice(this.#inputs.gradient.stops.findIndex((stop) => stop[0] === offset), 1);
                this.#oninput();
                this.#refreshBadge();
            }
        };
        item.appendChild(offset);
        item.appendChild(color);
        item.appendChild(moveUp);
        item.appendChild(moveDown);
        item.appendChild(remove);
        this.#inputs.gradient.stops.push([offset, color]);
        this.#stopsContainer.appendChild(item);
        this.#oninput();
        this.#refreshBadge();
        return this.#inputs.gradient.stops.at(-1);
    }
    #refreshBadge() {
        if (this.#state.mode == 0) {
            this.#badge.style.background = this.#inputs.solid.input.value;
        } else if (this.#state.mode == 1) {
            switch (Number(this.#inputs.gradient.pattern.value)) {
                case 0:
                    this.#badge.style.background = `linear-gradient(${180 - Number(this.#inputs.gradient.angle.value)}deg${this.#inputs.gradient.stops.sort((a, b) => a[0] - b[0]).reduce((acc, curr) => acc + `, ${curr[1].value} ${curr[0].value}%`, '')})`;
                    break;
                case 1:
                    this.#badge.style.background = `radial-gradient(circle ${Number(this.#inputs.gradient.r.value) * 0.2}px at ${this.#inputs.gradient.x.value}% ${this.#inputs.gradient.y.value}%${this.#inputs.gradient.stops.sort((a, b) => a[0] - b[0]).reduce((acc, curr) => acc + `, ${curr[1].value} ${curr[0].value}%`, '')})`;
                    break;
                case 2:
                    this.#badge.style.background = `conic-gradient(from ${90 + Number(this.#inputs.gradient.angle.value)}deg at ${this.#inputs.gradient.x.value}% ${this.#inputs.gradient.y.value}%${this.#inputs.gradient.stops.sort((a, b) => a[0] - b[0]).reduce((acc, curr) => acc + `, ${curr[1].value} ${curr[0].value}%`, '')})`;
                    break;
            }
        }
    }

    set oninput(cb) {
        if (typeof cb != 'function') throw new TypeError('Callback function must be a function');
        this.#oninput = cb;
    }
    get oninput() {
        return this.#oninput;
    }

    get value() {
        if (this.#state.mode == 0) {
            return {
                mode: 0,
                value: this.#inputs.solid.input.value
            };
        } else if (this.#state.mode == 1) {
            return {
                mode: 1,
                value: {
                    type: Number(this.#inputs.gradient.pattern.value),
                    x: Number(this.#inputs.gradient.x.value) / 100,
                    y: Number(this.#inputs.gradient.y.value) / 100,
                    r: Number(this.#inputs.gradient.r.value) / 100,
                    angle: Number(this.#inputs.gradient.angle.value),
                    stops: this.#inputs.gradient.stops.map(inputs => [Number(inputs[0].value) / 100, inputs[1].value]).sort((a, b) => a[0] - b[0])
                }
            };
        }
    }
    set value(v) {
        (this.#inputs.modeSelectors[v.mode] ?? this.#inputs.modeSelectors[0]).onclick();
        switch (v.mode) {
            case 0:
                this.#inputs.solid.input.value = v.value;
                this.#oninput();
                this.#refreshBadge();
                break;
            case 1:
                this.#inputs.gradient.pattern.value = v.value.type;
                this.#inputs.gradient.x.value = v.value.x * 100;
                this.#inputs.gradient.y.value = v.value.y * 100;
                this.#inputs.gradient.r.value = v.value.r * 100;
                this.#inputs.gradient.angle.value = v.value.angle;
                this.#stopsContainer.innerHTML = '';
                this.#inputs.gradient.stops = [];
                for (let stop of v.value.stops) {
                    const inputs = this.#addGradientColorStop();
                    inputs[0].value = stop[0] * 100;
                    inputs[1].value = stop[1];
                }
                this.#inputs.gradient.pattern.oninput();
                this.#oninput();
                this.#refreshBadge();
                break;
        }
    }
}

// upload/download
const fileControlsContainer = document.getElementById('fileControls');
const uploadButtonLabel = document.getElementById('uploadButtonLabel');
const uploadButton = document.getElementById('uploadButton');
const downloadButton = document.getElementById('downloadButton');
const uploadingCover = document.getElementById('uploadingCover');
async function compressTree(tree) {
    let promises = []
    let curr;
    let stack = [tree];
    while (stack.length) {
        curr = stack.pop();
        if (curr.children !== undefined) {
            for (let child of curr.children) stack.push(child);
            continue;
        }
        if (curr.visualizer != null) {
            let visualizer = curr.visualizer;
            if (Worker !== undefined) {
                promises.push(new Promise((resolve, reject) => {
                    fflate.gzip(new Uint8Array(visualizer.buffer), {
                        level: 4
                    }, (err, data) => {
                        if (err) throw err;
                        visualizer.buffer = data.buffer;
                        resolve();
                    });
                }));
            } else {
                visualizer.buffer = fflag.gzipSync(new Uint8Array(visualizer.buffer), { level: 4 }).buffer;
            }
        }
    }
    await Promise.all(promises);
    return tree;
};
async function decompressTree(file) {
    const tree = msgpack.decode(new Uint8Array(file));
    if (tree.version > 1) {
        modal('Unsupported version!', `The uploaded Tile version (${tree.version} )is newer than the current Sound Tile Version (1)!<br>Try again on a newer version.`);
        return;
    }
    if (tree.version > 0) {
        // decompress audio
        let promises = [];
        let curr;
        let stack = [tree.root];
        while (stack.length) {
            curr = stack.pop();
            if (curr.children !== undefined) {
                for (let child of curr.children) stack.push(child);
                continue;
            }
            if (curr.visualizer != null) {
                let visualizer = curr.visualizer;
                if (Worker !== undefined) {
                    promises.push(new Promise((resolve, reject) => {
                        fflate.decompress(new Uint8Array(visualizer.buffer), {
                            consume: true
                        }, (err, data) => {
                            if (err) throw err;
                            visualizer.buffer = data.buffer;
                            resolve();
                        });
                    }));
                } else {
                    visualizer.buffer = fflate.decompressSync(new Uint8Array(visualizer.buffer)).buffer;
                }
            }
        }
        await Promise.all(promises);
    }
    return tree;
};
uploadButton.oninput = async (e) => {
    if (!uploadButton.disabled && modificationLock == 0 && uploadButton.files.length > 0 && uploadButton.files[0].name.endsWith('.soundtile')) {
        modificationLock++;
        downloadButton.disabled = true;
        uploadButton.disabled = true;
        mDatTitle.disabled = true;
        mDatSubtitle.disabled = true;
        uploadingCover.style.opacity = 1;
        uploadingCover.style.display = 'block';
        mediaControls.stopPlayback();
        // clear playlist
        // assign rest of files in upload list to playlist
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const tree = await decompressTree(reader.result);
                if (tree == undefined) {
                    modificationLock--;
                    downloadButton.disabled = false;
                    uploadButton.disabled = false;
                    uploadingCover.style.opacity = 0;
                    setTimeout(() => uploadingCover.style.display = '', 500);
                    return;
                }
                // jank
                for (let child of GroupTile.root.children) {
                    child.destroy();
                }
                Visualizer.destroyAll();
                if (wakeLock && !wakeLock.released) wakeLock.release();
                GroupTile.root.tile.remove();
                GroupTile.root = new GroupTile(false);
                if (pipWindow !== null) pipContainer.appendChild(GroupTile.root.tile);
                else display.appendChild(GroupTile.root.tile);
                let dfs = (treenode) => {
                    if (treenode.children !== undefined) {
                        let node = GroupTile.fromData(treenode);
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
                            case 'cp':
                                return ChannelPeakTile.fromData(treenode);
                            case 'i':
                                return ImageTile.fromData(treenode);
                            case 't':
                                return TextTile.fromData(treenode);
                            case 'b':
                                return BlankTile.fromData(treenode);
                            case 'grass':
                                return GrassTile.fromData(treenode);
                            default:
                                const tile = new TextTile();
                                tile.text = 'Unknown Tile';
                                tile.refresh();
                                return tile;
                        }
                    }
                };
                GroupTile.root.addChild(dfs(tree.root));
                GroupTile.root.children[0].checkObsolescence();
                setTimeout(() => GroupTile.root.refresh(), 0);
                // set media data
                if (tree.metadata !== undefined) {
                    mDatImage.src = tree.metadata.image;
                    mDatTitle.value = tree.metadata.title;
                    mDatSubtitle.value = tree.metadata.subtitle;
                    mDatToggle.checked = tree.metadata.title != '';
                } else {
                    mDatImage.src = './assets/default-cover.png';
                    mDatTitle.value = '';
                    mDatSubtitle.value = '';
                    mDatToggle.checked = false;
                }
                modificationLock--;
                updateTitle();
                downloadButton.disabled = false;
                uploadButton.disabled = false;
                mDatTitle.disabled = false;
                mDatSubtitle.disabled = false;
                uploadingCover.style.opacity = 0;
                setTimeout(() => uploadingCover.style.display = '', 500);
            } catch (err) {
                console.error(err);
                modificationLock--;
                updateTitle();
                downloadButton.disabled = false;
                uploadButton.disabled = false;
                mDatTitle.disabled = false;
                mDatSubtitle.disabled = false;
                uploadingCover.style.opacity = 0;
                setTimeout(() => uploadingCover.style.display = '', 500);
                modal('Could not load Tiles:', `An error occured while loading your tiles:<br><span style="color: red;">${e.message}<br>${e.filename} ${e.lineno}:${e.colno}</span>`, false);
                GroupTile.root.tile.remove();
                GroupTile.root = new GroupTile(false);
                const tile = new TextTile();
                tile.text = 'Upload failed';
                tile.refresh();
                GroupTile.root.addChild(tile);
            } finally {
                uploadButton.value = '';
            }
        };
        reader.readAsArrayBuffer(uploadButton.files[0]);
    }
};
downloadButton.onclick = async (e) => {
    if (downloadButton.disabled) return;
    try {
        modificationLock++;
        downloadButton.disabled = true;
        uploadButton.disabled = true;
        mDatTitle.disabled = true;
        mDatSubtitle.disabled = true;
        document.body.style.cursor = 'progress';
        let dfs = (node) => {
            if (node.children !== undefined) {
                let treenode = {
                    ...node.getData(),
                    children: []
                };
                for (let child of node.children) {
                    treenode.children.push(dfs(child));
                }
                return treenode;
            } else return node.getData();
        };
        const tree = {
            version: 1,
            root: dfs(GroupTile.root),
            metadata: {
                image: mDatImage.src,
                title: mDatTitle.value,
                subtitle: mDatSubtitle.value
            }
        };
        await compressTree(tree.root);
        const download = document.createElement('a');
        let current = new Date();
        download.download = `${current.getHours()}-${current.getMinutes()}_${current.getMonth()}-${current.getDay()}-${current.getFullYear()}.soundtile`;
        download.href = window.URL.createObjectURL(new Blob([msgpack.encode(tree)], { type: 'application/octet-stream' }));
        download.click();
    } catch (err) {
        modal('Could not save Tiles:', `An error occured while saving your tiles:<br><span style="color: red;">${e.message}<br>${e.filename} ${e.lineno}:${e.colno}</span>`, false);
    } finally {
        modificationLock--;
        downloadButton.disabled = false;
        uploadButton.disabled = false;
        mDatTitle.disabled = false;
        mDatSubtitle.disabled = false;
        document.body.style.cursor = '';
    }
};
fileControlsContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadButtonLabel.style.backgroundColor = '#999';
});
fileControlsContainer.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadButtonLabel.style.backgroundColor = '';
});
fileControlsContainer.addEventListener('dragend', (e) => {
    e.preventDefault();
    uploadButtonLabel.style.backgroundColor = '';
});
fileControlsContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadButtonLabel.style.backgroundColor = '';
    if (e.dataTransfer.files) {
        uploadButton.files = e.dataTransfer.files;
        uploadButton.oninput();
    }
});

// PWA slap-on upload
window.launchQueue?.setConsumer((params) => {
    if (params.files && params.files.length > 0 && !uploadButton.disabled) {
        window.addEventListener('load', async (e) => {
            const list = new DataTransfer();
            list.items.add(await params.files[0].getFile());
            uploadButton.files = list.files;
            uploadButton.oninput();
        });
    }
});

// playlists
// store in weird limbo state where the tree is decompressed
// send to service worker to store as temp file?
// hook unload event to tell service worker to remove temp files
// probably should fix big lag caused by forced reflow

// volume
const volumeControlInput = document.getElementById('volume');
const volumeControlThumb = document.getElementById('volumeThumb');
const pipVolumeControlBody = document.getElementById('pipVolumeBody');
const pipVolumeControlInput = document.getElementById('pipVolume');
volumeControlInput.oninput = (e) => {
    globalVolume.gain.setValueAtTime(Number(volumeControlInput.value) / 100, audioContext.currentTime);
    volumeControlThumb.style.setProperty('--volume', Number(volumeControlInput.value) / 150);
    pipVolumeControlBody.style.setProperty('--volume', Number(volumeControlInput.value) / 150);
    pipVolumeControlInput.value = volumeControlInput.value;
    volumeControlInput.title = 'Volume: ' + volumeControlInput.value + '%';
    pipVolumeControlInput.title = 'Volume: ' + volumeControlInput.value + '%';
    window.localStorage.setItem('volume', volumeControlInput.value);
};
volumeControlInput.addEventListener('wheel', (e) => {
    volumeControlInput.value = Number(volumeControlInput.value) - Math.round(e.deltaY / 20);
    volumeControlInput.oninput();
}, { passive: true });
window.addEventListener('load', (e) => {
    volumeControlInput.value = window.localStorage.getItem('volume') ?? 100;
    volumeControlInput.oninput();
});

// media controls
const timeSeekInput = document.getElementById('seeker');
const timeSeekThumb = document.getElementById('seekerThumb');
const pipTimeSeekInput = document.getElementById('pipSeeker');
const pipTimeSeekThumb = document.getElementById('pipSeekerThumb');
const playButton = document.getElementById('playButton');
const pipPlayButton = document.getElementById('pipPlayButton');
const timeDisplay = document.getElementById('timeDisplay');
const loopToggle = document.getElementById('loopToggle');
const mediaControls = {
    startTime: 0,
    duration: 0,
    currentTime: 0,
    playing: false,
    loop: (window.localStorage.getItem('loop') ?? true) == 'true' ? true : false,
    setTime: (t) => {
        if (modificationLock > 0) return;
        mediaControls.currentTime = Number(t);
        timeSeekInput.value = mediaControls.currentTime;
        pipTimeSeekInput.value = mediaControls.currentTime;
        timeSeekThumb.style.setProperty('--progress', (mediaControls.currentTime / mediaControls.duration) || 0);
        pipTimeSeekThumb.style.setProperty('--progress', (mediaControls.currentTime / mediaControls.duration) || 0);
        timeSeekInput.title = `${getTime(mediaControls.currentTime)}/${getTime(mediaControls.duration)}`;
        pipTimeSeekInput.title = timeSeekInput.title;
        mediaControls.startTime = performance.now() - (mediaControls.currentTime * 1000);
        if (mediaControls.playing) Visualizer.startAll(mediaControls.currentTime);
    },
    startPlayback: async () => {
        mediaControls.playing = true;
        playButton.checked = true;
        pipPlayButton.checked = true;
        Visualizer.startAll(mediaControls.currentTime);
        playButton.title = "Pause (SPACE)";
        pipPlayButton.title = "Pause (SPACE)";
        if (window.WakeLock !== undefined && !displayWindow.document.hidden) wakeLock = await displayWindow.navigator.wakeLock.request();
    },
    stopPlayback: () => {
        mediaControls.playing = false;
        playButton.checked = false;
        pipPlayButton.checked = false;
        Visualizer.stopAll();
        playButton.title = "Play (SPACE)";
        pipPlayButton.title = "Play (SPACE)";
        if (wakeLock && !wakeLock.released) wakeLock.release();
    }
};
let wakeLock;
Visualizer.onUpdate = () => {
    mediaControls.duration = Visualizer.duration;
    timeSeekInput.max = mediaControls.duration;
    pipTimeSeekInput.max = mediaControls.duration;
    if (mediaControls.playing) Visualizer.startAll(mediaControls.currentTime);
    if (mediaControls.currentTime >= mediaControls.duration) {
        mediaControls.currentTime = mediaControls.duration;
        mediaControls.startTime = performance.now();
    }
    timeSeekThumb.style.setProperty('--progress', (mediaControls.currentTime / mediaControls.duration) || 0);
    pipTimeSeekThumb.style.setProperty('--progress', (mediaControls.currentTime / mediaControls.duration) || 0);
};
function getTime(s) {
    return `${Math.trunc(s / 60)}:${s % 60 < 10 ? '0' : ''}${Math.trunc(s) % 60}`;
};
setInterval(() => {
    let now = performance.now();
    if (mediaControls.currentTime >= mediaControls.duration) {
        if (mediaControls.duration == 0 || !mediaControls.loop) {
            mediaControls.stopPlayback();
            mediaControls.setTime(mediaControls.duration);
        } else if (mediaControls.playing) {
            mediaControls.setTime(0);
        }
    }
    if (mediaControls.playing) {
        mediaControls.currentTime = (now - mediaControls.startTime) / 1000;
        timeSeekInput.value = mediaControls.currentTime;
        pipTimeSeekInput.value = mediaControls.currentTime;
        timeSeekThumb.style.setProperty('--progress', (mediaControls.currentTime / mediaControls.duration) || 0);
        pipTimeSeekThumb.style.setProperty('--progress', (mediaControls.currentTime / mediaControls.duration) || 0);
        timeSeekInput.title = `${getTime(mediaControls.currentTime)}/${getTime(mediaControls.duration)}`;
        pipTimeSeekInput.title = timeSeekInput.title;
    } else {
        mediaControls.startTime = now - (mediaControls.currentTime * 1000);
    }
    timeDisplay.innerText = getTime(mediaControls.currentTime);
}, 20);
timeSeekInput.oninput = (e) => {
    mediaControls.setTime(timeSeekInput.value);
};
playButton.onclick = async (e) => {
    if (mediaControls.currentTime >= mediaControls.duration) {
        mediaControls.currentTime = 0;
        mediaControls.startTime = performance.now();
    }
    if (playButton.checked) await mediaControls.startPlayback();
    else mediaControls.stopPlayback();
};
loopToggle.onclick = (e) => {
    mediaControls.loop = loopToggle.checked;
    mDatPlaylistLoop.checked = loopToggle.checked;
    window.localStorage.setItem('loop', mediaControls.loop);
};
document.addEventListener('visibilitychange', async (e) => {
    if (!displayWindow.document.hidden && mediaControls.playing && window.WakeLock != undefined) wakeLock = await displayWindow.navigator.wakeLock.request();
});
loopToggle.checked = mediaControls.loop;

// media data
const title = document.head.querySelector('title');
const mDatToggle = document.getElementById('mediaDataTabCheckbox');
const mDatImage = document.getElementById('mediaDataCoverArt');
const mDatTitle = document.getElementById('mediaDataTitle');
const mDatSubtitle = document.getElementById('mediaDataSubtitle');
const mDatPlaylistShuffle = document.getElementById('mediaDataPlaylistShuffleToggle');
const mDatPlaylistLoop = document.getElementById('mediaDataPlaylistLoopToggle');
function updateTitle() {
    if (mDatTitle.value.trim().length > 0) {
        let text = `${mDatTitle.value.trim().substring(0, 32)}${mDatTitle.value.trim().length > 32 ? '...' : ''}${mDatSubtitle.value.replaceAll(' ', '').length > 0 ? ' - ' : ''}${mDatSubtitle.value.trim().substring(0, 32)}${mDatSubtitle.value.trim().length > 32 ? '...' : ''}`;
        if (isPWA) title.innerText = text;
        else title.innerText = `Sound Tile - ${text}`
    } else title.innerText = 'Sound Tile';
};
mDatTitle.addEventListener('input', updateTitle);
mDatTitle.addEventListener('focus', (e) => mDatTitle.scrollLeft = 0);
mDatSubtitle.addEventListener('input', updateTitle);
mDatSubtitle.addEventListener('focus', (e) => mDatSubtitle.scrollLeft = 0);
mDatTitle._scrollTime = 0;
mDatSubtitle._scrollTime = 0;
let scrollTime = -120;
setInterval(() => {
    scrollTime += 1;
    if (document.activeElement != mDatTitle) mDatTitle.scrollLeft = scrollTime;
    if (document.activeElement != mDatSubtitle) mDatSubtitle.scrollLeft = scrollTime;
    if ((scrollTime > mDatTitle.scrollWidth - 112 || document.activeElement == mDatTitle) && (scrollTime > mDatSubtitle.scrollWidth - 112 || document.activeElement == mDatSubtitle)) {
        scrollTime = -120;
    }
}, 40);
mDatTitle.addEventListener('wheel', (e) => {
    if (document.activeElement != mDatTitle) e.preventDefault();
});
mDatSubtitle.addEventListener('wheel', (e) => {
    if (document.activeElement != mDatSubtitle) e.preventDefault();
});
mDatImage.addEventListener('dblclick', (e) => {
    e.preventDefault();
    const imageUpload = document.createElement('input');
    imageUpload.type = 'file';
    imageUpload.accept = 'image/*';
    imageUpload.addEventListener('change', (e) => {
        if (imageUpload.files.length > 0 && imageUpload.files[0].type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                mDatImage.src = reader.result;
            };
            reader.readAsDataURL(imageUpload.files[0]);
        }
    });
    imageUpload.click();
});
// copy/paste spaghetti (clean up if more drag-and-drop files added later?)
mDatImage.addEventListener('dragover', (e) => e.preventDefault());
mDatImage.addEventListener('dragleave', (e) => e.preventDefault());
mDatImage.addEventListener('dragend', (e) => e.preventDefault());
mDatImage.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            mDatImage.src = reader.result;
        };
        reader.readAsDataURL(e.dataTransfer.files[0]);
    }
});
mDatPlaylistLoop.onclick = (e) => loopToggle.click();
mDatPlaylistLoop.checked = mediaControls.loop;

// picture-in-picture
let pipWindow = null;
const pipButton = document.getElementById('pipButton')
const pipContainer = document.getElementById('pipContainer');
const pipDisplay = document.getElementById('pipDisplay');
const pipTitle = document.createElement('title');
const pipIconLink = document.createElement('link');
const pipDisplayCover = document.getElementById('pipDisplayCover');
pipContainer.remove();
pipIconLink.rel = 'icon';
pipIconLink.href = './assets/icon-0.png';
pipIconLink.type = 'image/png';
if (window.documentPictureInPicture !== undefined) pipButton.onclick = async (e) => {
    if (documentPictureInPicture.window == null) {
        try {
            pipWindow = await documentPictureInPicture.requestWindow({ width: screen.width / 3, height: screen.height / 3 });
            displayWindow = pipWindow;
            pipWindow.addEventListener('pagehide', (e) => {
                pipWindow = null;
                displayWindow = window;
                display.appendChild(GroupTile.root.tile);
                pipDisplayCover.style.opacity = 0;
                pipButton.checked = false;
                let inefficientWait = setInterval(() => {
                    if ([...display.children].includes(GroupTile.root.tile)) {
                        GroupTile.root.refresh();
                        clearInterval(inefficientWait);
                    }
                }, 10);
            });
            const styleSheet = document.createElement('link');
            styleSheet.href = './style.css';
            styleSheet.rel = 'stylesheet';
            pipTitle.innerText = 'Sound Tile'; // add media information later
            pipWindow.document.head.appendChild(pipTitle);
            pipWindow.document.head.appendChild(styleSheet);
            pipWindow.document.head.appendChild(pipIconLink);
            pipWindow.document.body.appendChild(pipContainer);
            // re-add listeners that get removed
            pipPlayButton.onclick = (e) => playButton.click();
            pipVolumeControlInput.oninput = (e) => {
                globalVolume.gain.setValueAtTime(Number(pipVolumeControlInput.value) / 100, audioContext.currentTime);
                volumeControlThumb.style.setProperty('--volume', Number(pipVolumeControlInput.value) / 150);
                pipVolumeControlBody.style.setProperty('--volume', Number(pipVolumeControlInput.value) / 150);
                volumeControlInput.value = pipVolumeControlInput.value;
                volumeControlInput.title = 'Volume: ' + pipVolumeControlInput.value + '%';
                pipVolumeControlInput.title = 'Volume: ' + pipVolumeControlInput.value + '%';
                window.localStorage.setItem('volume', pipVolumeControlInput.value);
            };
            pipVolumeControlInput.addEventListener('wheel', (e) => {
                pipVolumeControlInput.value = Number(pipVolumeControlInput.value) - Math.round(e.deltaY / 20);
                pipVolumeControlInput.oninput();
            }, { passive: true });
            pipTimeSeekInput.oninput = (e) => {
                mediaControls.setTime(pipTimeSeekInput.value);
            };
            pipContainer.appendChild(GroupTile.root.tile);
            pipDisplayCover.style.opacity = 1;
            pipWindow.addEventListener('resize', (e) => {
                GroupTile.root.refresh();
            });
            pipWindow.document.addEventListener('visibilitychange', async (e) => {
                if (!displayWindow.document.hidden && mediaControls.playing && window.WakeLock != undefined) wakeLock = await displayWindow.navigator.wakeLock.request();
            });
            pipContainer.addEventListener('wheel', (e) => {
                e.preventDefault();
            });
            let inefficientWait = setInterval(() => {
                try {
                    // completely doesn't work because the size is just wrong
                    if ([...pipWindow.document.body.children].includes(pipContainer) && [...pipContainer.children].includes(GroupTile.root.tile)) {
                        GroupTile.root.refresh();
                        clearInterval(inefficientWait);
                    }
                    if (documentPictureInPicture.window == null) clearInterval(inefficientWait);
                } catch (err) {
                    clearInterval(inefficientWait);
                }
            }, 10);
            // band-aid fix
            setTimeout(() => GroupTile.root.refresh(), 1000);
        } catch (err) {
            console.error(err);
            if (documentPictureInPicture.window !== null) documentPictureInPicture.window.close();
            pipWindow = null;
            displayWindow = window;
            modal('Could not open picture-in-picture', 'An unexpected error occured while opening picture-in-picture.<br>(Perhaps your connection is not secure?)');
        }
        pipButton.checked = documentPictureInPicture.window !== null;
    } else {
        documentPictureInPicture.window.close();
        pipWindow = null;
        displayWindow = window;
        pipDisplayCover.style.opacity = 0;
        pipButton.checked = false;
        let inefficientWait = setInterval(() => {
            if ([...display.children].includes(GroupTile.root.tile)) {
                GroupTile.root.refresh();
                clearInterval(inefficientWait);
            }
        }, 10);
    }
};

// tile source
const tileSourceTemplate = document.getElementById('tileSourceTemplate');
const tileSourceContainer = document.getElementById('tileSource');
tileSourceContainer.addEventListener('wheel', (e) => {
    tileSourceContainer.scrollBy(e.deltaY, 0);
}, { passive: true });
function createTileSource(tileClass, img, alt) {
    const source = tileSourceTemplate.content.cloneNode(true).children[0];
    source.querySelector('.tileSourceImg').src = img;
    source.querySelector('.tileSourceImg').alt = alt;
    source.querySelector('.tileSourcePopup').innerText = alt;
    source.addEventListener('mousedown', (e) => {
        if (pipWindow != null || drag.dragging || e.button != 0) return;
        const tile = new tileClass();
        drag.tile = tile;
        const rect = source.getBoundingClientRect();
        drag.dragX = e.clientX - rect.left;
        drag.dragY = 5;
        drag.tile.tile.querySelector('.tileDrag').style.opacity = 1;
        drag.container.style.top = e.clientY - drag.dragY + 'px';
        drag.container.style.left = e.clientX - drag.dragX + 'px';
        drag.container.style.width = rect.width + 'px';
        drag.container.style.height = rect.height + 'px';
        drag.container.appendChild(tile.tile);
        drag.layoutPreview.style.display = 'flex';
        drag.dragging = true;
    });
    tileSourceContainer.appendChild(source);
};
createTileSource(VisualizerTile, './assets/visualizer-tile.png', 'New visualizer tile');
createTileSource(ChannelPeakTile, './assets/channelpeak-tile.png', 'New channel peak tile');
createTileSource(TextTile, './assets/text-tile.png', 'New text tile');
createTileSource(ImageTile, './assets/image-tile.png', 'New image tile');
createTileSource(VisualizerTextTile, './assets/visualizer-text-tile.png', 'New visualizer + text tile');
createTileSource(VisualizerImageTile, './assets/visualizer-image-tile.png', 'New visualizer + image tile');
createTileSource(BlankTile, './assets/blank-tile.png', 'New blank tile');
createTileSource(GrassTile, './assets/blank-tile.png', 'New grass tile');
tileSourceContainer.lastChild.style.display = 'none';

// tree editor
const tileModeButton = document.getElementById('tileMode');
const treeModeButton = document.getElementById('treeMode');
tileModeButton.onclick = (e) => {
    tileModeButton.disabled = true;
    treeModeButton.disabled = false;
    GroupTile.treeMode = false;
};
treeModeButton.onclick = (e) => {
    tileModeButton.disabled = false;
    treeModeButton.disabled = true;
    GroupTile.treeMode = true;
};
tileModeButton.disabled = true;

// keys and stuff
const dropdownButton = document.getElementById('dropdownTab');
document.addEventListener('keydown', (e) => {
    if (e.target.matches('input[type=text]') || e.target.matches('input[type=number]') || e.target.matches('textarea')) return;
    if (e.target.matches('input')) e.target.blur();
    const key = e.key.toLowerCase();
    switch (key) {
        case 'arrowleft':
            if (e.ctrlKey) break;
            e.preventDefault();
            mediaControls.setTime(Math.max(0, mediaControls.currentTime - 5));
            break;
        case 'arrowright':
            if (e.ctrlKey) break;
            e.preventDefault();
            mediaControls.setTime(Math.min(mediaControls.duration, mediaControls.currentTime + 5));
            break;
        case ' ':
        case 'p':
            if (e.ctrlKey) break;
            e.preventDefault();
            playButton.click();
            break;
        case 'h':
            if (e.ctrlKey) break;
            e.preventDefault();
            dropdownButton.click();
            if (e.shiftKey) dropdownButton.classList.toggle('hidden');
            break;
        case 't':
            if (e.ctrlKey) break;
            e.preventDefault();
            if (GroupTile.treeMode) tileModeButton.click();
            else treeModeButton.click();
            break;
        case 's':
            if (e.ctrlKey) {
                e.preventDefault();
                downloadButton.click();
            }
            break;
        case 'o':
            if (e.ctrlKey) {
                e.preventDefault();
                uploadButton.click();
            }
            break;
    }
});
