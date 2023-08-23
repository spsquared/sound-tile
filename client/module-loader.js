// because I don't want to convert everything else to modules
// mostly because I still don't know exactly how that changes things

import loadMP4Module, { isWebCodecsSupported } from "https://unpkg.com/mp4-wasm@1.0.6";

window.MP4 = await loadMP4Module();