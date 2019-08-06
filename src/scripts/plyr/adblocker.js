// ==========================================================================
// Check AdBlocker
// ==========================================================================
import defaults from './defaults';
import utils from './utils';
import lotties from './lotties';

const adblocker = {
    
    // Check an existing Ad Blocker Plugin
    check(adsblocked) {
        
        const URL = `https://adservice.google.com/adsid/integrator.js?domain=${defaults.ads.domain}`;   
        
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

            setTimeout(() => {
                if (adblockWarning.classList.contains('invisible')){
                    adblockWarning.classList.remove('invisible');
                }
            }, 500);

            // Configure HoneyBadger tool.
            const debug = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') || location.href.replace(/^(?:https?:\/\/)?/i, '').split('/')[0].split('.')[0] === 'test';
            const hbConfig = {
                apiKey: 'b4753ed6',
                environment: debug ? 'development' : 'production',
                disabled: debug,
            };
            
            // eslint-disable-next-line no-undef
            Honeybadger.configure(hbConfig);
            
            // Notify HoneyBadger found an adblocker plugin.
            const hbObj = {
                message: 'An adblocker plugin has been found. The player could not be started.',
                name: 'AdBlocker',
                component: 'player',
                action: 'show',
                environment: debug ? 'development' : 'production',
                projectRoot: location.href,
            };
            
            // eslint-disable-next-line no-undef
            Honeybadger.notify('error', hbObj);
        });

        return adsblocked;
    },
};

export default adblocker;

