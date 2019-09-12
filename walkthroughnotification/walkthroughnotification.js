class WalkthroughNotification {

    constructor(config) {
        
        const defaults = {
            message: 'Hey there! Do you need help? Let me show you the walkthrough.',
            calltoAction: 'Show Walkthrough',
            alignment: 'br',
            character: 1,
            autoShow: true,
            autoPlay: true,
            wait: 1000, // Wait X ms before showing the notification
        };
       
        this.config = config || defaults;

        this.elements = {
            page: document.querySelector('body'),
            wthVideo: null,
            wthVideoBtn: null,
            closeButton: null,
            notificationPopup: null,
            notificationContainer: null,
        };

        this.showNotification = this.showNotification.bind(this);
        this.hideNotification = this.hideNotification.bind(this);
        this.scrollToWalkthrough = this.scrollToWalkthrough.bind(this);

        this.setup();
    }

    setup() {

        const iframeList = document.querySelectorAll('iframe');
        iframeList.forEach(element => {
            if (element.hasAttribute('src')) {
                if (element.src.indexOf('player.tubia.com') > -1) {
                    element.setAttribute('tubia-walkthrough', true);
                }
            }
        });

        const tubiaIframe = document.querySelectorAll('iframe[tubia-walkthrough=true]');
        if (!tubiaIframe.length) {
            console.warn('Please, make sure the page has a Tubia Walkthrough video.');
            return;
        };
        this.elements.wthVideo = tubiaIframe[0]||tubiaIframe;
        
        this.elements.notificationContainer = document.createElement('div');
        this.elements.notificationContainer.setAttribute('id', 'tubiaWalkthroughNotification');
        this.elements.notificationContainer.setAttribute('class', `box hide ${this.config.alignment}`);

        this.elements.notificationContainer.innerHTML = `
          <!-- Tubia Walkthrough Notification -->
          <div class="character-${this.config.character}"></div>
          <div class="container">
              <p>
                  ${this.config.message}
              </p>
              <button id="showTubiaWalkthrough" type="text">
                    ${this.config.calltoAction}  
              </button>
          </div>
      `;

        this.elements.closeButton = document.createElement('button');
        this.elements.closeButton.setAttribute('id', 'closeButton');
        this.elements.closeButton.addEventListener('click', this.hideNotification);

        this.elements.notificationContainer.appendChild(this.elements.closeButton);
        this.elements.page.appendChild(this.elements.notificationContainer);

        this.elements.wthVideoBtn = document.getElementById('showTubiaWalkthrough');
        this.elements.notificationPopup = document.getElementById('tubiaWalkthroughNotification');

        if (this.config.autoShow) {
            setTimeout(() => {
                this.showNotification();
            }, this.config.wait);
        }

        if (typeof (this.elements.wthVideoBtn) !== 'undefined' && this.elements.wthVideoBtn !== null) {
            this.elements.wthVideoBtn.addEventListener('click', this.scrollToWalkthrough);
        } else {
            console.error(
                'Error! Make sure the page has a walkthrough caller button with the setting of "id:showTubiaWalkthrough".'
            );
        }
    }

    scrollToWalkthrough() {
        if ((typeof (this.elements.wthVideo) !== 'undefined' && this.elements.wthVideo !== null)) {
            this.elements.wthVideo.scrollIntoView(true);
            if (this.config.autoPlay) {
                setTimeout(() => {
                    this.elements.wthVideo.contentWindow.postMessage('startPlay', '*');
                }, 100);
            }
            setTimeout(() => {
                this.hideNotification();
            }, 100);
        } else {
            console.error(
                'Error! Make sure the page has a walkthrough video with the setting of "id:tubiaWalkthroughVideo".'
            );
        }
    }

    showNotification() {
        this.elements.notificationPopup.classList.remove('hide');
    }

    hideNotification() {
        this.elements.notificationPopup.classList.add('hide');
    }
}

