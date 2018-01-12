const t = Date.now();

/**
 * dankLog
 * Just shows stuff in as dank as possible.
 * @param {String} name
 * @param {String} message
 * @param {String} status
 * @public
 */
function dankLog(name, message, status) {
    try {
        if (localStorage.getItem('tubia_debug')) {
            let theme = (status === 'error')
                ? 'background: #c4161e; color: #fff'
                : (status === 'warning')
                    ? 'background: #ff8c1c; color: #fff'
                    : 'background: #006897; color: #fff';
            const banner = console.log('[' + (Date.now() - t) / 1000 + 's]' +
            '%c %c %c tubia %c %c %c ' + name + ' ',
            'background: #01567d', 'background: #00405c',
            'color: #fff; background: #002333;', 'background: #00405c',
            'background: #01567d', theme,
            (typeof message !== 'undefined') ? message : '');
            /* eslint-disable */
            console.log.apply(console, banner);
            /* eslint-enable */
        }
    } catch (error) {
        console.log(error);
    }
}

export {dankLog};
