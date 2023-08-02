// Copyright (C) 2023 Sampleprovider(sp)

class TileGroup {
    static root = new TileGroup(null, false);

    parent = null;
    children = [];
    orientation = 0;
    tile = null;
    constructor(parent, orientation) {
        if (!(parent instanceof TileGroup) && TileGroup.root !== undefined) throw TypeError('TileGroup parent must be another TileGroup');
        this.parent = parent;
        this.orientation = orientation;
        this.tile = document.createElement('div');
        this.tile.classList.add('tileGroup');
        if (orientation) this.tile.classList.add('tileGroupVertical');
    }

    addChild(child, index = this.children.length) {
        if (!(child instanceof TileGroup) && !(child instanceof Tile)) throw TypeError('TileGroup child must be a Tile or another TileGroup');
        if (typeof index != 'number' || index < 0 || index > this.children.length) throw new RangeError('TileGroup child insertion index out of range');
        if (index == this.children.length) this.tile.appendChild(child.tile);
        else this.tile.insertBefore(child.tile, this.children[index].tile);
        this.children.splice(index, 0, child);
    }
    removeChild(child) {
        if (!this.children.includes(child)) throw Error('TileGroup remove child is not a child of the TileGroup');
        this.children.splice(this.children.indexOf(child), 1)[0].tile.remove();
        this.refresh();
    }
    removeChildIndex(index) {
        this.children.splice(index, 1)[0].tile.remove();
        this.refresh();
    }
    refresh() {
        if (this.children.length == 0 && this.parent !== null) this.destroy();
    }
    destroy() {
        if (this.parent === null) throw Error('TileGroup tree root node cannot be removed');
        for (const child of this.children) {
            child.destroy();
        }
        this.tile.remove();
        this.parent.removeChild(this);
    }
}
class Tile {
    static #list = new Set();
    static #template = document.getElementById('tileTemplate');

    parent = null;
    tile = null;
    canvas = null;
    ctx = null;
    img = null;
    visualizer = null;
    // add option to make static image/text
    constructor(parent) {
        if (!(parent instanceof TileGroup)) throw TypeError('Tile parent must be a TileGroup');
        this.parent = parent;
        this.tile = Tile.#template.content.cloneNode(true).children[0];
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
        const imageUpload = this.tile.querySelector('.tileImgUpload');
        const imageUploadLabel = this.tile.querySelector('.tileImgUploadLabelText');
        imageUpload.addEventListener('change', (e) => {
            const fileTypes = [
                'image/bmp',
                'image/jpeg',
                'image/png',
                'image/svg+xml',
                'image/webp',
            ];
            if (imageUpload.files.length > 0 && fileTypes.includes(imageUpload.files[0].type)) {
                this.img.src = URL.createObjectURL(imageUpload.files[0]);
                this.img.classList.remove('hidden');
                imageUploadLabel.innerText = 'Change Image';
            }
        });
        window.addEventListener('resize', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = Math.round(rect.width);
            this.canvas.height = Math.round(rect.height);
        });
        window.addEventListener('load', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = Math.round(rect.width);
            this.canvas.height = Math.round(rect.height);
        });
        Tile.#list.add(this);
    }

    destroy() {
        this.parent.removeChild(this);
        Tile.#list.remove(this);
    }
}
document.getElementById('display').appendChild(TileGroup.root.tile);

// test code
TileGroup.root.addChild(new Tile(TileGroup.root));
let subTileGroup = new TileGroup(TileGroup.root, 1);
subTileGroup.addChild(new Tile(subTileGroup));
subTileGroup.addChild(new Tile(subTileGroup));
TileGroup.root.addChild(subTileGroup, 0);