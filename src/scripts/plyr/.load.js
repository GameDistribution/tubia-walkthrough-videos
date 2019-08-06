const loadJs = document.querySelectorAll('[load-main-js]')[0];
const js = document.createElement('script');
const debug = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') || location.ancestorOrigins[0].replace(/^(?:https?:\/\/)?/i, '').split('/')[0].split('.')[0] === 'test';
const fileExtension = debug ? '.js' : '.min.js';

js.src = `./libs/gd/main${fileExtension}`;
js.async= 'true';
loadJs.parentNode.insertBefore(js, loadJs);