// ==========================================================================
// Honeybadger Code Monitoring Tool
// ==========================================================================

const CodeMonitor = () => {
    /**
     * Code Monitoring Tool of Tubia Player.
     * honeybadger.io
     */
    let locationAncestorOrigin = false;
    // eslint-disable-next-line no-constant-condition
    if (!typeof location.ancestorOrigins === 'undefined') {
        locationAncestorOrigin = (location.ancestorOrigins.length > 0) ? location.ancestorOrigins[0].replace(/^(?:https?:\/\/)?/i, '').split('/')[0].split('.')[0] === 'test' : false;
    }
    const debug = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') || locationAncestorOrigin || location.hostname.split('.')[1] === 'ngrok';
    const hbConfig = {
        apiKey: 'b4753ed6',
        environment: debug ? 'development' : 'production',
        disabled: true,
        maxErrors: 20,
    };

    return {
        configure: () => {
            Honeybadger.configure(hbConfig);
        },
        notifyError: (e) => {
            const err = {
                environment: debug ? 'development' : 'production',
                projectRoot: location.href,
            };
            Honeybadger.notify('error', { ...err, ...e });
        },
    };
};

export default CodeMonitor;