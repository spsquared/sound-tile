// Copyright (C) 2023 Sampleprovider(sp)

const visualizerOptionsTemplate = document.getElementById('visualizerOptionsTemplate');
function setDefaultTileControls() {
    const backgroundColorSelect = this.tile.querySelector('.tileBackgroundColor');
    backgroundColorSelect.addEventListener('input', (e) => this.tile.style.backgroundColor = backgroundColorSelect.value);
    this.tile.addEventListener('mouseover', (e) => { if (drag.tile !== this) drag.hoverTile = this; });
    this.tile.addEventListener('mouseleave', (e) => { if (drag.hoverTile === this) drag.hoverTile = null; });
    this.tile.querySelector('.tileDrag').addEventListener('mousedown', (e) => startDrag.call(this, e));
    this.tile.querySelector('.tileRemove').addEventListener('click', (e) => { if (GroupTile.root.children.length > 1 || GroupTile.root.children[0] != this) this.destroy() });
};
function setVisualizerControls() {
    // add options from template here
    this.tile.querySelector('.tileVisualizerControls').appendChild(visualizerOptionsTemplate.content.cloneNode(true).children[0]);
    // audio controls
    const audioUpload = this.tile.querySelector('.tileSourceUpload');
    audioUpload.addEventListener('change', async (e) => {
        if (audioUpload.files.length > 0 && audioUpload.files[0].type.startsWith('audio/')) {
            this.visualizer = new Visualizer(await audioUpload.files[0].arrayBuffer(), this.ctx);
            this.tile.querySelector('.tileSourceUploadCover').remove();
        }
    });
    const audioReplace = this.tile.querySelector('.tileAudioReplace');
    audioReplace.addEventListener('change', async (e) => {
        if (audioReplace.files.length > 0 && audioReplace.files[0].type.startsWith('audio/')) {
            this.visualizer.destroy();
            this.visualizer = new Visualizer(await audioReplace.files[0].arrayBuffer(), this.ctx);
            this.visualizer.mode = parseInt(visualizerMode.value);
            this.visualizer.fftSize = parseInt(visualizerFFTSize.value);
            this.visualizer.barWidthPercent = parseInt(visualizerFrequencyWidth.value) / 100;
            this.visualizer.barCrop = parseFloat(visualizerFrequencyCrop.value) / 100;
            this.visualizer.scale = parseFloat(visualizerWaveformScale.value);
            this.visualizer.lineWidth = parseInt(visualizerWaveformLineWidth.value);
            this.visualizer.color = colorSelect.value;
        }
    });
    // visualizer options
    const colorSelect = this.tile.querySelector('.tileVisualizerColor');
    colorSelect.addEventListener('input', (e) => { if (this.visualizer !== null) this.visualizer.color = colorSelect.value; });
    const visualizerMode = this.tile.querySelector('.tileVisualizerMode');
    const visualizerFrequencyOptions = this.tile.querySelector('.tileVisualizerFrequencyOptions');
    const visualizerWaveformOptions = this.tile.querySelector('.tileVisualizerWaveformOptions');
    visualizerMode.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.mode = parseInt(visualizerMode.value);
        if (parseInt(visualizerMode.value) < 2) {
            visualizerFrequencyOptions.classList.remove('hidden');
            visualizerWaveformOptions.classList.add('hidden');
        } else {
            visualizerFrequencyOptions.classList.add('hidden');
            visualizerWaveformOptions.classList.remove('hidden');
        }
    });
    visualizerWaveformOptions.classList.add('hidden');
    const visualizerFFTSize = this.tile.querySelector('.tileVisualizerFFTSize');
    visualizerFFTSize.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.fftSize = parseInt(visualizerFFTSize.value);
    });
    // frequency mode options
    const visualizerFrequencyWidth = this.tile.querySelector('.tileVisualizerFrequencyWidth');
    visualizerFrequencyWidth.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.barWidthPercent = parseInt(visualizerFrequencyWidth.value) / 100;
    });
    const visualizerFrequencyCrop = this.tile.querySelector('.tileVisualizerFrequencyFrequencyCrop');
    visualizerFrequencyCrop.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.barCrop = parseFloat(visualizerFrequencyCrop.value) / 100;
    });
    // waveform mode options
    const visualizerWaveformScale = this.tile.querySelector('.tileVisualizerWaveformScale');
    visualizerWaveformScale.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.scale = parseFloat(visualizerWaveformScale.value);
    });
    const visualizerWaveformLineWidth = this.tile.querySelector('.tileVisualizerWaveformLineWidth');
    visualizerWaveformLineWidth.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.lineWidth = parseInt(visualizerWaveformLineWidth.value);
    });
    const visualizerFlip = this.tile.querySelector('.tileVisualizerFlip');
    // more visualizer options
    visualizerFlip.addEventListener('click', (e) => {
        if (visualizerFlip.checked) this.canvas.classList.add('flipped');
        else this.canvas.classList.remove('flipped');
    });
};
function applyDefaultTileControls(tile, data) {
    tile.tile.querySelector('.tileBackgroundColor').value = data.backgroundColor;
    tile.tile.style.backgroundColor = data.backgroundColor;
};
function applyVisualizerControls(tile, data) {
    tile.tile.querySelector('.tileVisualizerColor').value = data.visualizer.color;
    tile.tile.querySelector('.tileVisualizerMode').value = data.visualizer.mode;
    if (data.visualizer.mode < 2) {
        tile.tile.querySelector('.tileVisualizerWaveformOptions').classList.add('hidden');;
    } else {
        tile.tile.querySelector('.tileVisualizerFrequencyOptions').classList.add('hidden');;
    }
    tile.tile.querySelector('.tileVisualizerFFTSize').value = data.visualizer.fftSize;
    tile.tile.querySelector('.tileVisualizerFrequencyWidth').value = data.visualizer.barWidthPercent * 100;
    tile.tile.querySelector('.tileVisualizerFrequencyFrequencyCrop').value = data.visualizer.barCrop * 100;
    tile.tile.querySelector('.tileVisualizerWaveformScale').value = data.visualizer.scale;
    tile.tile.querySelector('.tileVisualizerWaveformLineWidth').value = data.visualizer.lineWidth;
    if (data.flipped) tile.tile.querySelector('.tileVisualizerFlip').click();
    if (data.visualizer !== null) tile.visualizer = Visualizer.fromData(data.visualizer, tile.ctx);
};

class GroupTile {
    static root = new GroupTile(false);

    parent = null;
    children = [];
    orientation = 0;
    tile = null;
    constructor(orientation = false) {
        this.orientation = orientation;
        this.tile = document.createElement('div');
        this.tile.classList.add('tileGroup');
        if (orientation) this.tile.classList.add('tileGroupVertical');
    }

    addChild(child, index = this.children.length) {
        if (!(child instanceof GroupTile) && !(child instanceof VisualizerTile) && !(child instanceof VisualizerImageTile) && !(child instanceof ImageTile) && !(child instanceof TextTile) && !(child instanceof BlankTile)) throw TypeError('GroupTile child must be a VisualizerTile, VisualizerImageTile, ImageTile, TextTile, BlankTile, or another GroupTile');
        if (typeof index != 'number' || index < 0 || index > this.children.length) throw new RangeError('GroupTile child insertion index out of range');
        // prevent duplicate children, add the tile to DOM first
        if (child.parent !== null) child.parent.removeChild(child);
        if (index === this.children.length) this.tile.appendChild(child.tile);
        else this.tile.insertBefore(child.tile, this.children[index].tile);
        this.children.splice(index, 0, child);
        child.parent = this;
        this.refresh();
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
        this.refresh();
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
        this.refresh();
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
            this.parent.replaceChild(this, this.children[0]);
            this.children = [];
            this.destroy();
        }
    }

    destroy() {
        for (const child of this.children) child.destroy();
        if (this.parent) this.parent.removeChild(this);
    }
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
        this.ctx = this.canvas.getContext('2d');
        // visualizer controls
        setVisualizerControls.call(this);
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        // How to avoid using JS to resize???
        const canvasContainer = this.tile.querySelector('.tileCanvasContainer');
        this.#resize = () => {
            const rect = canvasContainer.getBoundingClientRect();
            this.canvas.width = Math.round(rect.width);
            this.canvas.height = Math.round(rect.height);
            this.canvas.style.width = Math.round(rect.width) + 'px';
            this.canvas.style.height = Math.round(rect.height) + 'px';
        };
        window.addEventListener('resize', this.#resize);
        window.addEventListener('load', this.#resize);
    }

    #resize = () => { }
    refresh() {
        this.#resize();
    }

    getData() {
        return {
            type: 'v',
            backgroundColor: this.tile.querySelector('.tileBackgroundColor').value,
            flipped: this.canvas.classList.contains('flipped'),
            visualizer: this.visualizer !== null ? this.visualizer.getData() : null
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
        this.ctx = this.canvas.getContext('2d');
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
        imageReplace.addEventListener('change', (e) => {
            if (imageReplace.files.length > 0 && fileTypes.includes(imageReplace.files[0].type)) {
            }
        });
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
                };
                reader.readAsDataURL(imageReplace.files[0]);
            }
        });
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        // How to avoid using JS to resize???
        const canvasContainer = this.tile.querySelector('.tileCanvasContainer');
        const imageContainer = this.tile.querySelector('.tileImgContainer');
        this.#resize = () => {
            const rect = canvasContainer.getBoundingClientRect();
            this.canvas.width = Math.round(rect.width);
            this.canvas.height = Math.round(rect.height);
            this.canvas.style.width = Math.round(rect.width) + 'px';
            this.canvas.style.height = Math.round(rect.height) + 'px';
            const rect2 = imageContainer.getBoundingClientRect();
            if (rect2.width / rect2.height < this.img.width / this.img.height) {
                // width restriction
                this.img.style.width = Math.round(rect2.width) + 'px';
                this.img.style.height = 'unset';
            } else {
                // height restriction
                this.img.style.width = 'unset';
                this.img.style.height = Math.round(rect2.height) + 'px';
            }
        };
        window.addEventListener('resize', this.#resize);
        window.addEventListener('load', this.#resize);
    }

    #resize = () => { }
    refresh() {
        this.#resize();
    }

    getData() {
        return {
            type: 'vi',
            backgroundColor: this.tile.querySelector('.tileBackgroundColor').value,
            flipped: this.canvas.classList.contains('flipped'),
            visualizer: this.visualizer !== null ? this.visualizer.getData() : null,
            image: this.img.src
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
        // How to avoid using JS to resize???
        const imageContainer = this.tile.querySelector('.tileImgContainer');
        this.#resize = () => {
            const rect = imageContainer.getBoundingClientRect();
            if (rect.width / rect.height < this.img.width / this.img.height) {
                // width restriction
                this.img.style.width = Math.round(rect.width) + 'px';
                this.img.style.height = 'unset';
            } else {
                // height restriction
                this.img.style.width = 'unset';
                this.img.style.height = Math.round(rect.height) + 'px';
            }
        };
        window.addEventListener('resize', this.#resize);
        window.addEventListener('load', this.#resize);
    }

    #resize = () => { }
    refresh() {
        this.#resize();
    }

    getData() {
        return {
            type: 'i',
            backgroundColor: this.tile.querySelector('.tileBackgroundColor').value,
            image: this.img.src
        };
    }
    static fromData(data) {
        const tile = new ImageTile();
        applyDefaultTileControls(tile, data);
        if (data.image !== '') {
            tile.img.src = data.image;
            tile.tile.querySelector('.tileImgUploadCover').remove();
        }
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
    text = null;
    constructor() {
        this.tile = TextTile.#template.content.cloneNode(true).children[0];
        setDefaultTileControls.call(this);
        this.text = this.tile.querySelector('.tileText');
    }

    refresh() { }

    getData() {
        return {
            type: 't',
            backgroundColor: this.tile.querySelector('.tileBackgroundColor').value,
            text: this.text.value
        };
    }
    static fromData(data) {
        const tile = new TextTile();
        applyDefaultTileControls(tile, data);
        if (data.text !== undefined) {
            tile.text.value = data.text;
        }
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
            backgroundColor: this.tile.querySelector('.tileBackgroundColor').value
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

document.getElementById('display').appendChild(GroupTile.root.tile);

const drag = {
    container: document.getElementById('draggingContainer'),
    tile: null,
    dragX: 0,
    dragY: 0,
    hoverTile: null,
    placeholder: new BlankTile(),
    dragging: false
};
drag.placeholder.tile.style.backgroundColor = 'gray';
drag.placeholder.tile.querySelector('.tileDrag').style.display = 'none';
drag.placeholder.tile.querySelector('.tileControls').style.display = 'none';
function startDrag(e) {
    if (drag.dragging || this.parent === null || e.target.matches('.tileRemove') || e.button != 0 || (GroupTile.root.children.length == 1 && GroupTile.root.children[0] == this)) return;
    drag.tile = this;
    const rect = this.tile.querySelector('.tileDrag').getBoundingClientRect();
    drag.dragX = e.clientX - rect.left;
    drag.dragY = e.clientY - rect.top;
    const rect2 = this.tile.getBoundingClientRect();
    drag.container.style.top = e.clientY - drag.dragY + 'px';
    drag.container.style.left = e.clientX - drag.dragX + 'px';
    drag.container.style.width = rect2.width + 'px';
    drag.container.style.height = rect2.height + 'px';
    this.parent.removeChild(this);
    drag.container.appendChild(this.tile);
    drag.container.style.display = 'flex';
    document.body.style.cursor = 'grabbing';
    drag.dragging = true;
};
document.addEventListener('mousemove', (e) => {
    if (drag.dragging) {
        drag.container.style.top = e.clientY - drag.dragY + 'px';
        drag.container.style.left = e.clientX - drag.dragX + 'px';
        if (drag.hoverTile !== null) {
            // prevent infinite grouping if hovered over the placeholder
            if (drag.hoverTile !== drag.placeholder) {
                if (drag.placeholder.parent) drag.placeholder.parent.removeChild(drag.placeholder);
                const parent = drag.hoverTile.parent;
                const rect = drag.hoverTile.tile.getBoundingClientRect();
                let topDist = e.clientY - rect.top;
                let bottomDist = (rect.top + rect.height) - e.clientY;
                let leftDist = e.clientX - rect.left;
                let rightDist = (rect.left + rect.width) - e.clientX;
                let groupThreshhold = Math.min(rect.width, rect.height);
                switch (Math.min(topDist, bottomDist, leftDist, rightDist)) {
                    case topDist:
                        if (topDist > 0.2 * groupThreshhold) {
                            const group = new GroupTile(true);
                            parent.replaceChild(drag.hoverTile, group);
                            group.addChild(drag.placeholder);
                            group.addChild(drag.hoverTile);
                        } else {
                            parent.addChild(drag.placeholder, parent.getChildIndex(drag.hoverTile));
                        }
                        break;
                    case bottomDist:
                        if (bottomDist > 0.2 * groupThreshhold) {
                            const group = new GroupTile(true);
                            parent.replaceChild(drag.hoverTile, group);
                            group.addChild(drag.hoverTile);
                            group.addChild(drag.placeholder);
                        } else {
                            parent.addChild(drag.placeholder, parent.getChildIndex(drag.hoverTile) + 1);
                        }
                        break;
                    case leftDist:
                        if (leftDist > 0.2 * groupThreshhold) {
                            const group = new GroupTile(false);
                            parent.replaceChild(drag.hoverTile, group);
                            group.addChild(drag.placeholder);
                            group.addChild(drag.hoverTile);
                        } else {
                            parent.addChild(drag.placeholder, parent.getChildIndex(drag.hoverTile));
                        }
                        break;
                    case rightDist:
                        if (rightDist > 0.2 * groupThreshhold) {
                            const group = new GroupTile(false);
                            parent.replaceChild(drag.hoverTile, group);
                            group.addChild(drag.hoverTile);
                            group.addChild(drag.placeholder);
                        } else {
                            parent.addChild(drag.placeholder, parent.getChildIndex(drag.hoverTile) + 1);
                        }
                        break;
                }
            }
        } else if (drag.placeholder.parent !== null) {
            drag.placeholder.parent.removeChild(drag.placeholder);
        }
    }
});
document.addEventListener('mouseup', (e) => {
    if (drag.dragging && drag.placeholder.parent !== null) {
        drag.placeholder.parent.replaceChild(drag.placeholder, drag.tile);
        drag.container.style.display = '';
        document.body.style.cursor = '';
        drag.tile = null;
        drag.dragging = false;
    }
});

// test code
window.addEventListener('load', (e) => {
    GroupTile.root.addChild(new ImageTile());
    GroupTile.root.addChild(new ImageTile());
    let subgroup = new GroupTile(1);
    subgroup.addChild(new VisualizerImageTile())
    subgroup.addChild(new VisualizerTile())
    subgroup.addChild(new VisualizerImageTile());
    let subgroup2 = new GroupTile();
    subgroup2.addChild(new ImageTile);
    subgroup2.addChild(new ImageTile);
    subgroup.addChild(subgroup2, 1);
    GroupTile.root.addChild(subgroup, 0);
});