// Copyright (C) 2023 Sampleprovider(sp)

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
        if (!(child instanceof GroupTile) && !(child instanceof VisualizerImageTile) && !(child instanceof ImageTile)) throw TypeError('GroupTile child must be a VisualizerImageTile, ImageTile, or another GroupTile');
        if (typeof index != 'number' || index < 0 || index > this.children.length) throw new RangeError('GroupTile child insertion index out of range');
        if (index == this.children.length) this.tile.appendChild(child.tile);
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
        removed.tile.remove();
        this.refresh();
        return removed;
    }
    refresh() {
        for (let child of this.children) {
            child.refresh();
        }
        if (this.parent === null) return;
        if (this.children.length == 0) this.destroy();
        if (this.children.length == 1) {
            this.parent.replaceChild(this, this.children[0]);
            this.destroy();
        }
    }

    destroy() {
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
        this.canvas = this.tile.querySelector('.tileCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.img = this.tile.querySelector('.tileImg');
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
            }
        });
        const imageUpload = this.tile.querySelector('.tileImgUpload');
        const imageUploadLabel = this.tile.querySelector('.tileImgUploadLabelText');
        const fileTypes = [
            'image/bmp',
            'image/jpeg',
            'image/png',
            'image/svg+xml',
            'image/webp',
        ];
        imageUpload.addEventListener('change', (e) => {
            if (imageUpload.files.length > 0 && fileTypes.includes(imageUpload.files[0].type)) {
                this.img.src = URL.createObjectURL(imageUpload.files[0]);
                this.img.classList.remove('hidden');
                imageUploadLabel.innerText = 'Change Image';
                this.img.onload = (e) => this.#resize();
            }
        });
        this.tile.querySelector('.tileRemove').onclick = (e) => this.destroy();
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

    #resize = () => {}

    refresh() {
        this.#resize();
    }

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
        this.img = this.tile.querySelector('.tileImg');
        const imageUpload = this.tile.querySelector('.tileImgUpload');
        const imageUpload2 = this.tile.querySelector('.tileSourceUpload');
        const fileTypes = [
            'image/bmp',
            'image/jpeg',
            'image/png',
            'image/svg+xml',
            'image/webp',
        ];
        imageUpload.addEventListener('change', (e) => {
            if (imageUpload.files.length > 0 && fileTypes.includes(imageUpload.files[0].type)) {
                this.img.src = URL.createObjectURL(imageUpload.files[0]);
                this.img.onload = (e) => this.#resize();
            }
        });
        imageUpload2.addEventListener('change', (e) => {
            if (imageUpload2.files.length > 0 && fileTypes.includes(imageUpload2.files[0].type)) {
                this.img.src = URL.createObjectURL(imageUpload2.files[0]);
                this.tile.querySelector('.tileSourceUploadCover').remove();
                this.img.onload = (e) => this.#resize();
            }
        });
        this.tile.querySelector('.tileRemove').onclick = (e) => this.destroy();
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

    #resize = () => {}

    refresh() {
        this.#resize();
    }

    destroy() {
        if (this.parent) this.parent.removeChild(this);
    }
}
// text tile

document.getElementById('display').appendChild(GroupTile.root.tile);

// test code
// GroupTile.root.addChild(new VisualizerImageTile());
// let subTileGroup = new GroupTile(1);
// subTileGroup.addChild(new VisualizerImageTile());
// subTileGroup.addChild(new ImageTile());
// GroupTile.root.addChild(subTileGroup, 0);
GroupTile.root.addChild(new ImageTile());
GroupTile.root.addChild(new ImageTile());
let subgroup = new GroupTile(1);
subgroup.addChild(new VisualizerImageTile())
subgroup.addChild(new VisualizerImageTile())
subgroup.addChild(new VisualizerImageTile());
let subgroup2 = new GroupTile();
subgroup2.addChild(new ImageTile);
subgroup2.addChild(new ImageTile);
subgroup.addChild(subgroup2, 1);
GroupTile.root.addChild(subgroup, 0);