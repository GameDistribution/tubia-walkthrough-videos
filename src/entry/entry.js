(function(){
    // Default publisher implementation will give us a global object containing
    // options as TUBIA_OPTIONS or for legacy gdPlayer. Here we check if either
    // of these globals are set.
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
    /* eslint-enable */

    // We will now create an i-frame and pass on the given options as GET parameters.
    const settingsArray = [{
        publisherid: settings.publisherId,
        title: settings.title,
        gameid: settings.gameId,
        url: document.location.href,
        colormain: settings.colorMain,
        coloraccent: settings.colorAccent,
        gdprtracking: settings.gdprTracking,
        gdprtargeting: settings.gdprTargeting,
        langcode: settings.langCode,
        debug: settings.debug,
        testing: settings.testing,
        videointerval: settings.videoInterval,
        category: settings.category,
        keys: settings.keys,
    }];

    let url = settings.debug ? './index_test.html?' : 'https://player.tubia.com/index.html?';
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
    frame.setAttribute('frameBorder', '0');
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('allowfullscreen', 'true');
    frame.style.position = 'absolute';
    frame.style.top = '0';
    frame.style.left = '0';
    frame.style.width = '100%';
    frame.style.height = '100%';

    const container = document.getElementById(settings.container);
    if (container) {
        container.appendChild(frame);
    } else {
        console.error('There is no container element for Tubia set.');
    }

    // Listen to events coming in from the Tubia iframe.
    window.addEventListener('message', (event) => {
        // Check if the origin domain is correct.
        if (event.origin !== 'http://localhost:8081'
            && event.origin !== 'https://player.tubia.com') return;
        // Did we get data?
        if (!event.data) return;
        // What kind of data?
        if (event.data.name === 'onStart') {
            if (typeof window.TUBIA_OPTIONS.onStart === 'function') {
                window.TUBIA_OPTIONS.onStart(event.data.payload);
            }
        }
        if (event.data.name === 'onFound') {
            if (typeof window.TUBIA_OPTIONS.onFound === 'function') {
                window.TUBIA_OPTIONS.onFound(event.data.payload);
            }
        }
        if (event.data.name === 'onNotFound') {
            if (typeof window.TUBIA_OPTIONS.onNotFound === 'function') {
                window.TUBIA_OPTIONS.onNotFound(event.data.payload);
            }
        }
        if (event.data.name === 'onError') {
            if (typeof window.TUBIA_OPTIONS.onError === 'function') {
                window.TUBIA_OPTIONS.onError(event.data.payload);
            }
        }
        if (event.data.name === 'onReady') {
            if (typeof window.TUBIA_OPTIONS.onReady === 'function') {
                window.TUBIA_OPTIONS.onReady(event.data.payload);
            }
        }
    }, false);
}());