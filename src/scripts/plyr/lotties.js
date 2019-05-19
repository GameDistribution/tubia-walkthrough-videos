// ==========================================================================
// Lottie Animations
// ==========================================================================

import defaults from './defaults';

const anim = [];

const lotties = {
    
    // Create lottie Animations
    createAnimations() {
        setTimeout(() => {
            Object.keys(defaults.lottieAnim).forEach((key)=>{
                const element = defaults.lottieAnim[key];
                const container = document.querySelector(`[lottie-class="${element.container}"]`);
                const params = {
                    container: document.querySelector(`[lottie-class="${element.container}"]`),
                    autoplay: element.autoplay,
                    loop: element.loop,
                    path: `./animations/${element.container}.json`,
                    renderer: 'svg',
                };

                // eslint-disable-next-line
                anim[element.container] = bodymovin.loadAnimation(params);

                if (element.speed) {
                    anim[element.container].setSpeed(element.speed);
                }
                
                if (element.eventlisteners) {
                    if (element.playWhenHover) {
                        if (element.onMouseOver) {
                            container.setAttribute('play-this', element.onMouseOver);
                        }
                        container.addEventListener('mouseover', this.mouseOverLottieSVG);
                        container.addEventListener('mouseout', this.mouseOutLottieSVG);
                    } else {
                        container.addEventListener('click', this.clickLottieSVG);
                    }
                }
            });
        }, 100);
        this.addExitFullscreenListeners();
    },

    // Detect whether user presses to esc key
    addExitFullscreenListeners() {
        document.addEventListener('webkitfullscreenchange', this.toggleFullscreen, false);
        document.addEventListener('mozfullscreenchange', this.toggleFullscreen, false);
        document.addEventListener('fullscreenchange', this.toggleFullscreen, false);
        document.addEventListener('MSFullscreenChange', this.toggleFullscreen, false);
    },

    toggleFullscreen() {
        // Play/Reverse play lottie icon depends on fullscreen active mode
        if (!document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
            lotties.reversePlayLottie('plyr--button-fullscreen');
        } else {
            lotties.playLottie('plyr--button-fullscreen');
        }
    },
    
    clickLottieSVG() {
        const currAnim = this.getAttribute('lottie-class');
        const currFNum = anim[currAnim].currentRawFrame;
        if (!currFNum) {
            lotties.playLottie(currAnim);
        } else {
            lotties.reversePlayLottie(currAnim);
        }
    },

    mouseOverLottieSVG() {
        const playThis = this.getAttribute('play-this');
        const el = anim[!playThis ? this.getAttribute('lottie-class') : playThis];
        
        el.play();
    },
    
    mouseOutLottieSVG() {
        const playThis = this.getAttribute('play-this');
        const el = anim[!playThis ? this.getAttribute('lottie-class') : playThis];

        el.stop();
    },

    playLottie(element) {
        const el = anim[element];
        console.warn(el);
        el.setDirection(1);
        el.goToAndPlay(0, true);
    },

    reversePlayLottie(element) {
        const el = anim[element];
        el.setDirection(-1);
        el.goToAndPlay(20, true);
    },

};

export default lotties;