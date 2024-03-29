// Copyright (C) 2024 Sampleprovider(sp)

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

function superSecretScanlines() {
    document.getElementById('superSecretDiv').style.display = 'block';
};
if (urlParams.get('superSecretScanlines')) superSecretScanlines();