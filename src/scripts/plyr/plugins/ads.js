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

        this.tag = player.config.ads.tag;
        this.tagLegacy = player.config.ads.tagLegacy;
        this.debug = player.config.debug;
        this.enabled = player.isHTML5 && player.isVideo && utils.is.string(this.tag) && this.tag.length;
        this.gdprTargeting = player.config.ads.gdprTargeting;
        this.headerBidding = player.config.ads.headerBidding;
        this.keys = player.config.ads.keys;
        this.domain = player.config.ads.domain;
        this.category = player.config.ads.category || '';

        this.prerollEnabled = player.config.ads.prerollEnabled;
        this.midrollEnabled = player.config.ads.midrollEnabled;
        this.videoInterval = player.config.ads.videoInterval;
        this.overlayInterval = player.config.ads.overlayInterval;

        this.loader = null;
        this.manager = null;
        this.cuePoints = [];
        this.elements = {
            container: null,
            displayContainer: null,
        };
        this.events = {};
        this.safetyTimer = null;
        this.adCount = 0;
        this.adPosition = 0;
        this.previousMidrollTime = 0;
        this.requestRunning = false;
        this.slotId = 'tubia__advertisement_slot';

        // For testing:
        // this.tag = 'https://pubads.g.doubleclick.net/gampad/ads?sz=480x70&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dnonlinear&correlator=';
        // this.tag = 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dskippablelinear&correlator=';

        // Setup a promise to resolve when the IMA manager is ready
        this.loaderPromise = new Promise((resolve, reject) => {
            this.player.on('adsloaderready', resolve);
            this.on('error', () => {
                // The advertisement failed! Continue video...
                this.player.play();

                // Reject our loader promise.
                reject(new Error('Initial loaderPromise failed to load.'));
            });
        });

        // Load Google IMA HTML5 SDK.
        if (this.enabled) {
            if (!utils.is.object(window.google) || !utils.is.object(window.google.ima)) {
                window.google = window.google || {};
                window.google.ima = window.google.ima || {};
            }

            if (!utils.is.object(window.idhbtubia) || !utils.is.array(window.idhbtubia.que)) {
                window.idhbtubia = window.idhbtubia || {};
                window.idhbtubia.que = window.idhbtubia.que || [];

                // Show some header bidding logging.
                if (this.debug) {
                    window.idhbtubia.getConfig();
                    window.idhbtubia.debug(true);
                }
            }

            this.ready();
            this.setupIMA();
        }
    }

    /**
     * Get the ads instance ready
     */
    ready() {
        // Start ticking our safety timer. If the whole advertisement
        // thing doesn't resolve within our set time; we bail
        this.startSafetyTimer(12000, 'ready()');

        // Clear the safety timer
        this.loaderPromise.then(() => {
            this.clearSafetyTimer('onAdsManagerLoaded()');

            // Preload the preroll.
            // Start playing the advertisement when ready.
            if (this.prerollEnabled) {
                this.adPosition = 1;
                this.prerollEnabled = false;
                this.player.debug.log('Starting a pre-roll advertisement.');
                this.requestAd()
                    .then(vastUrl => this.loadAd(vastUrl))
                    .catch(error => this.player.debug.log(error));
            }
        });

        // Subscribe to the LOADED event as we will want to clear our initial
        // safety timer, but also start a new one, as sometimes advertisements
        // can have trouble starting.
        this.player.on('adsmanagerloaded', () => {
            // Start our safety timer every time an ad is loaded.
            // It can happen that an ad loads and starts, but has an error
            // within itself, so we never get an error event from IMA.
            this.clearSafetyTimer('adloaded');
            this.startSafetyTimer(8000, 'adloaded');
        });

        // Subscribe to the STARTED event, so we can clear the safety timer
        // started from the LOADED event. This is to avoid any problems within
        // an advertisement itself, like when it doesn't start or has
        // a javascript error, which is common with VPAID.
        this.player.on('adsstarted', () => {
            this.clearSafetyTimer('adsstarted');
        });

        // Get current track time
        let time;
        this.player.on('seeking', () => {
            time = this.player.currentTime;
            return time;
        });

        // Discard ads when skipping the track at certain cue's
        // Todo: We don't have cue's because we don't have ad rules.
        this.player.on('seeked', () => {
            if (this.manager) {
                const seekedTime = this.player.currentTime;
                if (this.cuePoints){
                    this.cuePoints.forEach((cuePoint, index) => {
                        if (time < cuePoint && cuePoint < seekedTime) {
                            this.manager.discardAdBreak();
                            this.cuePoints.splice(index, 1);
                        }
                    });
                }
            }
        });

        // Run a post-roll advertisement and complete the ads loader
        this.player.on('ended', () => {
            this.adPosition = 0; // Make sure we register a post-roll.
            this.requestAd()
                .then(vastUrl => this.loadAd(vastUrl))
                .catch(error => this.player.debug.log(error));
            this.player.debug.log('Starting a post-roll advertisement.');
        });

        // Run a mid-roll non-linear or linear advertisement on a certain time
        // Timeupdate event updates ~250ms per second so we set a previousMidrollTime
        // to avoid consecutive requests for ads, as it is quite a race.
        this.player.on('timeupdate', () => {
            // Try to request non-linear ad every this.overlayInterval, unless
            // there is already one running. Try to request a linear ad every
            // this.videoInterval seconds, we must kill any running non-linear
            // advertisement before requesting this.
            if(this.midrollEnabled) {
                const currentTime = Math.ceil(this.player.currentTime);
                const intervalOverlay = Math.ceil(this.overlayInterval);
                const intervalVideo = Math.ceil(this.videoInterval);
                const duration = Math.floor(this.player.duration);

                // Standard midroll video when header bidding is enabled.
                // Otherwise we do a mix of non-linear and linear.
                if (currentTime % intervalVideo === 0
                    && currentTime !== this.previousMidrollTime
                    && currentTime < duration - intervalVideo) {
                    this.previousMidrollTime = currentTime;
                    this.adPosition = 3;
                    this.player.debug.log('Starting a linear mid-roll advertisement.');
                    // Make sure to kill the current running ad if there is any.
                    // This is not really allowed, but whatever...
                    // As there is a great chance we have a non-linear ad present.
                    if (this.requestRunning) {
                        this.killCurrentAd();
                    }
                    this.requestAd()
                        .then(vastUrl => this.loadAd(vastUrl))
                        .catch(error => this.player.debug.log(error));
                } else if (currentTime % intervalOverlay === 0
                    && currentTime !== this.previousMidrollTime
                    && currentTime < duration - intervalOverlay
                    && !this.requestRunning) {
                    // Make sure we don't re-request an ad when one is already running.
                    this.previousMidrollTime = currentTime;
                    this.adPosition = 2;
                    this.player.debug.log('Starting a non-linear mid-roll advertisement.');
                    this.requestAd()
                        .then(vastUrl => this.loadAd(vastUrl))
                        .catch(error => this.player.debug.log(error));
                }
            }
        });
    }

    /**
     * Kill the non-linear advertisement before requesting a new one.
     * This way we're allowed to request a new one.
     * Normal video ads kill themselves on CONTENT_RESUME event.
     */
    killCurrentAd() {
        // Destroy the manager so we can grab new ads after this.
        // If we don't then we're not allowed to call new ads based
        // on google policies, as they interpret this as an accidental
        // video requests. https://developers.google.com/interactive-
        // media-ads/docs/sdks/android/faq#8
        if (this.loader) {
            this.loader.contentComplete();
        }
        if (this.manager) {
            this.manager.destroy();
        }

        // We're done with the current request.
        this.requestRunning = false;

        // Log message to tell that the advertisement thing is finished.
        this.player.debug.log('IMA SDK is ready for new ad requests.');
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
            id: this.slotId, // Element id is needed by SpotX.
        });
        this.player.elements.container.appendChild(this.elements.container);

        // So we can run VPAID2
        google.ima.settings.setVpaidMode(google.ima.ImaSdkSettings.VpaidMode.INSECURE);

        // Set language
        if (!google.ima.settings.setLocale) {
            google.ima.settings.setLocale(this.player.config.ads.language);
        }

        // We assume the adContainer is the video container of the plyr element
        // that will house the ads
        this.elements.displayContainer = new google.ima.AdDisplayContainer(
            this.elements.container,
            this.player.elements.original,
        );

        // Create ads loader
        this.loader = new google.ima.AdsLoader(this.elements.displayContainer);

        // Listen and respond to ads loaded and error events
        this.loader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, event => this.onAdsManagerLoaded(event), false);
        this.loader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, error => this.onAdError(error), false);

        // The ad loader is ready to receive an advertisement request.
        utils.dispatchEvent.call(this.player, this.player.media, 'adsloaderready');
    }

    /**
     * requestAd
     * Request advertisements.
     * @return {Promise} Promise that returns DFP vast url like https://pubads.g.doubleclick.net/...
     * @public
     */
    requestAd() {
        return new Promise((resolve, reject) => {
            if (this.requestRunning) {
                this.player.debug.log('A request is already running');
                return;
            }

            this.requestRunning = true;

            try {
                this.player.debug.log('----- ADVERTISEMENT ------');

                // Get/ Create the VAST XML URL or return reporting keys.
                this.reportingKeys()
                    .then((data) => {
                        // REGULAR.
                        // Check if we simply got a VAST URL back.
                        if (typeof data === 'string' || data instanceof String) {
                            resolve(data);
                            return;
                        }

                        // HEADER BIDDING.
                        // We got an object with keys, so we know this
                        // will be a header bidding ad request.
                        if (typeof window.idhbtubia.requestAds === 'undefined') {
                            reject(new Error('Prebid.js wrapper script hit an error or didn\'t exist!'));
                            return;
                        }

                        // Create the ad unit name based on given Tunnl data.
                        // Default is the gamedistribution.com ad unit.
                        const nsid = data.nsid ? data.nsid : 'TNL_T-17102571517';
                        const tid = data.tid ? data.tid : 'TNL_NS-18101700058';
                        const unit = `${nsid}/${tid}`;

                        // Make sure to remove these properties as we don't
                        // want to pass them as key values.
                        delete data.nsid;
                        delete data.tid;

                        // Set the consent string and pass it to the header bidding wrapper.
                        // The default always allows personalised ads.
                        // The consent string given by Tunnl is set within their system, by domain.
                        // So if you want to disable personalised ads for a complete domain by default,
                        // then generate a "fake" string and add it to Tunnl for that domain.
                        // An exception to this is whenever a proper IAB CMP solution is found, which
                        // means there is an "euconsent" cookie with a consent string. The header bidding
                        // wrapper will then ignore any consent string given by the SDK or Tunnl, and will
                        // use this user generated consent string instead.
                        const consentString = data.consent_string
                            ? data.consent_string
                            : 'BOWJjG9OWJjG9CLAAAENBx-AAAAiDAAA';

                        this.player.debug.log(unit, 'info');

                        // Add test parameter for Tunnl.
                        Object.assign(data, {
                            tnl_system: '1',
                            tnl_tubia_category: this.category.toLowerCase(),
                        });

                        // Send event for Tunnl debugging.
                        /* eslint-disable */
                        if (typeof window['ga'] !== 'undefined') {
                            window['ga']('tubia.send', {
                                hitType: 'event',
                                eventCategory: 'AD_REQUEST',
                                eventAction: this.domain,
                                eventLabel: unit,
                            });
                        }
                        /* eslint-enable */

                        // Make the request for a VAST tag from the Prebid.js wrapper.
                        // Get logging from the wrapper using: ?idhbtubia_debug=true
                        // To get a copy of the current config: copy(idhbtubia.getConfig());
                        window.idhbtubia.que.push(() => {
                            window.idhbtubia.setAdserverTargeting(data);
                            window.idhbtubia.setDfpAdUnitCode(unit);

                            // This is to add a flag, which if set to false;
                            // non-personalized ads get requested from DFP and a no-consent
                            // string - BOa7h6KOa7h6KCLABBENCDAAAAAjyAAA - is sent to all SSPs.
                            // If set to true, then the wrapper will continue as if no consent was given.
                            // This is only for Google, as google is not part of the IAB group.
                            window.idhbtubia.allowPersonalizedAds(this.gdprTargeting);

                            // Pass on the IAB CMP euconsent string. Most SSP's are part of the IAB group.
                            // So they will interpret and apply proper consent rules based on this string.
                            window.idhbtubia.setDefaultGdprConsentString(consentString);
                            window.idhbtubia.requestAds({
                                slotIds: [this.slotId],
                                callback: vastUrl => {
                                    resolve(vastUrl);
                                },
                            });
                        });
                    })
                    .catch(error => {
                        reject(error);
                    });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * reportingKeys
     * Tunnl reporting needs its own custom tracking keys.
     * @return {Promise<any>} - Object containing keys or a VAST URL.
     * @private
     */
    reportingKeys() {
        return new Promise((resolve) => {
            // GDPR personalised advertisement ruling.
            this.tag = utils.updateQueryStringParameter(this.tag, 'npa', this.gdprTargeting ? '0' : '1');
            this.tagLegacy = utils.updateQueryStringParameter(this.tagLegacy, 'npa', this.gdprTargeting ? '0' : '0');
            this.player.debug.log(`ADVERTISEMENT: gdpr: npa=${this.gdprTargeting ? '0' : '1'}`);

            // Set custom tracking keys for Tunnl.
            try {
                if (this.keys) {
                    const keys = Object.entries(JSON.parse(this.keys));
                    keys.forEach(key => {
                        this.tag = utils.updateQueryStringParameter(this.tag, key[0], key[1]);
                        this.tagLegacy = utils.updateQueryStringParameter(this.tagLegacy, key[0], key[1]);
                    });
                }
            } catch(error) {
                this.player.debug.warn(error);
            }

            // Update our tag. We add additional parameters so Tunnl
            // can use the values as new metrics within reporting.
            // It is also used to determine if we get an overlay or not.
            // And even if the mid-roll should be non-linear or linear.
            // 0 - post-roll
            // 1 - pre-roll
            // 2 - mid-roll "subbanner" non-linear
            // 3 - mid-roll linear
            this.adCount += 1;
            const positionCount = this.adCount - 1;
            this.tag = utils.updateQueryStringParameter(this.tag, 'ad_count', this.adCount);
            this.tagLegacy = utils.updateQueryStringParameter(this.tagLegacy, 'ad_count', this.adCount);
            this.tag = utils.updateQueryStringParameter(this.tag, 'ad_request_count', '1');
            this.tagLegacy = utils.updateQueryStringParameter(this.tagLegacy, 'ad_request_count', '1');
            this.player.debug.log(`ADVERTISEMENT: ad_count: ${this.adCount}`);
            this.player.debug.log('ADVERTISEMENT: ad_request_count: 1');
            if (this.adPosition === 0) {
                this.tag = utils.updateQueryStringParameter(this.tag, 'ad_position', 'postroll');
                this.player.debug.log('ADVERTISEMENT: ad_position: postroll');
                this.player.debug.log('ADVERTISEMENT: hb: on');
            } else if (this.adPosition === 1) {
                this.tag = utils.updateQueryStringParameter(this.tag, 'ad_position', 'preroll');
                this.player.debug.log('ADVERTISEMENT: ad_position: preroll');
                this.player.debug.log('ADVERTISEMENT: hb: on');
            } else if (this.adPosition === 2) {
                // For testing:
                // this.tag = 'https://pubads.g.doubleclick.net/gampad/ads?sz=480x70&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dnonlinear&correlator=';
                this.tagLegacy = utils.updateQueryStringParameter(this.tagLegacy, 'ad_position', 'subbanner');
                this.tagLegacy = utils.updateQueryStringParameter(this.tagLegacy, 'ad_midroll_count', positionCount.toString());
                this.tagLegacy = utils.updateQueryStringParameter(this.tagLegacy, 'ad_type', 'image');
                this.tagLegacy = utils.updateQueryStringParameter(this.tagLegacy, 'ad_skippable', '0');
                this.tagLegacy = utils.updateQueryStringParameter(this.tagLegacy, 'hb', 'off');
                this.player.debug.log('ADVERTISEMENT: ad_position: subbanner');
                this.player.debug.log(`ADVERTISEMENT: ad_midroll_count: ${positionCount}`);
                this.player.debug.log('ADVERTISEMENT: ad_type: image');
                this.player.debug.log('ADVERTISEMENT: ad_skippable: 0');
                this.player.debug.log('ADVERTISEMENT: hb: off');
            } else if (this.adPosition === 3) {
                // For testing:
                // this.tag = 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dskippablelinear&correlator=';
                this.tag = utils.updateQueryStringParameter(this.tag, 'ad_position', 'midroll');
                this.tag = utils.updateQueryStringParameter(this.tag, 'ad_midroll_count', positionCount.toString());
                this.tag = utils.updateQueryStringParameter(this.tag, 'ad_type', '');
                this.tag = utils.updateQueryStringParameter(this.tag, 'ad_skippable', '');
                this.player.debug.log('ADVERTISEMENT: ad_position: midroll');
                this.player.debug.log(`ADVERTISEMENT: ad_midroll_count: ${positionCount}`);
                this.player.debug.log('ADVERTISEMENT: ad_type: ');
                this.player.debug.log('ADVERTISEMENT: ad_skippable: ');
                this.player.debug.log('ADVERTISEMENT: hb: on');
            }

            // If we want to run an old school non-linear ad.
            if (this.adPosition === 2) {
                resolve(this.tagLegacy);
            } else {
                // Appearantly we're ready for header bidding, fetch the reporting keys.
                // We pass on these keys to the Prebid wrapper, which returns us an
                // updated VAST XML tag.
                const request = new Request(this.tag, {method: 'GET'});
                fetch(request)
                    .then((response) => response.text())
                    .then((text) => text.length ? JSON.parse(text) : {})
                    .then(keys => resolve(keys))
                    .catch(error => {
                        this.player.debug.log(error);

                        const keys = {
                            'tid': 'TNL_T-17102571517',
                            'nsid': 'TNL_NS-18101700058',
                            'tnl_tid': 'T-17102571517',
                            'tnl_nsid': 'NS-18101700058',
                            'tnl_pt': '22',
                            'tnl_pid': 'P-17101800031',
                            'tnl_paid': '17',
                            'tnl_ad_type': 'video_image',
                            'tnl_asset_id': '0',
                            'tnl_ad_pos': this.adPosition,
                            'tnl_skippable': '1',
                            'tnl_cp1': '',
                            'tnl_cp2': '',
                            'tnl_cp3': '',
                            'tnl_cp4': '',
                            'tnl_cp5': '',
                            'tnl_cp6': '',
                            'tnl_campaign': '2',
                            'tnl_gdpr': '0',
                            'tnl_gdpr_consent': '1',
                            'consent_string': 'BOWJjG9OWJjG9CLAAAENBx-AAAAiDAAA',
                            'tnl_tubia_category': this.category.toLowerCase(),
                        };

                        // Send event for Tunnl debugging.
                        /* eslint-disable */
                        if (typeof window['ga'] !== 'undefined') {
                            window['ga']('gd.send', {
                                hitType: 'event',
                                eventCategory: 'AD_REQUEST_FALLBACK',
                                eventAction: this.domain,
                                eventLabel: error,
                            });
                        }
                        /* eslint-enable */

                        resolve(keys);
                    });
            }
        });
    }

    /**
     * _loadAd
     * Load advertisements.
     * @param {String} vastUrl
     * @public
     */
    loadAd(vastUrl) {
        const { container } = this.player.elements;

        if (typeof google === 'undefined') {
            this.trigger('error', 'Unable to request ad, google IMA SDK not defined.');
            return;
        }

        try {
            // Request video new ads.
            const adsRequest = new google.ima.AdsRequest();

            // Set the VAST tag.
            adsRequest.adTagUrl = vastUrl;

            this.player.debug.log(adsRequest.adTagUrl);

            // Specify the linear and nonlinear slot sizes. This helps the SDK
            // to select the correct creative if multiple are returned
            adsRequest.linearAdSlotWidth = container.offsetWidth;
            adsRequest.linearAdSlotHeight = container.offsetHeight;
            adsRequest.nonLinearAdSlotWidth = container.offsetWidth;

            // Set a small height, when we want to run a non linear in order to enforce an IAB leaderboard.
            const isMidrollDesktop = (this.adPosition === 2 && (!/Mobi/.test(navigator.userAgent)));
            adsRequest.nonLinearAdSlotHeight = (isMidrollDesktop) ? 120 : container.offsetHeight;
            this.player.debug.log(`ADVERTISEMENT: nonLinearAdSlotWidth: ${container.offsetWidth}`);
            this.player.debug.log(`ADVERTISEMENT: nonLinearAdSlotHeight: ${adsRequest.nonLinearAdSlotHeight}`);

            // We don't want non-linear FULL SLOT ads when we're running mid-rolls on desktop
            adsRequest.forceNonLinearFullSlot = (!isMidrollDesktop);
            this.player.debug.log(`ADVERTISEMENT: forceNonLinearFullSlot: ${(!isMidrollDesktop)}`);

            // Send event for Tunnl debugging.
            /* eslint-disable */
            if (typeof window['ga'] !== 'undefined') {
                const time = new Date();
                const h = time.getHours();
                const d = time.getDate();
                const m = time.getMonth();
                const y = time.getFullYear();
                let categoryName = '';
                if (this.adPosition === 0) {
                    categoryName = 'POSTROLL';
                } else if (this.adPosition === 1) {
                    categoryName = 'PREROLL';
                } else if (this.adPosition === 2) {
                    categoryName = 'MIDROLL_NON_LINEAR';
                } else if (this.adPosition === 3) {
                    categoryName = 'MIDROLL_LINEAR';
                }
                window.ga('tubia.send', {
                    hitType: 'event',
                    eventCategory: categoryName,
                    eventAction: `${this.domain} | h${h} d${d} m${m} y${y}`,
                    eventLabel: vastUrl,
                });
            }
            /* eslint-enable */

            // Get us some ads!
            this.loader.requestAds(adsRequest);
        } catch (e) {
            this.onAdError(e);
        }
    }

    /**
     * This method is called whenever the ads are ready inside the AdDisplayContainer
     * @param {Event} adsManagerLoadedEvent
     */
    onAdsManagerLoaded(adsManagerLoadedEvent) {
        const { container } = this.player.elements;

        // Get the ads manager
        const settings = new google.ima.AdsRenderingSettings();
        settings.enablePreloading = true;
        settings.restoreCustomPlaybackStateOnAdBreakComplete = true;
        // settings.useStyledLinearAds = false;
        // Make sure we always have an ad timer.
        settings.uiElements = [
            google.ima.UiElements.AD_ATTRIBUTION,
            google.ima.UiElements.COUNTDOWN,
        ];

        // The SDK is polling currentTime on the contentPlayback. And needs a duration
        // so it can determine when to start the mid- and post-roll
        this.manager = adsManagerLoadedEvent.getAdsManager(this.player.elements.original, settings);

        // Get the cue points for any mid-rolls by filtering out the pre- and post-roll
        this.cuePoints = this.manager.getCuePoints();

        // Add advertisement cue's within the time line if available
        // Todo: cue points are not yet working with how we currently request ads.
        if (this.cuePoints) {
            this.cuePoints.forEach(cuePoint => {
                if (cuePoint !== 0 && cuePoint !== -1 && cuePoint < this.player.duration) {
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
        }

        // Set volume to match player
        this.manager.setVolume(this.player.volume);

        // Add listeners to the required events
        // Advertisement error events
        this.manager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, error => this.onAdError(error));

        // Advertisement regular events
        Object.keys(google.ima.AdEvent.Type).forEach(type => {
            this.manager.addEventListener(google.ima.AdEvent.Type[type], event => this.onAdEvent(event));
        });

        // Listen to the resizing of the window. And resize ad accordingly
        window.addEventListener('resize', () => {
            if (this.manager) {
                this.manager.resize(container.offsetWidth, container.offsetHeight, google.ima.ViewMode.NORMAL);
            }
        });

        // Once the ad display container is ready and ads have been retrieved,
        // we can use the ads manager to display the ads.
        if (this.manager && this.elements.displayContainer) {
            // Send an event to tell that our ads manager
            // has successfully loaded the VAST response.
            utils.dispatchEvent.call(this.player, this.player.media, 'adsmanagerloaded');

            // Initialize the container. Must be done via a user action on mobile devices
            this.elements.displayContainer.initialize();

            try {
                // Initialize the ads manager. Ad rules playlist will start at this time
                this.manager.init(container.offsetWidth, container.offsetHeight, google.ima.ViewMode.NORMAL);

                // Call play to start showing the ad. Single video and overlay ads will
                // start at this time; the call will be ignored for ad rules
                this.manager.start();
            } catch (adError) {
                // An error may be thrown if there was a problem with the VAST response
                this.onAdError(adError);
            }
        }
    }

    /**
     * This is where all the event handling takes place. Retrieve the ad from the event. Some
     * events (e.g. ALL_ADS_COMPLETED) don't have the ad object associated
     * https://developers.google.com/interactive-media-ads/docs/sdks/html5/v3/apis#ima.AdEvent.Type
     * @param {Event} event
     */
    onAdEvent(event) {
        // Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED)
        // don't have ad object associated
        const ad = event.getAd();

        // Proxy event
        const dispatchEvent = type => {
            const eventMessage = `ads${type.replace(/_/g, '').toLowerCase()}`;
            utils.dispatchEvent.call(this.player, this.player.media, eventMessage);
        };

        utils.on(this.player.media, 'loaded started impression contentpause contentresume midpoint complete allcomplete click', (eventAds) => {
            console.log('**__', eventAds);
        });

        switch (event.type) {
            case google.ima.AdEvent.Type.LOADED:
                dispatchEvent('loaded');
                // Make sure that our ad containers have the correct size and styling.
                // Ad.getVastMediaWidth() and Ad.getVastMediaHeight() are now released.
                if (ad.isLinear()) {
                    utils.toggleClass(this.elements.container, this.player.config.classNames.nonLinearAdvertisement, false);
                    this.elements.container.style.width = '100%';
                    this.elements.container.style.height = '100%';
                    this.elements.container.style.backgroundColor = '#000000';
                    this.elements.container.firstChild.style.width = '100%';
                    this.elements.container.firstChild.style.height = '100%';
                    this.elements.container.firstChild.style.backgound = '#000000';
                } else {
                    const advertisement = ad[Object.keys(ad)[0]];
                    if (advertisement) {
                        utils.toggleClass(this.elements.container, this.player.config.classNames.nonLinearAdvertisement, true);
                        this.elements.container.style.width = `${advertisement.width}px`;
                        this.elements.container.style.height = `${advertisement.height}px`;
                        this.elements.container.firstChild.style.width = `${advertisement.width}px`;
                        this.elements.container.firstChild.style.height = `${advertisement.height}px`;
                    }
                }

                // console.info('Ad type: ' + event.getAd().getAdPodInfo().getPodIndex());
                // console.info('Ad time: ' + event.getAd().getAdPodInfo().getTimeOffset());
                break;

            case google.ima.AdEvent.Type.STARTED:
                dispatchEvent('started');
                // Show the container when we get a non-linear ad.
                // Because non-linear ads won't trigger CONTENT_PAUSE_REQUESTED.
                if (!ad.isLinear()) {
                    this.showAd('nonlinear');
                }
                break;

            case google.ima.AdEvent.Type.IMPRESSION:
                dispatchEvent('impression');

                try {
                    const time = new Date();
                    const h = time.getHours();
                    const d = time.getDate();
                    const m = time.getMonth();
                    const y = time.getFullYear();

                    /* eslint-disable */
                    if (typeof window.ga !== 'undefined') {
                        window.ga('tubia.send', {
                            hitType: 'event',
                            eventCategory: 'IMPRESSION',
                            eventAction: this.domain,
                            eventLabel: `h${h} d${d} m${m} y${y}`,
                        });
                    }
                    /* eslint-enable */

                    // Check which bidder served us the impression.
                    // We can call on a Prebid.js method. If it exists we report it.
                    // Our default ad provider is Ad Exchange.
                    if (utils.is.object(window.pbjstubia)) {
                        const winners = window.pbjstubia.getHighestCpmBids();
                        if (this.debug) {
                            this.player.debug.log('Winner(s)', winners);
                        }
                        // Todo: There can be multiple winners...
                        if (winners.length > 0) {
                            winners.forEach((winner) => {

                                /* eslint-disable */
                                if (typeof window['ga'] !== 'undefined' && winner.bidder) {
                                    window['ga']('tubia.send', {
                                        hitType: 'event',
                                        eventCategory: `IMPRESSION_${winner.bidder.toUpperCase()}`,
                                        eventAction: this.domain,
                                        eventLabel: `h${h} d${d} m${m} y${y}`,
                                    });
                                }
                                /* eslint-enable */
                            });
                        } else {
                            /* eslint-disable */
                            if (typeof window['ga'] !== 'undefined') {
                                window['ga']('tubia.send', {
                                    hitType: 'event',
                                    eventCategory: `IMPRESSION_ADEXCHANGE${this.adPosition === 2 ? '_NON_LINEAR' : '_LINEAR'}`,
                                    eventAction: this.domain,
                                    eventLabel: `h${h} d${d} m${m} y${y}`,
                                });
                            }
                            /* eslint-enable */
                        }
                    }
                } catch (error) {
                    this.player.debug.warn('error', error);
                }

                /* eslint-enable */
                break;

            case google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED:
                dispatchEvent('contentpause');
                // This event indicates the ad has started - the video player can adjust the UI,
                // for example display a pause button and remaining time. Fired when content should
                // be paused. This usually happens right before an ad is about to cover the content
                this.pauseContent();
                this.showAd();
                break;

            case google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED:
                dispatchEvent('contentresume');
                // This event indicates the ad has finished - the video player can perform
                // appropriate UI actions, such as removing the timer for remaining time detection.
                // Fired when content should be resumed. This usually happens when an ad finishes
                // or collapses

                // Hide the advertisement.
                this.hideAd();

                // Kill the current ad.
                this.killCurrentAd();

                // Play our video
                if (this.player.currentTime < this.player.duration) {
                    this.player.play();
                }
                break;

            case google.ima.AdEvent.Type.MIDPOINT:
                dispatchEvent('midpoint');
                break;

            case google.ima.AdEvent.Type.COMPLETE:
                dispatchEvent('complete');
                break;

            case google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
                dispatchEvent('allcomplete');
                // All ads for the current videos are done. We can now request new advertisements
                // in case the video is re-played
                break;

            case google.ima.AdEvent.Type.USER_CLOSE:
                dispatchEvent('complete');
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
     * https://developers.google.com/interactive-media-ads/docs/sdks/html5/v3/apis#ima.AdError.getErrorCode
     * @param {Event} event
     */
    onAdError(event) {
        this.cancel();

        try {
            /* eslint-disable */
            if (typeof window['ga'] !== 'undefined') {
                window['ga']('tubia.send', {
                    hitType: 'event',
                    eventCategory: 'AD_ERROR',
                    eventAction: event.getError().getErrorCode().toString() || event.getError().getVastErrorCode().toString(),
                    eventLabel: event.getError().getMessage(),
                });
            }
            /* eslint-enable */

            // Check which bidder served us a possible broken advertisement.
            // We can call on a Prebid.js method. If it exists we report it.
            // If there is no winning bid we assume the problem lies with AdExchange.
            // As our default ad provider is Ad Exchange.
            if (utils.is.object(window.pbjstubia)) {
                const winners = window.pbjstubia.getHighestCpmBids();
                if (this.debug) {
                    this.player.debug.log('Failed winner(s)', winners);
                }
                // Todo: There can be multiple winners...
                if (winners.length > 0) {
                    winners.forEach((winner) => {
                        const adId = winner.adId ? winner.adId : null;
                        const creativeId = winner.creativeId ? winner.creativeId : null;

                        /* eslint-disable */
                        if (typeof window['ga'] !== 'undefined' && winner.bidder) {
                            window['ga']('tubia.send', {
                                hitType: 'event',
                                eventCategory: `AD_ERROR_${winner.bidder.toUpperCase()}`,
                                eventAction: event.getError().getErrorCode().toString() || event.getError().getVastErrorCode().toString(),
                                eventLabel: `${adId} | ${creativeId}`,
                            });
                        }
                        /* eslint-enable */
                    });
                } else {
                    /* eslint-disable */
                    if (typeof window['ga'] !== 'undefined') {
                        window['ga']('tubia.send', {
                            hitType: 'event',
                            eventCategory: `AD_ERROR_ADEXCHANGE${this.adPosition === 2 ? '_NON_LINEAR' : '_LINEAR'}`,
                            eventAction: event.getError().getErrorCode().toString() || event.getError().getVastErrorCode().toString(),
                            eventLabel: event.getError().getMessage(),
                        });
                    }
                    /* eslint-enable */
                }
            }
        } catch (error) {
            this.player.debug.warn('error', error);
        }
    }

    /**
     * Show the advertisement container
     * @param {String} adType
     */
    showAd(adType) {
        this.elements.container.style.zIndex = (adType === 'nonlinear') ? '3' : '4';
    }

    /**
     * Hide the advertisement container
     */
    hideAd() {
        this.elements.container.style.zIndex = '';
    }

    /**
     * Pause our video
     */
    pauseContent() {
        // Ad is playing.
        this.playing = true;

        // Pause our video.
        this.player.pause();
    }

    /**
     * Cancel our ads, just resume the content and trigger an error
     */
    cancel() {
        // Destroy the manager so we can grab new ads after this.
        // If we don't then we're not allowed to call new ads based
        // on google policies, as they interpret this as an accidental
        // video requests. https://developers.google.com/interactive-
        // media-ads/docs/sdks/android/faq#8
        this.loaderPromise.then(() => {
            if (this.loader) {
                // We don't use DFP ad rules, so we have to set it to complete.
                // Before we can request new ads.
                this.loader.contentComplete();
            }
            if (this.manager) {
                this.manager.destroy();
            }

            // Hide the advertisement.
            this.hideAd();

            // We're done with the current request.
            this.requestRunning = false;

            // Play our video.
            if (this.player.currentTime < this.player.duration) {
                this.player.play();
            }
        }).catch(() => {
            this.player.debug.warn(new Error('adsLoaderPromise failed to load.'));
        });

        // Log message to tell that the whole advertisement
        // thing is finished.
        this.player.debug.log('Advertisement has been canceled.');

        // Tell our instance that we're done for now
        // this.trigger('error');
    }

    /**
     * Handles callbacks after an ad event was invoked
     * @param {string} event - Event type
     */
    trigger(event, ...args) {
        const handlers = this.events[event];
        if (utils.is.array(handlers)) {
            handlers.forEach(handler => {
                if (utils.is.function(handler)) {
                    handler.apply(this, args);
                }
            });
        }
    }

    /**
     * Add event listeners
     * @param {string} event - Event type
     * @param {function} callback - Callback for when event occurs
     * @return {Ads}
     */
    on(event, callback) {
        if (!utils.is.array(this.events[event])) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
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
        this.safetyTimer = setTimeout(() => {
            this.player.debug.log(`Safety timer triggered from: ${from}`);
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