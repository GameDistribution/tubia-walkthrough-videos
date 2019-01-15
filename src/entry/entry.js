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
    }];

    let url = './index.html?';
    settingsArray.forEach(setting => {
        url += Object.keys(setting)
            .filter(key => typeof setting[key] !== 'undefined')
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(setting[key])}`)
            .join('&');
    });

    console.log(url);

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

}());