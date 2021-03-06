import 'es6-promise/auto';
import 'whatwg-fetch';
// Todo: range touch is causing the following error:
// Todo: Uncaught DOMException: Failed to execute 'insertRule' on 'CSSStyleSheet': Cannot access StyleSheet to insertRule
// import 'rangetouch';

import PackageJSON from '../../package.json';
import Plyr from './plyr/plyr';
import utils from './plyr/utils';
import adblocker from './plyr/adblocker';
import CodeMonitor from './plyr/codemonitor';
import Storage from './plyr/storage';

/**
 * Player
 */
class Player {
    /**
     * Constructor of Tubia Player.
     * @return {*}
     */
    constructor() {
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

        const params = utils.getUrlParams(document.location.href) || {};
        
        // Setup local storage for player settings
        this.storage = Storage;

        // Get URL parameter values from i-frame URL.
        // We also have to deal with legacy parameters.
        const publisherIdLegacy = params.pubid || params.publisherid;
        const publisherId = typeof publisherIdLegacy !== 'undefined' && publisherIdLegacy !== '' ? publisherIdLegacy : 'dc63a91fa184423482808bed4d782320';
        const gameId = typeof params.gameid !== 'undefined' && params.gameid !== '' ? params.gameid : '0';
        const title = typeof params.title !== 'undefined' && params.title !== '' ? params.title : 'Jewel Burst';
        const colorMain = typeof params.colormain !== 'undefined' && params.colormain !== '' ? params.colormain : '';
        const colorAccent = typeof params.coloraccent !== 'undefined' && params.coloraccent !== '' ? params.coloraccent : '';
        const gdprTracking = typeof params.gdprtracking !== 'undefined' ? utils.parseJson(params.gdprtracking) : true;
        const gdprTargeting = typeof params.gdprtargeting !== 'undefined' ? utils.parseJson(params.gdprtargeting) : true;
        const langCodeLegacy = params.lang || params.langcode;
        const langCode = typeof langCodeLegacy !== 'undefined' && langCodeLegacy !== '' ? langCodeLegacy : 'en-us';
        const debug = (typeof params.debug !== 'undefined' && params.debug !== '') && params.debug === 'true';
        const testing = typeof params.testing !== 'undefined' || params.testing !== '' && params.debug === 'true';
        const videoInterval = params.videointerval || null;
        const category = utils.parseJson(params.category);
        const keys = utils.parseJson(params.keys);
        const magicvideo = typeof params.magicvideo !== 'undefined' && params.magicvideo !== '' ? parseInt(params.magicvideo, 10) : true;

        // Set the URL's based on given (legacy) parameters.
        // Receiving a proper pageurl parameter is mandatory. We either get it directly from the iframe URL,
        // or we get it from /src/entry/tubia.js.
        const pageUrl = params.pageurl || params.url;
        // Remove any added query parameters. The default is some legacy thing used by our tubia admin.
        const url = pageUrl ? pageUrl.split('?')[0] : `http://player.tubia.com/libs/gd/?gameid=${gameId}`;
        const href = pageUrl || document.location.href;
        const domain = url.toLowerCase().replace(/^(?:https?:\/\/)?/i, '').split('/')[0];

        // Populate the options object.
        this.options = {
            publisherId,
            gameId,
            title,
            url,
            href,
            domain,
            colorMain: colorMain.indexOf('#') >= 0 ? colorMain : `#${colorMain}`,
            colorAccent: colorAccent.indexOf('#') >= 0 ? colorAccent : `#${colorAccent}`,
            gdprTracking,
            gdprTargeting,
            langCode,
            debug,
            testing,
            videoInterval, // Todo: testing. Video midroll interval.
            category,
            keys,
            lottie: true,
            magicvideo,
        };

        // Honeybadger Code Monitoring
        this.codemonitor = CodeMonitor();

        // Test domains.
        const testDomains = [
            'localhost:8081',
            'player.tubia.com',
            'test.spele.nl',
        ];

        // Update options.
        this.options.publisherId = this.options.publisherId.toString().replace(/-/g, '');
        this.options.testing = this.options.testing || testDomains.indexOf(this.options.domain.replace(/^(?:https?:\/\/)?(?:\/\/)?(?:www\.)?/i, '').split('/')[0]) > -1;
        this.options.debug = !this.options.debug ? this.options.testing : this.options.debug;

        console.info(this.options);

        this.videoId = '';
        this.adTag = null;
        this.adTagLegacy = null;
        this.posterUrl = '';
        this.videoSearchPromise = null;
        this.videoDataPromise = null;
        this.transitionSpeed = 2000;
        this.startPlyrHandler = this.startPlyr.bind(this);
        this.hoverPlyrHandler = this.hoverPlyr.bind(this);
        this.player = null;
        this.nextCuePoint = null;
        this.displayAds = {
            slots: {
                top: 'tubia__banner-ad2',
                bottom: 'tubia__banner-ad',
            },
        };
        this.displayIsShown = false;

        // Set the proper origin URL for postMessage requests.
        this.origin = document.location.origin;
        if (window.location !== window.parent.location
            && document.referrer && document.referrer !== '') {
            // Get the actual origin from the referrer URL.
            const parts = document.referrer.split('://')[1].split('/');
            const protocol = document.referrer.split('://')[0];
            const host = parts[0];
            // const pathName = parts.slice(1).join('/');
            this.origin = `${protocol}://${host}`;
        }

        this.container = document.getElementById('tubia');

        if (this.options.lottie) {
            this.animationElement = this.container.querySelector('.tubia__animation');
        } else {
            this.transitionElement = this.container.querySelector('.tubia__transition');
        }
        
        this.playButton = null;
        this.hexagonLoader = null;
        this.posterPosterElement = null;

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

        const imaSdk = document.createElement('script');
        imaSdk.src = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
        imaSdk.type = 'application/javascript';
        document.head.appendChild(imaSdk);

        // Check if an Ad Blocker Plugin exists
        adblocker.check();
        
        // Watch the iframe messages and start to play if we receive a 'startPlay' message
        window.addEventListener('message', (event) => {
            if (event.data === 'startPlay') {
                this.startPlyrHandler();
            }
        });

        // Send event to our publisher.
        try {
            parent.postMessage({ name: 'onStart' }, this.origin);
        } catch (postMessageError) {
            console.error(postMessageError);
        }

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

                    // Set the category.
                    if (data && data.category && data.category !== '' && this.options.category === '') {
                        this.options.category = data.category;

                        // Lotame tracking.
                        // It is critical to wait for the load event. Yes hilarious.
                        window.addEventListener('load', () => {
                            try {
                                /* eslint-disable */
                                window['_cc13997'].bcpw('int', `category : ${data.category.toLowerCase()}`);
                                /* eslint-enable */
                            } catch (error) {
                                // No need to throw an error or log. It's just Lotame.
                            }
                        });
                    }

                    resolve();
                })
                .catch(error => reject(error));
        });

        // Get the video data using the id returned from the videoSearchPromise.
        this.videoDataPromise = new Promise((resolve, reject) => {
            this.videoSearchPromise.then(() => {
                // Yes argument gameid is expecting the videoId...
                const videoDataUrl = `https://api.tubia.com/api/player/publish/?gameid=${this.videoId}&publisherid=${this.options.publisherId}&domain=${encodeURIComponent(this.options.domain)}`;

                // videoDataUrl = 'http://104.196.166.83:8085/api/player/publish/?gameid=f9f096cf81034a0baca18ae34951092f&publisherid=dc63a91fa184423482808bed4d782320&domain=player.tubia.com';

                const videoDataRequest = new Request(videoDataUrl, { method: 'GET' });

                // Record Tubia "Video Loaded" event in Tunnl.
                (new Image()).src = `https://ana.tunnl.com/event?tub_id=${this.videoId}&eventtype=0&page_url=${encodeURIComponent(this.options.url)}`;

                // Set the ad tag using the given id.
                this.adTag = `https://pub.tunnl.com/opphb?page_url=${encodeURIComponent(this.options.url)}&tub_id=${this.videoId}&correlator=${Date.now()}`;

                // We also have a legacy ad tag, which returns VAST XML, instead of Tunnl JSON.
                this.adTagLegacy = `https://pub.tunnl.com/opp?page_url=${encodeURIComponent(this.options.url)}&tub_id=${this.videoId}&correlator=${Date.now()}`;

                fetch(videoDataRequest)
                    .then((response) => response.text())
                    .then((text) => text.length ? JSON.parse(text) : {})
                    .then(data => {
                        if (!data) {
                            throw new Error('No video has been found!');
                        }

                        // Invoke callback to end-user containing our video data.
                        try {
                            if (parent === top) {
                                parent.postMessage({ name: 'onFound', payload: data }, this.origin);
                            }
                        } catch (postMessageError) {
                            console.error(postMessageError);
                        }

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
                            const relatedVideosUrl = `https://api.tubia.com/api/RelatedVideo/?gameMd5=${this.options.gameId}&publisherId=${this.options.publisherId}&domain=${encodeURIComponent(this.options.domain)}&skip=0&take=10&orderBy=visit&sortDirection=desc&langCode=${this.options.langCode}`;
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
                                }).catch(() => {
                                    this.codemonitor.notifyError({
                                        message: 'The related videos could not fetched.',
                                        component: 'video',
                                        action: 'request',
                                        projectRoot: this.options.domain,
                                        params: {
                                            gameId: this.options.gameId,
                                            href: this.options.href,
                                        },
                                    });
                                });
                        }
                    }).catch(error => reject(error));
            }).catch(error => reject(error));
        });

        this.videoDataPromise
            .then(() => {
                // And add theme styles.
                this.setTheme();

                // Create the markup now that we have the stylesheets and main container ready.
                this.createMarkup();

            })
            .catch(error => this.notFound('start videoDataPromise', error));
    }

    /**
     * createMarkup
     * Create the markup for the Tubia application.
     */
    createMarkup() {
        const html = `
            <div id="loader__transition" class="tubia__transition" style="display: none !important;"></div>
            <div id="loader__animation" class="tubia__animation">
                <div class="loading-animation" lottie-class="loading-animation"></div>
            </div>
            
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
            <div class="tubia__hexagon-loader" style="display: none !important;">
                <svg class="tubia__hexagon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 129.78 150.37">
                    <path class="tubia__hexagon-base" d="M-1665.43,90.94V35.83a15.09,15.09,0,0,1,6.78-12.59l48.22-31.83a15.09,15.09,0,0,1,16-.38L-1547,19.13a15.09,15.09,0,0,1,7.39,13V90.94a15.09,15.09,0,0,1-7.21,12.87l-47.8,29.24a15.09,15.09,0,0,1-15.75,0l-47.8-29.24A15.09,15.09,0,0,1-1665.43,90.94Z" transform="translate(1667.43 13.09)"/>
                    <path class="tubia__hexagon-line-animation" d="M-1665.43,90.94V35.83a15.09,15.09,0,0,1,6.78-12.59l48.22-31.83a15.09,15.09,0,0,1,16-.38L-1547,19.13a15.09,15.09,0,0,1,7.39,13V90.94a15.09,15.09,0,0,1-7.21,12.87l-47.8,29.24a15.09,15.09,0,0,1-15.75,0l-47.8-29.24A15.09,15.09,0,0,1-1665.43,90.94Z" transform="translate(1667.43 13.09)"/>
                </svg>
            </div>
            <div id="tubia__banner-ad2" class="tubia__banner-ad-top tubia__banner"><iframe></iframe></div>
            <div id="tubia__banner-ad" class="tubia__banner-ad-bottom tubia__banner"><iframe></iframe></div>
        `;

        this.container.insertAdjacentHTML('beforeend', html);

        // this.container.addEventListener('mouseover', this.hoverPlyrHandler, false);
        
        if (this.options.lottie) {
            this.animationElement = this.container.querySelector('.tubia__animation');
        } else {
            this.transitionElement = this.container.querySelector('.tubia__transition');
        }

        this.playButton = this.container.querySelector('.tubia__play-button');
        this.hexagonLoader = this.container.querySelector('.tubia__hexagon-loader');

        // Show the container.
        this.container.classList.toggle('tubia__active');

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
            this.posterPosterElement.id = 'tubia__poster';
            const checkImage = path =>
                new Promise(resolve => {
                    const img = new Image();
                    img.onload = () => resolve({ path, status: 'ok' });
                    img.onerror = () => resolve({ path, status: 'error' });
                    img.src = path;

                    // Always resolve.
                    setTimeout(() => {
                        resolve({ path, status: 'error' });
                    }, 2000);
                });
            const loadImg = (...paths) => Promise.all(paths.map(checkImage));
            loadImg(this.posterUrl).then((response) => {
                if (response[0].status === 'ok') {
                    this.posterPosterElement.style.backgroundImage = `url(${response[0].path})`;
                } else {
                    this.posterPosterElement.style.display = 'none';
                }

                // Hide our spinner loader.
                this.hexagonLoader.classList.toggle('tubia__active');

                // Add our poster image.
                this.container.appendChild(this.posterPosterElement);

                // Create the play button.
                this.playButton.classList.toggle('tubia__active');
                this.playButton.addEventListener('click', this.startPlyrHandler, false);
            });

            const headerLiftJs = document.createElement('script');
            headerLiftJs.src = `https://hb.improvedigital.com/pbw/headerlift.min.js?t=tubia&page_width=${this.container.offsetWidth}`;
            headerLiftJs.setAttribute('type', 'application/javascript');
            headerLiftJs.setAttribute('async', 'async');
            headerLiftJs.id = 'idhb';
            document.head.appendChild(headerLiftJs);

            // Create a display advertisement which will reside on top of the poster image.
            const slotElement = document.getElementById(this.displayAds.slots.bottom);
            const slotElement2 = document.getElementById(this.displayAds.slots.top);
            const displayIgnoreDomains = [
                '1001spiele.de',
                '1001hry.cz',
                'isladejuegos.es',
                'grajteraz.pl',
                '1001jogos.pt',
                'igrixl.ru',
                'elkspel.nl',
                'jatekokxl.hu',
                'spillespill.no',
                'spelo.se',
                '1001pelit.com',
                '1001jeux.fr',
                'giochixl.it',
                'paixnidiaxl.gr',
                'jetztspielen.ws',
                '1001giochi.it',
                'gamesxl.com',
                'gierkionline.pl',
                'juegosjuegos.ws',
                'spilxl.dk',
                '1001spiele.at',
                '1001games.fr',
                'speltuin.nl',
                '1001games.co.uk',
                'wuki.com',
            ];
        
            if (slotElement
                && displayIgnoreDomains.indexOf(this.options.domain.replace(/^(?:https?:\/\/)?(?:\/\/)?(?:www\.)?/i, '').split('/')[0]) === -1) {
                
                // Set adslot dimensions.
                if (this.container.offsetWidth >= 970) {
                    slotElement.classList.add('large-leaderboard');
                    slotElement2.classList.add('large-leaderboard');
                } else if (this.container.offsetWidth >= 728) {
                    slotElement.classList.add('leaderboard');
                    slotElement2.classList.add('leaderboard');
                } else if (this.container.offsetWidth >= 468) {
                    // banner
                    slotElement.classList.add('banner');
                    slotElement2.classList.add('banner');
                } else if (this.container.offsetWidth >= 360) {
                    slotElement.classList.add('mobile-banner');
                    slotElement2.classList.add('mobile-banner');
                } else if (this.container.offsetWidth >= 320) {
                    slotElement.classList.add('mobile-leaderboard');
                    slotElement2.classList.add('mobile-leaderboard');
                } else if (this.container.offsetWidth >= 234) {
                    slotElement.classList.add('half-banner');
                    slotElement2.classList.add('half-banner');
                }
                const slots = [ this.displayAds.slots.bottom ];
                if (this.container.offsetHeight < 220) {
                    const topBanner = document.getElementById('tubia__banner-ad2');
                    if (!utils.is.nullOrUndefined(topBanner)) {
                        topBanner.style.visibility = 'hidden';
                    }
                } else {
                    slots.push(this.displayAds.slots.top);
                }
                // Set header bidding name space.
                window.idhb = window.idhb || {};
                window.idhb.que = window.idhb.que || [];

                // Load the ad.
                window.idhb.que.push(() => {
                    // Pass on the IAB CMP euconsent string. Most SSP's are part of the IAB group.
                    // So they will interpret and apply proper consent rules based on this string.
                    // window.idhb.setDefaultGdprConsentString('BOWJjG9OWJjG9CLAAAENBx-AAAAiDAAA');
                    window.idhb.requestAds({
                        slotIds: slots,
                        callback: (response) => {
                            this.displayIsShown = true;
                            if (this.options.debug) {
                                console.info('window.idhbtubia.requestAds callback returned:', response);
                            }
                        },
                    });
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
        try {
            parent.postMessage({ name: 'onNotFound', payload: 'No video has been found!' }, this.origin);
        } catch (postMessageError) {
            console.error(postMessageError);
        }

        // Report missing video.
        this.reportToMatchmaking();

        throw new Error(message);
    }

    /**
     * onError
     * Whenever we hit a problem while initializing Tubia.
     * @param {String} origin
     * @param {String} error
     */
    onError(origin, error) {
        try {
            parent.postMessage({ name: 'onError', payload: error }, this.origin);
        } catch (postMessageError) {
            console.error(postMessageError);
        }

        // Todo: I think Plyr has some error handling div?
        if (this.container) {
            this.container.classList.add('tubia__error');
        }

        // Send this error to honeybadger.
        this.codemonitor.notifyError({
            message: `An error occured: ${error}`,
            component: 'player',
            action: 'error',
            projectRoot: this.options.domain,
            params: {
                gameId: this.options.gameId,
                href: this.options.href,
            },
        });

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
     * hoverPlyr
     * Method for starting player muted when user hovers the player
     */
    hoverPlyr() {
        // Remove hover listener to avoid recall hover state.
        this.container.removeEventListener('mouseover', this.hoverPlyrHandler, false);
        this.startPlyr(true);
    }

    /**
     * startPlyr
     * Method for animating into loading the Plyr player.
     */
    startPlyr() {

        // Add started class to handle display banners hide/show
        this.container.classList.add('tubia__started');
        this.displayIsShown = false;

        // Call Google Analytics and Death Star.
        this.analytics();

        // Configure Honeybadger to start monitoring the system
        this.codemonitor.configure();

        // Remove our click listener to avoid double clicks.
        this.playButton.removeEventListener('click', this.startPlyrHandler, false);

        // Hide the play button.
        this.playButton.classList.toggle('tubia__active');

        setTimeout(() => {
            // Show our spinner loader.
            this.hexagonLoader.classList.toggle('tubia__active');
            // If lottie animation is not active hide the poster image.
            if (!this.options.lottie) {
                this.posterPosterElement.style.display = 'none';
            }
            // Remove the button.
            this.playButton.parentNode.removeChild(this.playButton);
            // Load our player.
            this.loadPlyr();
        }, 200); // Wait for the play button to hide.

        // Destroy our display ad if it exists.
        const displayAd = document.getElementById('tubia__display-ad');
        if (displayAd) {
            displayAd.parentNode.removeChild(displayAd);
        }
    }

    /**
     * loadPlyr
     * Load the Plyr library.
     */
    loadPlyr() {
        const nextCueTime = '';
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
            videoElement.setAttribute('type', (json.files && json.files.length > 0) ? json.files[json.files.length - 1].type : 'video/mp4');
            videoElement.setAttribute('autoplay', 'true');
            videoElement.setAttribute('class', 'source');
            videoElement.poster = this.posterUrl;
            videoElement.id = 'plyr__tubia';
            
            // Todo: If files (transcoded videos) doesn't exist we must load the raw video file.
            // Todo: However, currently the raw files are in the wrong google project and not served from a CDN, so expensive!
            const source = (json.files && json.files.length > 0) ? json.files[json.files.length - 1].linkSecure : `https://storage.googleapis.com/vooxe_eu/vids/default/${json.detail[0].mediaURL}`;
            const sourceUrl = source.replace(/^http:\/\//i, 'https://');
            const sourceType = videoElement.type;
            const gameUrl = this.options.url;

            videoElement.src = sourceUrl;

            const { detail } = json;
            
            if (this.storage.supported) {
                localStorage.setItem('defaultVideo',JSON.stringify({
                    url: sourceUrl,
                    type: sourceType,
                    videoTitle: detail[0].title,
                    gameUrl }));
            }
            

            // videoElement.appendChild(videoSource);
            this.container.appendChild(videoElement);

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

            // Setup the morevideos.
            const morevideos = {
                active: true,
                type: json.playlistType ? json.playlistType : 'cue',
                data: json.relatedVideos,
            };

            // Setup the share
            // eslint-disable-next-line no-unused-vars
            const share = {
                active: true,
            };

            // We don't want certain options when our view is too small.
            if ((this.container.offsetWidth >= 400)
                && (!/Mobi/.test(navigator.userAgent))) {
                controls.push('volume');
                controls.push('settings');
                // controls.push('captions');
                controls.push('pip');
                controls.push('share');
            }

            // Check if we want a playlist.
            if (json.cuepoints && json.cuepoints.length > 0) {
                controls.push('playlist');
                controls.push('morevideos');
            }

            const {magicvideo} = this.options;


            // Create the Plyr instance.
            this.player = new Plyr('#plyr__tubia', {
                debug: this.options.debug,
                iconUrl: './libs/gd/sprite.svg',
                title: (json.detail && json.detail.length > 0) ? json.detail[0].title : '',
                logo: (json.logoEnabled) ? json.logoEnabled : false,
                showPosterOnEnd: true,
                hideControls: (!/Android/.test(navigator.userAgent)), // Hide on Android devices.
                ads: {
                    enabled: (json.adsEnabled) ? json.adsEnabled : true,
                    headerBidding: true,
                    prerollEnabled: (json.preRollEnabled) ? json.preRollEnabled : true,
                    midrollEnabled: (json.subBannerEnabled) ? json.subBannerEnabled : true,
                    // Todo: Test with 1 minute something video midroll interval.
                    // videoInterval: 60, // (json.preRollSecond) ? json.preRollSecond : 300,
                    // overlayInterval: (json.subBannerSecond) ? json.subBannerSecond : 15,
                    gdprTargeting: this.options.gdprTargeting,
                    tag: (json.adsEnabled && !json.addFreeActive) || this.options.debug ? this.adTag : '',
                    tagLegacy: (json.adsEnabled && !json.addFreeActive) || this.options.debug ? this.adTagLegacy : '',
                    keys: this.options.keys ? JSON.stringify(this.options.keys) : null,
                    domain: this.options.domain,
                    category: this.options.category,
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
                duration: null,
                seekTime: nextCueTime,
                playlist,
                morevideos,
                share: true,
                controls,
                magicvideo,
            });

            // Set some listeners.
            this.player.on('ready', () => {
                // Start transition towards showing the player.
                if (this.options.lottie) {
                    this.animationElement.classList.toggle('tubia__active');
                } else {
                    this.transitionElement.classList.toggle('tubia__active');
                }
                
                setTimeout(() => {
                    // Hide our spinner loader.
                    this.hexagonLoader.classList.toggle('tubia__active');
                }, this.transitionSpeed / 2);

                
                // Return ready callback for our clients.
                try {
                    parent.postMessage({ name: 'onReady' }, this.origin);
                } catch (postMessageError) {
                    console.error(postMessageError);
                }

                // Record Tubia "Video Play" event in Tunnl.
                (new Image()).src = `https://ana.tunnl.com/event?tub_id=${this.videoId}&eventtype=1&page_url=${encodeURIComponent(this.options.url)}`;
            });

            this.player.on('error', (error) => {
                this.onError('loadPlyr player', error);
            });

            this.player.on('adsclick', () => {
                try {
                    /* eslint-disable */
                    window['_cc13997'].bcpw('act', 'ad click');
                    /* eslint-enable */
                } catch (error) {
                    // No need to throw an error or log. It's just Lotame.
                }
            });

            this.player.on('adscomplete', () => {
                try {
                    /* eslint-disable */
                    window['_cc13997'].bcpw('act', 'ad complete');
                    /* eslint-enable */
                } catch (error) {
                    // No need to throw an error or log. It's just Lotame.
                }
            });

            this.player.on('adsimpression', () => {
                try {
                    /* eslint-disable */
                    window['_cc13997'].bcpw('genp', 'ad video');
                    window['_cc13997'].bcpw('act', 'ad impression');
                    /* eslint-enable */
                } catch (error) {
                    // No need to throw an error or log. It's just Lotame.
                }
            });

            this.player.on('adsskipped', () => {
                try {
                    /* eslint-disable */
                    window['_cc13997'].bcpw('act', 'ad skipped');
                    /* eslint-enable */
                } catch (error) {
                    // No need to throw an error or log. It's just Lotame.
                }
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
        utils.loadScript('https://www.google-analytics.com/analytics.js', 'tubia_google_analytics')
            .then(() => {
                /* eslint-disable */
                window['ga']('create', 'UA-102831738-1', {
                    'name': 'tubia',
                    'cookieExpires': 90 * 86400,
                }, 'auto');

                const pageView = {
                    hitType: 'pageview',
                    page: `index.html?publisherid=${this.options.publisherId}&title=${encodeURIComponent(this.options.title)}&url=${encodeURIComponent(this.options.url)}`,
                    location: this.options.domain,
                    title: this.options.title,
                };
                window['ga']('tubia.send', pageView);

                // Anonymize IP for GDPR purposes.
                if (this.options.gdprTracking) {
                    window['ga']('tubia.set', 'anonymizeIp', true);
                }
                /* eslint-enable */
            })
            .catch(error => {
                throw new Error(error);
            });
        if (this.options.gdprTracking) {
            utils.loadScript('https://tags.crwdcntrl.net/c/13997/cc.js?ns=_cc13997', 'LOTCC_13997')
                .then(() => {
                    /* eslint-disable */
                    if (typeof window['_cc13997'] === 'object'
                        && typeof window['_cc13997'].bcpf === 'function'
                        && typeof window['_cc13997'].add === 'function') {
                        window['_cc13997'].add('med', 'video');
                        window['_cc13997'].add('genp', `domain : ${this.origin}`);
                        // Must wait for the load event, before running Lotame.
                        if (document.readyState === 'complete') {
                            window['_cc13997'].bcpf();
                        } else {
                            window['_cc13997'].bcp();
                        }
                    }
                    /* eslint-enable */
                })
                .catch(error => {
                    throw new Error(error);
                });
        }
    }

    /**
     * setTheme
     * Set some theme styling, which overwrites colors of our loaded CSS.
     */
    setTheme() {
        if (this.options.colorMain !== '' && this.options.colorAccent !== '') {
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
            this.container.appendChild(style);
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
        const videoCounterData = `publisherId=${this.options.publisherId}&url=${encodeURIComponent(this.options.url)}&title=${this.options.title}&gameId=${this.options.gameId}&category=${this.options.category}&langCode=${this.options.langCode}`;
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
        }).catch(() => {
            // TODO: Report this issue to honeybadger.
        });
    }
}

export default Player;

window.Player = new Player();
