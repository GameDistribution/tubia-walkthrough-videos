import utils from './utils';

class CueMark {
    constructor(player) {

        
        const self = this;

        self.player = player;
        self.markWrapper = utils.createElement('div', {
            class: 'progress--mark-wrapper',
        });
        self.cue = 0;

        self.wrapperClickAdded = false;

        const videoContainer = document.querySelector(self.player.config.selectors.progress);

        const pin = utils.createElement('div', {
            class: 'pin',
        });

        const text = utils.createElement('div', {
            class: 'text',
        });
        text.innerText = '0';
        self.markWrapper.text = text;

        pin.appendChild(text);

        const pulse = utils.createElement('div', {
            class: 'pulse',
        });

        self.markWrapper.appendChild(pin);
        self.markWrapper.appendChild(pulse);

        self.markWrapper.addEventListener('mouseover', () => {
            document.querySelector('.plyr__tooltip').style.opacity = 0;
            self.markWrapper.setAttribute('class', 'progress--mark-wrapper active');
        });

        self.markWrapper.addEventListener('mouseout', () => {
            document.querySelector('.plyr__tooltip').style.opacity = 1;
            self.markWrapper.setAttribute('class', 'progress--mark-wrapper');
        });


        self.markWrapper.addEventListener('click', {
            handleEvent: self.go,
            self: this,
        });



        videoContainer.appendChild(self.markWrapper);



    }

    create(cue) {
        cue.addEventListener('mouseover', {
            handleEvent: this.show,
            wrapper: this.markWrapper,
            self: this,
        });
        cue.addEventListener('mouseout', {
            handleEvent: this.hide,
            wrapper: this.markWrapper,
            self: this,
        });

        // cue.addEventListener('click',{
        //     handleEvent : this.go
        //     self:this
        // })
    }

    go(event) {
        // eslint-disable-next-line no-console
        console.log('this.player',event);
        this.self.player.jumpTo(this.self.cue);
    }

    show(event) {
        const left = `${event.target.offsetLeft + event.target.offsetWidth}px`;


        this.wrapper.setAttribute('class', 'progress--mark-wrapper active');
        this.wrapper.style.left = left;
        // this.wrapper.style.opacity=1;

        // var afterSlidingTagRule = utils.getRuleWithSelector('.progress--mark-wrapper .pin:after');
        // console.log('afterSlidingTagRule',afterSlidingTagRule)

        this.wrapper.text.innerText = event.target.dataset.value;

        // eslint-disable-next-line radix
        const cuePoint = parseInt(event.target.dataset.cue);
        this.self.cue = cuePoint;
        document.querySelector('.plyr__tooltip').style.opacity = 0;


        // if (!this.self.wrapperClickAdded) {
        // this.wrapper.addEventListener('click', {
        //     handleEvent: this.self.go,
        //     cue: cuePoint
        // })
        // this.self.wrapperClickAdded=true;
        // }

        event.stopPropagation();
    }

    hide(event) {
        // this.wrapper.removeEventListener('click', true);
        this.wrapper.setAttribute('class', 'progress--mark-wrapper');
        document.querySelector('.plyr__tooltip').style.opacity = 1;
        // this.wrapper.style.opacity=0;
        event.stopPropagation();
    }
}

export default CueMark;
