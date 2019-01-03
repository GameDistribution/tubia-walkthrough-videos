import utils from './utils';
import defaults from './defaults';
class HowToPlay {

    constructor(player) {
        this.player = player;
        this.class = {
            wrapper: 'tubia__how-to-player',
                label: 'tubia__how-to-player--label',
                close: 'tubia__how-to-player--close',
                hide: 'tubia__how-to-player-hide'
        };
        this.CreateHowToPlay();
    }

    destroy() {
        setTimeout(() => {
            document.querySelector(`.${this.class.wrapper}`).remove();
        }, 1500);
    }

    CreateHowToPlay() {
        let wrapper = utils.createElement('div', {
            class: `${this.class.wrapper} ${this.class.hide}`
        })

        wrapper.addEventListener('click', (evt) => {
            document.querySelector(defaults.selectors.videContainer).scrollIntoView({
                behavior: 'smooth'
            });
            this.player.playButton.click();
            wrapper.setAttribute('class', `${this.class.wrapper} ${this.class.hide}`);
            this.destroy();
        });

        wrapper.style.backgroundImage = `url('${this.player.posterUrl}')`;

        let label = utils.createElement('div', {
            class: this.class.label
        }, 'How to play?')

        let close = utils.createElement('a', {
            class: this.class.close
        })

        close.addEventListener("click", (evt) => {
            wrapper.setAttribute('class', `${this.class.wrapper} ${this.class.hide}`);
            this.destroy();
        })

        wrapper.appendChild(label);
        wrapper.appendChild(close);
        document.getElementsByTagName('body')[0].appendChild(wrapper);

        setTimeout(() => {
            wrapper.setAttribute('class', this.class.wrapper);
        }, 3000);
    }
}

export default HowToPlay;
