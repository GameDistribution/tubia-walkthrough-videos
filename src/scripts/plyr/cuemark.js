import utils from './utils';
import defaults from './defaults';

class CueMark {
    constructor(player) {

        
        var self = this;

        self.player = player;
        self.markWrapper = utils.createElement('div', {
            class: 'progress--mark-wrapper'
        })
        self.cue = 0;

        self.wrapperClickAdded = false;

        let videoContainer = document.querySelector(self.player.config.selectors.progress);

        let pin = utils.createElement('div', {
            class: 'pin'
        })

        let text = utils.createElement('div', {
            class: 'text'
        })
        text.innerText = '0';
        self.markWrapper.text = text;

        pin.appendChild(text);

        let pulse = utils.createElement('div', {
            class: 'pulse'
        })

        self.markWrapper.appendChild(pin);
        self.markWrapper.appendChild(pulse);

        self.markWrapper.addEventListener('mouseover', () => {
            document.querySelector('.plyr__tooltip').style.opacity = 0;
            self.markWrapper.setAttribute('class', 'progress--mark-wrapper active');
        })

        self.markWrapper.addEventListener('mouseout', () => {
            document.querySelector('.plyr__tooltip').style.opacity = 1;
            self.markWrapper.setAttribute('class', 'progress--mark-wrapper');
        })


        self.markWrapper.addEventListener('click', {
            handleEvent: self.go,
            self: this
        });



        videoContainer.appendChild(self.markWrapper);



    }

    create(cue) {
        cue.addEventListener('mouseover', {
            handleEvent: this.show,
            wrapper: this.markWrapper,
            self: this
        });
        cue.addEventListener('mouseout', {
            handleEvent: this.hide,
            wrapper: this.markWrapper,
            self: this
        });

        // cue.addEventListener('click',{
        //     handleEvent : this.go
        //     self:this
        // })
    }

    go(event) {
        console.log('this.player',event)
        console.log('this.player',this)
        console.log('this.player', this.self.cue);
        this.self.player.jumpTo(this.self.cue)
    }

    show(event) {
        var left = `${event.target.offsetLeft + event.target.offsetWidth}px`;


        this.wrapper.setAttribute('class', 'progress--mark-wrapper active');
        this.wrapper.style.left = left;
        // this.wrapper.style.opacity=1;

        // var afterSlidingTagRule = utils.getRuleWithSelector('.progress--mark-wrapper .pin:after');
        // console.log('afterSlidingTagRule',afterSlidingTagRule)

        this.wrapper.text.innerText = event.target.dataset.value

        var cuePoint = parseInt(event.target.dataset.cue);
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
        this.wrapper.removeEventListener('click');
        this.wrapper.setAttribute('class', 'progress--mark-wrapper');
        document.querySelector('.plyr__tooltip').style.opacity = 1;
        // this.wrapper.style.opacity=0;
        event.stopPropagation();
    }
}

export default CueMark;
