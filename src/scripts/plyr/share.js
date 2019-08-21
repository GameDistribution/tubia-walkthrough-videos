// ==========================================================================
// Plyr share
// ==========================================================================

import utils from './utils';

class Share {
    constructor(p) {
        this.player = p.listeners.player;
        this.setup();
    }

    // Setup share
    setup() {
        
        // Requires UI support
        if (!this.player.supported.ui) {
            return;
        }

        // Set share enabled state if not set
        if (!utils.is.boolean(this.player.share.active)) {

            const active = this.player.storage.get('share');

            if (utils.is.boolean(active)) {
                this.player.share.active = active;
            } else {
                this.player.share.active = this.config.share.active;
            }
        }

        // Inject the container into the controls container
        if (!utils.is.element(this.player.elements.share)) {
            this.player.elements.share = utils.createElement('div', utils.getAttributesFromSelector(this.player.config.selectors.share));
            document.querySelector('.plyr--share-button').appendChild(utils.createElement('span', {
                class: 'plyr--share-title', 
            }, 'Share'));
            this.player.elements.controls.appendChild(this.player.elements.share);
        }

        // Enable UI
        Share.show.call(this);

        const shareScreenWrapper = document.querySelector('.plyr');

        const shareScreen = utils.createElement('div', {
            class: 'plyr--share-fullscreen',
        });

        document.querySelector('.plyr--share-button').addEventListener('click', () => {
            let json = null;
            if (this.player.storage.supported) {
                json = localStorage.getItem('defaultVideo');
            }
            
            let shareLink;
            
            if(!json) {
                shareLink = document.location.href;
            } else {
                const { gameUrl } = JSON.parse(json);
                shareLink = gameUrl;
            }
            shareScreen.classList.toggle('active');

            const shareScreenContent = `
            <div>
                <input type="text" id="shareInput" class="plyr--share-fullscreen-input" value="${shareLink}"/>
                <div class="plyr--share-buttons-wrapper">
                    <a class="plyr--sharing-button__link" href="https://facebook.com/sharer/sharer.php?u=${shareLink}" target="_blank" rel="noopener" aria-label="">
                    <div class="plyr--sharing-button plyr--sharing-button--facebook plyr--sharing-button--small"><div aria-hidden="true" class="plyr--sharing-button__icon plyr--sharing-button__icon--solid">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/></svg>
                        </div>
                    </div>
                    </a>
                    
                    <a class="plyr--sharing-button__link" href="https://twitter.com/intent/tweet/?text=${shareLink}" target="_blank" rel="noopener" aria-label="">
                    <div class="plyr--sharing-button plyr--sharing-button--twitter plyr--sharing-button--small"><div aria-hidden="true" class="plyr--sharing-button__icon plyr--sharing-button__icon--solid">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M23.44 4.83c-.8.37-1.5.38-2.22.02.93-.56.98-.96 1.32-2.02-.88.52-1.86.9-2.9 1.1-.82-.88-2-1.43-3.3-1.43-2.5 0-4.55 2.04-4.55 4.54 0 .36.03.7.1 1.04-3.77-.2-7.12-2-9.36-4.75-.4.67-.6 1.45-.6 2.3 0 1.56.8 2.95 2 3.77-.74-.03-1.44-.23-2.05-.57v.06c0 2.2 1.56 4.03 3.64 4.44-.67.2-1.37.2-2.06.08.58 1.8 2.26 3.12 4.25 3.16C5.78 18.1 3.37 18.74 1 18.46c2 1.3 4.4 2.04 6.97 2.04 8.35 0 12.92-6.92 12.92-12.93 0-.2 0-.4-.02-.6.9-.63 1.96-1.22 2.56-2.14z"/></svg>
                        </div>
                    </div>
                    </a>
                    
                    <a class="plyr--sharing-button__link" href="whatsapp://send?text=${shareLink}" target="_blank" rel="noopener" aria-label="">
                    <div class="plyr--sharing-button plyr--sharing-button--whatsapp plyr--sharing-button--small"><div aria-hidden="true" class="plyr--sharing-button__icon plyr--sharing-button__icon--solid">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.1 3.9C17.9 1.7 15 .5 12 .5 5.8.5.7 5.6.7 11.9c0 2 .5 3.9 1.5 5.6L.6 23.4l6-1.6c1.6.9 3.5 1.3 5.4 1.3 6.3 0 11.4-5.1 11.4-11.4-.1-2.8-1.2-5.7-3.3-7.8zM12 21.4c-1.7 0-3.3-.5-4.8-1.3l-.4-.2-3.5 1 1-3.4L4 17c-1-1.5-1.4-3.2-1.4-5.1 0-5.2 4.2-9.4 9.4-9.4 2.5 0 4.9 1 6.7 2.8 1.8 1.8 2.8 4.2 2.8 6.7-.1 5.2-4.3 9.4-9.5 9.4zm5.1-7.1c-.3-.1-1.7-.9-1.9-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1s-1.2-.5-2.3-1.4c-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6s.3-.3.4-.5c.2-.1.3-.3.4-.5.1-.2 0-.4 0-.5C10 9 9.3 7.6 9 7c-.1-.4-.4-.3-.5-.3h-.6s-.4.1-.7.3c-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.3-.3-.4-.6-.5z"/></svg>
                        </div>
                    </div>
                    </a>
                </div>
                <div id="toast"><div id="img">
                    <?xml version="1.0"?>
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 504.12 504.12" style="enable-background:new 0 0 504.12 504.12;" xml:space="preserve" width="512px" height="512px" class=""><g><circle style="fill:#FF9400" cx="252.06" cy="252.06" r="252.06" data-original="#3DB39E" class="" data-old_color="#ff9400"/><path style="fill:#E98903" d="M463.163,114.609L240.246,345.403l0.394,24.812h10.24l241.428-194.56  C485.218,153.994,475.372,133.12,463.163,114.609z" data-original="#37A18E" class="active-path" data-old_color="#E58703"/><path style="fill:#F2F1EF;" d="M499.397,103.582l-44.505-44.111c-5.908-5.908-15.754-5.908-22.055,0L242.609,256l-82.314-81.132  c-5.908-5.908-15.754-5.908-22.055,0l-39.385,38.991c-5.908,5.908-5.908,15.754,0,21.662L230.4,365.883  c3.545,3.545,8.271,4.726,12.997,4.332c4.726,0.394,9.452-0.788,12.997-4.332l243.003-240.246  C505.305,119.335,505.305,109.489,499.397,103.582z" data-original="#F2F1EF"/><path style="fill:#E6E5E3" d="M256.394,365.883l243.003-240.246c5.908-5.908,5.908-15.754,0-21.662l-7.089-6.695L243.003,342.252  L105.157,207.951l-5.908,5.908c-5.908,5.908-5.908,15.754,0,21.662l131.545,130.363c3.545,3.545,8.271,4.726,12.997,4.332  C248.123,370.609,252.849,369.428,256.394,365.883z" data-original="#E6E5E3" class=""/></g> </svg>
                </div>
                <div id="desc">Copied!</div></div>
            </div>
            `;

            shareScreen.innerHTML = shareScreenContent;
            shareScreenWrapper.prepend(shareScreen);

            document.querySelector('#shareInput').addEventListener('click', (e) => {
                document.getElementById(e.target.id).select();
                document.execCommand('copy');
                const toast = document.getElementById('toast');
                toast.className = 'show';
                setTimeout(() => {
                    toast.className = toast.className.replace('show', '');
                }, 3500);
            });
        });
    }

    static hide() {
        utils.toggleClass(this.player.elements.container, this.player.config.classNames.share.active, false);
        utils.toggleState(this.player.elements.buttons.share, false);
    }

    static show() {
        // Try to load the value from storage
        let active = false;
        // Otherwise fall back to the default config
        if (!utils.is.boolean(active)) {
            ({ active } = this.player.config.share);
        } else {
            this.player.share.active = active;
        }

        if (active) {
            utils.toggleClass(this.player.elements.container, this.player.config.classNames.share.active, true);
            utils.toggleState(this.player.elements.buttons.share, true);
        }
    }
};

export default Share;