// ==========================================================================
// Load main script
// ==========================================================================

const locationAncestorOrigin = (location.ancestorOrigins.length > 0) ? location.ancestorOrigins[0].replace(/^(?:https?:\/\/)?/i, '').split('/')[0].split('.')[0] === 'test' : false;
const debug = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') || locationAncestorOrigin;

const fileExtension = debug ? '.js' : '.min.js';


const js = document.createElement('script');

js.src = `./libs/gd/main${fileExtension}`
js.async = true;
js.defer = true;

const loader = document.getElementById('loader');
loader.parentNode.insertBefore(js, loader);

