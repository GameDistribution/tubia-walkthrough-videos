// ==========================================================================
// Google IMA SDK plugin
// ==========================================================================

// import utils from './utils';

import EventBus from '../../temp/components/EventBus';
import Console from './console';
import {updateQueryStringParameter} from '../../temp/modules/common';

const instance = null;

/**
 * VideoAd
 */
class Ads {
    /**
     * Constructor of VideoAd.
     * @param {Object} videoElement
     * @return {*}
     */
    constructor(videoElement) {
        // Make this a singleton.
        if (instance) {
            return instance;
        }

        this.debug = new Console();
        this.locale = 'en';
        this.prefix = 'plyr__';
        this.gameId = '4f3d7d38d24b740c95da2b03dc3a2333';
        this.adsLoader = null;
        this.adsManager = null;
        this.adContainer = null;
        this.adDisplayContainer = null;
        this.videoElement = videoElement;
        this.eventBus = new EventBus();
        this.safetyTimer = null;
        this.requestAttempts = 0;
        this.containerTransitionSpeed = 300;
        this.adCount = 0;
        this.requestAttempts = 0;
        this.width = window.innerWidth ||
            document.documentElement.clientWidth || document.body.clientWidth;
        this.height = window.innerHeight ||
            document.documentElement.clientHeight || document.body.clientHeight;
        this.tag = 'https://pubads.g.doubleclick.net/gampad/ads' +
            '?sz=640x480&iu=/124319096/external/single_ad_samples' +
            '&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast' +
            '&unviewed_position_start=1&cust_params=deployment%3Ddevsite' +
            '%26sample_ct%3Dlinear&correlator=';

        // Analytics variables
        this.eventCategory = 'AD';
    }

    /**
     * start
     * Start the VideoAd instance by first checking if we
     * have auto play capabilities. By calling start() we start the
     * creation of the adsLoader, needed to request ads. This is also
     * the time where we can change other options based on context as well.
     * @public
     */
    start() {
        // Start ticking our safety timer. If the whole advertisement
        // thing doesn't resolve within our set time, then screw this.
        this.startSafetyTimer(12000, 'start()');

        // Load Google IMA HTML5 SDK.
        this.loadIMAScript();

        // Setup a simple promise to resolve if the IMA loader is ready.
        // We mainly do this because showBanner() can be called before we've
        // even setup our ad.
        this.adsLoaderPromise = new Promise((resolve) => {
            // Wait for adsLoader to be loaded.
            this.eventBus.subscribe('AD_SDK_LOADER_READY', () => resolve());
        });

        // Setup a promise to resolve if the IMA manager is ready.
        this.adsManagerPromise = new Promise((resolve) => {
            // Wait for adsManager to be loaded.
            this.eventBus.subscribe('AD_SDK_MANAGER_READY', () => resolve());
        });

        // Subscribe to our new AD_SDK_MANAGER_READY event and clear the
        // initial safety timer set within the start of our start() method.
        this.eventBus.subscribe('AD_SDK_MANAGER_READY', () => {
            this.clearSafetyTimer('AD_SDK_MANAGER_READY');
        });

        // Show the advertisement container.
        this.eventBus.subscribe('CONTENT_PAUSE_REQUESTED', () => {
            // Show the advertisement container.
            if (this.adContainer) {
                this.adContainer.style.transform = 'translateX(0)';
                setTimeout(() => {
                    this.adContainer.style.opacity = '1';
                }, 10);
            }
        });
    }

    /**
     * initialUserAction
     * Start the advertisement. Ad rules dictate when to show them during video.
     * @public
     */
    initialUserAction() {
        // Play the requested advertisement whenever the adsManager is ready.
        this.adsManagerPromise.then(() => {
            // The IMA HTML5 SDK uses the AdDisplayContainer to play the
            // video ads. To initialize the AdDisplayContainer, call the
            // play() method in a user action.
            if (!this.adsManager || !this.adDisplayContainer) {
                this.onError('Missing an adsManager or adDisplayContainer');
                return;
            }
            // Always initialize the container first.
            this.adDisplayContainer.initialize();

            try {
                // Initialize the ads manager. Ad rules playlist will
                // start at this time.
                this.adsManager.init(
                    this.width,
                    this.height,
                    google.ima.ViewMode.NORMAL
                );
                // Call play to start showing the ad. Single video and
                // overlay ads will start at this time; the call will be
                // ignored for ad rules.
                this.adsManager.start();
            } catch (adError) {
                // An error may be thrown if there was a problem with the
                // VAST response.
                this.onError(adError);
            }
        });
    }

    /**
     * contentEnded
     * Our video content has ended.
     * @public
     */
    contentEnded() {
        if (this.adsLoader) {
            this.adsLoader.contentComplete();
        }
    };

    /**
     * loadIMAScript
     * Loads the Google IMA script using a <script> tag.
     * @private
     */
    loadIMAScript() {
        // Load the HTML5 IMA SDK.
        const src = (this.debug)
            ? '//imasdk.googleapis.com/js/sdkloader/ima3_debug.js'
            : '//imasdk.googleapis.com/js/sdkloader/ima3.js';
        const script = document.getElementsByTagName('script')[0];
        const ima = document.createElement('script');
        ima.type = 'text/javascript';
        ima.async = true;
        ima.src = src;
        ima.onload = () => {
            this.createPlayer();
        };
        ima.onerror = () => {
            // Return an error event.
            this.onError('IMA script failed to load! Probably due to an ADBLOCKER!');
        };

        // Append the IMA script to the first script tag within the document.
        script.parentNode.insertBefore(ima, script);
    }

    /**
     * createPlayer
     * Creates our staging/ markup for the advertisement.
     * @private
     */
    createPlayer() {
        const body = document.body || document.getElementsByTagName('body')[0];

        this.adContainer = document.createElement('div');
        this.adContainer.id = `${this.prefix}advertisement`;
        this.adContainer.style.position = 'fixed';
        this.adContainer.style.zIndex = '99';
        this.adContainer.style.top = '0';
        this.adContainer.style.left = '0';
        this.adContainer.style.width = '100%';
        this.adContainer.style.height = '100%';
        this.adContainer.style.transform = 'translateX(-9999px)';
        this.adContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.adContainer.style.opacity = '0';
        this.adContainer.style.transition = `opacity ${this.containerTransitionSpeed}ms cubic-bezier(0.55, 0, 0.1, 1)`;

        const adContainerInner = document.createElement('div');
        adContainerInner.id = `${this.prefix}advertisement_slot`;
        adContainerInner.style.position = 'absolute';
        adContainerInner.style.backgroundColor = '#000000';
        adContainerInner.style.top = '0';
        adContainerInner.style.left = '0';
        adContainerInner.style.width = `${this.width}px`;
        adContainerInner.style.height = `${this.height}px`;

        this.adContainer.appendChild(adContainerInner);
        body.appendChild(this.adContainer);

        // We need to resize our adContainer
        // when the view dimensions change.
        window.addEventListener('resize', () => {
            this.width = window.innerWidth ||
                document.documentElement.clientWidth ||
                document.body.clientWidth;
            this.height = window.innerHeight ||
                document.documentElement.clientHeight ||
                document.body.clientHeight;
            adContainerInner.style.width = `${this.width}px`;
            adContainerInner.style.height = `${this.height}px`;
        });

        this.setUpIMA();
    }

    /**
     * setUpIMA
     * Create's a the adsLoader object.
     * @private
     */
    setUpIMA() {
        // In order for the SDK to display ads on our page, we need to tell
        // it where to put them. In the html above, we defined a div with
        // the id "adContainer". This div is set up to render on top of
        // the video player. Using the code below, we tell the SDK to render
        // ads in that div. Also provide a handle to the content video
        // player - the SDK will poll the current time of our player to
        // properly place mid-rolls. After we create the ad display
        // container, initialize it. On mobile devices, this initialization
        // must be done as the result of a user action! Which is done
        // at playAds().

        // So we can run VPAID2.
        google.ima.settings.setVpaidMode(google.ima.ImaSdkSettings.VpaidMode.ENABLED);

        // Set language.
        google.ima.settings.setLocale(this.locale);

        // We assume the adContainer is the DOM id of the element that
        // will house the ads.
        this.adDisplayContainer = new google.ima.AdDisplayContainer(
            document.getElementById(`${this.prefix}advertisement_slot`),
            this.videoElement,
        );

        // Here we create an AdsLoader and define some event listeners.
        // Then create an AdsRequest object to pass to this AdsLoader.
        // We'll then wire up the 'Play' button to
        // call our requestAds function.

        // We will maintain only one instance of AdsLoader for the entire
        // lifecycle of the page. To make additional ad requests, create a
        // new AdsRequest object but re-use the same AdsLoader.

        // Re-use this AdsLoader instance for the entire lifecycle of the page.
        this.adsLoader = new google.ima.AdsLoader(this.adDisplayContainer);

        // Add adsLoader event listeners.
        this.adsLoader.addEventListener(
            google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
            this.onAdsManagerLoaded,
            false,
            this
        );
        this.adsLoader.addEventListener(
            google.ima.AdErrorEvent.Type.AD_ERROR,
            this.onAdError,
            false,
            this
        );

        // Send event that adsLoader is ready.
        const eventName = 'AD_SDK_LOADER_READY';
        this.eventBus.broadcast(eventName, {
            name: eventName,
            message: this,
            status: 'success',
            analytics: {
                category: this.eventCategory,
                action: eventName,
                label: this.gameId,
            },
        });

        // Request new video ads to be pre-loaded.
        this.requestAds();
    }

    /**
     * requestAds
     * Request advertisements.
     * @public
     */
    requestAds() {
        if (typeof google === 'undefined') {
            this.onError('Unable to request ad, google IMA SDK not defined.');
            return;
        }

        // First check if we can run ads. If the video is embedded within a
        // Phone Gap/ Cordova app, then we're not allowed.
        if (navigator.userAgent.match(/Crosswalk/i) ||
            typeof window.cordova !== 'undefined') {
            this.onError('Navigator.userAgent contains Crosswalk and/ or ' +
                'window.cordova. We\'re not allowed to run advertisements ' +
                'within Cordova.');
            return;
        }

        try {
            // Request video new ads.
            const adsRequest = new google.ima.AdsRequest();

            // Update our adTag. We add additional parameters so Tunnl
            // can use the values as new metrics within reporting.
            this.adCount += 1;
            const positionCount = this.adCount - 1;
            this.tag = updateQueryStringParameter(this.tag, 'ad_count',
                this.adCount);
            this.tag = updateQueryStringParameter(this.tag, 'ad_position',
                (this.adCount === 1)
                    ? 'preroll'
                    : `midroll${positionCount.toString()}`);
            adsRequest.adTagUrl = this.tag;

            // Specify the linear and nonlinear slot sizes. This helps
            // the SDK to select the correct creative if multiple are returned.
            adsRequest.linearAdSlotWidth = this.width;
            adsRequest.linearAdSlotHeight = this.height;
            adsRequest.nonLinearAdSlotWidth = this.width;
            adsRequest.nonLinearAdSlotHeight = this.height;

            // We allow overlay ads.
            adsRequest.forceNonLinearFullSlot = false;

            // Get us some ads!
            this.adsLoader.requestAds(adsRequest);

            // Send event.
            const eventName = 'AD_SDK_LOADER_READY';
            this.eventBus.broadcast(eventName, {
                name: eventName,
                message: this.tag,
                status: 'success',
                analytics: {
                    category: this.eventCategory,
                    action: eventName,
                    label: this.gameId,
                },
            });
        } catch (e) {
            this.onAdError(e);
        }
    }

    /**
     * onAdsManagerLoaded
     * This function is called whenever the ads are ready inside
     * the AdDisplayContainer.
     * @param {Event} adsManagerLoadedEvent
     * @private
     */
    onAdsManagerLoaded(adsManagerLoadedEvent) {
        // Get the ads manager.
        const adsRenderingSettings = new google.ima.AdsRenderingSettings();
        adsRenderingSettings.enablePreloading = true;
        adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;

        // We don't set videoContent as in the Google IMA example docs,
        // cause we run a game, not an ad.
        // todo: we will want to change this.
        this.adsManager = adsManagerLoadedEvent.getAdsManager(
            this.videoElement,
            adsRenderingSettings,
        );

        // Todo: dont know what this does lol.
        if (this.adsManager.isCustomClickTrackingUsed()) {
            this.customClickDiv.style.display = 'table';
        }

        // Add listeners to the required events.
        // https://developers.google.com/interactive-media-
        // ads/docs/sdks/html5/v3/apis

        // Advertisement error events.
        this.adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR,
            this.onAdError.bind(this), false, this);

        // Advertisement regular events.
        this.adsManager.addEventListener(google.ima.AdEvent.Type.AD_BREAK_READY, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.AD_METADATA, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.CLICK, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.DURATION_CHANGE, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.FIRST_QUARTILE, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.IMPRESSION, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.INTERACTION, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.LINEAR_CHANGED, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.LOG, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.MIDPOINT, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.PAUSED, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.RESUMED, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.SKIPPABLE_STATE_CHANGED, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.SKIPPED, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.THIRD_QUARTILE, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.USER_CLOSE, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.VOLUME_CHANGED, this.onAdEvent.bind(this), this);
        this.adsManager.addEventListener(google.ima.AdEvent.Type.VOLUME_MUTED, this.onAdEvent.bind(this), this);

        // We need to resize our adContainer when the view dimensions change.
        window.addEventListener('resize', () => {
            this.adsManager.resize(
                this.width,
                this.height,
                google.ima.ViewMode.NORMAL,
            );
        });

        // Once the ad display container is ready and ads have been retrieved,
        // we can use the ads manager to display the ads.
        if (this.adsManager && this.adDisplayContainer) {
            // Reset attempts as we've successfully setup the adsloader (again).
            this.requestAttempts = 0;
            const eventName = 'AD_SDK_MANAGER_READY';
            this.eventBus.broadcast(eventName, {
                name: eventName,
                message: this.adsManager,
                status: 'success',
                analytics: {
                    category: this.eventCategory,
                    action: eventName,
                    label: this.gameId,
                },
            });
        }
    }

    /**
     * onAdEvent
     * This is where all the event handling takes place. Retrieve the ad from
     * the event. Some events (e.g. ALL_ADS_COMPLETED) don't have ad
     * object associated.
     * @param {Event} adEvent
     * @private
     */
    onAdEvent(adEvent) {
        let eventName = '';
        let eventMessage = '';
        switch (adEvent.type) {
            case google.ima.AdEvent.Type.AD_BREAK_READY:
                eventName = 'AD_BREAK_READY';
                eventMessage = 'Fired when an ad rule or a VMAP ad break would have played if autoPlayAdBreaks is false.';
                break;
            case google.ima.AdEvent.Type.AD_METADATA:
                eventName = 'AD_METADATA';
                eventMessage = 'Fired when an ads list is loaded.';
                break;
            case google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
                eventName = 'ALL_ADS_COMPLETED';
                eventMessage = 'Fired when the ads manager is done playing all the ads.';
                break;
            case google.ima.AdEvent.Type.CLICK:
                eventName = 'CLICK';
                eventMessage = 'Fired when the ad is clicked.';
                break;
            case google.ima.AdEvent.Type.COMPLETE:
                eventName = 'COMPLETE';
                eventMessage = 'Fired when the ad completes playing.';
                break;
            case google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED:
                eventName = 'CONTENT_PAUSE_REQUESTED';
                eventMessage = 'Fired when content should be paused. This usually happens right before an ad is about to cover the content.';
                break;
            case google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED:
                eventName = 'CONTENT_RESUME_REQUESTED';
                eventMessage = 'Fired when content should be resumed. This usually happens when an ad finishes or collapses.';

                // Hide the advertisement.
                if (this.adContainer) {
                    this.adContainer.style.opacity = '0';
                    setTimeout(() => {
                        // We do not use display none. Otherwise element.offsetWidth
                        // and height will return 0px.
                        this.adContainer.style.transform = 'translateX(-9999px)';
                    }, this.containerTransitionSpeed);
                }

                // Destroy the adsManager so we can grab new ads after this.
                // If we don't then we're not allowed to call new ads based
                // on google policies, as they interpret this as an accidental
                // video requests. https://developers.google.com/interactive-
                // media-ads/docs/sdks/android/faq#8
                Promise.all([
                    this.adsLoaderPromise,
                    this.adsManagerPromise,
                ]).then(() => {
                    if (this.adsLoader) {
                        // this.adsLoader.contentComplete();
                    }

                    this.adsLoaderPromise = new Promise((resolve) => {
                        // Wait for adsLoader to be loaded.
                        this.eventBus.subscribe('AD_SDK_LOADER_READY', () => resolve());
                    });
                    this.adsManagerPromise = new Promise((resolve) => {
                        // Wait for adsManager to be loaded.
                        this.eventBus.subscribe('AD_SDK_MANAGER_READY', () => resolve());
                    });

                    // Preload new ads by doing a new request.
                    // this.requestAds();

                    // Send event to tell that the whole advertisement
                    // thing is finished.
                    this.eventBus.broadcast(eventName, {
                        name: 'AD_SDK_FINISHED',
                        message: 'IMA is ready for new requests.',
                        status: 'success',
                        analytics: {
                            category: this.eventCategory,
                            action: 'AD_SDK_FINISHED',
                            label: this.gameId,
                        },
                    });
                }).catch((error) => {
                    this.debug.error(error);
                });

                break;
            case google.ima.AdEvent.Type.DURATION_CHANGE:
                eventName = 'DURATION_CHANGE';
                eventMessage = 'Fired when the ad\'s duration changes.';
                break;
            case google.ima.AdEvent.Type.FIRST_QUARTILE:
                eventName = 'FIRST_QUARTILE';
                eventMessage = 'Fired when the ad playhead crosses first quartile.';
                break;
            case google.ima.AdEvent.Type.IMPRESSION:
                eventName = 'IMPRESSION';
                eventMessage = 'Fired when the impression URL has been pinged.';
                break;
            case google.ima.AdEvent.Type.INTERACTION:
                eventName = 'INTERACTION';
                eventMessage = 'Fired when an ad triggers the interaction callback. Ad interactions contain an interaction ID string in the ad data.';
                break;
            case google.ima.AdEvent.Type.LINEAR_CHANGED:
                eventName = 'LINEAR_CHANGED';
                eventMessage = 'Fired when the displayed ad changes from linear to nonlinear, or vice versa.';
                break;
            case google.ima.AdEvent.Type.LOADED:
                // console.info('Ad type: ' + adEvent.getAd().getAdPodInfo().getPodIndex());
                // console.info('Ad time: ' + adEvent.getAd().getAdPodInfo().getTimeOffset());
                eventName = 'LOADED';
                eventMessage = adEvent.getAd().getContentType();
                break;
            case google.ima.AdEvent.Type.MIDPOINT:
                eventName = 'MIDPOINT';
                eventMessage = 'Fired when the ad playhead crosses midpoint.';
                break;
            case google.ima.AdEvent.Type.PAUSED:
                eventName = 'PAUSED';
                eventMessage = 'Fired when the ad is paused.';
                break;
            case google.ima.AdEvent.Type.RESUMED:
                eventName = 'RESUMED';
                eventMessage = 'Fired when the ad is resumed.';
                break;
            case google.ima.AdEvent.Type.SKIPPABLE_STATE_CHANGED:
                eventName = 'SKIPPABLE_STATE_CHANGED';
                eventMessage = 'Fired when the displayed ads skippable state is changed.';
                break;
            case google.ima.AdEvent.Type.SKIPPED:
                eventName = 'SKIPPED';
                eventMessage = 'Fired when the ad is skipped by the user.';
                break;
            case google.ima.AdEvent.Type.STARTED:
                eventName = 'STARTED';
                eventMessage = 'Fired when the ad starts playing.';
                break;
            case google.ima.AdEvent.Type.THIRD_QUARTILE:
                eventName = 'THIRD_QUARTILE';
                eventMessage = 'Fired when the ad playhead crosses third quartile.';
                break;
            case google.ima.AdEvent.Type.USER_CLOSE:
                eventName = 'USER_CLOSE';
                eventMessage = 'Fired when the ad is closed by the user.';
                break;
            case google.ima.AdEvent.Type.VOLUME_CHANGED:
                eventName = 'VOLUME_CHANGED';
                eventMessage = 'Fired when the ad volume has changed.';
                break;
            case google.ima.AdEvent.Type.VOLUME_MUTED:
                eventName = 'VOLUME_MUTED';
                eventMessage = 'Fired when the ad volume has been muted.';
                break;
            default:
                eventName = '';
                eventMessage = '';
        }

        // Send the event to our eventBus.
        if (eventName !== '' && eventMessage !== '') {
            this.eventBus.broadcast(eventName, {
                name: eventName,
                message: eventMessage,
                status: 'success',
                analytics: {
                    category: this.eventCategory,
                    action: eventName,
                    label: this.gameId,
                },
            });
        }
    }

    /**
     * cancel
     * Makes it possible to stop an advertisement while its
     * loading or playing. This will clear out the adsManager, stop any
     * ad playing and allowing new ads to be called.
     * @public
     */
    cancel() {
        // Todo: cancel not working very well with ad rules.
        // Todo: https://developers.google.com/interactive-media-ads/docs/sdks/html5/ad-rules
        // Todo: Section: Disabling automatic playback of ad breaks.
        // Hide the advertisement.
        if (this.adContainer) {
            this.adContainer.style.opacity = '0';
            setTimeout(() => {
                // We do not use display none. Otherwise element.offsetWidth
                // and height will return 0px.
                this.adContainer.style.transform =
                    'translateX(-9999px)';
            }, this.containerTransitionSpeed);
        }

        // Destroy the adsManager so we can grab new ads after this.
        // If we don't then we're not allowed to call new ads based
        // on google policies, as they interpret this as an accidental
        // video requests. https://developers.google.com/interactive-
        // media-ads/docs/sdks/android/faq#8
        Promise.all([
            this.adsLoaderPromise,
            this.adsManagerPromise,
        ]).then(() => {
            if (this.adsManager) {
                this.adsManager.destroy();
            }
            if (this.adsLoader) {
                this.adsLoader.contentComplete();
            }

            this.adsLoaderPromise = new Promise((resolve) => {
                // Wait for adsLoader to be loaded.
                this.eventBus.subscribe('AD_SDK_LOADER_READY',
                    () => resolve());
            });
            this.adsManagerPromise = new Promise((resolve) => {
                // Wait for adsManager to be loaded.
                this.eventBus.subscribe('AD_SDK_MANAGER_READY',
                    () => resolve());
            });

            // Preload new ads by doing a new request.
            if (this.requestAttempts <= 3) {
                if (this.requestAttempts > 1) {
                    this.debug.warning('AD_SDK_REQUEST_ATTEMPT', this.requestAttempts);
                }
                this.requestAds();
                this.requestAttempts += 1;
            }
        }).catch((error) => {
            this.debug.error(error);
        });

        // Send event to tell that the whole advertisement
        // thing is finished.
        const eventName = 'AD_CANCELED';
        const eventMessage = 'Advertisement has been canceled.';
        this.eventBus.broadcast(eventName, {
            name: eventName,
            message: eventMessage,
            status: 'warning',
            analytics: {
                category: this.eventCategory,
                action: eventName,
                label: this.gameId,
            },
        });
    }

    /**
     * onAdError
     * Any ad error handling comes through here.
     * @param {Event} adErrorEvent
     * @private
     */
    onAdError(adErrorEvent) {
        const eventName = 'AD_ERROR';
        const eventMessage = adErrorEvent.getError();
        this.eventBus.broadcast(eventName, {
            name: eventName,
            message: eventMessage,
            status: 'warning',
            analytics: {
                category: this.eventCategory,
                action: eventName,
                label: eventMessage,
            },
        });
        this.cancel();
        this.clearSafetyTimer('AD_ERROR');
    }

    /**
     * onError
     * Any error handling comes through here.
     * @param {String} eventMessage
     * @private
     */
    onError(eventMessage) {
        const eventName = 'AD_SDK_ERROR';
        this.eventBus.broadcast(eventName, {
            name: eventName,
            message: eventMessage,
            status: 'error',
            analytics: {
                category: this.eventCategory,
                action: eventName,
                label: eventMessage,
            },
        });
        this.cancel();
        this.clearSafetyTimer('AD_SDK_ERROR');
    }

    /**
     * startSafetyTimer
     * Setup a safety timer for when the ad network
     * doesn't respond for whatever reason. The advertisement has 12 seconds
     * to get its shit together. We stop this timer when the advertisement
     * is playing, or when a user action is required to start, then we
     * clear the timer on ad ready.
     * @param {Number} time
     * @param {String} from
     * @private
     */
    startSafetyTimer(time, from) {
        const t = Date.now();
        this.debug.log(`[${(Date.now() - t) / 1000}s] AD_SAFETY_TIMER`, `Invoked timer from: ${from}!`);
        this.safetyTimer = window.setTimeout(() => {
            const eventName = 'AD_SAFETY_TIMER';
            const eventMessage = 'Advertisement took too long to load.';
            this.eventBus.broadcast(eventName, {
                name: eventName,
                message: eventMessage,
                status: 'warning',
                analytics: {
                    category: this.eventCategory,
                    action: eventName,
                    label: this.gameId,
                },
            });
            this.cancel();
            this.clearSafetyTimer('AD_SAFETY_TIMER');
        }, time);
    }

    /**
     * clearSafetyTimer
     * @param {String} from
     * @private
     */
    clearSafetyTimer(from) {
        if (typeof this.safetyTimer !== 'undefined' &&
            this.safetyTimer !== null) {
            this.debug.log('AD_SAFETY_TIMER', `Cleared timer from: ${from}!`);
            clearTimeout(this.safetyTimer);
            this.safetyTimer = undefined;
        }
    }

    /**
     * console
     * Debugging tool for advertisements.
     */
    console() {
        const css = `
            #${this.prefix}implementation {
                box-sizing: border-box;
                position: fixed;
                z-index: 100;
                bottom: 0;
                width: 100%;
                padding: 5px;
                background: linear-gradient(90deg,#01567d,#00405c);
                box-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
                color: #fff;
                font-family: Helvetica, Arial, sans-serif;
                font-size: 8px;
            }
            #${this.prefix}implementation > div {
                width: 100%;
            }
            #${this.prefix}implementation > div > div {
                float: left;
                margin-right: 10px;
            }
            #${this.prefix}implementation > div > div:last-of-type {
                float: right;
                margin-right: 0;
                text-align: right;
            }
            #${this.prefix}implementation h2 {
                color: #fff;
                text-shadow: 0 0.07em 0 rgba(0,0,0,.5);
                text-transform: uppercase;
                margin-bottom: 4px;
                font-size: 8px;
                line-height: 100%;
                text-align: left;
            }
            #${this.prefix}implementation button {
                background: transparent;
                margin-left: 2px;
                padding: 3px 10px;
                border: 1px solid #fff;
                color: #fff;
                outline: 0;
                cursor: pointer;
                font-size: 8px;
            }
            #${this.prefix}implementation button:hover {
                background: rgba(255, 255, 255, 0.5);
            }
            #${this.prefix}implementation button:active {
                background: #fff;
                color: #333;
            }
            #${this.prefix}implementation button:first-of-type {
                margin-left: 0;
            }
        `;

        const html = `
            <div id="${this.prefix}implementation">
                <div>
                    <div>
                        <h2>Advertisement</h2>
                        <button id="${this.prefix}cancel">Cancel</button>
                        <button id="${this.prefix}demo">Demo VAST tag</button>
                    </div>
                    <div>
                        <h2>Video</h2>
                        <button id="${this.prefix}pauseVideo">pause</button>
                        <button id="${this.prefix}resumeVideo">resume</button>
                    </div>
                </div>
            </div>
        `;

        // Add css
        const head = document.head || document.getElementsByTagName('head')[0];
        const style = document.createElement('style');
        style.type = 'text/css';
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }
        head.appendChild(style);

        // Add html
        const body = document.body || document.getElementsByTagName('body')[0];
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.zIndex = '100';
        container.style.bottom = '0';
        container.innerHTML = html;
        body.appendChild(container);

        // Add listeners
        const pauseVideo = document.getElementById(`${this.prefix}pauseVideo`);
        const resumeVideo = document.getElementById(`${this.prefix}resumeVideo`);
        const cancelAd = document.getElementById(`${this.prefix}cancel`);
        const demoAd = document.getElementById(`${this.prefix}demo`);

        if (localStorage.getItem(`${this.prefix}tag`)) {
            demoAd.innerHTML = 'Revert Vast tag';
            demoAd.style.background = '#002333';
        } else {
            demoAd.innerHTML = 'Demo VAST tag';
            demoAd.style.background = 'transparent';
        }

        pauseVideo.addEventListener('click', () => {
            window.tubia.onPauseVideo('Pause video requested from debugger', 'warning');
        });
        resumeVideo.addEventListener('click', () => {
            window.tubia.onResumeVideo('Resume video requested from debugger', 'warning');
        });
        cancelAd.addEventListener('click', () => {
            window.tubia.videoAdInstance.cancel();
        });
        demoAd.addEventListener('click', () => {
            try {
                if (localStorage.getItem(`${this.prefix}tag`)) {
                    localStorage.removeItem(`${this.prefix}tag`);
                } else {
                    // VMAP - Pre-roll Single Ad, Mid-roll Optimized Pod with
                    // 3 Ads, Post-roll Single Ad.
                    const tag = 'https://pubads.g.doubleclick.net/gampad/ads' +
                        '?sz=640x480&iu=/124319096/external/ad_rule_samples&' +
                        'ciu_szs=300x250&ad_rule=1&impl=s&gdfp_req=1&env=vp&' +
                        'output=vmap&unviewed_position_start=1&cust_params=d' +
                        'eployment%3Ddevsite%26sample_ar%3Dpremidpostoptimiz' +
                        'edpod&cmsid=496&vid=short_onecue&correlator=';
                    localStorage.setItem(`${this.prefix}tag`, tag);
                }
                location.reload();
            } catch (error) {
                this.debug.error(error);
            }
        });
    }
}

export default Ads;
