class Tubia {
    /**
     * Constructor of Tubia.
     * @param {Object} options
     * @return {*}
     */
    constructor(options) {
        this.options = options;
        // Make sure the DOM is ready!
        // The instance sometimes gets called from the <head> by publishers.
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            this.start();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this.start();
            });
        }
    }

    /**
     * start
     * Initialise the Tubia application. Fetch the data.
     */
    start() {
        // We will now create an i-frame and pass on the given options as GET parameters.
        const settingsArray = [{
            publisherid: this.options.publisherId,
            title: this.options.title,
            gameid: this.options.gameId,
            colormain: this.options.colorMain,
            coloraccent: this.options.colorAccent,
            gdprtracking: this.options.gdprTracking,
            gdprtargeting: this.options.gdprTargeting,
            langcode: this.options.langCode,
            debug: this.options.debug,
            testing: this.options.testing,
            videointerval: this.options.videoInterval,
            category: this.options.category,
            keys: this.options.keys,
            url: document.location.origin + document.location.pathname,
            href: document.location.href,
            magicvideo: this.options.magicvideo,
        }];

        const domain = settingsArray[0].url.toLowerCase().replace(/^(?:https?:\/\/)?/i, '').split('/')[0];
        let url = 'https://player.tubia.com/index.html?';
        if (domain === 'localhost:8081') {
            url = '/test/index.html?';
        } else if (this.options.debug) {
            url = 'https://player.tubia.com/test/index.html?';
        }

        settingsArray.forEach(setting => {
            url += Object.keys(setting)
                .filter(key => typeof setting[key] !== 'undefined')
                .map(key => {
                    let value = setting[key];
                    if (key === 'category' || key === 'keys') {
                        value = JSON.stringify(setting[key]);
                    }
                    return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
                })
                .join('&');
        });

        const frame = document.createElement('iframe');
        frame.src = url;
        frame.setAttribute('id', 'tubiaFrame');
        frame.setAttribute('frameBorder', '0');
        frame.setAttribute('scrolling', 'no');
        frame.setAttribute('allowfullscreen', 'true');
        frame.style.top = '0';
        frame.style.right = '0';
        frame.style.bottom = '0';
        frame.style.left = '0';
        frame.width = this.options.width || '100%';
        frame.height = this.options.height || '100%';

        const container = document.getElementById(this.options.container);
        if (container) {
            if (typeof this.options.height === 'undefined') {
                // Fix iOS problems.
                frame.style.height = '0';
                frame.style.width = '0';
                frame.style.minWidth = '100%';
                frame.style.minHeight = '100%';
                frame.style.maxWidth = '100%';
                frame.style.maxHeight = '100%';

                const ratio = document.createElement('div');
                ratio.style.position = 'relative';
                ratio.style.padding = '56.25% 0 0 0';
                frame.style.position = 'absolute';
                container.appendChild(ratio);
                ratio.appendChild(frame);
            } else {
                container.appendChild(frame);
            }
        } else {
            console.error('There is no container element for Tubia set.');
        }

        // Listen to events coming in from the Tubia iframe.
        window.addEventListener('message', (event) => {
            // Check if the origin domain is correct.
            if (event.origin !== 'http://localhost:8081' && event.origin !== 'https://player.tubia.com') return;
            // Did we get data?
            if (!event.data) return;
            // What kind of data?
            if (event.data.name === 'onStart') {
                if (typeof this.options.onStart === 'function') {
                    this.options.onStart(event.data.payload);
                }
            }
            if (event.data.name === 'onFound') {
                if (typeof this.options.onFound === 'function') {
                    this.options.onFound(event.data.payload);
                }
            }
            if (event.data.name === 'onNotFound') {
                if (typeof this.options.onNotFound === 'function') {
                    this.options.onNotFound(event.data.payload);
                }
            }
            if (event.data.name === 'onError') {
                if (typeof this.options.onError === 'function') {
                    this.options.onError(event.data.payload);
                }
            }
            if (event.data.name === 'onReady') {
                if (typeof this.options.onReady === 'function') {
                    this.options.onReady(event.data.payload);
                }
            }
        }, false);
    }
}

export default Tubia;