import 'es6-promise/auto';
import 'whatwg-fetch';
// Todo: range touch is causing the following error:
// Todo: Uncaught DOMException: Failed to execute 'insertRule' on 'CSSStyleSheet': Cannot access StyleSheet to insertRule
// import 'rangetouch';

import PackageJSON from '../../package.json';
import Plyr from './plyr/plyr';
import utils from './plyr/utils';

/**
 * Tubia
 */
class Tubia {
    /**
     * Constructor of Tubia.
     * @param {Object} options
     * @return {*}
     */
    constructor(options) {
        // If no options are given.
        if (!options || (Object.keys(options).length === 0 && options.constructor === Object)) {
            return new Error('No settings have been given to Tubia...');
        }

        // Set a version banner within the developer console.
        /* eslint-disable */
        const version = PackageJSON.version;
        const banner = console.log(
            '%c %c %c Tubia Video Walkthrough | Version: ' +
            version + ' %c %c %c', 'background: #01567d',
            'background: #00405c', 'color: #fff; background: #002333;',
            'background: #00405c', 'background: #01567d',
            'background: #006897');
        console.log.apply(console, banner);
        /* eslint-enable */

        // Set some defaults. We replace them with real given
        // values further down.
        const defaults = {
            debug: false,
            container: 'player',
            gameId: '0', // Todo: api.tubia.com expects something...
            publisherId: '',
            title: '',
            category: '',
            langCode: '',
            colorMain: '',
            colorAccent: '',
            url: document.location.origin + document.location.pathname,
            href: document.location.href,
            domain: document.location.host,
            gdprTracking: null,
            gdprTargeting: null,
            onStart() {
            },
            onFound() {
            },
            onError() {
            },
            onReady() {
            },
        };

        if (options) {
            this.options = utils.extendDefaults(defaults, options);
        } else {
            this.options = defaults;
        }

        console.log(this.options);

        this.videoId = '';
        this.innerContainer = null;
        this.adTag = null;
        this.posterUrl = '';
        this.posterPosterElement = null;
        this.transitionElement = null;
        this.playButton = null;
        this.hexagonLoader = null;
        this.videoSearchPromise = null;
        this.videoDataPromise = null;
        this.transitionSpeed = 2000;
        this.startPlyrHandler = this.startPlyr.bind(this);
        this.player = null;
        this.publisherId = this.options.publisherId.toString().replace(/-/g, '');

        // Call Google Analytics and Death Star.
        this.analytics();

        // Make sure the DOM is ready!
        // The Tubia instance sometimes gets called from the <head> by clients.
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
        // Invoke callback.
        this.options.onStart();

        // Search for a matching video within our Tubia database and return the id.
        // Todo: We can't get the poster image without doing these requests for data. Kind of sucks.
        this.videoSearchPromise = new Promise((resolve, reject) => {
            const gameId = this.options.gameId.toString().replace(/-/g, '');
            const title = encodeURIComponent(this.options.title);
            const pageId = window.calcMD5(this.options.url);
            const videoFindUrl = `https://api.tubia.com/api/player/findv3/?pageId=${pageId}&href=${encodeURIComponent(this.options.href)}&gameId=${gameId}&title=${title}&domain=${encodeURIComponent(this.options.domain)}`;
            const videoSearchRequest = new Request(videoFindUrl, {
                method: 'GET',
            });
            fetch(videoSearchRequest)
                .then((response) => response.text())
                .then((text) => text.length ? JSON.parse(text) : {})
                .then(data => {
                    // Set the videoId.
                    // id.gameId is actually the videoId...
                    if (data && data.gameId && data.gameId !== '') {
                        this.videoId = data.gameId.toString().replace(/-/g, '');
                    } else {
                        this.videoId = '0';
                    }

                    resolve();
                })
                .catch(error => reject(error));
        });

        // Get the video data using the id returned from the videoSearchPromise.
        this.videoDataPromise = new Promise((resolve, reject) => {
            this.videoSearchPromise.then(() => {
                // Yes argument gameid is expecting the videoId...
                const videoDataUrl = `https://api.tubia.com/api/player/publish/?gameid=${this.videoId}&publisherid=${this.publisherId}&domain=${encodeURIComponent(this.options.domain)}`;
                const videoDataRequest = new Request(videoDataUrl, {method: 'GET'});

                // Record Tubia "Video Loaded" event in Tunnl.
                (new Image()).src = `https://ana.tunnl.com/event?tub_id=${this.videoId}&eventtype=0&page_url=${encodeURIComponent(this.options.url)}`;

                // Set the ad tag using the given id.
                this.adTag = `https://pub.tunnl.com/opp?page_url=${encodeURIComponent(this.options.url)}&player_width=640&player_height=480&tub_id=${this.videoId}&correlator=${Date.now()}`;
                // this.adTag = `https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/ad_rule_samples&ciu_szs=300x250&ad_rule=1&impl=s&gdfp_req=1&env=vp&output=vmap&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ar%3Dpremidpostpod&cmsid=496&vid=short_onecue&correlator=${Date.now()}`;
                // this.adTag = 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/ad_rule_samples&ciu_szs=300x250&ad_rule=1&impl=s&gdfp_req=1&env=vp&output=vmap&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ar%3Dpreonly&cmsid=496&vid=short_onecue&correlator=';
                fetch(videoDataRequest)
                    .then((response) => response.text())
                    .then((text) => text.length ? JSON.parse(text) : {})
                    .then(data => {
                        if (!data) {
                            throw new Error('No video has been found!');
                        }

                        // Invoke callback to end-user containing our video data.
                        this.options.onFound(data);

                        // Increment the matchmaking counter so we can get a priority list for our editor.
                        // We know if the video is missing when the backFillVideoId and videoId match.
                        // Yes its the most dumbass thing ever.
                        if (data.backFillVideoId === this.videoId) {
                            this.reportToMatchmaking();
                        }

                        // Now check if we need to do an additional request in case
                        // we do not have data to populate our "level select" feature.
                        // If so then we fetch related games.
                        if (data.cuepoints && data.cuepoints.length > 0) {
                            resolve(data);
                        } else {
                            // Todo: Title property within related games JSON is always empty!!
                            const relatedVideosUrl = `https://api.tubia.com/api/RelatedVideo/?gameMd5=${this.options.gameId}&publisherId=${this.publisherId}&domain=${encodeURIComponent(this.options.domain)}&skip=0&take=10&orderBy=visit&sortDirection=desc&langCode=${this.options.langCode}`;
                            const relatedVideosRequest = new Request(relatedVideosUrl, {
                                method: 'GET',
                            });
                            fetch(relatedVideosRequest)
                                .then((response) => response.text())
                                .then((text) => text.length ? JSON.parse(text) : {})
                                .then((related) => {
                                    data.playlistType = 'related';
                                    data.cuepoints = related;
                                    resolve(data);
                                }).catch((error) => {
                                    /* eslint-disable */
                                    if (typeof window['ga'] !== 'undefined') {
                                        const time = new Date();
                                        const h = time.getHours();
                                        const d = time.getDate();
                                        const m = time.getMonth();
                                        const y = time.getFullYear();
                                        window['ga']('tubia.send', {
                                            hitType: 'event',
                                            eventCategory: 'ERROR',
                                            eventAction: `${this.options.domain} | h${h} d${d} m${m} y${y}`,
                                            eventLabel: `start relatedVideosRequest | ${error}`,
                                        });
                                    }
                                    /* eslint-enable */
                                });
                        }
                    }).catch(error => reject(error));
            }).catch(error => reject(error));
        });

        this.videoDataPromise
            .then(() => this.loadExternals())
            .catch(error => this.notFound('start videoDataPromise', error));
    }

    /**
     * loadExternals
     * Load stysheets and fonts and any other external files
     */
    loadExternals() {
        // Todo: Temporary tracking of wrong domains at publishers.
        /* eslint-disable */
        // if (typeof window['ga'] !== 'undefined' &&
        //     document.currentScript) {
        //     window['ga']('tubia.send', {
        //         hitType: 'event',
        //         eventCategory: 'LEGACY_URL_TRACKING',
        //         eventAction: document.currentScript.src,
        //         eventLabel: this.options.domain,
        //     });
        // }
        /* eslint-enable */

        const container = document.getElementById(this.options.container);
        if (container) {
            // Load our styles and fonts.
            utils.loadStyle('https://fonts.googleapis.com/css?family=Khand:400,700')
                .catch(() => {
                    /* eslint-disable */
                    if (typeof window['ga'] !== 'undefined') {
                        const time = new Date();
                        const h = time.getHours();
                        const d = time.getDate();
                        const m = time.getMonth();
                        const y = time.getFullYear();
                        window['ga']('tubia.send', {
                            hitType: 'event',
                            eventCategory: 'ERROR',
                            eventAction: `${this.options.domain} | h${h} d${d} m${m} y${y}`,
                            eventLabel: 'Something went wrong loading Google fonts.',
                        });
                    }
                    /* eslint-enable */
                });
            utils.loadStyle((this.options.domain === 'localhost:8081')
                ? './gd.css'
                : 'https://player.tubia.com/libs/gd/gd.css')
                .then(() => {
                    // Create an inner container; within we load our player and do other stuff.
                    // We make sure to destroy any inner content if there are already things inside.
                    if (container.firstChild) {
                        container.innerHTML = '';
                    }

                    // Now create the inner container.
                    this.innerContainer = document.createElement('div');
                    this.innerContainer.className = 'tubia';
                    container.appendChild(this.innerContainer);

                    // And add theme styles.
                    this.setTheme(container);

                    // Create the markup now that we have the stylesheets and main container ready.
                    this.createMarkup();
                }).catch((error) => {
                    // If something went wrong with loading the stylesheet we get an Event.
                    // Otherwise its just a regular error object.
                    if (error.target) {
                        this.onError('init loadStyle', 'Something went wrong when loading the Tubia stylesheet.');
                    } else {
                        this.onError('init loadStyle', error);
                    }
                });
        } else {
            this.onError('init container', 'There is no container element for Tubia set.');
        }
    }

    /**
     * createMarkup
     * Create the markup for the Tubia application.
     */
    createMarkup() {
        const html = `
            <div class="tubia__transition"></div>
            <button class="tubia__play-button">
                <svg class="tubia__play-icon" viewBox="0 0 18 18" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <g>
                        <path d="M15.5615866,8.10002147 L3.87056367,0.225209313 C3.05219207,-0.33727727 2,0.225209313 2,1.12518784 L2,16.8748122 C2,17.7747907 3.05219207,18.3372773 3.87056367,17.7747907 L15.5615866,9.89997853 C16.1461378,9.44998927 16.1461378,8.55001073 15.5615866,8.10002147 L15.5615866,8.10002147 Z"/>
                    </g>
                </svg>
                <svg class="tubia__hexagon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 129.78 150.37">
                    <path class="tubia__hexagon-base" d="M-1665.43,90.94V35.83a15.09,15.09,0,0,1,6.78-12.59l48.22-31.83a15.09,15.09,0,0,1,16-.38L-1547,19.13a15.09,15.09,0,0,1,7.39,13V90.94a15.09,15.09,0,0,1-7.21,12.87l-47.8,29.24a15.09,15.09,0,0,1-15.75,0l-47.8-29.24A15.09,15.09,0,0,1-1665.43,90.94Z" transform="translate(1667.43 13.09)"/>
                    <path class="tubia__hexagon-line-animation" d="M-1665.43,90.94V35.83a15.09,15.09,0,0,1,6.78-12.59l48.22-31.83a15.09,15.09,0,0,1,16-.38L-1547,19.13a15.09,15.09,0,0,1,7.39,13V90.94a15.09,15.09,0,0,1-7.21,12.87l-47.8,29.24a15.09,15.09,0,0,1-15.75,0l-47.8-29.24A15.09,15.09,0,0,1-1665.43,90.94Z" transform="translate(1667.43 13.09)"/>
                </svg>
            </button>
            <div class="tubia__hexagon-loader">
                <svg class="tubia__hexagon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 129.78 150.37">
                    <path class="tubia__hexagon-base" d="M-1665.43,90.94V35.83a15.09,15.09,0,0,1,6.78-12.59l48.22-31.83a15.09,15.09,0,0,1,16-.38L-1547,19.13a15.09,15.09,0,0,1,7.39,13V90.94a15.09,15.09,0,0,1-7.21,12.87l-47.8,29.24a15.09,15.09,0,0,1-15.75,0l-47.8-29.24A15.09,15.09,0,0,1-1665.43,90.94Z" transform="translate(1667.43 13.09)"/>
                    <path class="tubia__hexagon-line-animation" d="M-1665.43,90.94V35.83a15.09,15.09,0,0,1,6.78-12.59l48.22-31.83a15.09,15.09,0,0,1,16-.38L-1547,19.13a15.09,15.09,0,0,1,7.39,13V90.94a15.09,15.09,0,0,1-7.21,12.87l-47.8,29.24a15.09,15.09,0,0,1-15.75,0l-47.8-29.24A15.09,15.09,0,0,1-1665.43,90.94Z" transform="translate(1667.43 13.09)"/>
                </svg>
            </div>
            <div id="tubia__display-ad" class="tubia__display-ad"></div>
        `;

        this.innerContainer.insertAdjacentHTML('beforeend', html);
        this.transitionElement = this.innerContainer.querySelector('.tubia__transition');
        this.playButton = this.innerContainer.querySelector('.tubia__play-button');
        this.hexagonLoader = this.innerContainer.querySelector('.tubia__hexagon-loader');

        // Show the container.
        this.innerContainer.classList.toggle('tubia__active');

        // Show a spinner loader, as this could take some time.
        this.hexagonLoader.classList.toggle('tubia__active');

        // We start with showing a poster image with a play button.
        // By not loading the actual player we save some requests and overall page load.
        // A user can click the play button to start loading the video player.
        this.videoDataPromise.then((json) => {
            const poster = (json.pictures && json.pictures.length > 0) ? json.pictures[json.pictures.length - 1].link : '';
            this.posterUrl = poster.replace(/^http:\/\//i, 'https://');

            // Check if the poster image exists.
            this.posterPosterElement = document.createElement('div');
            this.posterPosterElement.classList.add('tubia__poster');
            const checkImage = path =>
                new Promise(resolve => {
                    const img = new Image();
                    img.onload = () => resolve({path, status: 'ok'});
                    img.onerror = () => resolve({path, status: 'error'});
                    img.src = path;

                    // Always resolve.
                    setTimeout(() => {
                        resolve({path, status: 'error'});
                    }, 2000);
                });
            const loadImg = (...paths) => Promise.all(paths.map(checkImage));
            loadImg(this.posterUrl).then((response) => {
                if (response[0].status === 'ok') {
                    this.posterPosterElement.style.backgroundImage = `url(${response[0].path})`;
                } else {
                    this.posterPosterElement.style.display = 'none';
                }

                // Start transition towards showing the poster image.
                this.transitionElement.classList.toggle('tubia__active');

                setTimeout(() => {
                    // Hide our spinner loader.
                    this.hexagonLoader.classList.toggle('tubia__active');
                    // Add our poster image.
                    this.innerContainer.appendChild(this.posterPosterElement);

                    // Create the play button.
                    this.playButton.classList.toggle('tubia__active');
                    this.playButton.addEventListener('click', this.startPlyrHandler, false);
                }, this.transitionSpeed / 2);

                setTimeout(() => {
                    // Hide transition.
                    this.transitionElement.classList.toggle('tubia__active');
                }, this.transitionSpeed);
            });

            // Create a display advertisement which will reside on top of the poster image.
            // load the DFP Script.
            const slotId = 'tubia__display-ad';
            const slotElement = document.getElementById(slotId);
            if (slotElement
                && (this.options.domain === 'spele.nl'
                || this.options.domain === 'www.funnygames.nl'
                || this.options.domain === 'www.bgames.com'
                || this.options.domain === 'www.plinga.com')) {
                const slotWidth = slotElement.offsetWidth;

                // Load DFP script.
                utils.loadScript('https://www.googletagservices.com/tag/js/gpt.js');

                // Set namespaces for DFP.
                window.googletag = window.googletag || {};
                window.googletag.cmd = window.googletag.cmd || [];

                // Create the ad slot.
                window.googletag.cmd.push(() => {
                    /* eslint-disable */
                    let mapping = null;
                    if (slotWidth >= 970) {
                        mapping = window.googletag.sizeMapping()
                            .addSize([970, 90], [[970, 90], [728, 90]])
                            .addSize([728, 90], [728, 90])
                            .build();
                    } else if (slotWidth >= 728) {
                        mapping = window.googletag.sizeMapping()
                            .addSize([728, 90], [728, 90])
                            .build();
                    }

                    // window.googletag.defineSlot('1015413/TNL_NS-18062500055/TNL_T-18082776963_1', [728, 90], slotId)
                    window.googletag.defineSlot('/21731147099/Tubia_prestart_leaderboard', [728, 90], slotId)
                        .defineSizeMapping(mapping)
                        .setCollapseEmptyDiv(true, true)
                        .addService(window.googletag.pubads());
                    /* eslint-enable */
                    window.googletag.enableServices();
                    window.googletag.display(slotId);
                });
            }
        });
    }

    /**
     * notFound
     * Whenever we failed to load a video.
     * @param {String} origin
     * @param {String} message
     */
    notFound(origin, message) {
        this.options.onNotFound(message);

        // Report missing video.
        this.reportToMatchmaking();

        /* eslint-disable */
        if (typeof window['ga'] !== 'undefined') {
            const time = new Date();
            const h = time.getHours();
            const d = time.getDate();
            const m = time.getMonth();
            const y = time.getFullYear();
            window['ga']('tubia.send', {
                hitType: 'event',
                eventCategory: 'VIDEO_NOT_FOUND',
                eventAction: `${this.options.url} | h${h} d${d} m${m} y${y}`,
                eventLabel: `${origin} | ${message}`,
            });
        }
        /* eslint-enable */

        throw new Error(message);
    }

    /**
     * onError
     * Whenever we hit a problem while initializing Tubia.
     * @param {String} origin
     * @param {String} error
     */
    onError(origin, error) {
        this.options.onError(error);

        // Todo: I think Plyr has some error handling div?
        if (this.innerContainer) {
            this.innerContainer.classList.add('tubia__error');
        }

        /* eslint-disable */
        if (typeof window['ga'] !== 'undefined') {
            const time = new Date();
            const h = time.getHours();
            const d = time.getDate();
            const m = time.getMonth();
            const y = time.getFullYear();
            window['ga']('tubia.send', {
                hitType: 'event',
                eventCategory: 'ERROR',
                eventAction: `${this.options.domain} | h${h} d${d} m${m} y${y}`,
                eventLabel: `${origin} | ${error}`,
            });
        }
        /* eslint-enable */

        throw new Error(error);
    }

    /**
     * userErrorReporting
     * Users can report issues concerning the player.
     * Todo: We don't support this feature yet. But i've added the request for future reference.
     * @param {String} userErrorMessage
     */
    userErrorReporting(userErrorMessage) {
        // Send error report to Tubia.
        (new Image()).src = `https://api.tubia.com/api/playernotification?reasonid=${userErrorMessage}&url=${encodeURIComponent(this.options.url)}&videoid=${this.videoId}`;
    }

    /**
     * startPlyr
     * Method for animating into loading the Plyr player.
     */
    startPlyr() {
        if(!this.playButton) {
            return;
        }

        // Remove our click listener to avoid double clicks.
        this.playButton.removeEventListener('click', this.startPlyrHandler, false);

        // Hide the play button.
        this.playButton.classList.toggle('tubia__active');

        setTimeout(() => {
            // Show our spinner loader.
            this.hexagonLoader.classList.toggle('tubia__active');
            // Hide the poster image.
            this.posterPosterElement.style.display = 'none';
            // Remove the button.
            this.playButton.parentNode.removeChild(this.playButton);
            // Load our player.
            this.loadPlyr();
        }, 200); // Wait for the play button to hide.

        // Destroy our display ad if it exists.
        const displayAd = document.getElementById('tubia__display-ad');
        if (displayAd) {
            if (window.googletag)
                window.googletag.destroySlots('tubia__display-ad');
            displayAd.parentNode.removeChild(displayAd);
        }
    }

    /**
     * loadPlyr
     * Load the Plyr library.
     */
    loadPlyr() {
        this.videoDataPromise.then((json) => {
            if (!json) {
                this.onError('loadPlyr json', 'No video data has been found!');
                return;
            }

            // Create the HTML5 video element.
            const videoElement = document.createElement('video');
            videoElement.setAttribute('controls', 'true');
            videoElement.setAttribute('crossorigin', 'true');
            videoElement.setAttribute('playsinline', 'true');
            videoElement.poster = this.posterUrl;
            videoElement.id = 'plyr__tubia';

            // Todo: If files (transcoded videos) doesn't exist we must load the raw video file.
            // Todo: However, currently the raw files are in the wrong google project and not served from a CDN, so expensive!
            const videoSource = document.createElement('source');
            const source = (json.files && json.files.length > 0) ? json.files[json.files.length - 1].linkSecure : `https://storage.googleapis.com/vooxe_eu/vids/default/${json.detail[0].mediaURL}`;
            const sourceUrl = source.replace(/^http:\/\//i, 'https://');
            const sourceType = (json.files && json.files.length > 0) ? json.files[json.files.length - 1].type : 'video/mp4';
            videoSource.src = sourceUrl;
            videoSource.type = sourceType;

            videoElement.appendChild(videoSource);
            this.innerContainer.appendChild(videoElement);

            // Create the video player.
            const controls = [
                'logo',
                'play-large',
                'title',
                'progress',
                'current-time',
                'duration',
                'play',
                'mute',
                'fullscreen',
            ];

            // Setup the playlist.
            const playlist = {
                active: false,
                type: (json.playlistType) ? json.playlistType : 'cue',
                data: json.cuepoints,
            };

            // We don't want certain options when our view is too small.
            if ((this.innerContainer.offsetWidth >= 400)
                && (!/Mobi/.test(navigator.userAgent))) {
                controls.push('volume');
                controls.push('settings');
                // controls.push('captions');
                controls.push('pip');
            }

            // Check if we want a playlist.
            if (json.cuepoints && json.cuepoints.length > 0) {
                controls.push('playlist');
            }

            // Create the Plyr instance.
            this.player = new Plyr('#plyr__tubia', {
                debug: this.options.debug,
                iconUrl: (this.options.domain === 'localhost:8081')
                    ? './sprite.svg'
                    : 'https://player.tubia.com/libs/gd/sprite.svg',
                title: (json.detail && json.detail.length > 0) ? json.detail[0].title : '',
                logo: (json.logoEnabled) ? json.logoEnabled : false,
                showPosterOnEnd: true,
                hideControls: (!/Android/.test(navigator.userAgent)), // Hide on Android devices.
                ads: {
                    enabenabledled: (json.adsEnabled) ? json.adsEnabled : true,
                    prerollEnabled: (json.preRollEnabled) ? json.preRollEnabled : true,
                    midrollEnabled: (json.subBannerEnabled) ? json.subBannerEnabled : true,
                    // Todo: Test with 1 minute something video midroll interval.
                    videoInterval: 60, // (json.preRollSecond) ? json.preRollSecond : 300,
                    overlayInterval: (json.subBannerSecond) ? json.subBannerSecond : 15,
                    gdprTargeting: this.options.gdprTargeting,
                    tag: (json.adsEnabled && !json.addFreeActive) ? this.adTag : '',
                },
                keyboard: {
                    global: true,
                },
                tooltips: {
                    seek: true,
                    controls: false,
                },
                captions: {
                    active: false,
                },
                fullscreen: {
                    enabled: (json.fullScreenEnabled) ? json.fullScreenEnabled : true,
                },
                playlist,
                controls,
            });

            // Set some listeners.
            this.player.on('ready', () => {
                // Start transition towards showing the player.
                this.transitionElement.classList.toggle('tubia__active');

                setTimeout(() => {
                    // Hide our spinner loader.
                    this.hexagonLoader.classList.toggle('tubia__active');
                }, this.transitionSpeed / 2);

                setTimeout(() => {
                    // Hide transition.
                    this.transitionElement.classList.toggle('tubia__active');
                    // Permanently hide the transition.
                    this.transitionElement.style.display = 'none';
                    // Show the player.
                    this.player.elements.container.classList.toggle('tubia__active');
                    // Return ready callback for our clients.
                    this.options.onReady(this.player);
                    // Start playing.
                    this.player.play();
                }, this.transitionSpeed / 1.5);

                // Record Tubia "Video Play" event in Tunnl.
                (new Image()).src = `https://ana.tunnl.com/event?tub_id=${this.videoId}&eventtype=1&page_url=${encodeURIComponent(this.options.url)}`;
            });
            this.player.on('error', (error) => {
                this.onError('loadPlyr player', error);
            });
        }).catch(error => {
            this.onError('loadPlyr videoDataPromise', error);
        });
    }

    /**
     * Analytics
     * Load Google Analytics and OrangeGames analytics.
     */
    analytics() {
        /* eslint-disable */
        // Load Google Analytics so we can push out a Google event for
        // each of our events.
        if (typeof window['ga'] === 'undefined') {
            (function (i, s, o, g, r, a, m) {
                i['GoogleAnalyticsObject'] = r;
                i[r] = i[r] || function () {
                    (i[r].q = i[r].q || []).push(arguments);
                }, i[r].l = 1 * new Date();
                a = s.createElement(o),
                    m = s.getElementsByTagName(o)[0];
                a.async = true;
                a.src = g;
                m.parentNode.insertBefore(a, m);
            })(window, document, 'script',
                'https://www.google-analytics.com/analytics.js', 'ga');
        }
        if (typeof window['ga'] !== 'undefined') {
            window['ga']('create', 'UA-102831738-1', {
                'name': 'tubia',
                'cookieExpires': 90 * 86400,
            }, 'auto');
            window['ga']('tubia.send', 'pageview');

            // Anonymize IP.
            if(!this.options.gdprTracking) {
                window['ga']('set', 'anonymizeIp', true);
            }

            // GameDistribution DMPKit Tag Manager
            if(this.options.gdprTracking) {
                (function (w, d, s, l, h, m) {
                    w[l] = w[l] || [];
                    const f = d.getElementsByTagName(s)[0],
                        j = d.createElement(s), dl = l != 'dmpkitdl' ? '&l=' + l : '';
                    j.async = true;
                    j.src = '//' + m + '/tm.js?id=' + h + dl;
                    f.parentNode.insertBefore(j, f);
                })(window, document, 'script', 'dmpkitdl', 'ddc15dec-6bf1-4844-a362-c601005250e1', 'static-dmp.mediaglacier.com');
            }
            /* eslint-enable */
        }
    }

    /**
     * setTheme
     * Set some theme styling, which overwrites colors of our loaded CSS.
     * @param {Object} element
     */
    setTheme(element) {
        if(this.options.colorMain !== '' && this.options.colorAccent !== '') {
            const css = `
                .tubia .tubia__transition:after {
                    background-color: ${this.options.colorMain};
                }
                .tubia .tubia__transition:before {
                    background-color: ${this.options.colorAccent};
                }
                .tubia .tubia__play-button .tubia__hexagon .tubia__hexagon-base, 
                .tubia .tubia__play-button .tubia__hexagon .tubia__hexagon-line-animation,
                .plyr .plyr__control .plyr__hexagon .plyr__hexagon-base {
                    fill: ${this.options.colorMain};
                    stroke: ${this.options.colorMain};
                }
                .tubia .tubia__hexagon-loader .tubia__hexagon .tubia__hexagon-base,
                .plyr .plyr__control .plyr__hexagon .plyr__hexagon-base {
                    stroke: ${this.options.colorMain};
                }
                .tubia .tubia__hexagon-loader .tubia__hexagon .tubia__hexagon-line-animation,
                .plyr .plyr__control .plyr__hexagon .plyr__hexagon-line-animation {
                    stroke: ${this.options.colorAccent};
                }
                .plyr.plyr--full-ui input[type=range] {
                    color: ${this.options.colorMain};
                }
                .plyr .plyr__menu__container {
                    background: ${this.options.colorMain};
                }
                .plyr .plyr__menu__container label.plyr__control input[type=radio]:checked+span {
                    background: ${this.options.colorAccent};
                }
                .plyr .plyr__menu__container:after {
                    border-top-color: ${this.options.colorMain};
                }
                .plyr .plyr__playlist ul li.active .plyr__count {
                    border-color: ${this.options.colorMain};
                    background-color: ${this.options.colorMain};
                }
                .plyr .plyr__playlist ul li:active .plyr__count {
                    border-color: ${this.options.colorAccent};
                }
                .plyr .plyr__playlist:before {
                    background-color: ${this.options.colorAccent};
                }
                .plyr .plyr__playlist:after {
                    background-color: ${this.options.colorMain};
                }
            `;

            // Now create a new one.
            const style = document.createElement('style');
            style.type = 'text/css';
            if (style.styleSheet) {
                style.styleSheet.cssText = css;
            } else {
                style.appendChild(document.createTextNode(css));
            }
            element.appendChild(style);
        }
    }

    /**
     * reportToMatchmaking
     * Here we report failed video's to the matchmaking system.
     * Send a post request to tell the "matching"-team which video is becoming important.
     * It is basically for updating a click counter or whatever :P
     */
    reportToMatchmaking() {
        // Todo: Keep this logic within the backend.
        // Todo: Triodor has not yet deployed the preflight request update, so no JSON!
        // Todo: This should be a GET request.
        const videoCounterData = `publisherId=${this.publisherId}&url=${encodeURIComponent(this.options.url)}&title=${this.options.title}&gameId=${this.options.gameId}&category=${this.options.category}&langCode=${this.options.langCode}`;
        const videoCounterUrl = 'https://api.tubia.com/api/player/find/';
        const videoCounterRequest = new Request(videoCounterUrl, {
            method: 'POST',
            body: videoCounterData, // JSON.stringify(videoCounterData),
            headers: new Headers({
                'Content-Type': 'application/x-www-form-urlencoded', // application/json
            }),
        });
        fetch(videoCounterRequest).then((response) => {
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new TypeError('Oops, we didn\'t get JSON!');
            }
        }).catch((error) => {
            /* eslint-disable */
            if (typeof window['ga'] !== 'undefined') {
                const time = new Date();
                const h = time.getHours();
                const d = time.getDate();
                const m = time.getMonth();
                const y = time.getFullYear();
                window['ga']('tubia.send', {
                    hitType: 'event',
                    eventCategory: 'ERROR',
                    eventAction: `${this.options.domain} | h${h} d${d} m${m} y${y}`,
                    eventLabel: `${error} | videoCounterRequest`,
                });
            }
            /* eslint-enable */
        });
    }
}

export default Tubia;
