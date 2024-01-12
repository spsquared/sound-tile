// Copyright (C) 2024 Sampleprovider(sp)

class ColorInput {
    static #template = document.getElementById('colorInputTemplate');
    static #container = document.getElementById('colorInputMasterContainer');

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
        for (let curr = container; curr != null && !curr.classList.contains('tileControls'); curr = curr.parentElement, this.#controlsParent = curr); // I hate this
        // opening/closing
        this.#badge.onclick = (e) => {
            this.#popup.classList.toggle('colorInputContainerHidden');
            if (!this.#popup.classList.contains('colorInputContainerHidden')) {
                const rect = this.#badge.getBoundingClientRect();
                if (rect.top < 242) this.#popup.style.bottom = (window.innerHeight - rect.bottom - 242) + 'px';
                else this.#popup.style.bottom = (window.innerHeight - rect.top - 2) + 'px';
                this.#popup.style.left = Math.min(window.innerWidth - 244, rect.left) + 'px';
                if (this.#controlsParent != null) this.#controlsParent.classList.add('tileControlsNoHide');
            } else {
                if (this.#controlsParent != null) this.#controlsParent.classList.remove('tileControlsNoHide');
            }
        };
        let hideOnClickOff = (e) => {
            if (!document.body.contains(container)) {
                this.#popup.remove();
                document.removeEventListener('mousedown', hideOnClickOff);
            }
            if (!this.#popup.contains(e.target) && e.target != this.#badge && !this.#popup.classList.contains('colorInputContainerHidden')) {
                this.#popup.classList.add('colorInputContainerHidden');
                if (this.#controlsParent != null && (!e.target.matches('.colorInputBadge') || !this.#controlsParent.contains(e.target))) this.#controlsParent.classList.remove('tileControlsNoHide');
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
            this.#oninput();
            this.#refreshBadge();
        });
        const color = document.createElement('input');
        color.classList.add('colorInputGradientStopColor');
        color.type = 'color';
        color.value = '#ffffff';
        color.addEventListener('input', (e) => {
            this.#oninput();
            this.#refreshBadge();
        });
        const remove = document.createElement('input');
        remove.classList.add('colorInputGradientStopRemove');
        remove.type = 'button';
        remove.value = 'X';
        remove.onclick = (e) => {
            if (this.#inputs.gradient.stops.length > 1) {
                item.remove();
                this.#inputs.gradient.stops.splice(this.#inputs.gradient.stops.indexOf(item), 1);
                this.#oninput();
                this.#refreshBadge();
            }
        };
        item.appendChild(offset);
        item.appendChild(color);
        item.appendChild(remove);
        this.#inputs.gradient.stops.push([offset, color]);
        this.#stopsContainer.appendChild(item);
        return this.#inputs.gradient.stops.at(-1);
    }
    #refreshBadge() {
        if (this.#state.mode == 0) {
            this.#badge.style.background = this.#inputs.solid.input.value;
        } else if (this.#state.mode == 1) {
            switch (Number(this.#inputs.gradient.pattern.value)) {
                case 0:
                    this.#badge.style.background = `linear-gradient(${180 - Number(this.#inputs.gradient.angle.value)}deg${this.#inputs.gradient.stops.reduce((acc, curr) => acc + `, ${curr[1].value} ${curr[0].value}%`, '')})`;
                    break;
                case 1:
                    this.#badge.style.background = `radial-gradient(circle ${Number(this.#inputs.gradient.r.value) * 0.2}px at ${this.#inputs.gradient.x.value}% ${this.#inputs.gradient.y.value}%${this.#inputs.gradient.stops.reduce((acc, curr) => acc + `, ${curr[1].value} ${curr[0].value}%`, '')})`;
                    break;
                case 2:
                    this.#badge.style.background = `conic-gradient(from ${90 - Number(this.#inputs.gradient.angle.value)}deg at ${this.#inputs.gradient.x.value}% ${this.#inputs.gradient.y.value}%${this.#inputs.gradient.stops.reduce((acc, curr) => acc + `, ${curr[1].value} ${curr[0].value}%`, '')})`;
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
                    stops: this.#inputs.gradient.stops.map(inputs => [Number(inputs[0].value) / 100, inputs[1].value])
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
                this.#oninput();
                this.#refreshBadge();
                break;
        }
    }
}

// helpers for setup
const visualizerOptionsTemplate = document.getElementById('visualizerOptionsTemplate');
function setDefaultTileControls() {
    const backgroundColorSelect = this.tile.querySelector('.tileBackgroundColor');
    backgroundColorSelect.addEventListener('input', (e) => this.tile.style.backgroundColor = backgroundColorSelect.value);
    this.tile.querySelector('.tileDrag').addEventListener('mousedown', (e) => startDrag.call(this, e));
    this.tile.querySelector('.tileRemove').addEventListener('click', (e) => { if (allowModification && (GroupTile.root.children.length > 1 || GroupTile.root.children[0] != this)) this.destroy() });
    const flexGrowInput = this.tile.querySelector('.tileFlex');
    flexGrowInput.addEventListener('input', (e) => {
        this.tile.style.flexGrow = Number(flexGrowInput.value);
        if (this.parent !== null) this.parent.refresh();
    });
};
function setVisualizerControls() {
    this.tile.querySelector('.tileVisualizerControls').appendChild(visualizerOptionsTemplate.content.cloneNode(true).children[0]);
    // audio controls
    const audioUpload = this.tile.querySelector('.tileSourceUpload');
    audioUpload.addEventListener('change', async (e) => {
        if (audioUpload.files.length > 0 && audioUpload.files[0].type.startsWith('audio/')) {
            this.visualizer = new Visualizer(await audioUpload.files[0].arrayBuffer(), this.canvas, () => this.refresh());
            this.tile.querySelector('.tileSourceUploadCover').remove();
            this.visualizer.loadPromise.then(() => visualizerFrequencyCropDisplay.innerText = this.visualizer.sampleRate / 2 * (Number(visualizerFrequencyCrop.value) / 100));
        }
    });
    const audioReplace = this.tile.querySelector('.tileAudioReplace');
    audioReplace.addEventListener('change', async (e) => {
        if (audioReplace.files.length > 0 && audioReplace.files[0].type.startsWith('audio/')) {
            this.visualizer.destroy();
            this.visualizer = new Visualizer(await audioReplace.files[0].arrayBuffer(), this.canvas, () => this.refresh());
            this.visualizer.mode = Number(visualizerMode.value);
            this.visualizer.fftSize = Number(visualizerFFTSize.value);
            this.visualizer.barWidthPercent = Number(visualizerWidth.value) / 100;
            this.visualizer.barCrop = Number(visualizerFrequencyCrop.value) / 100;
            this.visualizer.barScale = Number(visualizerVolumeCrop.value) / 100;
            this.visualizer.symmetry = Number(visualizerSymmetry.value);
            this.visualizer.scale = Number(visualizerWaveformScale.value);
            this.visualizer.lineWidth = Number(visualizerLineWidth.value);
            this.visualizer.flippedX = visualizerFlip.checked;
            this.visualizer.flippedY = visualizerFlip2.checked;
            this.visualizer.rotated = visualizerRotate.checked;
            this.visualizer.color = colorSelect.value;
            this.visualizer.volume = Number(volumeInput.value) / 100;
            audioReplace.value = '';
        }
    });
    // volume controls
    const volumeInput = this.tile.querySelector('.tileVisualizerVolumeInput');
    const volumeThumb = this.tile.querySelector('.tileVisualizerVolumeThumb');
    volumeInput.oninput = (e) => {
        if (this.visualizer !== null) this.visualizer.volume = Number(volumeInput.value) / 100;
        volumeThumb.style.setProperty('--volume', Number(volumeInput.value) / 120);
        volumeInput.title = volumeInput.value + '%';
    };
    volumeInput.addEventListener('wheel', (e) => {
        volumeInput.value = Number(volumeInput.value) - Math.round(e.deltaY / 20);
        volumeInput.oninput();
    }, { passive: true });
    // visualizer options
    this.colorSelect1 = new ColorInput(this.tile.querySelector('.tileVisualizerColor1'));
    this.colorSelect2 = new ColorInput(this.tile.querySelector('.tileVisualizerColor2'));
    this.colorSelect1.oninput = (e) => {
        if (this.visualizer !== null) this.visualizer.color = this.colorSelect1.value;
    };
    this.colorSelect2.oninput = (e) => {
        if (this.visualizer !== null) this.visualizer.color2 = this.colorSelect2.value;
    };
    const visualizerMode = this.tile.querySelector('.tileVisualizerMode');
    const visualizerBarOptions = this.tile.querySelector('.tileVisualizerBarOptions');
    const visualizerLineOptions = this.tile.querySelector('.tileVisualizerLineOptions');
    const visualizerFrequencyOptions = this.tile.querySelector('.tileVisualizerFrequencyOptions');
    const visualizerWaveformOptions = this.tile.querySelector('.tileVisualizerWaveformOptions');
    visualizerMode.addEventListener('input', (e) => {
        let mode = Number(visualizerMode.value);
        if (this.visualizer !== null) this.visualizer.mode = mode;
        if (mode <= 3 || mode == 5 || mode == 7) {
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
        if (this.visualizer !== null) this.visualizer.fftSize = Number(visualizerFFTSize.value);
    });
    // bar options
    const visualizerWidth = this.tile.querySelector('.tileVisualizerBarWidth');
    visualizerWidth.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.barWidthPercent = Number(visualizerWidth.value) / 100;
    });
    // line options
    const visualizerLineWidth = this.tile.querySelector('.tileVisualizerLineWidth');
    visualizerLineWidth.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.lineWidth = Number(visualizerLineWidth.value);
    });
    // frequency mode options
    const visualizerFrequencyCrop = this.tile.querySelector('.tileVisualizerFrequencyFrequencyCrop');
    const visualizerFrequencyCropDisplay = this.tile.querySelector('.tileVisualizerFrequencyFrequencyCropDisplay');
    visualizerFrequencyCrop.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.barCrop = Number(visualizerFrequencyCrop.value) / 100;
        visualizerFrequencyCropDisplay.innerText = this.visualizer.sampleRate / 2 * this.visualizer.barCrop;
    });
    const visualizerVolumeCrop = this.tile.querySelector('.tileVisualizerFrequencyVolumeCrop');
    visualizerVolumeCrop.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.barScale = Number(visualizerVolumeCrop.value) / 100;
    });
    const visualizerSymmetry = this.tile.querySelector('.tileVisualizerFrequencySymmetry');
    visualizerSymmetry.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.symmetry = Number(visualizerSymmetry.value);
    });
    const visualizerSmoothing = this.tile.querySelector('.tileVisualizerFrequencySmoothing');
    visualizerSmoothing.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.smoothingTimeConstant = Number(visualizerSmoothing.value);
    });
    // waveform mode options
    const visualizerWaveformScale = this.tile.querySelector('.tileVisualizerWaveformScale');
    visualizerWaveformScale.addEventListener('input', (e) => {
        if (this.visualizer !== null) this.visualizer.scale = Number(visualizerWaveformScale.value);
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
    if (typeof data.visualizer.color == 'string') {
        tile.colorSelect1.value = {
            mode: 0,
            value: data.visualizer.color
        };
        tile.colorSelect2.value = {
            mode: 0,
            value: data.visualizer.color
        };
    } else {
        tile.colorSelect1.value = data.visualizer.color;
        tile.colorSelect2.value = data.visualizer.color2;
    }
    tile.tile.querySelector('.tileVisualizerMode').value = data.visualizer.mode;
    if (data.visualizer.mode <= 3 || data.visualizer.mode == 5 || data.visualizer.mode == 7) {
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
    tile.tile.querySelector('.tileVisualizerFrequencySymmetry').value = data.visualizer.symmetry ?? 0;
    tile.tile.querySelector('.tileVisualizerWaveformScale').value = data.visualizer.scale;
    tile.tile.querySelector('.tileVisualizerLineWidth').value = data.visualizer.lineWidth;
    tile.tile.querySelector('.tileVisualizerVolumeInput').value = (data.visualizer.volume ?? 1) * 100;
    tile.tile.querySelector('.tileVisualizerVolumeInput').oninput();
    if (data.visualizer.flippedX) tile.tile.querySelector('.tileVisualizerFlip').click();
    if (data.visualizer.flippedY) tile.tile.querySelector('.tileVisualizerFlip2').click();
    if (data.visualizer.rotated) tile.tile.querySelector('.tileVisualizerRotate').click();
    tile.visualizer = Visualizer.fromData(data.visualizer, tile.canvas);
    tile.visualizer.loadPromise.then(() => tile.tile.querySelector('.tileVisualizerFrequencyFrequencyCropDisplay').innerText = tile.visualizer.sampleRate / 2 * (Number(tile.tile.querySelector('.tileVisualizerFrequencyFrequencyCrop').value) / 100));
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
        flexGrow: null,
        vertical: null
    };
    constructor(orientation = false) {
        this.tile = GroupTile.#template.content.cloneNode(true).children[0];
        this.childBox = this.tile.querySelector('.tileGroupChildren');
        this.orientation = orientation;
        if (orientation) this.childBox.classList.add('tileGroupVertical');
        this.controls.dragBar = this.tile.querySelector('.tileDrag');
        this.tile.querySelector('.tileDrag').addEventListener('mousedown', (e) => startDrag.call(this, e));
        this.tile.querySelector('.tileRemove').addEventListener('click', (e) => { if (allowModification && GroupTile.root != this && (GroupTile.root.children.length > 1 || GroupTile.root.children[0] != this)) this.destroy() });
        this.controls.controls = this.tile.querySelector('.tileControls');
        this.controls.flexGrow = this.tile.querySelector('.tileFlex');
        this.controls.flexGrow.addEventListener('input', (e) => {
            this.tile.style.flexGrow = Number(this.controls.flexGrow.value);
            if (this.parent !== null) this.parent.refresh();
        });
        this.controls.vertical = this.tile.querySelector('.tileGroupVertical');
        this.controls.vertical.onclick = (e) => {
            this.orientation = this.controls.vertical.checked;
            if (this.orientation) this.childBox.classList.add('tileGroupVertical');
            else this.childBox.classList.remove('tileGroupVertical');
            if (this.parent !== null) this.parent.refresh();
        };
        this.controls.vertical.checked = this.orientation;
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
    }
    destroy() {
        for (const child of this.children) child.destroy();
        if (this.parent) this.parent.removeChild(this);
    }

    static set treeMode(tmode) {
        if (tmode == this.#treeMode) return;
        this.#treeMode = tmode;
        if (this.#treeMode) display.classList.add('treeModeDisplay');
        else display.classList.remove('treeModeDisplay');
        setTimeout(() => GroupTile.root.refresh(), 0);
    }
    static get treeMode() { return this.#treeMode; }
}
class VisualizerTile {
    static #template = document.getElementById('visualizerTileTemplate');

    parent = null;
    tile = null;
    colorSelect1 = null;
    colorSelect2 = null;
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
    colorSelect1 = null;
    colorSelect2 = null;
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
    colorSelect1 = null;
    colorSelect2 = null;
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
            this.ctx2.textAlign = Number(textAlign.value) == 1 ? 'right' : (Number(textAlign.value) == 0.5 ? 'center' : 'left');
            this.ctx2.textBaseline = 'middle';
            this.ctx2.fillStyle = textColor.value;
            let size = Number(fontSize.value) + 2;
            let x = this.canvas2.width * Number(textAlign.value);
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
            let textHeight = this.text.split('\n').length * (Number(fontSize.value) + 2) + 4;
            const rect = canvasContainer.getBoundingClientRect();
            let scale = window.devicePixelRatio ?? 1;
            if (this.visualizer !== null) this.visualizer.resize(Math.round(rect.width * scale), Math.round((rect.height - textHeight - 4) * scale));
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = (rect.height - textHeight - 4) + 'px';
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
    colorSelect = null;
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
                this.visualizer.channelCount = Number(channelPeakChannels.value);
                this.visualizer.barWidthPercent = Number(channelPeakBarWidth.value) / 100;
                this.visualizer.smoothing = Number(channelPeakSmoothing.value);
                this.visualizer.color = colorSelect.value;
                this.visualizer.volume = Number(volumeInput.value) / 100;
                audioReplace.value = '';
            }
        });
        // volume controls
        const volumeInput = this.tile.querySelector('.tileVisualizerVolumeInput');
        const volumeThumb = this.tile.querySelector('.tileVisualizerVolumeThumb');
        volumeInput.oninput = (e) => {
            if (this.visualizer !== null) this.visualizer.volume = Number(volumeInput.value) / 100;
            volumeThumb.style.setProperty('--volume', Number(volumeInput.value) / 120);
            volumeInput.title = volumeInput.value + '%';
        };
        volumeInput.addEventListener('wheel', (e) => {
            volumeInput.value = Number(volumeInput.value) - Math.round(e.deltaY / 20);
            volumeInput.oninput();
        }, { passive: true });
        // visualizer options
        this.colorSelect = new ColorInput(this.tile.querySelector('.tileVisualizerColor'));
        this.colorSelect.oninput = (e) => {
            if (this.visualizer !== null) this.visualizer.color = this.colorSelect.value;
        };
        const channelPeakVolumeCrop = this.tile.querySelector('.tileChannelPeakVolumeCrop');
        channelPeakVolumeCrop.addEventListener('input', (e) => {
            if (this.visualizer !== null) this.visualizer.barScale = Number(channelPeakVolumeCrop.value) / 100;
        });
        // actual options that arent copied from somewhere else
        const channelPeakChannels = this.tile.querySelector('.tileChannelPeakChannels');
        channelPeakChannels.addEventListener('input', (e) => {
            if (this.visualizer !== null) this.visualizer.channelCount = Number(channelPeakChannels.value);
        });
        // bar options
        const channelPeakBarWidth = this.tile.querySelector('.tileChannelPeakBarWidth');
        channelPeakBarWidth.addEventListener('input', (e) => {
            if (this.visualizer !== null) this.visualizer.barWidthPercent = Number(channelPeakBarWidth.value) / 100;
        });
        const channelPeakSmoothing = this.tile.querySelector('.tileChannelPeakSmoothing');
        channelPeakSmoothing.addEventListener('input', (e) => {
            if (this.visualizer !== null) this.visualizer.smoothing = Number(channelPeakSmoothing.value);
        });
        const channelPeakMute = this.tile.querySelector('.tileChannelPeakMute');
        channelPeakMute.addEventListener('input', (e) => {
            if (this.visualizer !== null) this.visualizer.muteOutput = channelPeakMute.checked;
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
            tile.tile.querySelector('.tileChannelPeakVolumeCrop').value = (data.visualizer.barScale ?? 1) * 100;
            if (typeof data.visualizer.color == 'string') tile.colorSelect.value = {
                mode: 0,
                value: data.visualizer.color
            };
            else tile.colorSelect.value = data.visualizer.color;
            tile.tile.querySelector('.tileVisualizerVolumeInput').value = (data.visualizer.volume ?? 1) * 100;
            tile.tile.querySelector('.tileVisualizerVolumeInput').oninput();
            tile.tile.querySelector('.tileChannelPeakMute').checked = data.visualizer.muteOutput ?? false;
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
            this.ctx.textAlign = Number(textAlign.value) == 1 ? 'right' : (Number(textAlign.value) == 0.5 ? 'center' : 'left');
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = textColor.value;
            let size = Number(fontSize.value) + 2;
            let x = this.canvas.width * Number(textAlign.value);
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
        if (GroupTile.treeMode) {
            if (e.clientX < window.innerWidth * 0.01) {
                display.scrollBy(-8, 0);
            } else if (e.clientX > window.innerWidth * 0.99) {
                display.scrollBy(8, 0);
            }
            if (e.clientY < window.innerHeight * 0.01) {
                display.scrollBy(0, -8);
            } else if (e.clientY > window.innerHeight * 0.99) {
                display.scrollBy(0, 8);
            }
        }
        drag.container.style.top = e.clientY - drag.dragY + 'px';
        drag.container.style.left = e.clientX - drag.dragX + 'px';
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
            const ddiv = document.createElement('div');
            ddiv.classList.add('pTileDrop');
            ddiv.style.flexGrow = drag.tile.tile.style.flexGrow;
            if (drag.tile instanceof GroupTile) {
                ddiv.classList.add('pGroupTile');
                if (drag.tile.orientation) ddiv.classList.add('pGroupTileVertical');
                let dfs = (group, div) => {
                    for (const child of group.children) {
                        const tdiv = document.createElement('div');
                        if (child.children !== undefined) tdiv.classList.add('pGroupTile');
                        else tdiv.classList.add('pTile');
                        tdiv.style.flexGrow = child.tile.style.flexGrow;
                        if (child.children !== undefined) {
                            if (child.orientation) tdiv.classList.add('pGroupTileVertical');
                            dfs(child, tdiv);
                        }
                        div.appendChild(tdiv);
                    }
                };
                dfs(drag.tile, ddiv);
            } else ddiv.classList.add('pTile');
            let dfs = (group, div) => {
                for (let i in group.children) {
                    const child = group.children[i];
                    const tdiv = document.createElement('div');
                    if (child.children !== undefined) tdiv.classList.add('pGroupTile');
                    else tdiv.classList.add('pTile');
                    tdiv.style.flexGrow = child.tile.style.flexGrow;
                    if (group === drag.drop.tile && !drag.drop.createGroup && i == drag.drop.index) {
                        div.appendChild(ddiv);
                    }
                    if (child.children !== undefined) {
                        if (child.orientation) tdiv.classList.add('pGroupTileVertical');
                        dfs(child, tdiv);
                    }
                    if (drag.drop.createGroup && child === drag.drop.tile) {
                        const gdiv = document.createElement('div');
                        gdiv.classList.add('pGroupTile');
                        if (drag.drop.groupOrientation) gdiv.classList.add('pGroupTileVertical');
                        if (drag.drop.index == 1) gdiv.appendChild(tdiv);
                        if (drag.drop.index == 1) gdiv.appendChild(tdiv);
                        gdiv.appendChild(ddiv);
                        if (drag.drop.index == 0) gdiv.appendChild(tdiv);
                        div.appendChild(gdiv);
                    } else div.appendChild(tdiv);
                }
                if (group == drag.drop.tile && !drag.drop.createGroup && drag.drop.index == group.children.length) {
                    div.appendChild(ddiv);
                }
            };
            drag.layoutPreview.innerHTML = '';
            drag.layoutPreview.style.opacity = '1';
            dfs(GroupTile.root, drag.layoutPreview);
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
                    if (parent != null && parent != GroupTile.root && parent.orientation == 1 && relY < halfBoxHeight * 0.5) {
                        setLayout(currTile, parent.getChildIndex(currTile), false);
                    } else {
                        setLayout(currTile, 0, true, 1);
                    }
                } else if (relY > rect.height - halfBoxHeight && relX > halfWidth - halfBoxWidth && relX < halfWidth + halfBoxWidth) {
                    if (parent != null && parent != GroupTile.root && parent.orientation == 1 && relY > rect.height - halfBoxHeight * 0.5) {
                        setLayout(currTile, parent.getChildIndex(currTile) + 1, false);
                    } else {
                        setLayout(currTile, 1, true, 1);
                    }
                } else if (relX < halfBoxWidth && relY > halfHeight - halfBoxHeight && relY < halfHeight + halfBoxHeight) {
                    if (parent != null && parent != GroupTile.root && parent.orientation == 0 && relX < halfBoxWidth * 0.5) {
                        setLayout(currTile, parent.getChildIndex(currTile), false);
                    } else {
                        setLayout(currTile, 0, true, 0);
                    }
                } else if (relX > rect.width - halfBoxWidth && relY > halfHeight - halfBoxHeight && relY < halfHeight + halfBoxHeight) {
                    if (parent != null && parent != GroupTile.root && parent.orientation == 0 && relX > rect.width - halfBoxWidth * 0.5) {
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
}, { passive: true });
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