// Copyright (C) 2025 Sampleprovider(sp)

let loaded = true;
window.addEventListener('load', (e) => {
    if (AudioContext == undefined) {
        document.getElementById('notsupported').style.display = 'block';
        return;
    }
    if (window.documentPictureInPicture == undefined || !window.isSecureContext) {
        document.getElementById('pipButton').disabled = true;
    }
    if (!loaded) return;
    document.getElementById('loadingCover').style.opacity = 0;
    window.addEventListener('error', (e) => {
        modal('An error occured:', `<span style="color: red;">${e.message}<br>${e.filename} ${e.lineno}:${e.colno}</span>`, false);
    });
    window.onerror = null;
    setTimeout(() => {
        document.getElementById('loadingCover').remove();
    }, 200);
});

window.onerror = (e, filename, lineno, colno, err) => {
    document.getElementById('loadingerror').innerText += `\n${err.message} (at ${filename} ${lineno}:${colno})`;
    loaded = false;
};

window.addEventListener('beforeunload', (e) => e.preventDefault());

// PWA stuff
const urlParams = new URLSearchParams(window.location.search);
const isPWA = urlParams.get('pwa') != null;
if (navigator.serviceWorker !== undefined) {
    try {
        navigator.serviceWorker.register('./serviceWorker.js', { scope: '/' });
    } catch (err) {
        console.error('Service worker installation failed:');
        console.error(err);
    }
}

// modal
const modalContainer = document.getElementById('modalContainer');
const modalBody = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const modalYes = document.getElementById('modalYes');
const modalNo = document.getElementById('modalNo');
const modalOk = document.getElementById('modalOk');
function modal(title, subtitle, confirmation = false) {
    modificationLock++;
    modalTitle.innerHTML = title;
    modalContent.innerHTML = subtitle;
    if (confirmation) {
        modalYes.style.display = '';
        modalNo.style.display = '';
        modalOk.style.display = 'none';
    } else {
        modalYes.style.display = 'none';
        modalNo.style.display = 'none';
        modalOk.style.display = '';
    }
    modalContainer.style.opacity = '1';
    modalContainer.style.pointerEvents = 'all';
    modalBody.style.transform = 'translateY(calc(50vh + 50%))';
    const hide = () => {
        modificationLock--;
        modalContainer.style.opacity = '';
        modalContainer.style.pointerEvents = '';
        modalBody.style.transform = '';
        modalYes.onclick = null;
        modalNo.onclick = null;
        modalOk.onclick = null;
    };
    return new Promise((resolve, reject) => {
        modalYes.onclick = (e) => {
            hide();
            resolve(true);
        };
        modalNo.onclick = (e) => {
            hide();
            resolve(false);
        };
        modalOk.onclick = (e) => {
            hide();
            resolve(true);
        };
        document.addEventListener('keydown', function cancel(e) {
            if (e.key == 'Escape') {
                hide();
                resolve(false);
                document.removeEventListener('keydown', cancel);
            }
        });
    });
};
let modificationLock = 0;

// copyright and stuff
function showCopyrightNotice() {
    modal('Sound Tile', '<b>Copyright &copy; 2025 Sampleprovider(sp) under GNU GPL v3.0</b><br>Source code is available on GitHub at <a href="https://github.com/spsquared/sound-tile" target="_blank" style="color: dodgerblue;">github.com/spsquared/sound-tile</a>.')
};

function superSecretScanlines() {
    document.getElementById('superSecretDiv').style.display = 'block';
};
if (urlParams.get('superSecretScanlines') != null) superSecretScanlines();