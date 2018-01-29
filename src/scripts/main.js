import Tubia from './tubia';

/* eslint-disable */
const settings = (typeof TUBIA_OPTIONS === 'object' && TUBIA_OPTIONS)
    ? TUBIA_OPTIONS
    : (window.gdPlayer && typeof window.gdPlayer.q[0][0] === 'object' &&
        window.gdPlayer.q[0][0])
        ? window.gdPlayer.q[0][0]
        : {};
/* eslint-enable */

window.tubia = new Tubia(settings);

// Bind new namespace to our old one.
window.gdPlayer = window.tubia;