'use strict';

import EventBus from '../components/EventBus';

let instance = null;

/**
 * ImplementationTest
 */
class ImplementationTest {
    /**
     * Constructor of ImplementationTest.
     * @return {*}
     */
    constructor() {
        // Make this a singleton.
        if (instance) {
            return instance;
        } else {
            instance = this;
        }

        this.eventBus = new EventBus();
    }

    /**
     * Start testing.
     */
    start() {
        const css = `
            #tubia__implementation {
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
            #tubia__implementation > div {
                width: 100%;
            }
            #tubia__implementation > div > div {
                float: left;
                margin-right: 10px;
            }
            #tubia__implementation > div > div:last-of-type {
                float: right;
                margin-right: 0;
                text-align: right;
            }
            #tubia__implementation h2 {
                color: #fff;
                text-shadow: 0 0.07em 0 rgba(0,0,0,.5);
                text-transform: uppercase;
                margin-bottom: 4px;
                font-size: 8px;
                line-height: 100%;
                text-align: left;
            }
            #tubia__implementation button {
                background: transparent;
                margin-left: 2px;
                padding: 3px 10px;
                border: 1px solid #fff;
                color: #fff;
                outline: 0;
                cursor: pointer;
                font-size: 8px;
            }
            #tubia__implementation button:hover {
                background: rgba(255, 255, 255, 0.5);
            }
            #tubia__implementation button:active {
                background: #fff;
                color: #333;
            }
            #tubia__implementation button:first-of-type {
                margin-left: 0;
            }
        `;

        const html = `
            <div id="tubia__implementation">
                <div>
                    <div>
                        <h2>Advertisement</h2>
                        <button id="tubia__showBanner">showBanner</button>
                        <button id="tubia__cancel">Cancel</button>
                        <button id="tubia__demo">Demo VAST tag</button>
                    </div>
                    <div>
                        <h2>Video</h2>
                        <button id="tubia__pauseVideo">pause</button>
                        <button id="tubia__resumeVideo">resume</button>
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
        const pauseVideo = document.getElementById('tubia__pauseVideo');
        const resumeVideo = document.getElementById('tubia__resumeVideo');
        const showBanner = document.getElementById('tubia__showBanner');
        const cancelAd = document.getElementById('tubia__cancel');
        const demoAd = document.getElementById('tubia__demo');

        if (localStorage.getItem('tubia_tag')) {
            demoAd.innerHTML = 'Revert Vast tag';
            demoAd.style.background = '#002333';
        } else {
            demoAd.innerHTML = 'Demo VAST tag';
            demoAd.style.background = 'transparent';
        }

        pauseVideo.addEventListener('click', () => {
            window.tubia.onPauseVideo('Pause video requested from debugger',
                'warning');
        });
        resumeVideo.addEventListener('click', () => {
            window.tubia.onResumeVideo('Resume video requested from debugger',
                'warning');
        });
        showBanner.addEventListener('click', () => {
            // window.tubia.showBanner();
        });
        cancelAd.addEventListener('click', () => {
            window.tubia.videoAdInstance.cancel();
        });
        demoAd.addEventListener('click', () => {
            try {
                if (localStorage.getItem('tubia_tag')) {
                    localStorage.removeItem('tubia_tag');
                } else {
                    // VMAP - Pre-roll Single Ad, Mid-roll Optimized Pod with
                    // 3 Ads, Post-roll Single Ad.
                    const tag = 'https://pubads.g.doubleclick.net/gampad/ads' +
                        '?sz=640x480&iu=/124319096/external/ad_rule_samples&' +
                        'ciu_szs=300x250&ad_rule=1&impl=s&gdfp_req=1&env=vp&' +
                        'output=vmap&unviewed_position_start=1&cust_params=d' +
                        'eployment%3Ddevsite%26sample_ar%3Dpremidpostoptimiz' +
                        'edpod&cmsid=496&vid=short_onecue&correlator=';
                    localStorage.setItem('tubia_tag', tag);
                }
                location.reload();
            } catch (error) {
                console.log(error);
            }
        });
    }
}

export default ImplementationTest;
