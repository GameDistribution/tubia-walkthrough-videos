'use strict';

import 'es6-promise/auto';
import 'whatwg-fetch';
import PackageJSON from '../../package.json';
import VideoAd from './components/VideoAd';
import VideoPlayer from './components/VideoPlayer';
import EventBus from './components/EventBus';
import ImplementationTest from './components/ImplementationTest';

import {dankLog} from './modules/dankLog';
import {
    extendDefaults,
    getParentUrl,
    getCookie,
} from './modules/common';

let instance = null;

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
        } else {
            instance = this;
        }

        // Set some defaults. We replace them with real given
        // values further down.
        const defaults = {
            debug: false,
            gameId: '4f3d7d38d24b740c95da2b03dc3a2333',
            userId: '31D29405-8D37-4270-BF7C-8D99CCF0177F-s1',
            resumeVideo: function() {
                // ...
            },
            pauseVideo: function() {
                // ...
            },
            onEvent: function(event) {
                // ...
            },
        };

        if (options) {
            this.options = extendDefaults(defaults, options);
        } else {
            this.options = defaults;
        }

        // Open the debug console when debugging is enabled.
        try {
            if (this.options.debug || localStorage.getItem('gd_debug')) {
                this.openConsole();
            }
        } catch (error) {
            console.log(error);
        }

        // Set a version banner within the developer console.
        const version = PackageJSON.version;
        const banner = console.log(
            '%c %c %c Tubia Video Walkthrough | Version: ' +
            version + ' %c %c %c', 'background: #01567d',
            'background: #00405c', 'color: #fff; background: #002333;',
            'background: #00405c', 'background: #01567d',
            'background: #006897');
        /* eslint-disable */
        console.log.apply(console, banner);
        /* eslint-enable */

        // Get referrer domain data.
        const referrer = getParentUrl();

        // Todo: enable analytics.
        // Call Google Analytics.
        // this._googleAnalytics();

        // Call Death Star.
        // this._deathStar();

        // Record a video "play"-event in Tunnl.
        // (new Image()).src = 'https://ana.tunnl.com/event' +
        // '?page_url=' + encodeURIComponent(referrer) +
        // '&game_id=' + this.options.gameId +
        // '&eventtype=1';

        // Setup all event listeners.
        // We also send a Google Analytics event for each one of our events.
        this.eventBus = new EventBus();

        // SDK events.
        this.eventBus.subscribe('TUBIA_READY', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('TUBIA_ERROR', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('TUBIA_VIDEO_RESUME',
            (arg) => this._onEvent(arg));
        this.eventBus.subscribe('TUBIA_VIDEO_PAUSE',
            (arg) => this._onEvent(arg));

        // IMA HTML5 SDK events.
        this.eventBus.subscribe('AD_SDK_LOADER_READY',
            (arg) => this._onEvent(arg));
        this.eventBus.subscribe('AD_SDK_MANAGER_READY',
            (arg) => this._onEvent(arg));
        this.eventBus.subscribe('AD_SDK_REQUEST_ADS',
            (arg) => this._onEvent(arg));
        this.eventBus.subscribe('AD_SDK_ERROR', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('AD_SDK_FINISHED', (arg) => this._onEvent(arg));

        // Ad events.
        this.eventBus.subscribe('AD_CANCELED', (arg) => {
            this._onEvent(arg);
            this.onResumeVideo(
                'Advertisement error, no worries, start / resume the video.',
                'warning');
        });
        this.eventBus.subscribe('AD_ERROR', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('AD_SAFETY_TIMER', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('AD_BREAK_READY', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('AD_METADATA', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('ALL_ADS_COMPLETED',
            (arg) => this._onEvent(arg));
        this.eventBus.subscribe('CLICK', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('COMPLETE', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('CONTENT_PAUSE_REQUESTED', (arg) => {
            this._onEvent(arg);
            this.onPauseVideo('New advertisements requested and loaded',
                'success');
        });
        this.eventBus.subscribe('CONTENT_RESUME_REQUESTED', (arg) => {
            this._onEvent(arg);
            this.onResumeVideo(
                'Advertisement(s) are done. Start / resume the video.',
                'success');
        });
        this.eventBus.subscribe('DURATION_CHANGE', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('FIRST_QUARTILE', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('IMPRESSION', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('INTERACTION', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('LINEAR_CHANGED', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('LOADED', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('LOG', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('MIDPOINT', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('PAUSED', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('RESUMED', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('SKIPPABLE_STATE_CHANGED',
            (arg) => this._onEvent(arg));
        this.eventBus.subscribe('SKIPPED', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('STARTED', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('THIRD_QUARTILE', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('USER_CLOSE', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('VOLUME_CHANGED', (arg) => this._onEvent(arg));
        this.eventBus.subscribe('VOLUME_MUTED', (arg) => this._onEvent(arg));

        // Set some states.
        this.initialUserAction = false;

        // Start our advertisement instance first. That way we have our
        // advertisement ready before the actual player is setup.
        // Setting up the adsLoader should resolve the videoAdPromise.
        const videoElement = document.getElementsByTagName('video')[0];
        this.videoAdInstance = new VideoAd(videoElement);
        this.videoAdInstance.tag = 'https://pub.tunnl.com/opp' +
            '?page_url=' + encodeURIComponent(referrer) +
            '&player_width=640' +
            '&player_height=480' +
            '&game_id=' + this.options.gameId;

        // Enable some debugging perks.
        try {
            if (localStorage.getItem('tubia_debug')) {
                // So we can set a custom tag.
                if (localStorage.getItem('tubia_tag')) {
                    this.videoAdInstance.tag =
                        localStorage.getItem('tubia_tag');
                }
            }
        } catch (error) {
            console.log(error);
        }

        this.videoAdInstance.start();

        // Ad ready or failed.
        // Wait for our video ad promise to resolve or reject, which should
        // be resolved before an ad can be called from a user interaction.
        this.videoAdPromise = new Promise((resolve, reject) => {
            // The ad is pre-loaded and ready.
            this.eventBus.subscribe('AD_SDK_MANAGER_READY', () => resolve());
            // The IMA SDK failed.
            this.eventBus.subscribe('AD_SDK_ERROR', (error) => reject(error));
            // It can happen that the first ad request failed... unlucky.
            this.eventBus.subscribe('AD_CANCELED', (error) => reject(error));
        });

        this.videoAdPromise.then(() => {
            // Setup the Plyr video player.
            const instances = VideoPlayer.setup({
                debug: true,
                iconPrefix: 'icon',
                iconUrl: 'sprite.svg',
                tooltips: {
                    controls: true,
                },
                captions: {
                    defaultActive: true,
                },
            });
            // Plyr video player returns an array regardless.
            this.videoPlayer = instances[0];

            // Setup a promise to tell our publisher that the player is ready.
            this.videoPlayerPromise = new Promise((resolve, reject) => {
                this.videoPlayer.on('ready', () => {
                    resolve();
                });
                this.videoPlayer.on('error', (error) => {
                    reject(error);
                });
            });

            // Tell IMA SDK that our video content has ended.
            this.videoPlayer.on('ended', () => {
                console.log('CONTENT ENDED!!!!');
                this.videoAdInstance.contentEnded();
            });

            // Tell IMA SDK that ad rules and advertisements can be started.
            this.videoPlayer.on('play', () => {
                if (!this.initialUserAction) {
                    // The user clicked/tapped - inform the ads controller that
                    // this code is being run in a user action thread.
                    this.videoAdInstance.initialUserAction();
                    this.initialUserAction = true;
                }
            });

            // Todo: move playlist into plyr script.
            this._createPlayList();
        });

        // Now check if everything is ready, so we can tell our publisher.
        Promise.all([
            this.videoPlayerPromise,
            this.videoAdPromise,
        ]).then(() => {
            let eventName = 'TUBIA_READY';
            let eventMessage = 'Everything is ready.';
            this.eventBus.broadcast(eventName, {
                name: eventName,
                message: eventMessage,
                status: 'success',
                analytics: {
                    category: 'TUBIA',
                    action: eventName,
                    label: this.options.gameId,
                },
            });
        }).catch((error) => {
            let eventName = 'TUBIA_ERROR';
            let eventMessage = 'TUBIA failed.';
            this.eventBus.broadcast(eventName, {
                name: eventName,
                message: eventMessage,
                status: 'error',
                analytics: {
                    category: 'TUBIA',
                    action: eventName,
                    label: error,
                },
            });
        });
    }

    /**
     * createPlayList
     * @private
     */
    _createPlayList() {
        // Create the playlist.
        // Todo: scroll to top if current item is active.
        // Todo: autoplay playlist.
        const playlist = document.querySelector('.plyr__playlist ul');
        if (playlist) {
            for (let i = 0; i < myPlaylist.length; i++) {
                let k = i + 1;
                const source = myPlaylist[i];
                let itemNumber = 0;
                const count = document.createElement('span');
                count.className = 'plyr__count';
                if (k.toString().length === 1) {
                    itemNumber = '0' + k;
                }
                count.innerText = '' + itemNumber;

                const title = document.createElement('span');
                title.className = 'plyr__title';
                title.innerText = source.title;

                const item = document.createElement('li');
                item.style.backgroundImage =
                    'url("data:image/svg+xml;base64,' +
                    /* eslint-disable */
                    'PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+DQogIDxyZWN0IHdpZHRoPScxMCcgaGVpZ2h0PScxMCcgZmlsbD0nIzAwMCcgZmlsbC1vcGFjaXR5PSIwLjYiIC8+DQogIDxyZWN0IHg9JzAnIHk9JzAnIHdpZHRoPSc1JyBoZWlnaHQ9JzUnIGZpbGw9JyMwMDAnIGZpbGwtb3BhY2l0eT0iMSIgLz4NCjwvc3ZnPg==' +
                    /* eslint-enable */
                    '"), url(' + source.poster + ')';
                item.style.backgroundSize = '2px, cover';
                item.style.backgroundPosition = 'center, center';
                item.style.backgroundRepeat = 'repeat, no-repeat';

                item.appendChild(count);
                item.appendChild(title);

                if (i === 0) {
                    item.className = 'active';
                }

                item.addEventListener('click', () => {
                    this.videoPlayer.source(source);
                    const playlistItems = document.querySelectorAll(
                        '.plyr__playlist ul li');
                    if (playlistItems.length > 0) {
                        for (let i = 0; i < playlistItems.length; i++) {
                            playlistItems[i].className = '';
                        }
                        item.className = 'active';
                    }
                });

                playlist.appendChild(item);
            }
        }
    }

    /**
     * _onEvent
     * Gives us a nice console log message for all our events going
     * through the EventBus.
     * @param {Object} event
     * @private
     */
    _onEvent(event) {
        // Show the event in the log.
        dankLog(event.name, event.message, event.status);
        // Push out a Google event for each event. Makes our
        // life easier. I think.
        try {
            /* eslint-disable */
            if (typeof window['ga'] !== 'undefined') {
                window['ga']('gd.send', {
                    hitType: 'event',
                    eventCategory: (event.analytics.category)
                        ? event.analytics.category
                        : '',
                    eventAction: (event.analytics.action)
                        ? event.analytics.action
                        : '',
                    eventLabel: (event.analytics.label)
                        ? event.analytics.label
                        : '',
                });
            }
            /* eslint-enable */
        } catch (error) {
            console.log(error);
        }
        // Now send the event to the developer.
        this.options.onEvent(event);
    }

    /**
     * _googleAnalytics
     * @private
     */
    _googleAnalytics() {
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
        window['ga']('create', 'UA-102601800-1', {'name': 'gd'}, 'auto');
        // Inject Death Star id's to the page view.
        const lcl = getCookie('brzcrz_local');
        if (lcl) {
            window['ga']('gd.set', 'userId', lcl);
            window['ga']('gd.set', 'dimension1', lcl);
        }
        window['ga']('gd.send', 'pageview');
        /* eslint-enable */
    }

    /**
     * _deathStar
     * @private
     */
    _deathStar() {
        /* eslint-disable */
        // Project Death Star.
        // https://bitbucket.org/keygamesnetwork/datacollectionservice
        const script = document.createElement('script');
        script.innerHTML = `
            var DS_OPTIONS = {
                id: 'GAMEDISTRIBUTION',
                success: function(id) {
                    window['ga']('gd.set', 'userId', id); 
                    window['ga']('gd.set', 'dimension1', id);
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

        // Try to send some additional analytics to Death Star.
        // Todo: fix this.
        // try {
        // let tagsArray = [];
        // gameData.tags.forEach((tag) => {
        // tagsArray.push(tag.title.toLowerCase());
        // });
        // window['ga']('gd.set', 'dimension2',
        // gameData.title.toLowerCase());
        // window['ga']('gd.set', 'dimension3',
        // tagsArray.join(', '));
        // } catch (error) {
        // console.log(error);
        // }
    }

    /**
     * onResumeVideo
     * Resume the video when an advertisement is done.
     * @param {String} message
     * @param {String} status
     */
    onResumeVideo(message, status) {
        this.videoPlayer.play();

        let eventName = 'TUBIA_VIDEO_RESUME';
        this.eventBus.broadcast(eventName, {
            name: eventName,
            message: message,
            status: status,
            analytics: {
                category: 'TUBIA',
                action: eventName,
                label: this.options.gameId,
            },
        });
    }

    /**
     * onPauseVideo
     * Pause the video when an advertisement is playing.
     * @param {String} message
     * @param {String} status
     */
    onPauseVideo(message, status) {
        this.videoPlayer.pause();

        let eventName = 'TUBIA_VIDEO_PAUSE';
        this.eventBus.broadcast(eventName, {
            name: eventName,
            message: message,
            status: status,
            analytics: {
                category: 'TUBIA',
                action: eventName,
                label: this.options.gameId,
            },
        });
    }

    /**
     * openConsole
     * Enable debugging, we also set a value in localStorage,
     * so we can also enable debugging without setting the property.
     * @public
     */
    openConsole() {
        try {
            const implementation = new ImplementationTest();
            implementation.start();
            localStorage.setItem('tubia_debug', true);
        } catch (error) {
            console.log(error);
        }
    }
}

export default Tubia;

const settings = (typeof TUBIA_OPTIONS === 'object' && TUBIA_OPTIONS)
    ? TUBIA_OPTIONS
    : {};
window.tubia = new Tubia(settings);
