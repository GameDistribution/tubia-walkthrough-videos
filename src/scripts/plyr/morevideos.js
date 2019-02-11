// ==========================================================================
// Plyr morevideos
// ==========================================================================

import utils from './utils';
import Carousel from './carousel';

const morevideos = {
    
    // Setup morevideos
    setup() {

        // Requires UI support
        if (!this.supported.ui) {
            return;
        }

        // Set morevideos enabled state if not set
        if (!utils.is.boolean(this.morevideos.active)) {
            const active = this.storage.get('morevideos');

            if (utils.is.boolean(active)) {
                this.morevideos.active = active;
            } else {
                this.morevideos.active = this.config.morevideos.active;
            }
        }

        // Inject the container into the controls container
        if (!utils.is.element(this.elements.morevideos)) {
            this.elements.morevideos = utils.createElement('div', utils.getAttributesFromSelector(this.config.selectors.morevideos));
            // const listItem = utils.createElement('ul');
            // this.elements.morevideos.appendChild(listItem);

            this.elements.controls.appendChild(this.elements.morevideos);


            const caption = utils.createElement('div',{class:'morevideos--caption'},'More Videos');

            this.elements.morevideos.appendChild(caption);
            // utils.insertAfter(this.elements.morevideos, this.elements.controls);
        }

        // // Set the class hook
        utils.toggleClass(this.elements.container, this.config.classNames.morevideos.enabled, !utils.is.empty(morevideos.getData.call(this)));

        // // If no morevideos data, hide container
        if (utils.is.empty(morevideos.getData.call(this))) {
            return;
        }

        // carousel enabled
        this.carousel = new Carousel(this);

        // Enable UI
        morevideos.show.call(this);
        // Set available videos in list
        // controls.setmoreVideoList.call(this);
    },

    // Get the playlist data
    getData() {
        return Array.from(this.config.morevideos.data || []);
    },

    hide(){
        utils.toggleClass(this.elements.container, this.config.classNames.morevideos.active, false);
        utils.toggleState(this.elements.buttons.morevideos, false);
    },

    show() {
        // Try to load the value from storage
        let active = this.storage.get('morevideos');

        // Otherwise fall back to the default config
        if (!utils.is.boolean(active)) {
            ({ active } = this.config.morevideos);
        } else {
            this.morevideos.active = active;
        }

        if (active) {
            utils.toggleClass(this.elements.container, this.config.classNames.morevideos.active, true);
            utils.toggleState(this.elements.buttons.morevideos, true);
        }
    },
};

export default morevideos;
