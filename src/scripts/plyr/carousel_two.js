import utils from './utils';
import defaults from './defaults';
import controls from './controls';

class CarouselTwo {
    constructor(p) {
        this.player = p.listeners.player;
        this.moreItems = p.config.morevideos.data;
        if (this.moreItems.length === 0 || this.moreItems === undefined) return;
        this.setup();
    }

    setup() {
        this.openedMagic = window.localStorage.getItem('openedMagic') || false;
        this.currentData = null;
        this.videoPaused = false;
        this.timer = null;
        this.attachedLoadedDataEvent = false;
        this.magicDelay = parseInt(60000, 10);
        this.classes = {
            relatedVideos: 'related--videos',
            modeTitle: 'related--videos-mode-title',
            interesting:'related--videos-mode-caption',
        };

        const filteredArray = (type) => this.moreItems.filter((element) => element.videos.some((vid) => vid.videoType === type))
            .map(m => ({ video: m.videos[0], picture: m.pictures[0] }))[0];

        this.modes = {
            insane: {
                type: 0,
                title: 'Insane mode',
                data: filteredArray(0) || null,
                section: utils.createElement('div'),
            },
            best: {
                type: 1,
                title: 'Best mode',
                data: filteredArray(1) || null,
                section: utils.createElement('div'),
            },
            magic: {
                type: 2,
                title: 'Watch the magic end!',
                data: filteredArray(2) || null,
                section: utils.createElement('div'),
            },
        };

        const moreVideosWrapper = document.querySelector(defaults.selectors.morevideos);
      
        const caption = utils.createElement('div', {
            class: this.classes.interesting,
        },'Interesting Videos');

        moreVideosWrapper.appendChild(caption);

        const relatedVideosWrapper = utils.createElement('div', {
            class: this.classes.relatedVideos,
        });

        if (this.modes.insane.data) {
            CarouselTwo.createTitle.call(this, this.modes.insane);
            CarouselTwo.createThumbnails.call(this, this.modes.insane);
            CarouselTwo.createHexagon.call(this, this.modes.insane);
            this.modes.insane.section.addEventListener('mouseenter', CarouselTwo.hoverGifAnimateEvent);
            this.modes.insane.section.addEventListener('mouseleave', CarouselTwo.hoverGifAnimateEvent);
            relatedVideosWrapper.appendChild(this.modes.insane.section);
        }
        if (this.modes.best.data) {
            CarouselTwo.createTitle.call(this, this.modes.best);
            CarouselTwo.createThumbnails.call(this, this.modes.best);
            CarouselTwo.createHexagon.call(this, this.modes.best);
            this.modes.best.section.addEventListener('mouseenter', CarouselTwo.hoverGifAnimateEvent);
            this.modes.best.section.addEventListener('mouseleave', CarouselTwo.hoverGifAnimateEvent);
            relatedVideosWrapper.appendChild(this.modes.best.section);
        }
        if (this.modes.magic.data) {
            CarouselTwo.createTitle.call(this, this.modes.magic);

            if (!this.openedMagic) {
                CarouselTwo.createMagicPlay.call(this);

                const magicTop = utils.createElement('div', { class: 'related--top' }, 'WATCH VIDEO TO UNLOCK');
                this.modes.magic.section.appendChild(magicTop);
                this.modes.magic.section.addEventListener('mouseenter', CarouselTwo.hoverGifAnimateEvent);
                this.modes.magic.section.addEventListener('mouseleave', CarouselTwo.hoverGifAnimateEvent);
            }
            else {
                CarouselTwo.createThumbnails.call(this, this.modes.magic);
                CarouselTwo.createHexagon.call(this, this.modes.magic);
                this.modes.magic.section.addEventListener('mouseenter', CarouselTwo.hoverGifAnimateEvent);
                this.modes.magic.section.addEventListener('mouseleave', CarouselTwo.hoverGifAnimateEvent);
            }
            relatedVideosWrapper.appendChild(this.modes.magic.section);
        }

        const vidEl = document.querySelector('video');
        if (this.attachedLoadedDataEvent === false) {
            vidEl.addEventListener('loadeddata', () => {
                utils.toggleHidden(this.player.elements.volume, false);
                utils.toggleHidden(this.player.elements.buttons.mute, false);
                vidEl.play();
                CarouselTwo.setMagicVideo.call(this);
            });
            this.attachedLoadedDataEvent = true;
        }

        vidEl.addEventListener('pause', () => { this.videoPaused = true; });
        vidEl.addEventListener('play', () => { this.videoPaused = false; });
        moreVideosWrapper.appendChild(relatedVideosWrapper);
    }

    static createTitle(mode) {
        const { section, title } = mode;
        const titleEl = utils.createElement('div', { class: this.classes.modeTitle }, title);
        section.appendChild(titleEl);
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

        if (type !== 2) {
            thumbnail = { link: data.video.videoThumb };
        }
        if (thumbnail) {
            const thumbElement = utils.createElement('img', { src: thumbnail.link });

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

    static createHexagon(mode) {
        const { data, section, type } = mode;

        if (type === 2) {
            const { magic } = data.video;

            data.picture.link = magic.videoThumb;
            data.video.gifUrl = magic.gifUrl;
            data.video.title = magic.title;
            data.video.linkSecure = magic.link.replace('http', 'https');
        }

        const button = utils.createElement('button', { class: 'tubia__play-button' });
        const hexagon = `<svg class="tubia__play-icon" viewBox="0 0 18 18" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <g>
                                <path d="M15.5615866,8.10002147 L3.87056367,0.225209313 C3.05219207,-0.33727727 2,0.225209313 2,1.12518784 L2,16.8748122 C2,17.7747907 3.05219207,18.3372773 3.87056367,17.7747907 L15.5615866,9.89997853 C16.1461378,9.44998927 16.1461378,8.55001073 15.5615866,8.10002147 L15.5615866,8.10002147 Z"/>
                            </g>
                         </svg>
                        <svg class="tubia__hexagon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 129.78 150.37">
                            <path class="tubia__hexagon-base" d="M-1665.43,90.94V35.83a15.09,15.09,0,0,1,6.78-12.59l48.22-31.83a15.09,15.09,0,0,1,16-.38L-1547,19.13a15.09,15.09,0,0,1,7.39,13V90.94a15.09,15.09,0,0,1-7.21,12.87l-47.8,29.24a15.09,15.09,0,0,1-15.75,0l-47.8-29.24A15.09,15.09,0,0,1-1665.43,90.94Z" transform="translate(1667.43 13.09)"/>
                            <path class="tubia__hexagon-line-animation" d="M-1665.43,90.94V35.83a15.09,15.09,0,0,1,6.78-12.59l48.22-31.83a15.09,15.09,0,0,1,16-.38L-1547,19.13a15.09,15.09,0,0,1,7.39,13V90.94a15.09,15.09,0,0,1-7.21,12.87l-47.8,29.24a15.09,15.09,0,0,1-15.75,0l-47.8-29.24A15.09,15.09,0,0,1-1665.43,90.94Z" transform="translate(1667.43 13.09)"/>
                        </svg>`;
        button.insertAdjacentHTML('beforeend', hexagon);
        button.addEventListener('click', () => {
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
        const thumbElement = utils.createElement('img', {class:'related--magic-href', src: 'https://cdn.tubia.com/media/picture/magic.png' });

        // If data has a gif url, it is being added as a data-attr.

        thumbElement.setAttribute('data-gif', 'https://cdn.tubia.com/media/video/cdb.gif');
        thumbElement.setAttribute('data-image', 'https://cdn.tubia.com/media/picture/magic.png');

        this.modes.magic.section.appendChild(thumbElement);


        thumbElement.addEventListener('click', () => {
            this.currentData = this.modes.magic.data;
            CarouselTwo.playVideoEvent.call(this);
        });
        this.modes.magic.section.appendChild(thumbElement);
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

    static setMagicVideo() {
        if (!this.currentData || this.openedMagic) return;
        const data = this.currentData;
        const { video } = data;
        const container = document.querySelector(defaults.selectors.container);
        let magicTimerEl = container.querySelector('.related--magic-timer');
        let magicTimerTextEl;

        if (video.locked) {
            this.player.elements.controls.style.display = 'none';
            let second = this.magicDelay / 1000;

            if (!container.querySelector('.related--magic-timer')) {
                magicTimerEl = utils.createElement('div', { class: 'related--magic-timer' });
                magicTimerTextEl = utils.createElement('span', { class: 'magic--timer-text' });


                magicTimerEl.insertAdjacentHTML('beforeend', `<svg preserveAspectRatio="none" width="100%" height="100%">
                <use xlink:href="libs/gd/sprite.svg#plyr-related-timer-bg"></use>
             </svg>`);

                magicTimerEl.appendChild(magicTimerTextEl);

                container.appendChild(magicTimerEl);
                // magicTimerEl.innerText = second;
                magicTimerTextEl.innerText = second;
            }
            else {
                magicTimerEl.className = 'related--magic-timer';
                magicTimerEl.innerText = second;
            }

            this.timer = setInterval(() => {
              
                if (!this.videoPaused) {
                    second -= 1;
                    // magicTimerEl.innerText = second;
                    magicTimerTextEl.innerText = second;
                    if (second === 0) {
                        magicTimerEl.className = 'related--magic-timer';
                        magicTimerEl.innerHTML = `<svg preserveAspectRatio="none" width="100%" height="100%">
                        <use xlink:href="libs/gd/sprite.svg#plyr-related-magicopen"></use>
                     </svg>`;

                        this.openedMagic = true;
                        const a = this.modes.magic.section.querySelector('.related--magic-href');

                        a.parentNode.removeChild(a);
                        const topTitle = this.modes.magic.section.querySelector('.related--top');
                        topTitle.parentNode.removeChild(topTitle);
                        this.player.elements.controls.removeAttribute('style');
                        window.localStorage.setItem('openedMagic', this.openedMagic);
                        // setting magic video
                        CarouselTwo.createTitle.call(this, this.modes.magic);
                        CarouselTwo.createThumbnails.call(this, this.modes.magic);
                        CarouselTwo.createHexagon.call(this, this.modes.magic);
                        this.modes.magic.section.addEventListener('mouseenter', CarouselTwo.hoverGifAnimateEvent);
                        this.modes.magic.section.addEventListener('mouseleave', CarouselTwo.hoverGifAnimateEvent);

                        clearInterval(this.timer);
                        CarouselTwo.playVideoMagic.call(this);
                    }
                }
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
        if (e.childNode === this) {
            return;
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
