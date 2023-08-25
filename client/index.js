// Copyright (C) 2023 Sampleprovider(sp)

window.addEventListener('load', (e) => {
    if (typeof AudioContext != 'function') {
        document.getElementById('notsupported').style.display = 'block';
        return;
    }
    document.getElementById('loadingCover').style.opacity = 0;
    setTimeout(() => {
        document.getElementById('loadingCover').remove();
    }, 200);
});

const display = document.getElementById('display');
let allowModification = true;

// welcome to Sound Tile, isdfsdffds how to use