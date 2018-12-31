import utils from './utils';
import defaults from './defaults';
import Glide from './glide.esm';
import controls from './controls';
import playlist from './playlist';
import howToPlay from './howtoplay';

class carousel {
    constructor(data) {

        var self = this;
        if (data.length == 0 || data == undefined) return;
        self.data = data;
        self.setup(data);
        self.attachedLoadedDataEvent = false;
        var tubia_slider = new Glide('.glide', {
            type: 'carousel',
            perView: 10,
            gap: 10,
            autoplay: 5000,
            breakpoints: {
                1920: {
                    perView: 10
                },
                1280: {
                    perView: 6
                },
                640: {
                    perView: 4
                }
            }
        });
        tubia_slider.mount();

        var glideSlides = document.querySelectorAll('.glide__slide');
        glideSlides.forEach(function (s, i) {
            var id = parseInt(s.dataset.id);
            var data = self.getSlideData(id);
            var img = s.firstElementChild;
            img.addEventListener("click", function (evt) {
                self.playMoreVide(evt, data);
            });
        })
    }

    getSlideData(id) {
        var filter = Array.prototype.filter,
            result = document.querySelectorAll('.glide__slide'),
            filtered = filter.call(result, function (node) {
                return node.dataset.id == id && node.data_json;
            });
        return filtered[0].data_json;
    }

    setup(p) {

        var data = p.config.morevideos.data
        var moreVideosWrapper = document.querySelector(defaults.selectors.morevideos);
        this.class = {
            glideCls: 'glide',
                glideTrackCls: 'glide__track',
                glideSlidesCls: 'glide__slides',
                slideCls: 'glide__slide',
                arrows: {
                    glideArrowsCls: 'glide__arrows',
                    leftCls: 'glide__arrow glide__arrow--left',
                    rightCls: 'glide__arrow glide__arrow--right'
                }
        }

        let glideWrapper = utils.createElement('div', {
            class: this.class.glideCls
        })

        let glideTrack = utils.createElement('div', {
            class: this.class.glideTrackCls,
            'data-glide-el': 'track'
        })

        let glideSlides = utils.createElement('ul', {
            class: this.class.glideSlidesCls,
        })

        glideTrack.appendChild(glideSlides);

        this.createGlideItem(data, glideSlides)
        glideWrapper.appendChild(glideTrack);

        let glideArrows = utils.createElement('div', {
            class: this.class.arrows.glideArrowsCls,
            'data-glide-el': "controls"
        })

        let leftArrow = utils.createElement('button', {
            class: this.class.arrows.leftCls,
            'data-glide-dir': '<'
        }, '')

        let rightArrow = utils.createElement('button', {
            class: this.class.arrows.rightCls,
            'data-glide-dir': '>'
        }, '')

        glideArrows.appendChild(leftArrow);
        glideArrows.appendChild(rightArrow);
        glideWrapper.appendChild(glideArrows);
        moreVideosWrapper.appendChild(glideWrapper);
    }

    createGlideItem(data, container) {
        var self = this;
        data.forEach(function (item, i) {
            let slideItem = utils.createElement('li', {
                'data-id': i,
                class: self.class.slideCls
            })
            slideItem.data_json = item;

            let img = utils.createElement('img', {
                src: item.pictures[0].link
            })

            slideItem.appendChild(img);
            container.appendChild(slideItem);
        })
    }

    playMoreVide(evt, data) {
        if (!data) return;

        var video = data.videos[0];
        var picture = data.pictures[0];
        var vidEl = document.querySelector('video');

        if (this.attachedLoadedDataEvent == false) {
            vidEl.addEventListener('loadeddata', () => {
                const progress = document.querySelector(this.data.config.selectors.progress);
                vidEl.play();
            })
        }
        this.attachedLoadedDataEvent = true;

        vidEl.setAttribute('poster', picture.link);
        var source = document.querySelector(defaults.selectors.playerSource);
        var title = document.querySelector(defaults.selectors.playerTitle);
        title.innerText = video.title;
        source.setAttribute('src', video.linkSecure);
        vidEl.load();
    }
}
export default carousel;
