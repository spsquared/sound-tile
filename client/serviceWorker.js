// Copyright (C) 2024 Sampleprovider(sp)

self.addEventListener('install', (e) => {
    e.waitUntil(new Promise(async (resolve, reject) => {
        self.skipWaiting();
        const cache = await caches.open('page');
        await cache.addAll([
            '/',
            './manifest.json',
            './index.html',
            './style.css',
            './assets/SourceCodePro.ttf',
            './msgpack.min.js',
            './fflate.min.js',
            './index.js',
            './tile.js',
            './sound.js',
            './visualizerWorker.js',
            // './export.js',
            './controls.js',
            './assets/logo.png',
            './assets/favicon.png',
            './assets/icon-0.png',
            './assets/icon-1.png',
            './assets/arrow-up.svg',
            './assets/arrow-up-dark.svg',
            './assets/arrow-down.svg',
            './assets/arrow-down-dark.svg',
            './assets/arrow-left.svg',
            './assets/arrow-left-dark.svg',
            './assets/arrow-right.svg',
            './assets/arrow-right-dark.svg',
            './assets/upload.svg',
            './assets/download.svg',
            './assets/default-cover.png',
            './assets/volume.svg',
            './assets/play.svg',
            './assets/pause.svg',
            './assets/shuffle.svg',
            './assets/loop.svg',
            './assets/picture-in-picture.svg',
            './assets/picture-in-picture-exit.svg',
            './assets/tilemode.png',
            './assets/treemode.png',
            './assets/visualizer-tile.png',
            './assets/channelpeak-tile.png',
            './assets/text-tile.png',
            './assets/image-tile.png',
            './assets/visualizer-text-tile.png',
            './assets/visualizer-image-tile.png',
            './assets/blank-tile.png',
            './assets/copy.svg',
            './assets/paste.svg',
            './assets/delete.svg',
            './assets/noise.png'
        ]);
        resolve();
    }));
});
self.addEventListener("activate", (e) => {
    let activate = async () => {
        await Promise.all((await caches.keys()).filter((key) => key != 'page').map((key) => caches.delete(key)));
        await self.clients.claim();
        await self.registration.navigationPreload?.enable();
    }
    e.waitUntil(activate());
});
let getCached = async (request, preloadResponse) => {
    try {
        const cache = await caches.open('page');
        try {
            const preloaded = await preloadResponse;
            if (preloaded !== undefined) {
                cache.put(request.url, preloaded.clone());
                return preloaded;
            }
        } finally {
            try {
                const networked = await fetch(request);
                cache.put(request.url, networked.clone());
                return networked;
            } finally {
                const cached = await cache.match(request);
                if (cached !== undefined) {
                    return cached;
                }
                return new Response('not cached; timed out', {
                    status: 408,
                    headers: { "Content-Type": "text/plain" },
                });
            }
        }
    } catch (err) {
        return new Response('cache error', {
            status: 502,
            headers: { "Content-Type": "text/plain" },
        });
    }
};
self.addEventListener("fetch", (e) => {
    e.respondWith(getCached(e.request, e.preloadResponse));
});