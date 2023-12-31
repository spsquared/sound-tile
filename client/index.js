// Copyright (C) 2024 Sampleprovider(sp)

let loaded = true;
window.addEventListener('load', (e) => {
    if (typeof AudioContext != 'function') {
        document.getElementById('notsupported').style.display = 'block';
        return;
    }
    if (!loaded) return;
    document.getElementById('loadingCover').style.opacity = 0;
    setTimeout(() => {
        window.onerror = null;
        document.getElementById('loadingCover').remove();
    }, 200);
});

window.onerror = (e) => {
    document.getElementById('loadingerror').innerText += '\n' + e;
    loaded = false;
};

const display = document.getElementById('display');
let allowModification = true;

function superSecretScanlines() {
    document.getElementById('superSecretDiv').style.display = 'block';
};
if (new URLSearchParams(window.location.search).get('superSecretScanlines')) superSecretScanlines();