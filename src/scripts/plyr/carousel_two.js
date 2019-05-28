import utils from './utils';
import defaults from './defaults';
import controls from './controls';
import lotties from './lotties';

class CarouselTwo {
    constructor(p) {
        this.player = p.listeners.player;
        this.moreItems = p.config.morevideos.data.filter((element) => element.videos.some((vid) => vid.videoType >=0 && vid.videoType<=3));
        if (this.moreItems.length === 0 || this.moreItems === undefined) return;
        this.setup();
    }

    setup() {
        this.openedMagic = window.localStorage.getItem('openedMagic') || false;
        this.currentData = null;
        this.videoPaused = false;
        this.videoStarted = false;
        this.timer = null;
        this.attachedLoadedDataEvent = false;
        this.magicDelay = parseInt(60000, 10);
        this.countdown = this.magicDelay / 1000;
        this.classes = {
            relatedVideos: 'related--videos',
            modeTitle: 'related--videos-mode-title',
            interesting:'related--videos-mode-caption',
            closeButton: 'related--videos-close-button',
            character: 'related--videos-tubia-character',
        };

        const filteredArray = (type) => this.moreItems.filter((element) => element.videos.some((vid) => vid.videoType === type))
            .map(m => ({ video: m.videos[0], picture: m.pictures[0] }));
        
        this.modes = {
            insane: filteredArray(0).length && {
                type: 0,
                title: filteredArray(0)[0].video.title,
                data: filteredArray(0)[0] || null,
                section: utils.createElement('div',{class:'mode'}),
            },
            best: filteredArray(1).length && {
                type: 1,
                title: filteredArray(1)[0].video.title,
                data: filteredArray(1)[0] || null,
                section: utils.createElement('div',{class:'mode'}),
            },
            magic: filteredArray(2).length && {
                type: 2,
                title: this.openedMagic ? filteredArray(2)[0].video.title : 'WATCH VIDEO TO UNLOCK',
                data: filteredArray(2)[0] || null,
                section: utils.createElement('div',{class:`mode magic-video ${this.openedMagic ? 'magic-opened' : 'magic-not-opened'}`}),
            },
            related: [],
        };
        
        
        const moreVideosWrapper = document.querySelector(defaults.selectors.morevideos);
        
        // Hide More Videos as a default
        moreVideosWrapper.classList.add('hide');

        // Caption is hidden.
        // const caption = utils.createElement('div', {
        //     class: this.classes.interesting,
        // },'Interesting Videos');

        const closeButton = utils.createElement('button', {
            class: this.classes.closeButton,
        });

        closeButton.insertAdjacentHTML('afterbegin', '<span class="icon-close"></span><span class="text">CLOSE</span>');

        closeButton.addEventListener('click', () => {
            controls.hideInterestingVideos();
        });

        closeButton.setAttribute('data-plyr', 'moreVideosCloseButton');

        // Caption is hidden.
        // moreVideosWrapper.appendChild(caption);
        moreVideosWrapper.appendChild(closeButton);

        const relatedVideosWrapper = utils.createElement('div', {
            class: this.classes.relatedVideos,
        });

        if (this.modes.insane.data) {
            CarouselTwo.createTitle.call(this, this.modes.insane);
            CarouselTwo.createThumbnails.call(this, this.modes.insane);
            CarouselTwo.createHexagon.call(this, this.modes.insane);
            CarouselTwo.createScrews.call(this, this.modes.insane);
            this.modes.insane.section.addEventListener('mouseenter', CarouselTwo.hoverGifAnimateEvent);
            this.modes.insane.section.addEventListener('mouseleave', CarouselTwo.hoverGifAnimateEvent);
            relatedVideosWrapper.appendChild(this.modes.insane.section);
        }
        if (this.modes.best.data) {
            CarouselTwo.createTitle.call(this, this.modes.best);
            CarouselTwo.createThumbnails.call(this, this.modes.best);
            CarouselTwo.createHexagon.call(this, this.modes.best);
            CarouselTwo.createScrews.call(this, this.modes.best);
            this.modes.best.section.addEventListener('mouseenter', CarouselTwo.hoverGifAnimateEvent);
            this.modes.best.section.addEventListener('mouseleave', CarouselTwo.hoverGifAnimateEvent);
            relatedVideosWrapper.appendChild(this.modes.best.section);
        }
        if (this.modes.magic.data) {
            CarouselTwo.createTitle.call(this, this.modes.magic);
            CarouselTwo.createScrews.call(this, this.modes.magic);
            CarouselTwo.createMagicAnimations.call(this, this.modes.magic);

            if (!this.openedMagic) {
                this.modes.magic.section.addEventListener('mouseenter', CarouselTwo.hoverGifAnimateEvent);
                this.modes.magic.section.addEventListener('mouseleave', CarouselTwo.hoverGifAnimateEvent);
                CarouselTwo.createMagicPlay.call(this);
            }
            else {
                CarouselTwo.createThumbnails.call(this, this.modes.magic);
                CarouselTwo.createHexagon.call(this, this.modes.magic);
                this.modes.magic.section.addEventListener('mouseenter', CarouselTwo.hoverGifAnimateEvent);
                this.modes.magic.section.addEventListener('mouseleave', CarouselTwo.hoverGifAnimateEvent);
            }
            relatedVideosWrapper.appendChild(this.modes.magic.section);
        }

        filteredArray(3).forEach((element) => {
            this.modes.related.push({
                type: 3,
                title: element.video.title,
                data: element || null,
                section: utils.createElement('div', { class:'mode related-video' }),
            });
        });

        this.modes.related.forEach((element) => {
            CarouselTwo.createTitle.call(this, element);
            CarouselTwo.createThumbnails.call(this, element);
            CarouselTwo.createHexagon.call(this, element);
            CarouselTwo.createScrews.call(this, element);
            element.section.addEventListener('mouseenter', CarouselTwo.hoverGifAnimateEvent);
            element.section.addEventListener('mouseleave', CarouselTwo.hoverGifAnimateEvent);
            relatedVideosWrapper.appendChild(element.section);
        });
        
        const vidEl = document.querySelector('video');
        CarouselTwo.createMagicTimerAnim.call(this);

        if (this.attachedLoadedDataEvent === false) {
            vidEl.addEventListener('loadeddata', () => {
                utils.toggleHidden(this.player.elements.volume, false);
                utils.toggleHidden(this.player.elements.buttons.mute, false);
                vidEl.play();
                CarouselTwo.setMagicVideo.call(this);
            });
            this.attachedLoadedDataEvent = true;
        }

        relatedVideosWrapper.appendChild(utils.createElement('div',{style:'clear:both'}));

        vidEl.addEventListener('pause', () => { 
            this.videoPaused = true; 
            controls.showInterestingVideos();
        });

        vidEl.addEventListener('play', () => { 
            this.videoStarted = true;
            if (this.videoPaused && this.videoStarted) 
            { 
                controls.hideInterestingVideos();
                this.videoPaused = false;
            }
        });

        moreVideosWrapper.appendChild(relatedVideosWrapper);
        CarouselTwo.createTubiaCharacter(this.modes.related);
    }

    

    static createThumbnails(mode) {
        const { data, section, type } = mode;
        if (!data) return;

        if (type === 2) {
            const { magic } = data.video;
            data.picture.link = magic.videoThumb;
            data.video.gifUrl = magic.gifUrl;
        }

        let thumbnail = data.picture;

        if (type !== 3) {
            thumbnail = { link: data.video.videoThumb };
        }
        if (thumbnail) {
            const thumbElement = utils.createElement('img', { src: thumbnail.link, class: (this.openedMagic) ? 'magic-opened' : 'magic-not-opened' });

            // If data has a gif url, it is being added as a data-attr.
            if (data.video.gifUrl) {
                const { gifUrl } = data.video;
                if (gifUrl) {
                    thumbElement.setAttribute('data-gif', gifUrl);
                    thumbElement.setAttribute('data-image', thumbnail.link);
                }
            }
            section.appendChild(thumbElement);
        }
    }

    static createTitle(mode) {
        const { section, title } = mode;
        const titleEl = utils.createElement('div', { class: this.classes.modeTitle }, title);
        section.appendChild(titleEl);
    }

    static createScrews(mode) {
        const { section } = mode;
        const secrewLeft = `
            <i class="screw left"></i>
        `;
        const secrewRight = `
            <i class="screw right"></i>
        `;
        section.insertAdjacentHTML('afterbegin', secrewLeft);
        section.insertAdjacentHTML('beforeend', secrewRight);
    }

    static createControls(container) {
        // const { section } = mode;
        // eslint-disable-next-line radix
        const prev = utils.createElement('div', { class: container.style.marginLeft ? 'control prev' : 'control prev hide' });

        prev.insertAdjacentHTML('afterbegin','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M16.67 0l2.83 2.829-9.339 9.175 9.339 9.167-2.83 2.829-12.17-11.996z"/></svg>');
        prev.addEventListener('click', CarouselTwo.showPrev);
        container.appendChild(prev);

        const next = utils.createElement('div', { class: 'control next' });
        next.insertAdjacentHTML('afterbegin','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M7.33 24l-2.83-2.829 9.339-9.175-9.339-9.167 2.83-2.829 12.17 11.996z"/></svg>');
        next.addEventListener('click', CarouselTwo.showNext);
        container.appendChild(next);
    }

    static showPrev() {
        CarouselTwo.updateControls('prev');
    }

    static showNext() {
        CarouselTwo.updateControls('next');
    }

    static updateControls(direction) {
        const container = document.querySelector('.related--videos');
        const playerWidth = document.querySelector('.plyr--video').offsetWidth;
        const videoWidth = document.querySelector('.mode').offsetWidth;
        const maxNumber = Math.floor(playerWidth / videoWidth);
        const prev = document.querySelector('.control.prev');
        const next = document.querySelector('.control.next');
        // const maxmargin =  container.offsetWidth - videoWidth*4;
        const maxmargin = playerWidth - container.offsetWidth - (maxNumber - 1)*videoWidth;
        
        
        let marginLeft = parseFloat(container.style.marginLeft ? container.style.marginLeft : 0);

        switch(direction) {
            case 'next': { 
                marginLeft -= videoWidth*2;
                if (marginLeft < maxmargin) return;
                break;
            } 
            case 'prev': { 
                marginLeft += videoWidth*2;
                if (marginLeft > 0) return;
                break; 
            }
            default: break;
        }
        
        next.classList[(marginLeft-videoWidth*maxNumber/2 > maxmargin)?'remove':'add']('hide');
        prev.classList[(marginLeft < 0)?'remove':'add']('hide');

        container.style.marginLeft = `${marginLeft  }px`;
    }

    static createMagicAnimations(mode) {
        const { section } = mode;
        const magicSpaceAnimation = utils.createElement('div', { class: this.openedMagic ? 'magic-space hide' : 'magic-space', 'lottie-class': 'magic-space'});
        const magicLockAnimation = utils.createElement('div', { class: this.openedMagic ? 'magic-lock magic-opened' : 'magic-lock', 'lottie-class': 'magic-lock'});
        
        section.appendChild(magicLockAnimation);
        section.appendChild(magicSpaceAnimation);
    }

    static createHexagon(mode) {
        const { data, section, type } = mode;

        if (type === 2) {
            const { magic } = data.video;

            data.picture.link = magic.videoThumb;
            data.video.gifUrl = magic.gifUrl;
            data.video.title = magic.title;
            data.video.linkSecure = magic.link.indexOf('https') >-1 ? magic.link : magic.link.replace('http', 'https');
        }

        const button = utils.createElement('button', { class: 'tubia__play-button' });
        const hexagon = `<svg class="tubia__play-icon" viewBox="0 0 18 18" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <g>
                                <path d="M15.5615866,8.10002147 L3.87056367,0.225209313 C3.05219207,-0.33727727 2,0.225209313 2,1.12518784 L2,16.8748122 C2,17.7747907 3.05219207,18.3372773 3.87056367,17.7747907 L15.5615866,9.89997853 C16.1461378,9.44998927 16.1461378,8.55001073 15.5615866,8.10002147 L15.5615866,8.10002147 Z"/>
                            </g>
                         </svg>`;
        button.insertAdjacentHTML('beforeend', hexagon);
        section.addEventListener('click', () => {
            this.currentData = data;
            CarouselTwo.playVideoEvent.call(this);
        });

        section.appendChild(button);
    }

    static createMagicPlay() {
        // eslint-disable-next-line no-script-url
        // const linkHref = utils.createElement('a', { class: 'related--magic-href', href: 'javascript:void(0)' });
        // linkHref.insertAdjacentHTML('beforeend', `<svg preserveAspectRatio="none" width="100%" height="100%">
        //     <use xlink:href="libs/gd/sprite.svg#plyr-related-magic"></use>
        //  </svg>`);
        const magicData = this.modes.magic.data;
        const thumbElement = utils.createElement('img', {class:'related--magic-href', src: magicData.video.videoThumb });
        
        // If data has a gif url, it is being added as a data-attr.

        thumbElement.setAttribute('data-gif', magicData.video.videoThumb);
        thumbElement.setAttribute('data-image', magicData.video.videoThumb);
        this.modes.magic.section.appendChild(thumbElement);

        const magicVideo = this.modes.magic.section;

        magicVideo.addEventListener('click', () => {
            this.currentData = this.modes.magic.data;
            CarouselTwo.playVideoEvent.call(this);
        });

        magicVideo.appendChild(thumbElement);
    }

    static createTubiaCharacter() {
        const container = document.querySelector('.related--videos');
        this.createControls(container);

        const characterCarousel =
        `<svg preserveAspectRatio="none" width="100%" height="100%">
            <use xlink:href="libs/gd/sprite.svg#plyr-character-carousel"></use>
        </svg>      
        `;

        const character = utils.createElement('div', { class: 'character' });
        
        character.insertAdjacentHTML('beforeend', characterCarousel);
        container.appendChild(character);

    }


    static playVideoEvent() {

        if (localStorage.getItem('openedMagic')) {
            const container = document.querySelector(defaults.selectors.container);
            const magicTimerEl = container.querySelector('.related--magic-timer');
          
            if (magicTimerEl)
                magicTimerEl.parentNode.removeChild(magicTimerEl);

        }

        document.querySelector(defaults.selectors.buttons.playlist).style.display = 'none';

        controls.ClearAllLevels.call(this);
        const data = this.currentData;

        if (!data) return;
        const { video, picture } = data;   
        const vidEl = document.querySelector('video');
        

        vidEl.setAttribute('poster', picture.link);
        const source = document.querySelector(defaults.selectors.playerSource);
        const title = document.querySelector(defaults.selectors.playerTitle);

        title.innerText = video.title;
        source.setAttribute('src', video.linkSecure);
        vidEl.load();
        clearInterval(this.timer);
    }

    static playVideoMagic() {
        controls.ClearAllLevels.call(this);
        const { magic } = this.modes.magic.data.video;
        const source = document.querySelector(defaults.selectors.playerSource);
        const title = document.querySelector(defaults.selectors.playerTitle);
        title.innerText = magic.title;
        source.setAttribute('src', magic.link);
        const vidEl = document.querySelector('video');
        vidEl.load();
    }

    static createMagicTimerAnim() {
        const container = document.querySelector(defaults.selectors.container);
        const magicTimerEl = utils.createElement('div', { class: 'related--magic-timer hide' });
        const magicTimerTextEl = utils.createElement('span', { class: 'magic--timer-text' });
        magicTimerTextEl.innerText = this.countdown;
        // magicTimerEl.insertAdjacentHTML('beforeend', `<svg preserveAspectRatio="none" width="100%" height="100%">
        // <use xlink:href="libs/gd/sprite.svg#plyr-related-timer-bg"></use>
        // </svg>`);

        magicTimerEl.setAttribute('lottie-class', 'magic-timer');
        magicTimerEl.appendChild(magicTimerTextEl);
        container.appendChild(magicTimerEl);
    }

    static setMagicVideo() {
        if (!this.currentData || this.openedMagic) { 
            lotties.playLottie('magic-lock');
            return;
        }
        controls.hideInterestingVideos();
        const data = this.currentData;
        const { video } = data;
        const container = document.querySelector(defaults.selectors.container);
        const magicTimerEl = container.querySelector('.related--magic-timer');

        if (video.locked) {
            this.player.elements.controls.style.display = 'none';
            // magicTimerEl.className = 'related--magic-timer';
            // magicTimerEl.innerText = second;
            this.timer = setInterval(() => {
                if (!this.videoPaused || this.videoStarted) {
                    magicTimerEl.classList.remove('hide');
                    // CarouselTwo.timerCountDown.call(this, magicTimerTextEl);
                    if (!this.videoPaused) {
                        const countdownEl = document.querySelector('.magic--timer-text');
                        this.countdown -= 1;
                        countdownEl.innerText = this.countdown;

                        if (this.countdown === 0) {
                            this.openedMagic = true;
                            lotties.playLottie('magic-timer');
                            setTimeout(() => {
                                magicTimerEl.classList.add('hide');
                            }, 1500);
                            const a = this.modes.magic.section.querySelector('.related--magic-href');
                            a.parentNode.removeChild(a);

                            const magicLock = document.querySelector('.magic-lock');
                            const magicSpace = document.querySelector('.magic-space');
                            
                            magicSpace.classList.add('hide');
                            magicLock.classList.add('magic-opened');
                            lotties.playLottie('magic-lock');
                            
                            this.player.elements.controls.removeAttribute('style');
                            window.localStorage.setItem('openedMagic', this.openedMagic);
                            
                            // setting magic video
                            CarouselTwo.createTitle.call(this, this.modes.magic);
                            CarouselTwo.createThumbnails.call(this, this.modes.magic);
                            CarouselTwo.createHexagon.call(this, this.modes.magic);
                
                            clearInterval(this.timer);
                            CarouselTwo.playVideoMagic.call(this);
                        }
                    }
                };
            }, 1000);
        }
        else {
            if (!magicTimerEl) return;
            magicTimerEl.className = 'related--magic-timer hide';
            clearInterval(this.timer);  
        }
    }

    static hoverGifAnimateEvent(event) {
        // this is the original element the event handler was assigned to
        const e = event.toElement || event.relatedTarget;

        if (Object.prototype.toString.call(e) === '[object HTMLDivElement]') {
            if (Object.prototype.toString.call(e) === 'childNode') {
                if (e.childNode === this) return;
            }
        }

        const imgEl = this.querySelector('img');
        const gif = imgEl.getAttribute('data-gif');
        if (!gif) return;
        const img = imgEl.getAttribute('data-image');
        const currentState = imgEl.getAttribute('showing-gif');
        if (currentState) {
            imgEl.removeAttribute('showing-gif');
            imgEl.setAttribute('src', img);
        }
        else {
            imgEl.setAttribute('showing-gif', true);
            imgEl.setAttribute('src', gif);
        }
    }
}
export default CarouselTwo;
