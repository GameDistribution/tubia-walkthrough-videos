import utils from './utils';

class MoreMenu {
    constructor(p) {
        this.player = p.listeners.player;
        this.moremenu = p.config.moremenu;
        if (!this.moremenu) return;
        this.setup();
    }

    setup() {
        MoreMenu.createMoreMenu.call(this);
    }

    static createMoreMenu() {
        const moreMenuContainer = utils.createElement('div', {
            class: 'more-menu-container',
        });

        const moreMenu = utils.createElement('ul', {
            class: 'more-menu-items hide',
            id: 'moreMenu',
        });
        
        const aboutTubiaPlayer = utils.createElement('li');
        aboutTubiaPlayer.insertAdjacentHTML('afterbegin', '<a href="https://tubia.com/" target="_blank">About Tubia Player</a>');

        const shareThisVideo = utils.createElement('li');
        shareThisVideo.insertAdjacentHTML('afterbegin', '<span>Share this video</span>');
        shareThisVideo.addEventListener('click', () => MoreMenu.openShareContainer.call(this));
        
        moreMenu.appendChild(shareThisVideo);
        moreMenu.appendChild(aboutTubiaPlayer);
        
        moreMenuContainer.appendChild(moreMenu);

        const moreButton = utils.createElement('button', {
            class: 'more-button',
        });
        moreButton.insertAdjacentHTML('afterbegin', `
        <?xml version="1.0" encoding="utf-8"?>
        <!-- Generator: Adobe Illustrator 24.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
        <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
            viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve">
            <style type="text/css">
                .st0{fill:#FFFFFF;}
            </style>
            <g>
                <circle class="st0" cx="25" cy="52.8" r="8"/>
                <circle class="st0" cx="50" cy="52.8" r="8"/>
                <circle class="st0" cx="75" cy="52.8" r="8"/>
            </g>
        </svg>
        `);
        moreButton.addEventListener('click', () => MoreMenu.toggleMoreMenu.call(this));
        moreMenuContainer.appendChild(moreButton);

        const container = document.querySelector('.plyr__controls');
        const controlsTop = utils.createElement('div', {
            class: 'plyr__controls-top',
        });
        controlsTop.appendChild(moreMenuContainer);
        container.appendChild(controlsTop); 
    }

    static toggleMoreMenu() {
        const menu = document.getElementById('moreMenu');
        if (!utils.is.nullOrUndefined(menu)) {
            if (menu.classList.contains('hide')) {
                menu.classList.remove('hide');
            } else {
                menu.classList.add('hide');
            }
        }
    }

    static openShareContainer() {
        const shareButton = document.getElementById('shareButton');
        MoreMenu.toggleMoreMenu.call(this);
        shareButton.click();
    }
}
export default MoreMenu;
