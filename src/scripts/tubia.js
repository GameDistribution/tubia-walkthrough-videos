import 'es6-promise/auto';
import 'whatwg-fetch';
import PackageJSON from '../../package.json';
import Plyr from './plyr';
import utils from './utils';

const instance = null;

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
        // Make this a singleton.
        if (instance) {
            return instance;
        }

        // Set some defaults. We replace them with real given
        // values further down.
        const defaults = {
            debug: true,
            container: 'player',
            gameId: '',
            publisherId: '',
            title: '',
            category: '',
            langCode: '',
            color: '#1aafff',
            domain: window.location.href.toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0],
            onFound() {},
            onError() {},
            onReady() {},
        };

        if (options) {
            this.options = utils.extendDefaults(defaults, options);
        } else {
            this.options = defaults;
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

        // Load polyfills and range fix.
        // Todo: check if we have missing polyfills. Rather get them as npm bundle.
        utils.loadScript('https://cdn.rangetouch.com/1.0.1/rangetouch.js');

        // Todo: this is the biggest shit ever.
        const MD5Promise = new Promise((resolve) => {
            utils.loadScript('https://common-static.tunnl.com/api/libs/md5/md5.js', () => {
                resolve();
            });
        });

        // Call Google Analytics and Death Star.
        this.analytics();

        // Todo: Add tubia related videos
        // //walkthrough.gamedistribution.com/api/RelatedVideo/?gameMd5=" + A + "&publisherId=" + G
        // + "&domain=" + b + "&skip=0&take=5&orderBy=visit&sortDirection=desc&langCode=" + aa

        // Todo: Add tubia error reporting
        // //walkthrough.gamedistribution.com/api/playernotification?reasonid=" + b + "&url=" +
        // encodeURIComponent(q()) + "&videoid=" + A

        // Send a post request to tell the "matching"-team which video is becoming important.
        // It is basically for updating a click counter or whatever :P
        const videoCounterData = {
            publisherId: this.options.publisherId,
            url: document.location.href,
            title: this.options.title,
            gameId: this.options.gameId,
            category: this.options.category,
            langCode: this.options.langCode,
        };
        // Todo: Tubia API needs to allow OPTIONS header.
        // const videoCounterUrl = 'https://walkthrough.gamedistribution.com/api/player/find/';
        const videoCounterUrl = 'https://test-walkthrough.vooxe.video/api/player/find/';
        const videoCounterRequest = new Request(videoCounterUrl, {
            method: 'POST',
            body: JSON.stringify(videoCounterData),
            headers: new Headers({
                'Content-Type': 'application/json',
            }),
        });
        fetch(videoCounterRequest).
            then((response) => {
                const contentType = response.headers.get('content-type');
                if (!contentType ||
                    !contentType.includes('application/json')) {
                    throw new TypeError('Oops, we didn\'t get JSON!');
                } else {
                    return response.json();
                }
            }).
            then((json) => {
                console.log(json);
            }).
            catch((error) => {
                this.options.onError(error);
            });

        // Search for a matching game within our Tubia database and return the id.
        const videoSearchPromise = new Promise((resolve, reject) => {
            MD5Promise.
                then(() => {
                    // Todo: set document.location.href
                    const pageId = window.calcMD5('http://spele.nl/jewel-burst-spel/');
                    const videoFindUrl = `https://walkthrough.gamedistribution.com/api/player/findv2/?pageId=${pageId}&gameId=${this.options.gameId}&title=${this.options.title}&domain=${this.options.domain}`;
                    const videoSearchRequest = new Request(videoFindUrl, {
                        method: 'GET',
                    });
                    fetch(videoSearchRequest).
                        then((response) => {
                            const contentType = response.headers.get('content-type');
                            if (!contentType ||
                                !contentType.includes('application/json')) {
                                reject();
                                throw new TypeError('Oops, we didn\'t get JSON!');
                            } else {
                                return response.json();
                            }
                        }).
                        then((json) => {
                            resolve(json);
                        }).
                        catch((error) => {
                            this.options.onError(error);
                            reject();
                        });
                }).
                catch((error) => {
                    this.options.onError(error);
                });
        });

        // Get us some video data.
        const videoDataPromise = new Promise((resolve, reject) => {
            // Todo: check if we dont want to use a tubia url.
            // Todo: verify if tubia cdn urls are ssl ready.
            // Todo: make sure to disable ads if enableAds is false. Also for addFreeActive :P
            videoSearchPromise.
                then((id) => {
                    const gameId = (!id) ? this.options.gameId: id;
                    const videoDataUrl = `https://walkthrough.gamedistribution.com/api/player/publish/?gameid=${gameId.replace(/-/g, '')}&publisherid=${this.options.publisherId.replace(/-/g, '')}&domain=${this.options.domain}`;
                    const videoDataRequest = new Request(videoDataUrl, {method: 'GET'});

                    // Record Tubia view event in Tunnl.
                    (new Image()).src = `https://ana.tunnl.com/event?tub_id=${gameId}&eventtype=0&page_url=${encodeURIComponent(document.location.href)}`;

                    fetch(videoDataRequest).
                        then((response) => {
                            const contentType = response.headers.get('content-type');
                            if (!contentType ||
                                !contentType.includes('application/json')) {
                                reject();
                                throw new TypeError('Oops, we didn\'t get JSON!');
                            } else {
                                return response.json();
                            }
                        }).
                        then(json => {
                            this.options.onFound(json);
                            resolve(json);
                        }).
                        catch((error) => {
                            this.options.onError(error);
                            reject(error);
                        });
                }).
                catch((error) => {
                    this.options.onError(error);
                });
        });

        videoDataPromise.
            then((json) => {
                if (!json) {
                    this.options.onError();
                    return;
                }

                // Create the HTML5 video element.
                const videoElement = document.createElement('video');
                videoElement.setAttribute('controls', true);
                videoElement.setAttribute('crossorigin', true);
                videoElement.setAttribute('playsinline', true);
                videoElement.poster = json.pictures[json.pictures.length - 1].link;
                videoElement.id = 'plyr__tubia';

                const videoSource = document.createElement('source');
                videoSource.src = json.files[json.files.length - 1].linkSecure;
                videoSource.type = json.files[json.files.length - 1].type;

                const container = document.getElementById(this.options.container);
                if (container) {
                    // Add our stylesheet.
                    const headElement = document.head;
                    const css = document.createElement('link');
                    css.type = 'text/css';
                    css.rel = 'stylesheet';
                    css.href = 'https://video-static.vooxe.com/libs/gd/main.min.css';
                    const font = document.createElement('link');
                    font.type = 'text/css';
                    font.rel = 'stylesheet';
                    font.href = 'https://fonts.googleapis.com/css?family=Khand:400,700';

                    headElement.appendChild(font);
                    headElement.appendChild(css);
                    videoElement.appendChild(videoSource);
                    container.appendChild(videoElement);
                }

                // Create the video player.
                const adTag = `https://pubads.g.doubleclick.net/gampad/ads?sz=640x360&iu=/8034/Test_bgames&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&url=${encodeURIComponent(window.location.origin)}&description_url=${encodeURIComponent(window.location.href)}&correlator=${Date.now()}`;
                console.log(adTag);
                this.player = new Plyr('#plyr__tubia', {
                    debug: this.options.debug,
                    iconUrl: 'https://video-static.vooxe.com/libs/gd/sprite.svg',
                    color: this.options.color,
                    title: json.detail[0].title,
                    showPosterOnEnd: true,
                    ads: {
                        tag: adTag,
                    },
                    keyboard: {
                        global: true,
                    },
                    tooltips: {
                        seek: true,
                        controls: false,
                    },
                    captions: {
                        active: true,
                    },
                    playlist: {
                        active: true,
                        data: json.cuepoints,
                    },
                    controls: [
                        'logo',
                        'playlist',
                        // 'share',
                        'play-large',
                        'title',
                        // 'play',
                        // 'restart',
                        // 'rewind',
                        // 'forward',
                        'progress',
                        'current-time',
                        'duration',
                        'mute',
                        'volume',
                        'settings',
                        'captions',
                        'fullscreen',
                        'pip',
                        'airplay',
                    ],
                });

                // Set some listeners.
                const videoContainer = document.querySelectorAll('.plyr--video')[0];
                this.player.on('ready', () => {
                    this.options.onReady(this.player);
                    if(videoContainer) {
                        videoContainer.style.opacity = '1';
                    }
                });
                this.player.on('error', (error) => {
                    // Todo: I think Plyr has some error handling div.
                    this.options.onError(error);
                    if(videoContainer) {
                        videoContainer.style.display = 'none';
                    }
                });
            }).
            catch(error => {
                this.options.onError(error);
            });
    }

    /**
     * Analytics
     */
    analytics() {
        /* eslint-disable */
        // Load Google Analytics so we can push out a Google event for
        // each of our events.
        if (typeof window['ga'] === 'undefined') {
            (function(i, s, o, g, r, a, m) {
                i['GoogleAnalyticsObject'] = r;
                i[r] = i[r] || function() {
                    (i[r].q = i[r].q || []).push(arguments);
                }, i[r].l = 1 * new Date();
                a = s.createElement(o),
                    m = s.getElementsByTagName(o)[0];
                a.async = 1;
                a.src = g;
                m.parentNode.insertBefore(a, m);
            })(window, document, 'script',
                'https://www.google-analytics.com/analytics.js', 'ga');
        }
        window['ga']('create', 'UA-102831738-1', {'name': 'tubia'}, 'auto');
        // Inject Death Star id's to the page view.
        const lcl = utils.getCookie('brzcrz_local');
        if (lcl) {
            window['ga']('tubia.set', 'userId', lcl);
            window['ga']('tubia.set', 'dimension1', lcl);
        }
        window['ga']('tubia.send', 'pageview');

        // Project Death Star.
        // https://bitbucket.org/keygamesnetwork/datacollectionservice
        const script = document.createElement('script');
        script.innerHTML = `
            var DS_OPTIONS = {
                id: 'TUBIA',
                success: function(id) {
                    window['ga']('tubia.set', 'userId', id); 
                    window['ga']('tubia.set', 'dimension1', id);
                    window['ga']('tubia.set', 'dimension2', '${this.options.category.toLowerCase()}');
                }
            }
        `;
        document.head.appendChild(script);

        // Load Death Star
        (function(window, document, element, source) {
            const ds = document.createElement(element);
            const m = document.getElementsByTagName(element)[0];
            ds.type = 'text/javascript';
            ds.async = true;
            ds.src = source;
            m.parentNode.insertBefore(ds, m);
        })(window, document, 'script',
            'https://game.gamemonkey.org/static/main.min.js');
        /* eslint-enable */
    }
}

export default Tubia;
