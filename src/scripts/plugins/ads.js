// ==========================================================================
// Advertisement plugin using Google IMA HTML5 SDK
// Create an account with our ad partner, vi here:
// https://www.vi.ai/publisher-video-monetization/
// ==========================================================================

/* global google */

import utils from '../utils';

class Ads {
    /**
     * Ads constructor.
     * @param {object} player
     * @return {Ads}
     */
    constructor(player) {
        this.player = player;
        this.playing = false;
        this.initialized = false;
        this.enabled = utils.is.url(player.config.ads.tag);

        // Check if a tag URL is provided.
        if (!this.enabled) {
            return;
        }

        // Check if the Google IMA3 SDK is loaded
        if (!utils.is.object(window.google)) {
            utils.loadScript(player.config.urls.googleIMA.api, () => {
                this.ready();
            });
        } else {
            this.ready();
        }
    }

    /**
     * Get the ads instance ready.
     */
    ready() {
        this.elements = {
            container: null,
            displayContainer: null,
        };
        this.manager = null;
        this.loader = null;
        this.cuePoints = null;
        this.events = {};
        this.safetyTimer = null;
        this.countdownTimer = null;

        // Set listeners on the Plyr instance
        this.listeners();

        // Start ticking our safety timer. If the whole advertisement
        // thing doesn't resolve within our set time; we bail
        this.startSafetyTimer(12000, 'ready()');

        // Setup a simple promise to resolve if the IMA loader is ready
        this.loaderPromise = new Promise(resolve => {
            this.on('ADS_LOADER_LOADED', () => resolve());
        });

        // Setup a promise to resolve if the IMA manager is ready
        this.managerPromise = new Promise(resolve => {
            this.on('ADS_MANAGER_LOADED', () => resolve());
        });

        // Clear the safety timer
        this.managerPromise.then(() => {
            this.clearSafetyTimer('onAdsManagerLoaded()');
        });

        // Setup the IMA SDK
        this.setupIMA();
    }

    /**
     * In order for the SDK to display ads for our video, we need to tell it where to put them,
     * so here we define our ad container. This div is set up to render on top of the video player.
     * Using the code below, we tell the SDK to render ads within that div. We also provide a
     * handle to the content video player - the SDK will poll the current time of our player to
     * properly place mid-rolls. After we create the ad display container, we initialize it. On
     * mobile devices, this initialization is done as the result of a user action.
     */
    setupIMA() {
        // Create the container for our advertisements
        this.elements.container = utils.createElement('div', {
            class: this.player.config.classNames.ads,
            hidden: '',
        });
        this.player.elements.container.appendChild(this.elements.container);

        // So we can run VPAID2
        google.ima.settings.setVpaidMode(google.ima.ImaSdkSettings.VpaidMode.ENABLED);

        // Set language
        google.ima.settings.setLocale(this.player.config.ads.language);

        // We assume the adContainer is the video container of the plyr element
        // that will house the ads
        this.elements.displayContainer = new google.ima.AdDisplayContainer(this.elements.container);

        // Request video ads to be pre-loaded
        this.requestAds();
    }

    /**
     * Request advertisements
     */
    requestAds() {
        const { container } = this.player.elements;

        try {
            // Create ads loader
            this.loader = new google.ima.AdsLoader(this.elements.displayContainer);

            // Listen and respond to ads loaded and error events
            this.loader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, event => this.onAdsManagerLoaded(event), false);
            this.loader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, error => this.onAdError(error), false);

            // Request video ads
            const request = new google.ima.AdsRequest();
            request.adTagUrl = this.player.config.ads.tag;

            // Specify the linear and nonlinear slot sizes. This helps the SDK
            // to select the correct creative if multiple are returned
            request.linearAdSlotWidth = container.offsetWidth;
            request.linearAdSlotHeight = container.offsetHeight;
            request.nonLinearAdSlotWidth = container.offsetWidth;
            request.nonLinearAdSlotHeight = container.offsetHeight;

            // We only overlay ads as we only support video.
            request.forceNonLinearFullSlot = false;

            this.loader.requestAds(request);

            this.handleEventListeners('ADS_LOADER_LOADED');
        } catch (e) {
            this.onAdError(e);
        }
    }

    /**
     * Update the ad countdown
     * @param {boolean} start
     */
    pollCountdown(start = false) {
        if (!start) {
            window.clearInterval(this.countdownTimer);
            this.elements.container.removeAttribute('data-badge-text');
            return;
        }

        const update = () => {
            const time = utils.formatTime(this.manager.getRemainingTime());
            this.elements.container.setAttribute('data-badge-text', time);
        };

        this.countdownTimer = window.setInterval(update, 100);
    }

    /**
     * This method is called whenever the ads are ready inside the AdDisplayContainer
     * @param {Event} adsManagerLoadedEvent
     */
    onAdsManagerLoaded(adsManagerLoadedEvent) {
        // Get the ads manager
        const settings = new google.ima.AdsRenderingSettings();

        // Tell the SDK to save and restore content video state on our behalf
        settings.restoreCustomPlaybackStateOnAdBreakComplete = true;
        settings.enablePreloading = true;

        // The SDK is polling currentTime on the contentPlayback. And needs a duration
        // so it can determine when to start the mid- and post-roll
        this.manager = adsManagerLoadedEvent.getAdsManager(this.player, settings);

        // Get the cue points for any mid-rolls by filtering out the pre- and post-roll
        this.cuePoints = this.manager.getCuePoints();

        // Add advertisement cue's within the time line if available
        this.cuePoints.forEach(cuePoint => {
            if (cuePoint !== 0 && cuePoint !== -1) {
                const seekElement = this.player.elements.progress;

                if (seekElement) {
                    const cuePercentage = 100 / this.player.duration * cuePoint;
                    const cue = utils.createElement('span', {
                        class: this.player.config.classNames.cues,
                    });

                    cue.style.left = `${cuePercentage.toString()}%`;
                    seekElement.appendChild(cue);
                }
            }
        });

        // Get skippable state
        // TODO: Skip button
        // this.manager.getAdSkippableState();

        // Set volume to match player
        this.manager.setVolume(this.player.volume);

        // Add listeners to the required events
        // Advertisement error events
        this.manager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, error => this.onAdError(error));

        // Advertisement regular events
        Object.keys(google.ima.AdEvent.Type).forEach(type => {
            this.manager.addEventListener(google.ima.AdEvent.Type[type], event => this.onAdEvent(event));
        });

        // Resolve our adsManager
        this.handleEventListeners('ADS_MANAGER_LOADED');
    }

    /**
     * This is where all the event handling takes place. Retrieve the ad from the event. Some
     * events (e.g. ALL_ADS_COMPLETED) don't have the ad object associated
     * https://developers.google.com/interactive-media-ads/docs/sdks/html5/v3/apis#ima.AdEvent.Type
     * @param {Event} event
     */
    onAdEvent(event) {
        const { container } = this.player.elements;

        // Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED)
        // don't have ad object associated
        const ad = event.getAd();

        // Proxy event
        const dispatchEvent = type => {
            utils.dispatchEvent.call(this.player, this.player.media, `ads${type}`);
        };

        switch (event.type) {
            case google.ima.AdEvent.Type.LOADED:
                // This is the first event sent for an ad - it is possible to determine whether the
                // ad is a video ad or an overlay
                this.handleEventListeners('LOADED');

                // Bubble event
                dispatchEvent('loaded');

                // Start countdown
                this.pollCountdown(true);

                if (!ad.isLinear()) {
                    // Position AdDisplayContainer correctly for overlay
                    ad.width = container.offsetWidth;
                    ad.height = container.offsetHeight;
                }

                // console.info('Ad type: ' + event.getAd().getAdPodInfo().getPodIndex());
                // console.info('Ad time: ' + event.getAd().getAdPodInfo().getTimeOffset());
                break;

            case google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
                // All ads for the current videos are done. We can now request new advertisements
                // in case the video is re-played
                this.handleEventListeners('ALL_ADS_COMPLETED');

                // Fire event
                dispatchEvent('allcomplete');

                // TODO: Example for what happens when a next video in a playlist would be loaded.
                // So here we load a new video when all ads are done.
                // Then we load new ads within a new adsManager. When the video
                // Is started - after - the ads are loaded, then we get ads.
                // You can also easily test cancelling and reloading by running
                // player.ads.cancel() and player.ads.play from the console I guess.
                // this.player.source = {
                //     type: 'video',
                //     title: 'View From A Blue Moon',
                //     sources: [{
                //         src:
                // 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.mp4', type:
                // 'video/mp4', }], poster:
                // 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg', tracks:
                // [ { kind: 'captions', label: 'English', srclang: 'en', src:
                // 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.en.vtt',
                // default: true, }, { kind: 'captions', label: 'French', srclang: 'fr', src:
                // 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.fr.vtt', }, ],
                // };

                // TODO: So there is still this thing where a video should only be allowed to start
                // playing when the IMA SDK is ready or has failed

                this.loadAds();
                break;

            case google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED:
                // This event indicates the ad has started - the video player can adjust the UI,
                // for example display a pause button and remaining time. Fired when content should
                // be paused. This usually happens right before an ad is about to cover the content
                this.handleEventListeners('CONTENT_PAUSE_REQUESTED');

                dispatchEvent('contentpause');

                this.pauseContent();

                break;

            case google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED:
                // This event indicates the ad has finished - the video player can perform
                // appropriate UI actions, such as removing the timer for remaining time detection.
                // Fired when content should be resumed. This usually happens when an ad finishes
                // or collapses
                this.handleEventListeners('CONTENT_RESUME_REQUESTED');

                dispatchEvent('contentresume');

                this.pollCountdown();

                this.resumeContent();

                break;

            case google.ima.AdEvent.Type.STARTED:
                dispatchEvent('started');
                break;

            case google.ima.AdEvent.Type.MIDPOINT:
                dispatchEvent('midpoint');
                break;

            case google.ima.AdEvent.Type.COMPLETE:
                dispatchEvent('complete');
                break;

            case google.ima.AdEvent.Type.IMPRESSION:
                dispatchEvent('impression');
                break;

            case google.ima.AdEvent.Type.CLICK:
                dispatchEvent('click');
                break;

            default:
                break;
        }
    }

    /**
     * Any ad error handling comes through here
     * @param {Event} event
     */
    onAdError(event) {
        this.cancel();
        this.player.debug.log('Ads error', event);
    }

    /**
     * Setup hooks for Plyr and window events. This ensures
     * the mid- and post-roll launch at the correct time. And
     * resize the advertisement when the player resizes
     */
    listeners() {
        const { container } = this.player.elements;
        let time;

        // Add listeners to the required events
        this.player.on('ended', () => {
            this.loader.contentComplete();
        });

        this.player.on('seeking', () => {
            time = this.player.currentTime;
            return time;
        });

        this.player.on('seeked', () => {
            const seekedTime = this.player.currentTime;

            this.cuePoints.forEach((cuePoint, index) => {
                if (time < cuePoint && cuePoint < seekedTime) {
                    this.manager.discardAdBreak();
                    this.cuePoints.splice(index, 1);
                }
            });
        });

        // Listen to the resizing of the window. And resize ad accordingly
        // TODO: eventually implement ResizeObserver
        window.addEventListener('resize', () => {
            this.manager.resize(container.offsetWidth, container.offsetHeight, google.ima.ViewMode.NORMAL);
        });
    }

    /**
     * Initialize the adsManager and start playing advertisements
     */
    play() {
        const { container } = this.player.elements;

        if (!this.managerPromise) {
            return;
        }

        // Play the requested advertisement whenever the adsManager is ready
        this.managerPromise.then(() => {
            // Initialize the container. Must be done via a user action on mobile devices
            this.elements.displayContainer.initialize();

            try {
                if (!this.initialized) {
                    // Initialize the ads manager. Ad rules playlist will start at this time
                    this.manager.init(container.offsetWidth, container.offsetHeight, google.ima.ViewMode.NORMAL);

                    // Call play to start showing the ad. Single video and overlay ads will
                    // start at this time; the call will be ignored for ad rules
                    this.manager.start();
                }

                this.initialized = true;
            } catch (adError) {
                // An error may be thrown if there was a problem with the
                // VAST response
                this.onAdError(adError);
            }
        });
    }

    /**
     * Resume our video.
     */
    resumeContent() {
        // Hide our ad container
        utils.toggleHidden(this.elements.container, true);

        // Ad is stopped
        this.playing = false;

        // Play our video
        if (this.player.currentTime < this.player.duration) {
            this.player.play();
        }
    }

    /**
     * Pause our video
     */
    pauseContent() {
        // Show our ad container.
        utils.toggleHidden(this.elements.container, false);

        // Ad is playing.
        this.playing = true;

        // Pause our video.
        this.player.pause();
    }

    /**
     * Destroy the adsManager so we can grab new ads after this. If we don't then we're not
     * allowed to call new ads based on google policies, as they interpret this as an accidental
     * video requests. https://developers.google.com/interactive-
     * media-ads/docs/sdks/android/faq#8
     */
    cancel() {
        // Pause our video
        if (this.initialized) {
            this.resumeContent();
        }

        // Tell our instance that we're done for now
        this.handleEventListeners('ERROR');

        // Re-create our adsManager
        this.loadAds();
    }

    /**
     * Re-create our adsManager
     */
    loadAds() {
        // Tell our adsManager to go bye bye
        this.managerPromise.then(() => {
            // Destroy our adsManager
            if (this.manager) {
                this.manager.destroy();
            }

            // Re-set our adsManager promises
            this.managerPromise = new Promise(resolve => {
                this.on('ADS_MANAGER_LOADED', () => resolve());
                this.player.debug.log(this.manager);
            });

            // Now request some new advertisements
            this.requestAds();
        });
    }

    /**
     * Handles callbacks after an ad event was invoked
     * @param {string} event - Event type
     */
    handleEventListeners(event) {
        if (utils.is.function(this.events[event])) {
            this.events[event].call(this);
        }
    }

    /**
     * Add event listeners
     * @param {string} event - Event type
     * @param {function} callback - Callback for when event occurs
     * @return {Ads}
     */
    on(event, callback) {
        this.events[event] = callback;
        return this;
    }

    /**
     * Setup a safety timer for when the ad network doesn't respond for whatever reason.
     * The advertisement has 12 seconds to get its things together. We stop this timer when the
     * advertisement is playing, or when a user action is required to start, then we clear the
     * timer on ad ready
     * @param {number} time
     * @param {string} from
     */
    startSafetyTimer(time, from) {
        this.player.debug.log(`Safety timer invoked from: ${from}`);

        this.safetyTimer = window.setTimeout(() => {
            this.cancel();
            this.clearSafetyTimer('startSafetyTimer()');
        }, time);
    }

    /**
     * Clear our safety timer(s)
     * @param {string} from
     */
    clearSafetyTimer(from) {
        if (!utils.is.nullOrUndefined(this.safetyTimer)) {
            this.player.debug.log(`Safety timer cleared from: ${from}`);

            clearTimeout(this.safetyTimer);
            this.safetyTimer = null;
        }
    }
}

export default Ads;
