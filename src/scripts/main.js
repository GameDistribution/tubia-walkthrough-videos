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
            gameId: '4f3d7d38d24b740c95da2b03dc3a2333',
            userId: '31D29405-8D37-4270-BF7C-8D99CCF0177F-s1',
            resumeVideo() {},
            pauseVideo() {},
            onEvent() {},
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
            // console.log(error);
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

        // Plyr video player returns an array regardless.
        // const videoPlayer = instances[0];
        const player = new Plyr('#player', {
            debug: true,
            title: 'View From A Blue Moon',
            iconUrl: 'sprite.svg',
            ads: {
                tagUrl: 'https://pubads.g.doubleclick.net/gampad/ads' +
                '?sz=640x480&iu=/124319096/external/ad_rule_samples&' +
                'ciu_szs=300x250&ad_rule=1&impl=s&gdfp_req=1&env=vp&' +
                'output=vmap&unviewed_position_start=1&cust_params=d' +
                'eployment%3Ddevsite%26sample_ar%3Dpremidpostoptimiz' +
                'edpod&cmsid=496&vid=short_onecue&correlator=',
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
                'play',
                'progress',
                'current-time',
                'mute',
                'volume',
                'captions',
                'settings',
                'fullscreen',
                'pip',
                'airplay',
            ],
        });

        // Expose for testing
        window.player = player;
    }
}

let settings = window.TUBIA_OPTIONS;
settings = (typeof settings === 'object' && settings)
    ? settings
    : {};
window.tubia = new Tubia(settings);
