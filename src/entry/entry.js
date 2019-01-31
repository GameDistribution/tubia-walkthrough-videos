// Grab an existing namespace object, or create a blank object
// if it doesn't exist.
const Tubia = window.Tubia || {};

// Stick on the modules that need to be exported.
// You only need to require the top-level modules, browserify
// will walk the dependency graph and load everything correctly.
Tubia.Player = require('./tubia');

// Replace/Create the global namespace.
window.Tubia = Tubia;

// Default publisher implementation will give us a global object containing
// options as TUBIA_OPTIONS or for legacy gdPlayer. Here we check if either
// of these globals are set. If so, then we instantiate the Tubia.Player
// instance using these options. Otherwise we need to wait for a manual
// instantiation of the instance.
/* eslint-disable */
const settings = (typeof window.TUBIA_OPTIONS === 'object' &&
    window.TUBIA_OPTIONS)
    ? window.TUBIA_OPTIONS
    : (window.gdPlayer &&
        window.gdPlayer.q &&
        window.gdPlayer.q.length > 0 &&
        window.gdPlayer.q[0].length > 0 &&
        typeof window.gdPlayer.q[0][0] === 'object' &&
        window.gdPlayer.q[0][0])
        ? window.gdPlayer.q[0][0]
        : {};
if (Object.keys(settings).length !== 0) {
    new Tubia.Player.default(settings);
}
/* eslint-enable */
