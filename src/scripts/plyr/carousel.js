import utils from './utils';
import defaults from './defaults';
import Glide from './glide.esm';

// eslint-disable-next-line no-unused-vars
class Carousel {
    constructor(data) {

        const self = this;
        if (data.length === 0 || data === undefined) return;
        self.data = data;
        self.setup(data);
        self.attachedLoadedDataEvent = false;
        const tubiaSlider = new Glide('.glide', {
            type: 'carousel',
            perView: 10,
            gap: 10,
            autoplay: 5000,
            breakpoints: {
                1920: {
                    perView: 10,
                },
                1280: {
                    perView: 6,
                },
                640: {
                    perView: 4,
                },
            },
        });
        tubiaSlider.mount();

        const glideSlides = document.querySelectorAll('.glide__slide');
        glideSlides.forEach((s) => {
            const id = parseInt(s.dataset.id, 10);
            const datas = this.getSlideData(id);
            const img = s.firstElementChild;

            img.addEventListener('click', (evt) => {
                this.playMoreVide(evt, datas);
            });
        });
    }

    // eslint-disable-next-line class-methods-use-this
    getSlideData(id) {
        const { filter } = Array.prototype;
        const result = document.querySelectorAll('.glide__slide');

        // eslint-disable-next-line arrow-body-style
        const filtered = filter.call(result, (node) => {
            return parseInt(node.dataset.id, 10) === id && node.data_json;
        });
        return filtered[0].data_json;
    }

    setup(p) {

        const { data } = p.config.morevideos;
        const moreVideosWrapper = document.querySelector(defaults.selectors.morevideos);
        this.class = {
            glideCls: 'glide',
            glideTrackCls: 'glide__track',
            glideSlidesCls: 'glide__slides',
            slideCls: 'glide__slide',
            arrows: {
                glideArrowsCls: 'glide__arrows',
                leftCls: 'glide__arrow glide__arrow--left',
                rightCls: 'glide__arrow glide__arrow--right',
            },
        };

        const glideWrapper = utils.createElement('div', {
            class: this.class.glideCls,
        });

        const glideTrack = utils.createElement('div', {
            class: this.class.glideTrackCls,
            'data-glide-el': 'track',
        });

        const glideSlides = utils.createElement('ul', {
            class: this.class.glideSlidesCls,
        });

        glideTrack.appendChild(glideSlides);

        this.createGlideItem(data, glideSlides);
        glideWrapper.appendChild(glideTrack);

        const glideArrows = utils.createElement('div', {
            class: this.class.arrows.glideArrowsCls,
            'data-glide-el': 'controls',
        });

        const leftArrow = utils.createElement('button', {
            class: this.class.arrows.leftCls,
            'data-glide-dir': '<',
        }, '');

        const rightArrow = utils.createElement('button', {
            class: this.class.arrows.rightCls,
            'data-glide-dir': '>',
        }, '');

        glideArrows.appendChild(leftArrow);
        glideArrows.appendChild(rightArrow);
        glideWrapper.appendChild(glideArrows);
        moreVideosWrapper.appendChild(glideWrapper);
    }

    createGlideItem(data, container) {
        const self = this;
        data.forEach((item, i) => {
            const slideItem = utils.createElement('li', {
                'data-id': i,
                class: self.class.slideCls,
            });
            slideItem.data_json = item;

            const img = utils.createElement('img', {
                src: item.pictures[0].link,
            });

            slideItem.appendChild(img);
            container.appendChild(slideItem);
        });
    }

    playMoreVide(evt, data) {
        if (!data) return;
        const video = data.videos[0];
        const picture = data.pictures[0];
        const vidEl = document.querySelector('video');

        if (this.attachedLoadedDataEvent === false) {
            vidEl.addEventListener('loadeddata', () => {
                vidEl.play();
            });
        }
        this.attachedLoadedDataEvent = true;

        vidEl.setAttribute('poster', picture.link);
        const source = document.querySelector(defaults.selectors.playerSource);
        const title = document.querySelector(defaults.selectors.playerTitle);
        title.innerText = video.title;
        source.setAttribute('src', video.linkSecure);
        vidEl.load();
    }
}
export default Carousel;
