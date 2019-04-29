// ==========================================================================
// Lottie Animations
// ==========================================================================

import defaults from './defaults';

const anim = [];

const lotties = {
    
    // Create lottie Animations
    createAnimations() {
        setTimeout(() => {
            defaults.lottieAnim.forEach((element, index) => {
                const params = {
                    container: document.querySelector(`.${defaults.lottieAnim[index]}`),
                    autoplay: false,
                    loop: false,
                    path: `./animations/${defaults.lottieAnim[index]}.json`,
                    renderer: 'svg',
                };
                document.querySelector(`.${defaults.lottieAnim[index]}`).setAttribute('id', defaults.lottieAnim[index]);
                anim[defaults.lottieAnim[index]] = bodymovin.loadAnimation(params);
                document.querySelector(`.${defaults.lottieAnim[index]}`).addEventListener('click', this.clickLottieSVG);
            });
        }, 100);
    },
    
    clickLottieSVG() {
        const currAnim = anim[this.getAttribute('id')];
        const currFNum = currAnim.currentRawFrame;
        if (!currFNum) {
            currAnim.setDirection(1);
        } else {
            currAnim.setDirection(-1);
        }
        currAnim.goToAndPlay(currFNum, true);
    },

};

export default lotties;