// Copyright (C) 2023 Sampleprovider(sp)

// (please credit me if you use this tool)

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

    removeChild(index) {
        this.children.splice(index, 1)[0].remove();
    }
}
class Tile {
    static #list = new Set();
    static #template = document.getElementById('tileTemplate');

    parent = null;
    tile = null;
    canvas = null;
    ctx = null;
    // add option to make static image/text
    constructor(parent) {
        if (!(parent instanceof TileGroup)) throw TypeError('Tile parent must be a TileGroup');
        this.parent = parent;
        this.tile = Tile.#template.content.cloneNode(true).children[0];
        this.canvas = this.tile.children[0];
        this.ctx = this.canvas.getContext('2d');
        Tile.#list.add(this);
    }
    remove() {
        Tile.#list.remove(this);
        if (this.tile != null) this.tile.remove();
    }
}
document.getElementById('display').appendChild(TileGroup.root.tile);

// test code
TileGroup.root.addChild(new Tile(TileGroup.root));
let subTileGroup = new TileGroup(TileGroup.root, 1);
subTileGroup.addChild(new Tile(subTileGroup));
subTileGroup.addChild(new Tile(subTileGroup));
TileGroup.root.addChild(subTileGroup, 0);