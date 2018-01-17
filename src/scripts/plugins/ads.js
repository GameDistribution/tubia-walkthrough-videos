import utils from '../utils';

class Ads {
    constructor(player) {
        this.player = player;
        this.playing = false;
        this.initialized = false;

        // Check if a tag URL is provided.
        if (!utils.is.url(player.config.ads.tagUrl)) {
            return this;
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

    ready() {
        this.time = Date.now();
        this.adsContainer = null;
        this.adDisplayContainer = null;
        this.adsManager = null;
        this.adsLoader = null;
        this.adsCuePoints = null;
        this.currentAd = null;
        this.events = {};
        this.safetyTimer = null;

        // Set listeners on the Plyr instance.
        this.setupListeners();

        // Start ticking our safety timer. If the whole advertisement
        // thing doesn't resolve within our set time; we bail.
        this.startSafetyTimer(12000, 'ready()');

        // Setup a simple promise to resolve if the IMA loader is ready.
        this.adsLoaderPromise = new Promise((resolve) => {
            this.on('ADS_LOADER_LOADED', () => resolve());
            this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] adsLoader resolved!`, this.adsLoader);
        });

        // Setup a promise to resolve if the IMA manager is ready.
        this.adsManagerPromise = new Promise((resolve) => {
            this.on('ADS_MANAGER_LOADED', () => resolve());
            this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] adsManager resolved!`, this.adsManager);

            // Clear the safety timer.
            this.clearSafetyTimer('onAdsManagerLoaded()');
        });

        // Setup the IMA SDK.
        this.setupIMA();
    }

    /**
     * setupIMA
     * In order for the SDK to display ads for our video, we need to tell it
     * where to put them, so here we define our ad container. This div is set
     * up to render on top of the video player. Using the code below, we tell
     * the SDK to render ads within that div. We also provide a handle to the
     * content video player - the SDK will poll the current time of our player
     * to properly place mid-rolls. After we create the ad display container,
     * we initialize it. On mobile devices, this initialization is done as the
     * result of a user action.
     */
    setupIMA() {
        // Create the container for our advertisements.
        this.adsContainer = utils.createElement('div', {
            class: this.player.config.classNames.ads,
        });
        this.player.elements.container.appendChild(this.adsContainer);

        // So we can run VPAID2.
        google.ima.settings.setVpaidMode(google.ima.ImaSdkSettings.VpaidMode.ENABLED);

        // Set language.
        // Todo: Could make a config option out of this locale value.
        google.ima.settings.setLocale('en');

        // We assume the adContainer is the video container of the plyr element
        // that will house the ads.
        this.adDisplayContainer = new google.ima.AdDisplayContainer(this.adsContainer);

        // Request video ads to be pre-loaded.
        this.requestAds();
    }

    /**
     * Request advertisements.
     */
    requestAds() {
        const { container } = this.player.elements;

        try {
            // Create ads loader.
            this.adsLoader = new google.ima.AdsLoader(this.adDisplayContainer);

            // Listen and respond to ads loaded and error events.
            this.adsLoader.addEventListener(
                google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
                event => this.onAdsManagerLoaded(event), false);
            this.adsLoader.addEventListener(
                google.ima.AdErrorEvent.Type.AD_ERROR,
                error => this.onAdError(error), false);

            // Request video ads.
            const adsRequest = new google.ima.AdsRequest();
            adsRequest.adTagUrl = this.player.config.ads.tagUrl;

            // Specify the linear and nonlinear slot sizes. This helps the SDK
            // to select the correct creative if multiple are returned.
            adsRequest.linearAdSlotWidth = container.offsetWidth;
            adsRequest.linearAdSlotHeight = container.offsetHeight;
            adsRequest.nonLinearAdSlotWidth = container.offsetWidth;
            adsRequest.nonLinearAdSlotHeight = container.offsetHeight;

            // We only overlay ads as we only support video.
            adsRequest.forceNonLinearFullSlot = false;

            this.adsLoader.requestAds(adsRequest);

            this.handleEventListeners('ADS_LOADER_LOADED');
        } catch (e) {
            this.onAdError(e);
        }
    }

    /**
     * This method is called whenever the ads are ready inside
     * the AdDisplayContainer.
     * @param {Event} adsManagerLoadedEvent
     */
    onAdsManagerLoaded(adsManagerLoadedEvent) {

        // Get the ads manager.
        const settings = new google.ima.AdsRenderingSettings();

        // Tell the SDK to save and restore content video state on our behalf.
        settings.restoreCustomPlaybackStateOnAdBreakComplete = true;
        settings.enablePreloading = true;

        // The SDK is polling currentTime on the contentPlayback. And needs a duration
        // so it can determine when to start the mid- and post-roll.
        this.adsManager = adsManagerLoadedEvent.getAdsManager(this.player, settings);

        // Get the cue points for any mid-rolls by filtering out the pre- and post-roll.
        this.adsCuePoints = this.adsManager.getCuePoints();
        this.player.debug.log(this.adsCuePoints);

        // Add listeners to the required events.
        // Advertisement error events.
        this.adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, error => this.onAdError(error));

        // Advertisement regular events.
        this.adsManager.addEventListener(google.ima.AdEvent.Type.AD_BREAK_READY, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.AD_METADATA, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.CLICK, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.DURATION_CHANGE, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.FIRST_QUARTILE, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.IMPRESSION, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.INTERACTION, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.LINEAR_CHANGED, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.MIDPOINT, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.PAUSED, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.RESUMED, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.SKIPPABLE_STATE_CHANGED, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.SKIPPED, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.THIRD_QUARTILE, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.USER_CLOSE, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.VOLUME_CHANGED, event => this.onAdEvent(event));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.VOLUME_MUTED, event => this.onAdEvent(event));

        // Resolve our adsManager.
        this.handleEventListeners('ADS_MANAGER_LOADED');
    }

    /**
     * This is where all the event handling takes place. Retrieve the ad from
     * the event. Some events (e.g. ALL_ADS_COMPLETED) don't have ad
     * object associated.
     * @param {Event} event
     */
    onAdEvent(event) {
        const { container } = this.player.elements;

        // Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED)
        // don't have ad object associated.
        const ad = event.getAd();

        // Set the currently played ad. This information could be used by callback
        // events.
        this.currentAd = ad;

        // let intervalTimer;

        switch (event.type) {

            case google.ima.AdEvent.Type.AD_BREAK_READY:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] AD_BREAK_READY |`, 'Fired when an ad rule or a VMAP ad break would have played if autoPlayAdBreaks is false.');
                break;
            case google.ima.AdEvent.Type.AD_METADATA:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] AD_METADATA |`, 'Fired when an ads list is loaded.');
                break;
            case google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
                // All ads for the current videos are done. We can now
                // request new advertisements in case the video is re-played.
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] ALL_ADS_COMPLETED |`, 'Fired when the ads manager is done playing all the ads.');
                this.handleEventListeners('ALL_ADS_COMPLETED');

                // Todo: Example for what happens when a next video in a playlist would be loaded.
                // So here we load a new video when all ads are done.
                // Then we load new ads within a new adsManager. When the video
                // Is started - after - the ads are loaded, then we get ads.
                // You can also easily test cancelling and reloading by running
                // player.ads.cancel() and player.ads.play from the console I guess.
                // this.player.source = {
                //     type: 'video',
                //     title: 'View From A Blue Moon',
                //     sources: [{
                //         src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.mp4',
                //         type: 'video/mp4',
                //     }],
                //     poster: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg',
                //     tracks: [
                //         {
                //             kind: 'captions',
                //             label: 'English',
                //             srclang: 'en',
                //             src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.en.vtt',
                //             default: true,
                //         },
                //         {
                //             kind: 'captions',
                //             label: 'French',
                //             srclang: 'fr',
                //             src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.fr.vtt',
                //         },
                //     ],
                // };

                // Todo: So there is still this thing where a video should only be allowed to start playing when the IMA SDK is ready or has failed.

                this.loadAds();
                break;
            case google.ima.AdEvent.Type.CLICK:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] CLICK |`, 'Fired when the ad is clicked.');
                break;
            case google.ima.AdEvent.Type.COMPLETE:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] COMPLETE |`, 'Fired when the ad completes playing.');
                break;
            case google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED:
                // This event indicates the ad has started - the video player
                // can adjust the UI, for example display a pause button and
                // remaining time.
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] CONTENT_PAUSE_REQUESTED |`, 'Fired when content should be paused. This usually happens right before an ad is about to cover the content.');
                this.handleEventListeners('CONTENT_PAUSE_REQUESTED');
                this.contentPause();
                break;
            case google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED:
                // This event indicates the ad has finished - the video player
                // can perform appropriate UI actions, such as removing the timer for
                // remaining time detection.
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] CONTENT_RESUME_REQUESTED |`, 'Fired when content should be resumed. This usually happens when an ad finishes or collapses.');
                this.handleEventListeners('CONTENT_RESUME_REQUESTED');
                this.contentResume();
                break;
            case google.ima.AdEvent.Type.LOADED:
                // This is the first event sent for an ad - it is possible to
                // determine whether the ad is a video ad or an overlay.
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] LOADED |`, event.getAd().getContentType());
                this.handleEventListeners('LOADED');

                if (!ad.isLinear()) {
                    // Position AdDisplayContainer correctly for overlay.
                    ad.width = container.offsetWidth;
                    ad.height = container.offsetHeight;
                }

                // console.info('Ad type: ' + event.getAd().getAdPodInfo().getPodIndex());
                // console.info('Ad time: ' + event.getAd().getAdPodInfo().getTimeOffset());
                break;
            case google.ima.AdEvent.Type.STARTED:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] STARTED |`, 'Fired when the ad starts playing.');
                break;
            case google.ima.AdEvent.Type.DURATION_CHANGE:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] DURATION_CHANGE |`, 'Fired when the ad\'s duration changes.');
                break;
            case google.ima.AdEvent.Type.FIRST_QUARTILE:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] FIRST_QUARTILE |`, 'Fired when the ad playhead crosses first quartile.');
                break;
            case google.ima.AdEvent.Type.IMPRESSION:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] IMPRESSION |`, 'Fired when the impression URL has been pinged.');
                break;
            case google.ima.AdEvent.Type.INTERACTION:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] INTERACTION |`, 'Fired when an ad triggers the interaction callback. Ad interactions contain an interaction ID string in the ad data.');
                break;
            case google.ima.AdEvent.Type.LINEAR_CHANGED:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] LINEAR_CHANGED |`, 'Fired when the displayed ad changes from linear to nonlinear, or vice versa.');
                break;
            case google.ima.AdEvent.Type.MIDPOINT:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] MIDPOINT |`, 'Fired when the ad playhead crosses midpoint.');
                break;
            case google.ima.AdEvent.Type.PAUSED:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] PAUSED |`, 'Fired when the ad is paused.');
                break;
            case google.ima.AdEvent.Type.RESUMED:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] RESUMED |`, 'Fired when the ad is resumed.');
                break;
            case google.ima.AdEvent.Type.SKIPPABLE_STATE_CHANGED:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] SKIPPABLE_STATE_CHANGED |`, 'Fired when the displayed ads skippable state is changed.');
                break;
            case google.ima.AdEvent.Type.SKIPPED:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] SKIPPED |`, 'Fired when the ad is skipped by the user.');
                break;
            case google.ima.AdEvent.Type.THIRD_QUARTILE:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] THIRD_QUARTILE |`, 'Fired when the ad playhead crosses third quartile.');
                break;
            case google.ima.AdEvent.Type.USER_CLOSE:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] USER_CLOSE |`, 'Fired when the ad is closed by the user.');
                break;
            case google.ima.AdEvent.Type.VOLUME_CHANGED:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] VOLUME_CHANGED |`, 'Fired when the ad volume has changed.');
                break;
            case google.ima.AdEvent.Type.VOLUME_MUTED:
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] VOLUME_MUTED |`, 'Fired when the ad volume has been muted.');
                break;

            default:
                break;
        }
    }

    /**
     * Any ad error handling comes through here.
     * @param {Event} adErrorEvent
     */
    onAdError(adErrorEvent) {
        this.cancel();
        this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] ERROR |`, adErrorEvent);
    }

    /**
     * Setup hooks for Plyr and window events. This ensures
     * the mid- and post-roll launch at the correct time. And
     * resize the advertisement when the player resizes.
     */
    setupListeners() {
        const { container } = this.player.elements;
        let time;

        // Add listeners to the required events.
        this.player.on('ended', () => {
            this.adsLoader.contentComplete();
        });

        this.player.on('seeking', () => {
            time = this.player.currentTime;
            return time;
        });

        this.player.on('seeked', () => {
            const seekedTime = this.player.currentTime;

            this.adsCuePoints.forEach((cuePoint, index) => {
                if (time < cuePoint && cuePoint < seekedTime) {
                    this.adsManager.discardAdBreak();
                    this.adsCuePoints.splice(index, 1);
                }
            });
        });

        // Listen to the resizing of the window. And resize ad accordingly.
        window.addEventListener('resize', () => {
            this.adsManager.resize(container.offsetWidth, container.offsetHeight, google.ima.ViewMode.NORMAL);
        });
    }

    /**
     * Initialize the adsManager and start playing advertisements.
     */
    play() {
        const { container } = this.player.elements;

        // Initialize the container. Must be done via a user action on mobile devices.
        this.adDisplayContainer.initialize();

        // Play the requested advertisement whenever the adsManager is ready.
        this.adsManagerPromise.then(() => {
            try {
                if (!this.initialized) {

                    // Initialize the ads manager. Ad rules playlist will start at this time.
                    this.adsManager.init(container.offsetWidth, container.offsetHeight, google.ima.ViewMode.NORMAL);

                    // Call play to start showing the ad. Single video and overlay ads will
                    // start at this time; the call will be ignored for ad rules.
                    this.adsManager.start();
                }

                this.initialized = true;
            } catch (adError) {
                // An error may be thrown if there was a problem with the
                // VAST response.
                this.onAdError(adError);
            }
        });
    }

    /**
     * Resume our video.
     */
    contentResume() {
        this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK]`, 'Resume video.');

        // Hide our ad container.
        this.adsContainer.style.display = 'none';

        // Ad is stopped.
        this.playing = false;

        // Play our video.
        if (this.player.currentTime < this.player.duration) {
            this.player.play();
        }
    }

    /**
     * Pause our video.
     */
    contentPause() {
        this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK]`, 'Pause video.');

        // Show our ad container.
        this.adsContainer.style.display = 'block';

        // Ad is playing.
        this.playing = true;

        // Pause our video.
        this.player.pause();
    }

    /**
     * Destroy the adsManager so we can grab new ads after this.
     * If we don't then we're not allowed to call new ads based
     * on google policies, as they interpret this as an accidental
     * video requests. https://developers.google.com/interactive-
     * media-ads/docs/sdks/android/faq#8
     */
    cancel() {
        this.player.debug.warn(`[${(Date.now() - this.time) / 1000}s][IMA SDK]`, 'Advertisement cancelled.');

        // Pause our video.
        this.contentResume();

        // Tell our instance that we're done for now.
        this.handleEventListeners('ERROR');

        // Re-create our adsManager.
        this.loadAds();
    }

    /**
     * Re-create our adsManager.
     */
    loadAds() {
        this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK]`, 'Re-loading advertisements.');

        // Tell our adsManager to go bye bye.
        this.adsManagerPromise.then(() => {
            // Destroy our adsManager.
            if (this.adsManager) {
                this.adsManager.destroy();
            }

            // Re-set our adsManager promises.
            this.adsManagerPromise = new Promise((resolve) => {
                this.on('ADS_MANAGER_LOADED', () => resolve());
                this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK] adsManager resolved!`, this.adsManager);
            });

            // Make sure we can re-call advertisements.
            this.initialized = false;

            // Now request some new advertisements.
            this.requestAds();
        });
    }

    /**
     * Handles callbacks after an ad event was invoked.
     */
    handleEventListeners(event) {
        if (typeof this.events[event] !== 'undefined') {
            this.events[event].call(this);
        }
    }

    /**
     * Add event listeners
     * @param {string} event - Event type
     * @param {function} callback - Callback for when event occurs
     */
    on(event, callback) {
        this.events[event] = callback;
        return this;
    }

    /**
     * Setup a safety timer for when the ad network doesn't respond for
     * whatever reason. The advertisement has 12 seconds to get its things
     * together. We stop this timer when the advertisement is playing, or when
     * a user action is required to start, then we clear the timer on ad ready.
     * @param {Number} time
     * @param {String} from
     */
    startSafetyTimer(time, from) {
        this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK]`, `Safety timer invoked timer from: ${from}`);
        this.safetyTimer = window.setTimeout(() => {
            this.cancel();
            this.clearSafetyTimer('startSafetyTimer()');
        }, time);
    }

    /**
     * Clear our safety timer(s).
     * @param {String} from
     */
    clearSafetyTimer(from) {
        if (typeof this.safetyTimer !== 'undefined' && this.safetyTimer !== null) {
            this.player.debug.log(`[${(Date.now() - this.time) / 1000}s][IMA SDK]`, `Safety timer cleared timer from: ${from}`);
            clearTimeout(this.safetyTimer);
            this.safetyTimer = undefined;
        }
    }
}

export default Ads;

