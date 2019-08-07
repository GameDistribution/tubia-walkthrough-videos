// ==========================================================================
// Check AdBlocker
// ==========================================================================
import utils from './utils';
import lotties from './lotties';

const adblocker = {
    
    // Check an existing Ad Blocker Plugin
    check(adsblocked) {
        
        const URL = 'https://adservice.google.com.tr/adsid/integrator.js?domain=player.tubia.com';   
        
        const config = {
            method: 'HEAD',
            mode: 'no-cors',
        };

        const request =new Request(URL, config);

        fetch(request).then((response) => response).then(() => {
            // There's nothing blocks our precious ads.
        }).catch(() => {
            lotties.createAnimations();
            console.warn('Please, deactivate the adblocker plugin or check the network policies.');
            const adblockWarning = utils.createElement('div', { id: 'adblockWarningPopup', class: 'popup adblocker invisible'});
            const content = `
                <div class="container">
                <div class="column-left">
                    <div class="title">Oh no!</div>
                    <div class="subtitle">Adblocker is found!</div>
                    <div class="text">
                        Hey! You want to learn how to play this game so badly, right? You can just turn off your adblocker to watch this amazing walkthrough video.
                    </div>
                </div>
                <div class="column-right">
                    <div class="crying-character" lottie-class="crying-character"></div>
                </div>
                </div>
            `;
            adblockWarning.insertAdjacentHTML('afterbegin', content);
            const container = document.querySelector('body');

            container.append(adblockWarning);

            if (adblockWarning.classList.contains('invisible')){
                adblockWarning.classList.remove('invisible');
            }
        });

        return adsblocked;
    },
};

export default adblocker;

