// Copyright (C) 2024 Sampleprovider(sp)

const visualizerOptionsTemplate = document.getElementById('visualizerOptionsTemplate');
function setDefaultTileControls() {
    const backgroundColorSelect = this.tile.querySelector('.tileBackgroundColor');
    backgroundColorSelect.addEventListener('input', (e) => this.tile.style.backgroundColor = backgroundColorSelect.value);
    this.tile.querySelector('.tileDrag').addEventListener('mousedown', (e) => startDrag.call(this, e));
    this.tile.querySelector('.tileRemove').addEventListener('click', (e) => { if (allowModification && (GroupTile.root.children.length > 1 || GroupTile.root.children[0] != this)) this.destroy() });
    const flexGrowInput = this.tile.querySelector('.tileFlex');
    flexGrowInput.oninput = (e) => {
        if (GroupTile.treeMode) this.tile.style.flexGrow = 1;
        else this.tile.style.flexGrow = parseFloat(flexGrowInput.value);
        if (this.parent !== null) this.parent.refresh();
    };
};
function setVisualizerControls() {
    // add options from template here
    this.tile.querySelector('.tileVisualizerControls').appendChild(visualizerOptionsTemplate.content.cloneNode(true).children[0]);
    // audio controls
    const audioUpload = this.tile.querySelector('.tileSourceUpload');
    audioUpload.addEventListener('change', async (e) => {
        if (audioUpload.files.length > 0 && audioUpload.files[0].type.startsWith('audio/')) {
            this.visualizer = new Visualizer(await audioUpload.files[0].arrayBuffer(), this.canvas, () => this.refresh());
            this.tile.querySelector('.tileSourceUploadCover').remove();
        }
    });
    const audioReplace = this.tile.querySelector('.tileAudioReplace');
    audioReplace.addEventListener('change', async (e) => {
        if (audioReplace.files.length > 0 && audioReplace.files[0].type.startsWith('audio/')) {
            this.visualizer.destroy();
            this.visualizer = new Visualizer(await audioReplace.files[0].arrayBuffer(), this.canvas, () => this.refresh());
            this.visualizer.mode = parseInt(visualizerMode.value);
            this.visualizer.fftSize = parseInt(visualizerFFTSize.value);
            this.visualizer.barWidthPercent = parseInt(visualizerWidth.value) / 100;
            this.visualizer.barCrop = parseFloat(visualizerFrequencyCrop.value) / 100;
            this.visualizer.barScale = parseFloat(visualizerVolumeCrop.value) / 100;
            this.visualizer.scale = parseFloat(visualizerWaveformScale.value);
            this.visualizer.lineWidth = parseInt(visualizerLineWidth.value);
            this.visualizer.flippedX = visualizerFlip.checked;
            this.visualizer.flippedY = visualizerFlip2.checked;
            this.visualizer.rotated = visualizerRotate.checked;
            this.visualizer.color = colorSelect.value;
            this.visualizer.volume = parseInt(volumeInput.value) / 100;
            audioReplace.value = '';
        }
    });
    // volume controls
    const volumeInput = this.tile.querySelector('.tileVisualizerVolumeInput');
    const volumeThumb = this.tile.querySelector('.tileVisualizerVolumeThumb');
    volumeInput.oninput = (e) => {
        if (this.visualizer !== null) this.visualizer.volume = parseInt(volumeInput.value) / 100;
        volumeThumb.style.setProperty('--volume', parseInt(volumeInput.value) / 120);
        volumeInput.title = volumeInput.value + '%';
    };
    volumeInput.addEventListener('wheel', (e) => {
        volumeInput.value = parseInt(volumeInput.value) - Math.round(e.deltaY / 20);
        volumeInput.oninput();
    }, { passive: true });
    // visualizer options
    const colorSelect = this.tile.querySelector('.tileVisualizerColor');
    colorSelect.addEventListener('input', (e) => { if (this.visualizer !== null) this.visualizer.color = colorSelect.value; });
    const visualizerMode = this.tile.querySelector('.tileVisualizerMode');
    const visualizerBarOptions = this.tile.querySelector('.tileVisualizerBarOptions');
    const visualizerLineOptions = this.tile.querySelector('.tileVisualizerLineOptions');
    const visualizerFrequencyOptions = this.tile.querySelector('.tileVisualizerFrequencyOptions');
    const visualizerWaveformOptions = this.tile.querySelector('.tileVisualizerWaveformOptions');
    visualizerMode.addEventListener('input', (e) => {
        let mode = parseInt(visualizerMode.value);
        if (this.visualizer !== null) this.visualizer.mode = mode;
        if (mode <= 3 || mode == 5) {
            visualizerFrequencyOptions.classList.remove('hidden');
            visualizerWaveformOptions.classList.add('hidden');
        } else {
            visualizerFrequencyOptions.classList.add('hidden');
            visualizerWaveformOptions.classList.remove('hidden');
        }
        if (mode < 2) {
            visualizerBarOptions.classList.remove('hidden');
            visualizerLineOptions.classList.add('hidden');
        } else {
            visualizerBarOptions.classList.add('hidden');
            visualizerLineOptions.classList.remove('hidden');
        }
    });
    visualizerWaveformOptions.classList.add('hidden');
    visualizerLineOptions.classList.add('hidden');
    const visualizerFFTSize = this.tile.querySelector('.tileVisualizerFFTSize');
    visualizerFFTSize.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.fftSize = parseInt(visualizerFFTSize.value);
    });
    // bar options
    const visualizerWidth = this.tile.querySelector('.tileVisualizerBarWidth');
    visualizerWidth.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.barWidthPercent = parseInt(visualizerWidth.value) / 100;
    });
    // line options
    const visualizerLineWidth = this.tile.querySelector('.tileVisualizerLineWidth');
    visualizerLineWidth.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.lineWidth = parseInt(visualizerLineWidth.value);
    });
    // frequency mode options
    const visualizerFrequencyCrop = this.tile.querySelector('.tileVisualizerFrequencyFrequencyCrop');
    const visualizerFrequencyCropDisplay = this.tile.querySelector('.tileVisualizerFrequencyFrequencyCropDisplay');
    visualizerFrequencyCrop.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.barCrop = parseFloat(visualizerFrequencyCrop.value) / 100;
        visualizerFrequencyCropDisplay.innerText = this.visualizer.sampleRate / 2 * this.visualizer.barCrop;
    });
    const visualizerVolumeCrop = this.tile.querySelector('.tileVisualizerFrequencyVolumeCrop');
    visualizerVolumeCrop.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.barScale = parseFloat(visualizerVolumeCrop.value) / 100;
    });
    const visualizerSmoothing = this.tile.querySelector('.tileVisualizerFrequencySmoothing');
    visualizerSmoothing.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.smoothingTimeConstant = parseFloat(visualizerSmoothing.value);
    });
    // waveform mode options
    const visualizerWaveformScale = this.tile.querySelector('.tileVisualizerWaveformScale');
    visualizerWaveformScale.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.scale = parseFloat(visualizerWaveformScale.value);
    });
    // more visualizer options
    const visualizerFlip = this.tile.querySelector('.tileVisualizerFlip');
    visualizerFlip.addEventListener('click', (e) => {
        if (this.visualizer !== null) this.visualizer.flippedX = visualizerFlip.checked;
    });
    const visualizerFlip2 = this.tile.querySelector('.tileVisualizerFlip2');
    visualizerFlip2.addEventListener('click', (e) => {
        if (this.visualizer !== null) this.visualizer.flippedY = visualizerFlip2.checked;
    });
    const visualizerRotate = this.tile.querySelector('.tileVisualizerRotate');
    visualizerRotate.addEventListener('click', (e) => {
        if (this.visualizer !== null) this.visualizer.rotated = visualizerRotate.checked;
    });
};
function applyDefaultTileControls(tile, data) {
    tile.tile.querySelector('.tileBackgroundColor').value = data.backgroundColor;
    tile.tile.style.backgroundColor = data.backgroundColor;
    tile.tile.querySelector('.tileFlex').value = data.flex ?? 1;
    tile.tile.style.flexGrow = data.flex ?? 1;
};
function applyVisualizerControls(tile, data) {
    tile.tile.querySelector('.tileVisualizerColor').value = data.visualizer.color;
    tile.tile.querySelector('.tileVisualizerMode').value = data.visualizer.mode;
    if (data.visualizer.mode <= 3 || data.visualizer.mode == 5) {
        tile.tile.querySelector('.tileVisualizerWaveformOptions').classList.add('hidden');
    } else {
        tile.tile.querySelector('.tileVisualizerFrequencyOptions').classList.add('hidden');
        tile.tile.querySelector('.tileVisualizerWaveformOptions').classList.remove('hidden');
    }
    if (data.visualizer.mode < 2) {
        tile.tile.querySelector('.tileVisualizerLineOptions').classList.add('hidden');
    } else {
        tile.tile.querySelector('.tileVisualizerBarOptions').classList.add('hidden');
        tile.tile.querySelector('.tileVisualizerLineOptions').classList.remove('hidden');
    }
    tile.tile.querySelector('.tileVisualizerFrequencySmoothing').value = data.visualizer.smoothing ?? 0.8;
    tile.tile.querySelector('.tileVisualizerFFTSize').value = data.visualizer.fftSize;
    tile.tile.querySelector('.tileVisualizerBarWidth').value = data.visualizer.barWidthPercent * 100;
    tile.tile.querySelector('.tileVisualizerFrequencyFrequencyCrop').value = data.visualizer.barCrop * 100;
    tile.tile.querySelector('.tileVisualizerFrequencyVolumeCrop').value = (data.visualizer.barScale ?? 1) * 100;
    tile.tile.querySelector('.tileVisualizerWaveformScale').value = data.visualizer.scale;
    tile.tile.querySelector('.tileVisualizerLineWidth').value = data.visualizer.lineWidth;
    tile.tile.querySelector('.tileVisualizerVolumeInput').value = (data.visualizer.volume ?? 1) * 100;
    tile.tile.querySelector('.tileVisualizerVolumeInput').oninput();
    if (data.visualizer.flippedX) tile.tile.querySelector('.tileVisualizerFlip').click();
    if (data.visualizer.flippedY) tile.tile.querySelector('.tileVisualizerFlip2').click();
    if (data.visualizer.rotated) tile.tile.querySelector('.tileVisualizerRotate').click();
    tile.visualizer = Visualizer.fromData(data.visualizer, tile.canvas);
    tile.visualizer.loadPromise.then(() => tile.tile.querySelector('.tileVisualizerFrequencyFrequencyCropDisplay').innerText = tile.visualizer.sampleRate / 2 * (parseFloat(tile.tile.querySelector('.tileVisualizerFrequencyFrequencyCrop').value) / 100));
};

class GroupTile {
    static #template = document.getElementById('groupTileTemplate');
    static root = new GroupTile(false);
    static #treeMode = false;

    parent = null;
    children = [];
    orientation = 0;
    tile = null;
    childBox = null; // uhhh
    controls = {
        dragBar: null,
        controls: null,
        flexGrow: null
    };
    constructor(orientation = false) {
        this.tile = GroupTile.#template.content.cloneNode(true).children[0];
        this.childBox = this.tile.querySelector('.tileGroupChildren');
        this.orientation = orientation;
        if (orientation) this.childBox.classList.add('tileGroupVertical');
        this.controls.dragBar = this.tile.querySelector('.tileDrag');
        this.tile.querySelector('.tileDrag').addEventListener('mousedown', (e) => startDrag.call(this, e));
        this.tile.querySelector('.tileRemove').addEventListener('click', (e) => { if (allowModification && (GroupTile.root.children.length > 1 || GroupTile.root.children[0] != this)) this.destroy() });
        this.controls.controls = this.tile.querySelector('.tileControls');
        this.controls.flexGrow = this.tile.querySelector('.tileFlex');
        this.controls.flexGrow.oninput = (e) => {
            if (GroupTile.treeMode) this.tile.style.flexGrow = 1;
            else this.tile.style.flexGrow = parseFloat(this.controls.flexGrow.value);
            if (this.parent !== null) this.parent.refresh();
        };
    }

    addChild(child, index = this.children.length) {
        if (!(child instanceof GroupTile) && !(child instanceof VisualizerTile) && !(child instanceof VisualizerImageTile) && !(child instanceof VisualizerTextTile) && !(child instanceof ChannelPeakTile) && !(child instanceof ImageTile) && !(child instanceof TextTile) && !(child instanceof BlankTile)) throw TypeError('GroupTile child must be a VisualizerTile, VisualizerImageTile, VisualizerTextTile, ImageTile, TextTile, BlankTile, or another GroupTile');
        if (typeof index != 'number' || index < 0 || index > this.children.length) throw new RangeError('GroupTile child insertion index out of range');
        // prevent duplicate children, add the tile to DOM first
        if (child.parent !== null) child.parent.removeChild(child);
        if (index === this.children.length) this.childBox.appendChild(child.tile);
        else this.childBox.insertBefore(child.tile, this.children[index].tile);
        this.children.splice(index, 0, child);
        child.parent = this;
        GroupTile.root.refresh();
    }
    replaceChild(child, replacement) {
        if (!this.children.includes(child)) return false;
        return this.replaceChildIndex(this.children.indexOf(child), replacement);
    }
    replaceChildIndex(index, replacement) {
        const removed = this.children.splice(index, 1)[0];
        removed.parent = null;
        removed.tile.remove();
        this.addChild(replacement, index);
        GroupTile.root.refresh();
        return removed;
    }
    removeChild(child) {
        if (!this.children.includes(child)) return false;
        return this.removeChildIndex(this.children.indexOf(child));
    }
    removeChildIndex(index) {
        const removed = this.children.splice(index, 1)[0];
        removed.parent = null;
        removed.tile.remove();
        GroupTile.root.refresh();
        this.checkObsolescence();
        return removed;
    }
    getChildIndex(child) {
        return this.children.indexOf(child);
    }
    refresh() {
        for (let child of this.children) {
            child.refresh();
        }
    }
    checkObsolescence() {
        if (this.parent === null) return;
        if (this.children.length === 0) this.destroy();
        if (this.children.length === 1) {
            let parent = this.parent;
            let child = this.children[0];
            parent.replaceChild(this, child);
            this.children = [];
            this.destroy();
            if (child instanceof GroupTile) child.checkObsolescence();
            parent.checkObsolescence();
        }
    }


    getData() {
        return {
            orientation: this.orientation,
            flex: this.tile.querySelector('.tileFlex').value
        };
    }
    static fromData(data) {
        const tile = new GroupTile(data.orientation);
        tile.controls.flexGrow.value = data.flex ?? (data.flexGrow == '' ? 1 : data.flexGrow) ?? 1;
        tile.tile.style.flexGrow = data.flex ?? data.flexGrow ?? 1;
        return tile;
    };
    destroy() {
        for (const child of this.children) child.destroy();
        if (this.parent) this.parent.removeChild(this);
    }

    static set treeMode(tmode) {
        if (tmode == this.#treeMode) return;
        this.#treeMode = tmode;
        if (this.#treeMode) display.classList.add('treeModeDisplay');
        else display.classList.remove('treeModeDisplay');
        GroupTile.root.refresh();
    }
    static get treeMode() { return this.#treeMode; }
}
class VisualizerTile {
    static #template = document.getElementById('visualizerTileTemplate');

    parent = null;
    tile = null;
    canvas = null;
    ctx = null;
    visualizer = null;
    constructor() {
        this.tile = VisualizerTile.#template.content.cloneNode(true).children[0];
        setDefaultTileControls.call(this);
        this.canvas = this.tile.querySelector('.tileCanvas');
        this.canvas.width = 500;
        this.canvas.height = 500;
        // visualizer controls
        setVisualizerControls.call(this);
        const canvasContainer = this.tile.querySelector('.tileCanvasContainer');
        this.#resize = () => {
            const rect = canvasContainer.getBoundingClientRect();
            let scale = window.devicePixelRatio ?? 1;
            if (this.visualizer !== null) this.visualizer.resize(Math.round(rect.width * scale), Math.round(rect.height * scale));
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
        };
        window.addEventListener('resize', this.#resize);
    }

    #resize = () => { }
    refresh() {
        this.#resize();
    }

    getData() {
        return {
            type: 'v',
            backgroundColor: this.tile.querySelector('.tileBackgroundColor').value,
            visualizer: this.visualizer !== null ? this.visualizer.getData() : null,
            flex: this.tile.querySelector('.tileFlex').value
        };
    }
    static fromData(data) {
        const tile = new VisualizerTile();
        applyDefaultTileControls(tile, data);
        if (data.visualizer !== null) {
            applyVisualizerControls(tile, data);
            tile.tile.querySelector('.tileSourceUploadCover').remove();
        }
        return tile;
    };
    destroy() {
        if (this.visualizer) this.visualizer.destroy();
        if (this.parent) this.parent.removeChild(this);
    }
}
class VisualizerImageTile {
    static #template = document.getElementById('visualizerImageTileTemplate');

    parent = null;
    tile = null;
    canvas = null;
    ctx = null;
    img = null;
    visualizer = null;
    constructor() {
        this.tile = VisualizerImageTile.#template.content.cloneNode(true).children[0];
        setDefaultTileControls.call(this);
        this.canvas = this.tile.querySelector('.tileCanvas');
        this.img = this.tile.querySelector('.tileImg');
        // visualizer controls
        setVisualizerControls.call(this);
        // image controls
        const imageUpload = this.tile.querySelector('.tileImgUpload');
        const imageReplace = this.tile.querySelector('.tileImgReplace');
        const imageReplaceLabel = this.tile.querySelector('.tileImgReplaceLabelText');
        const fileTypes = [
            'image/bmp',
            'image/jpeg',
            'image/png',
            'image/svg+xml',
            'image/webp',
        ];
        imageUpload.addEventListener('change', (e) => {
            if (imageUpload.files.length > 0 && fileTypes.includes(imageUpload.files[0].type)) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.img.src = reader.result;
                    this.img.onload = (e) => this.#resize();
                    imageReplaceLabel.innerText = 'Change Image';
                    this.tile.querySelector('.tileImgUploadCoverSmall').remove();
                };
                reader.readAsDataURL(imageUpload.files[0]);
            }
        });
        imageReplace.addEventListener('change', (e) => {
            if (imageReplace.files.length > 0 && fileTypes.includes(imageReplace.files[0].type)) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.img.src = reader.result;
                    this.img.onload = (e) => this.#resize();
                    imageReplaceLabel.innerText = 'Change Image';
                    if (this.tile.querySelector('.tileImgUploadCoverSmall') !== null) this.tile.querySelector('.tileImgUploadCoverSmall').remove();
                };
                reader.readAsDataURL(imageReplace.files[0]);
            }
        });
        const imageSmoothing = this.tile.querySelector('.tileImgSmoothing');
        imageSmoothing.addEventListener('click', (e) => {
            if (imageSmoothing.checked) this.img.style.imageRendering = 'auto';
            else this.img.style.imageRendering = 'pixelated';
        });
        const canvasContainer = this.tile.querySelector('.tileCanvasContainer');
        const imageContainer = this.tile.querySelector('.tileImgContainer');
        this.#resize = () => {
            const rect = canvasContainer.getBoundingClientRect();
            let scale = window.devicePixelRatio ?? 1;
            if (this.visualizer !== null) this.visualizer.resize(Math.round(rect.width * scale), Math.round(rect.height * scale));
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
            const rect2 = imageContainer.getBoundingClientRect();
            if (rect2.width / rect2.height < this.img.width / this.img.height) {
                // width restriction
                this.img.style.width = rect2.width + 'px';
                this.img.style.height = 'unset';
            } else {
                // height restriction
                this.img.style.width = 'unset';
                this.img.style.height = rect2.height + 'px';
            }
        };
        window.addEventListener('resize', this.#resize);
    }

    #resize = () => { }
    refresh() {
        this.#resize();
    }

    getData() {
        return {
            type: 'vi',
            backgroundColor: this.tile.querySelector('.tileBackgroundColor').value,
            visualizer: this.visualizer !== null ? this.visualizer.getData() : null,
            image: this.img.src,
            smoothing: this.tile.querySelector('.tileImgSmoothing').checked,
            flex: this.tile.querySelector('.tileFlex').value
        };
    }
    static fromData(data) {
        const tile = new VisualizerImageTile();
        applyDefaultTileControls(tile, data);
        if (data.visualizer !== null) {
            applyVisualizerControls(tile, data);
            tile.tile.querySelector('.tileSourceUploadCover').remove();
        }
        if (data.image !== '') {
            tile.img.src = data.image;
            tile.tile.querySelector('.tileImgUploadCoverSmall').remove();
        }
        if (data.smoothing === false) tile.tile.querySelector('.tileImgSmoothing').click();
        return tile;
    };
    destroy() {
        if (this.visualizer) this.visualizer.destroy();
        if (this.parent) this.parent.removeChild(this);
    }
}
class VisualizerTextTile {
    static #template = document.getElementById('visualizerTextTileTemplate');

    parent = null;
    tile = null;
    canvas = null;
    ctx = null;
    canvas2 = null;
    ctx2 = null;
    text = 'Text Here';
    visualizer = null;
    constructor() {
        this.tile = VisualizerTextTile.#template.content.cloneNode(true).children[0];
        setDefaultTileControls.call(this);
        this.canvas = this.tile.querySelector('.tileCanvas');
        this.canvas2 = this.tile.querySelector('.tileCanvas2');
        this.ctx2 = this.canvas2.getContext('2d');
        this.ctx2.imageSmoothingEnabled = false;
        this.ctx2.webkitImageSmoothingEnabled = false;
        // visualizer controls
        setVisualizerControls.call(this);
        // text controls
        this.tile.querySelector('.tileTextEdit').addEventListener('click', (e) => {
            editContainer.classList.remove('hidden');
        });
        const textEditor = this.tile.querySelector('.tileText');
        this.tile.querySelector('.tileTextEditDoneButton').addEventListener('click', (e) => {
            this.text = textEditor.value;
            this.refresh();
            draw();
            editContainer.classList.add('hidden');
        });
        const fontSize = this.tile.querySelector('.tileTextSize');
        const textAlign = this.tile.querySelector('.tileTextAlign');
        const textColor = this.tile.querySelector('.tileTextColor');
        let draw = () => {
            this.ctx2.clearRect(0, 0, this.canvas2.width, this.canvas2.height);
            this.ctx2.font = `${fontSize.value}px Source Code Pro`;
            this.ctx2.textAlign = parseFloat(textAlign.value) == 1 ? 'right' : (parseFloat(textAlign.value) == 0.5 ? 'center' : 'left');
            this.ctx2.textBaseline = 'middle';
            this.ctx2.fillStyle = textColor.value;
            let size = parseInt(fontSize.value) + 2;
            let x = this.canvas2.width * parseFloat(textAlign.value);
            let text = this.text.split('\n');
            for (let i = 0; i < text.length; i++) {
                this.ctx2.fillText(text[i], x, (i + 0.5) * size);
            }
        };
        fontSize.addEventListener('input', (e) => this.refresh());
        textAlign.addEventListener('input', (e) => draw());
        textColor.addEventListener('input', (e) => draw());
        const canvasContainer = this.tile.querySelector('.tileCanvasContainer');
        const editContainer = this.tile.querySelector('.tileTextEditContainer');
        this.canvas.style.top = '0px';
        this.canvas2.style.bottom = '0px';
        this.#resize = () => {
            let textHeight = this.text.split('\n').length * (parseInt(fontSize.value) + 2) + 4;
            const rect = canvasContainer.getBoundingClientRect();
            let scale = window.devicePixelRatio ?? 1;
            if (this.visualizer !== null) this.visualizer.resize(Math.round(rect.width * scale), Math.round((rect.height - textHeight - 4) * scale));
            if (this.visualizer !== null && this.visualizer.rotated) {
                this.canvas.style.width = (rect.height - textHeight - 2) + 'px';
                this.canvas.style.height = rect.width + 'px';
            } else {
                this.canvas.style.width = rect.width + 'px';
                this.canvas.style.height = (rect.height - textHeight - 2) + 'px';
            }
            this.canvas2.width = Math.round(rect.width * scale);
            this.canvas2.height = Math.round(textHeight * scale);
            this.canvas2.style.width = rect.width + 'px';
            this.canvas2.style.height = textHeight + 'px';
            const rect2 = this.tile.getBoundingClientRect();
            editContainer.style.width = rect2.width + 'px';
            editContainer.style.height = rect2.height + 'px';
            draw();
        };
        window.addEventListener('resize', this.#resize);
    }

    #resize = () => { }
    refresh() {
        this.#resize();
    }

    getData() {
        return {
            type: 'vt',
            backgroundColor: this.tile.querySelector('.tileBackgroundColor').value,
            visualizer: this.visualizer !== null ? this.visualizer.getData() : null,
            text: this.text,
            fontSize: this.tile.querySelector('.tileTextSize').value,
            textAlign: this.tile.querySelector('.tileTextAlign').value,
            textColor: this.tile.querySelector('.tileTextColor').value,
            flex: this.tile.querySelector('.tileFlex').value
        };
    }
    static fromData(data) {
        const tile = new VisualizerTextTile();
        applyDefaultTileControls(tile, data);
        if (data.visualizer !== null) {
            applyVisualizerControls(tile, data);
            tile.tile.querySelector('.tileSourceUploadCover').remove();
        }
        tile.text = data.text;
        tile.tile.querySelector('.tileText').value = data.text;
        tile.tile.querySelector('.tileTextSize').value = data.fontSize;
        tile.tile.querySelector('.tileTextAlign').value = data.textAlign;
        tile.tile.querySelector('.tileTextColor').value = data.textColor;
        return tile;
    };
    destroy() {
        if (this.visualizer) this.visualizer.destroy();
        if (this.parent) this.parent.removeChild(this);
    }
}
class ChannelPeakTile {
    static #template = document.getElementById('channelPeakTileTemplate');

    parent = null;
    tile = null;
    canvas = null;
    ctx = null;
    visualizer = null;
    constructor() {
        this.tile = ChannelPeakTile.#template.content.cloneNode(true).children[0];
        setDefaultTileControls.call(this);
        this.canvas = this.tile.querySelector('.tileCanvas');
        this.canvas.width = 500;
        this.canvas.height = 500;
        // visualizer controls
        // audio controls
        const audioUpload = this.tile.querySelector('.tileSourceUpload');
        audioUpload.addEventListener('change', async (e) => {
            if (audioUpload.files.length > 0 && audioUpload.files[0].type.startsWith('audio/')) {
                this.visualizer = new ChannelPeakVisualizer(await audioUpload.files[0].arrayBuffer(), this.canvas, () => this.refresh());
                this.tile.querySelector('.tileSourceUploadCover').remove();
            }
        });
        const audioReplace = this.tile.querySelector('.tileAudioReplace');
        audioReplace.addEventListener('change', async (e) => {
            if (audioReplace.files.length > 0 && audioReplace.files[0].type.startsWith('audio/')) {
                this.visualizer.destroy();
                this.visualizer = new ChannelPeakVisualizer(await audioReplace.files[0].arrayBuffer(), this.canvas, () => this.refresh());
                this.visualizer.channelCount = parseInt(channelPeakChannels.value);
                this.visualizer.barWidthPercent = parseInt(channelPeakBarWidth.value) / 100;
                this.visualizer.smoothing = parseFloat(channelPeakSmoothing.value);
                this.visualizer.color = colorSelect.value;
                this.visualizer.volume = parseInt(volumeInput.value) / 100;
                audioReplace.value = '';
            }
        });
        // volume controls
        const volumeInput = this.tile.querySelector('.tileVisualizerVolumeInput');
        const volumeThumb = this.tile.querySelector('.tileVisualizerVolumeThumb');
        volumeInput.oninput = (e) => {
            if (this.visualizer !== null) this.visualizer.volume = parseInt(volumeInput.value) / 100;
            volumeThumb.style.setProperty('--volume', parseInt(volumeInput.value) / 120);
            volumeInput.title = volumeInput.value + '%';
        };
        volumeInput.addEventListener('wheel', (e) => {
            volumeInput.value = parseInt(volumeInput.value) - Math.round(e.deltaY / 20);
            volumeInput.oninput();
        }, { passive: true });
        // visualizer options
        const colorSelect = this.tile.querySelector('.tileVisualizerColor');
        colorSelect.addEventListener('input', (e) => { if (this.visualizer !== null) this.visualizer.color = colorSelect.value; });
        const channelPeakVolumeCrop = this.tile.querySelector('.tileChannelPeakVolumeCrop');
        channelPeakVolumeCrop.addEventListener('input', (e) => {
            if (this.visualizer !== null) this.visualizer.barScale = parseFloat(channelPeakVolumeCrop.value) / 100;
        });
        // actual options that arent copied from somewhere else
        const channelPeakChannels = this.tile.querySelector('.tileChannelPeakChannels');
        channelPeakChannels.addEventListener('input', (e) => {
            if (this.visualizer !== null) this.visualizer.channelCount = parseInt(channelPeakChannels.value);
        });
        // bar options
        const channelPeakBarWidth = this.tile.querySelector('.tileChannelPeakBarWidth');
        channelPeakBarWidth.addEventListener('input', (e) => {
            if (this.visualizer !== null) this.visualizer.barWidthPercent = parseInt(channelPeakBarWidth.value) / 100;
        });
        const channelPeakSmoothing = this.tile.querySelector('.tileChannelPeakSmoothing');
        channelPeakSmoothing.addEventListener('input', (e) => {
            if (this.visualizer !== null) this.visualizer.smoothing = parseFloat(channelPeakSmoothing.value);
        });
        // more visualizer options
        const visualizerFlip = this.tile.querySelector('.tileVisualizerFlip');
        visualizerFlip.addEventListener('click', (e) => {
            if (this.visualizer !== null) this.visualizer.flippedX = visualizerFlip.checked;
        });
        const visualizerFlip2 = this.tile.querySelector('.tileVisualizerFlip2');
        visualizerFlip2.addEventListener('click', (e) => {
            if (this.visualizer !== null) this.visualizer.flippedY = visualizerFlip2.checked;
        });
        const visualizerRotate = this.tile.querySelector('.tileVisualizerRotate');
        visualizerRotate.addEventListener('click', (e) => {
            if (this.visualizer !== null) this.visualizer.rotated = visualizerRotate.checked;
        });
        const canvasContainer = this.tile.querySelector('.tileCanvasContainer');
        this.#resize = () => {
            const rect = canvasContainer.getBoundingClientRect();
            let scale = window.devicePixelRatio ?? 1;
            if (this.visualizer !== null) this.visualizer.resize(Math.round(rect.width * scale), Math.round(rect.height * scale));
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
        };
        window.addEventListener('resize', this.#resize);
    }

    #resize = () => { }
    refresh() {
        this.#resize();
    }

    getData() {
        return {
            type: 'cp',
            backgroundColor: this.tile.querySelector('.tileBackgroundColor').value,
            visualizer: this.visualizer !== null ? this.visualizer.getData() : null,
            flex: this.tile.querySelector('.tileFlex').value
        };
    }
    static fromData(data) {
        const tile = new ChannelPeakTile();
        applyDefaultTileControls(tile, data);
        if (data.visualizer !== null) {
            tile.tile.querySelector('.tileChannelPeakChannels').value = data.visualizer.channelCount;
            tile.tile.querySelector('.tileChannelPeakBarWidth').value = data.visualizer.barWidthPercent * 100;
            tile.tile.querySelector('.tileChannelPeakSmoothing').value = data.visualizer.smoothing ?? 0.8;
            tile.tile.querySelector('.tileVisualizerColor').value = data.visualizer.color;
            tile.tile.querySelector('.tileVisualizerVolumeInput').value = (data.visualizer.volume ?? 1) * 100;
            tile.tile.querySelector('.tileVisualizerVolumeInput').oninput();
            tile.tile.querySelector('.tileChannelPeakVolumeCrop').value = (data.visualizer.barScale ?? 1) * 100;
            tile.visualizer = ChannelPeakVisualizer.fromData(data.visualizer, tile.canvas);
            tile.tile.querySelector('.tileSourceUploadCover').remove();
        }
        return tile;
    };
    destroy() {
        if (this.visualizer) this.visualizer.destroy();
        if (this.parent) this.parent.removeChild(this);
    }
}
class ImageTile {
    static #template = document.getElementById('imageTileTemplate');

    parent = null;
    tile = null;
    img = null;
    constructor() {
        this.tile = ImageTile.#template.content.cloneNode(true).children[0];
        setDefaultTileControls.call(this);
        this.img = this.tile.querySelector('.tileImg');
        const imageUpload = this.tile.querySelector('.tileImgUpload');
        const imageReplace = this.tile.querySelector('.tileImgReplace');
        const fileTypes = [
            'image/bmp',
            'image/jpeg',
            'image/png',
            'image/svg+xml',
            'image/webp',
        ];
        imageUpload.addEventListener('change', (e) => {
            if (imageUpload.files.length > 0 && fileTypes.includes(imageUpload.files[0].type)) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.img.src = reader.result;
                    this.img.onload = (e) => this.#resize();
                    this.tile.querySelector('.tileImgUploadCover').remove();
                };
                reader.readAsDataURL(imageUpload.files[0]);
            }
        });
        imageReplace.addEventListener('change', (e) => {
            if (imageReplace.files.length > 0 && fileTypes.includes(imageReplace.files[0].type)) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.img.src = reader.result;
                    this.img.onload = (e) => this.#resize();
                };
                reader.readAsDataURL(imageReplace.files[0]);
            }
        });
        const imageSmoothing = this.tile.querySelector('.tileImgSmoothing');
        imageSmoothing.addEventListener('click', (e) => {
            if (imageSmoothing.checked) this.img.style.imageRendering = 'auto';
            else this.img.style.imageRendering = 'pixelated';
        });
        const imageContainer = this.tile.querySelector('.tileImgContainer');
        this.#resize = () => {
            const rect = imageContainer.getBoundingClientRect();
            if (rect.width / rect.height < this.img.width / this.img.height) {
                // width restriction
                this.img.style.width = rect.width + 'px';
                this.img.style.height = 'unset';
            } else {
                // height restriction
                this.img.style.width = 'unset';
                this.img.style.height = rect.height + 'px';
            }
        };
        window.addEventListener('resize', this.#resize);
    }

    #resize = () => { }
    refresh() {
        this.#resize();
    }

    getData() {
        return {
            type: 'i',
            backgroundColor: this.tile.querySelector('.tileBackgroundColor').value,
            image: this.img.src,
            smoothing: this.tile.querySelector('.tileImgSmoothing').checked,
            flex: this.tile.querySelector('.tileFlex').value
        };
    }
    static fromData(data) {
        const tile = new ImageTile();
        applyDefaultTileControls(tile, data);
        if (data.image !== '') {
            tile.img.src = data.image;
            tile.tile.querySelector('.tileImgUploadCover').remove();
        }
        if (data.smoothing === false) tile.tile.querySelector('.tileImgSmoothing').click();
        return tile;
    };
    destroy() {
        if (this.parent) this.parent.removeChild(this);
    }
}
class TextTile {
    static #template = document.getElementById('textTileTemplate');

    parent = null;
    tile = null;
    canvas = null;
    ctx = null;
    text = 'Text Here';
    constructor() {
        this.tile = TextTile.#template.content.cloneNode(true).children[0];
        setDefaultTileControls.call(this);
        this.canvas = this.tile.querySelector('.tileCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.tile.querySelector('.tileTextEdit').addEventListener('click', (e) => {
            editContainer.classList.remove('hidden');
        });
        const textEditor = this.tile.querySelector('.tileText');
        this.tile.querySelector('.tileTextEditDoneButton').addEventListener('click', (e) => {
            this.text = textEditor.value;
            this.refresh();
            draw();
            editContainer.classList.add('hidden');
        });
        const fontSize = this.tile.querySelector('.tileTextSize');
        const textAlign = this.tile.querySelector('.tileTextAlign');
        const textColor = this.tile.querySelector('.tileTextColor');
        let draw = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.font = `${fontSize.value * (window.devicePixelRatio ?? 1)}px Source Code Pro`;
            this.ctx.textAlign = parseFloat(textAlign.value) == 1 ? 'right' : (parseFloat(textAlign.value) == 0.5 ? 'center' : 'left');
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = textColor.value;
            let size = parseInt(fontSize.value) + 2;
            let x = this.canvas.width * parseFloat(textAlign.value);
            let text = this.text.split('\n');
            for (let i = 0; i < text.length; i++) {
                this.ctx.fillText(text[i], x, (this.canvas.height / 2) - (((text.length / 2) - i - 0.5) * size));
            }
        };
        fontSize.addEventListener('input', (e) => draw());
        textAlign.addEventListener('input', (e) => draw());
        textColor.addEventListener('input', (e) => draw());
        const canvasContainer = this.tile.querySelector('.tileCanvasContainer');
        const editContainer = this.tile.querySelector('.tileTextEditContainer');
        this.#resize = () => {
            const rect = this.tile.getBoundingClientRect();
            editContainer.style.width = rect.width + 'px';
            editContainer.style.height = rect.height + 'px';
            const rect2 = canvasContainer.getBoundingClientRect();
            let scale = window.devicePixelRatio ?? 1;
            this.canvas.width = Math.round(rect2.width * scale);
            this.canvas.height = Math.round(rect2.height * scale);
            this.canvas.style.width = rect2.width + 'px';
            this.canvas.style.height = rect2.height + 'px';
            draw();
        };
        window.addEventListener('resize', this.#resize);
    }

    #resize = () => { }
    refresh() {
        this.#resize();
    }

    getData() {
        return {
            type: 't',
            backgroundColor: this.tile.querySelector('.tileBackgroundColor').value,
            text: this.text,
            fontSize: this.tile.querySelector('.tileTextSize').value,
            textAlign: this.tile.querySelector('.tileTextAlign').value,
            color: this.tile.querySelector('.tileTextColor').value,
            flex: this.tile.querySelector('.tileFlex').value
        };
    }
    static fromData(data) {
        const tile = new TextTile();
        applyDefaultTileControls(tile, data);
        tile.text = data.text;
        tile.tile.querySelector('.tileText').value = data.text;
        tile.tile.querySelector('.tileTextSize').value = data.fontSize;
        tile.tile.querySelector('.tileTextAlign').value = data.textAlign;
        tile.tile.querySelector('.tileTextColor').value = data.color;
        return tile;
    };
    destroy() {
        if (this.parent) this.parent.removeChild(this);
    }
}
class BlankTile {
    static #template = document.getElementById('blankTileTemplate');

    parent = null;
    tile = null;
    constructor() {
        this.tile = BlankTile.#template.content.cloneNode(true).children[0];
        setDefaultTileControls.call(this);
    }

    refresh() { }

    getData() {
        return {
            type: 'b',
            backgroundColor: this.tile.querySelector('.tileBackgroundColor').value,
            flex: this.tile.querySelector('.tileFlex').value
        };
    }
    static fromData(data) {
        const tile = new BlankTile();
        applyDefaultTileControls(tile, data);
        return tile;
    };
    destroy() {
        if (this.parent) this.parent.removeChild(this);
    }
}

display.appendChild(GroupTile.root.tile);

const drag = {
    container: document.getElementById('draggingContainer'),
    layoutPreview: document.getElementById('draggingLayoutPreview'),
    tile: null,
    dragX: 0,
    dragY: 0,
    drop: {
        tile: null,
        index: 0,
        createGroup: false,
        groupOrientation: 0
    },
    from: {
        tile: null,
        index: 0
    },
    dragging: false
};
function startDrag(e) {
    if (!allowModification || drag.dragging || this.parent === null || e.target.matches('.tileRemove') || e.button != 0 || (GroupTile.root.children.length == 1 && GroupTile.root.children[0] == this)) return;
    drag.tile = this;
    drag.from.tile = this.parent;
    drag.from.index = this.parent.getChildIndex(this);
    const rect = this.tile.querySelector('.tileDrag').getBoundingClientRect();
    drag.dragX = e.clientX - rect.left;
    drag.dragY = e.clientY - rect.top;
    this.tile.querySelector('.tileDrag').style.opacity = 1;
    const rect2 = this.tile.getBoundingClientRect();
    drag.container.style.top = e.clientY - drag.dragY + 'px';
    drag.container.style.left = e.clientX - drag.dragX + 'px';
    drag.container.style.width = rect2.width + 'px';
    drag.container.style.height = rect2.height + 'px';
    this.parent.removeChild(this);
    drag.container.appendChild(this.tile);
    drag.layoutPreview.innerHTML = '';
    drag.layoutPreview.style.display = 'flex';
    drag.dragging = true;
    drag.drop.tile = null;
};
document.addEventListener('mousemove', (e) => {
    if (drag.dragging) {
        // scroll when mouse at edge of screen in tree mode
        drag.container.style.top = e.clientY - drag.dragY + 'px';
        drag.container.style.left = e.clientX - drag.dragX + 'px';
        drag.tile.refresh();
        const visited = new Set();
        let currTile = GroupTile.root;
        visited.add(currTile);
        for (let child of currTile.children) {
            const rect2 = child.tile.getBoundingClientRect();
            if (e.clientX >= rect2.left && e.clientX <= rect2.right && e.clientY >= rect2.top && e.clientY <= rect2.bottom) {
                currTile = child;
                visited.add(currTile);
            }
        }
        let foundDrop = false;
        let setLayout = (tile, index, createGroup, groupOrientation) => {
            if (createGroup) drag.drop.tile = tile;
            else drag.drop.tile = tile.parent;
            drag.drop.index = index;
            drag.drop.createGroup = createGroup;
            drag.drop.groupOrientation = groupOrientation;
            foundDrop = true;
        };
        let simulateLayout = () => {
            let rec = (group, div) => {
                for (let i in group.children) {
                    const child = group.children[i];
                    const tdiv = document.createElement('div');
                    if (child.children !== undefined) tdiv.classList.add('pGroupTile');
                    else tdiv.classList.add('pTile');
                    tdiv.style.flexGrow = child.tile.style.flexGrow;
                    if (group === drag.drop.tile && !drag.drop.createGroup && i == drag.drop.index) {
                        const ddiv = document.createElement('div');
                        ddiv.classList.add('pTile');
                        ddiv.classList.add('pTileDrop');
                        ddiv.style.flexGrow = drag.tile.tile.style.flexGrow;
                        div.appendChild(ddiv);
                    }
                    if (child.children !== undefined) {
                        if (child.orientation) tdiv.classList.add('pGroupTileVertical');
                        rec(child, tdiv);
                    }
                    if (drag.drop.createGroup && child === drag.drop.tile) {
                        const gdiv = document.createElement('div');
                        gdiv.classList.add('pGroupTile');
                        if (drag.drop.groupOrientation) gdiv.classList.add('pGroupTileVertical');
                        if (drag.drop.index == 1) gdiv.appendChild(tdiv);
                        const ddiv = document.createElement('div');
                        ddiv.classList.add('pTile');
                        ddiv.classList.add('pTileDrop');
                        ddiv.style.flexGrow = drag.tile.tile.style.flexGrow;
                        if (drag.drop.index == 1) gdiv.appendChild(tdiv);
                        gdiv.appendChild(ddiv);
                        if (drag.drop.index == 0) gdiv.appendChild(tdiv);
                        div.appendChild(gdiv);
                    } else div.appendChild(tdiv);
                }
                if (group == drag.drop.tile && !drag.drop.createGroup && drag.drop.index == group.children.length) {
                    const ddiv = document.createElement('div');
                    ddiv.classList.add('pTile');
                    ddiv.classList.add('pTileDrop');
                    ddiv.style.flexGrow = drag.tile.tile.style.flexGrow;
                    div.appendChild(ddiv);
                }
            };
            drag.layoutPreview.innerHTML = '';
            drag.layoutPreview.style.opacity = '1';
            rec(GroupTile.root, drag.layoutPreview);
        };
        traverse: while (true) {
            const rect = currTile.tile.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                let relX = e.clientX - rect.left;
                let relY = e.clientY - rect.top;
                const parent = currTile.parent;
                let halfBoxWidth = Math.min(12 * Math.log(rect.width + 1), rect.width * 0.6);
                let halfBoxHeight = Math.min(12 * Math.log(rect.height + 1), rect.height * 0.6);
                let halfWidth = rect.width / 2;
                let halfHeight = rect.height / 2;
                if (relY < halfBoxHeight && relX > halfWidth - halfBoxWidth && relX < halfWidth + halfBoxWidth) {
                    // uhhh doesnt work when orientation is horizontal??
                    if (parent != null && parent.orientation == 1 && relY < halfBoxHeight * 0.5) {
                        setLayout(currTile, parent.getChildIndex(currTile), false);
                    } else {
                        setLayout(currTile, 0, true, 1);
                    }
                } else if (relY > rect.height - halfBoxHeight && relX > halfWidth - halfBoxWidth && relX < halfWidth + halfBoxWidth) {
                    if (parent != null && parent.orientation == 1 && relY > rect.height - halfBoxHeight * 0.5) {
                        setLayout(currTile, parent.getChildIndex(currTile) + 1, false);
                    } else {
                        setLayout(currTile, 1, true, 1);
                    }
                } else if (relX < halfBoxWidth && relY > halfHeight - halfBoxHeight && relY < halfHeight + halfBoxHeight) {
                    if (parent != null && parent.orientation == 0 && relX < halfBoxWidth * 0.5) {
                        setLayout(currTile, parent.getChildIndex(currTile), false);
                    } else {
                        setLayout(currTile, 0, true, 0);
                    }
                } else if (relX > rect.width - halfBoxWidth && relY > halfHeight - halfBoxHeight && relY < halfHeight + halfBoxHeight) {
                    if (parent != null && parent.orientation == 0 && relX > rect.width - halfBoxWidth * 0.5) {
                        setLayout(currTile, parent.getChildIndex(currTile) + 1, false);
                    } else {
                        setLayout(currTile, 1, true, 0);
                    }
                } else if (parent != null && (currTile instanceof GroupTile ? currTile.children.every(v => visited.has(v)) : true)) {
                    currTile = parent;
                    continue traverse;
                }
            } else if (currTile.parent != null) {
                currTile = currTile.parent;
                continue traverse;
            }
            if (currTile instanceof GroupTile) for (let child of currTile.children) {
                if (visited.has(child)) continue;
                const rect2 = child.tile.getBoundingClientRect();
                if (e.clientX >= rect2.left && e.clientX <= rect2.right && e.clientY >= rect2.top && e.clientY <= rect2.bottom) {
                    currTile = child;
                    visited.add(currTile);
                    continue traverse;
                }
            }
            break;
        }
        if (foundDrop) simulateLayout();
        // else {
        //     drag.drop.tile = drag.from.tile;
        //     drag.drop.createGroup = false;
        //     drag.drop.index = drag.from.index;
        // }
    }
});
document.addEventListener('mouseup', (e) => {
    if (drag.dragging && drag.drop.tile !== null) {
        if (drag.drop.createGroup) {
            const newGroup = new GroupTile(drag.drop.groupOrientation);
            const parent = drag.drop.tile.parent;
            parent.replaceChild(drag.drop.tile, newGroup);
            newGroup.addChild(drag.drop.tile);
            newGroup.addChild(drag.tile, drag.drop.index);
        } else {
            drag.drop.tile.addChild(drag.tile, drag.drop.index);
        }
        drag.tile.tile.querySelector('.tileDrag').style.opacity = '';
        drag.drop.tile = null;
        drag.layoutPreview.innerHTML = '';
        drag.layoutPreview.style.display = 'none';
        drag.container.innerHTML = '';
        drag.tile = null;
        drag.dragging = false;
    }
});

window.addEventListener('load', (e) => {
    GroupTile.root.addChild(new ImageTile());
    GroupTile.root.addChild(new ImageTile());
    let subgroup = new GroupTile(1);
    subgroup.addChild(new VisualizerImageTile())
    subgroup.addChild(new VisualizerTile())
    subgroup.addChild(new VisualizerTextTile());
    let subgroup2 = new GroupTile();
    subgroup2.addChild(new BlankTile());
    subgroup2.addChild(new ImageTile());
    subgroup.addChild(subgroup2, 1);
    GroupTile.root.addChild(subgroup, 0);
});