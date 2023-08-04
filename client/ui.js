// Copyright (C) 2023 Sampleprovider(sp)

const timeSeek = document.getElementById('seeker');
const playButton = document.getElementById('playButton');
const mediaControls = {
    startTime: 0,
    duration: 0,
    currentTime: 0,
    playing: false
};

Visualizer.onUpdate = () => {
    mediaControls.duration = Visualizer.duration;
    timeSeek.max = mediaControls.duration;
    if (mediaControls.playing) Visualizer.startAll(mediaControls.currentTime);
};
setInterval(() => {
    let now = Date.now();
    if (mediaControls.playing) {
        mediaControls.currentTime = (now - mediaControls.startTime) / 1000;
        timeSeek.value = mediaControls.currentTime;
    } else {
        mediaControls.startTime = now - (mediaControls.currentTime * 1000);
    }
    if (mediaControls.currentTime >= mediaControls.duration && mediaControls.playing) {
        mediaControls.playing = false;
        playButton.checked = false;
    }
}, 20);

timeSeek.oninput = (e) => {
    mediaControls.currentTime = parseInt(timeSeek.value);
    mediaControls.startTime = Date.now() - (mediaControls.currentTime * 1000);
    if (mediaControls.playing) Visualizer.startAll(mediaControls.currentTime);
};
playButton.onclick = (e) => {
    mediaControls.playing = playButton.checked;
    if (mediaControls.playing) Visualizer.startAll(mediaControls.currentTime);
    else Visualizer.stopAll();
};