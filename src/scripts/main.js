import 'es6-promise/auto';
import 'whatwg-fetch';
import PackageJSON from '../../package.json';
import Plyr from './plyr';
import utils from './utils';

const instance = null;

/* eslint-disable */
const myPlaylist = [
    {
        type: 'video',
        title: 'Level 1',
        author: 'Gamedistribution',
        sources: [
            {
                src: 'yY_wD7rg4o4',
                type: 'youtube',
            }],
        poster: '//img.gamedistribution.com/09fefe9954da4aa5bb4923e662abd0d8.jpg',
    }, {
        type: 'video',
        title: 'Level 2',
        author: 'Gamedistribution',
        sources: [
            {
                src: 'no4QliMYFaw',
                type: 'youtube',
            }],
        poster: '//img.gamedistribution.com/4eda37038a3f4310b6330a1c7441f48a.jpg',
    }, {
        type: 'video',
        title: 'Level 3 - Bonus!',
        author: 'Gamedistribution',
        sources: [
            {
                src: 'SotFIzMGU5Y',
                type: 'youtube',
            }],
        poster: '//img.gamedistribution.com/268e2d230a4c4ee58c52bc9ddff62838.jpg',
    }, {
        type: 'video',
        title: 'Level 4',
        author: 'Gamedistribution',
        sources: [
            {
                src: 'mpFiRTHBAWY',
                type: 'youtube',
            }],
        poster: '//img.gamedistribution.com/0095b1d5dcb645d88971010491627362.jpg',
    }, {
        type: 'video',
        title: 'Level 5',
        author: 'Gamedistribution',
        sources: [
            {
                src: 'mpFiRTHBAWY',
                type: 'youtube',
            }],
        poster: '//img.gamedistribution.com/db770064d7cd45a798b096d4397a0870.jpg',
    }, {
        type: 'video',
        title: 'Level 6',
        author: 'Gamedistribution',
        sources: [
            {
                src: 'pkzmQobvFy4',
                type: 'youtube',
            }],
        poster: '//img.gamedistribution.com/f07403fb3a4e4278944d0b540a6de3ff.jpg',
    }, {
        type: 'video',
        title: 'Level 7',
        author: 'Gamedistribution',
        sources: [
            {
                src: 'yigTl-Nz9bI',
                type: 'youtube',
            }],
        poster: '//img.gamedistribution.com/6acda84726fe45b784e3a3afe23aaad4.jpg',
    }, {
        type: 'video',
        title: 'Level 8',
        author: 'Gamedistribution',
        sources: [
            {
                src: '0JssWLS7MsQ',
                type: 'youtube',
            }],
        poster: '//img.gamedistribution.com/de857b96d0a540e18b2a4037a8b7d6d8.jpg',
    }, {
        type: 'video',
        title: 'Level 9',
        author: 'Gamedistribution',
        sources: [
            {
                src: 'pkzmQobvFy4&t',
                type: 'youtube',
            }],
        poster: '//img.gamedistribution.com/f6f42e8013fe45df91d48689c63a08d1.jpg',
    }, {
        type: 'video',
        title: 'Level 10',
        author: 'Gamedistribution',
        sources: [
            {
                src: 'nU0iGUkPDTc',
                type: 'youtube',
            }],
        poster: '//img.gamedistribution.com/41bba635f3b94f118641f81b6632c347.jpg',
    }, {
        type: 'video',
        title: 'Level 11',
        author: 'Gamedistribution',
        sources: [
            {
                src: 'BBVdUImE5N0',
                type: 'youtube',
            }],
        poster: '//img.gamedistribution.com/024bd7264a574b4682d5640e9b0de8e0.jpg',
    }, {
        type: 'video',
        title: 'Level 12',
        author: 'Gamedistribution',
        sources: [
            {
                src: 'dciY7yfCcjo',
                type: 'youtube',
            }],
        poster: '//img.gamedistribution.com/2417f059ba0c43d1bfab9061a313343e.jpg',
    }, {
        type: 'video',
        title: 'Level 13',
        author: 'Gamedistribution',
        sources: [
            {
                src: '1RUraQtNVo4',
                type: 'youtube',
            }],
        poster: '//img.gamedistribution.com/c035e676ef654227b1537dabbf194e00.jpg',
    }];

/* eslint-enable */

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
            gameId: '2c13796e0f2f4180a84bc64ed53d78e3',
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
        utils.loadScript('https://cdn.rangetouch.com/1.0.1/rangetouch.js');

        // Plyr video player returns an array regardless.
        // const videoPlayer = instances[0];
        const player = new Plyr('#player', {
            debug: false,
            iconUrl: 'sprite.svg',
            color: this.options.color,
            ads: {
                tagUrl: 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480' +
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
        player.on('ready', () => {
            this.options.onReady(player);
            this.options.onFound();
        });
        player.on('error', () => {
            this.options.onError();
        });

        // Get us some video data.
        const videoDataPromise = new Promise((resolve, reject) => {
            const videoDataUrl = `http://walkthrough.gamedistribution.com/api/player/publish/?gameid=${this.options.gameId.replace(/-/g, '')}&publisherid=${this.options.publisherId.replace(/-/g, '')}&domain=spele.nl`;
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
