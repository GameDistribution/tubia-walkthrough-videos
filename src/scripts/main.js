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
            debug: false,
            container: 'player',
            gameId: '', // '2c13796e0f2f4180a84bc64ed53d78e3',
            publisherId: 'dc63a91fa184423482808bed4d782320',
            color: '#ff0080',
            onFound() {},
            onError() {},
            onReady() {},
        };

        if (options) {
            this.options = utils.extendDefaults(defaults, options);
        } else {
            this.options = defaults;
        }

        // Open the debug console when debugging is enabled.
        try {
            if (this.options.debug || localStorage.getItem('gd_debug')) {
                this.openConsole();
            }
        } catch (error) {
            /* eslint-disable */
            console.error(error);
            /* eslint-enable */
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

        // Create the video player.
        // Todo: create the markup up dynamically and append to real container.
        const player = new Plyr(`#${this.options.container}`, {
            debug: false,
            iconUrl: 'sprite.svg',
            color: this.options.color,
            ads: {
                tag: 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480' +
                '&iu=/124319096/external/ad_rule_samples&ciu_szs=300x250&ad_rul' +
                'e=1&impl=s&gdfp_req=1&env=vp&output=vmap&unviewed_position_sta' +
                'rt=1&cust_params=deployment%3Ddevsite%26sample_ar%3Dpremidpost' +
                '&cmsid=496&vid=short_onecue&correlator=',
            },
            keyboard: {
                global: true,
            },
            tooltips: {
                controls: true,
            },
            captions: {
                active: true,
            },
            controls: [
                'play-large',
                // 'play',
                // 'restart',
                'rewind',
                'forward',
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
        // Return callbacks.
        // Todo: add callback for pause, play and others.
        player.on('ready', () => {
            this.options.onReady(player);
            // Todo: do something with onFound.
            this.options.onFound('some data here');
        });
        player.on('error', () => {
            this.options.onError();
        });

        // Get us some video data.
        const videoDataPromise = new Promise((resolve, reject) => {
            // Todo: check if we dont want to use a tubia url.
            // Todo: verify if tubia cdn urls are ssl ready.
            // Todo: make sure to disable ads if enableAds is false. Also for addFreeActive :P
            const videoDataUrl = `https://walkthrough.gamedistribution.com/api/player/publish/?gameid=${this.options.gameId.replace(/-/g, '')}&publisherid=${this.options.publisherId.replace(/-/g, '')}&domain=spele.nl`;
            const videoDataRequest = new Request(videoDataUrl, {method: 'GET'});
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
                    resolve(json);
                }).catch(() => {
                    reject();
                });
        });

        videoDataPromise.then((json) => {
            if (!json) return;
            // Just grab the last video and poster image.
            // Set the video data to our video player.
            player.source = {
                type: 'video',
                title: json.detail[0].title,
                sources: [{
                    src: json.files[json.files.length - 1].linkSecure,
                    type: json.files[json.files.length - 1].type,
                }],
                poster: json.pictures[json.pictures.length - 1].link,
            };
            // Todo: Create seeking cue's as playlist using json.files.cues something data.
        }).catch(error => {
            /* eslint-disable */
            console.error(error);
            /* eslint-enable */
        });
    }
}

/* eslint-disable */
const settings = (typeof TUBIA_OPTIONS === 'object' && TUBIA_OPTIONS)
    ? TUBIA_OPTIONS
    : (window.gdPlayer && typeof window.gdPlayer.q[0][0] === 'object' &&
        window.gdPlayer.q[0][0])
        ? window.gdPlayer.q[0][0]
        : {};
/* eslint-enable */

window.tubia = new Tubia(settings);
window.gdPlayer = window.tubia;
