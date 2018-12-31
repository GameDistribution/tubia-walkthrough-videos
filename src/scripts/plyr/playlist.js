// ==========================================================================
// Plyr Playlist
// ==========================================================================

import utils from './utils';
import controls from './controls';

const playlist = {
    // Setup playlist
    setup() {
        // Requires UI support
        if (!this.supported.ui) {
            return;
        }

        // Set playlist enabled state if not set
        if (!utils.is.boolean(this.playlist.active)) {
            const active = this.storage.get('playlist');

            if (utils.is.boolean(active)) {
                this.playlist.active = active;
            } else {
                this.playlist.active = this.config.playlist.active;
            }
        }

        // Inject the container into the controls container
        if (!utils.is.element(this.elements.playlist)) {
            this.elements.playlist = utils.createElement('div', utils.getAttributesFromSelector(this.config.selectors.playlist));
            const listItem = utils.createElement('ul');
            this.elements.playlist.appendChild(listItem);
            utils.insertAfter(this.elements.playlist, this.elements.wrapper);
        }

        // Set the class hook
        utils.toggleClass(this.elements.container, this.config.classNames.playlist.enabled, !utils.is.empty(playlist.getData.call(this)));

        // If no playlist data, hide container
        if (utils.is.empty(playlist.getData.call(this))) {
            return;
        }

        // Enable UI
        playlist.show.call(this);

        // Set available videos in list
        controls.setPlaylist.call(this);
    },

    // Get the playlist data
    getData() {
        return Array.from(this.config.playlist.data || []);
    },

    // Get the current track for the current language
    getCurrent() {
        return playlist.getData.call(this).find(track => track.level.toLowerCase() === this.current);
    },

    // Display playlist container and button (for initialization)
    show() {
        // Try to load the value from storage
        let active = this.storage.get('playlist');

        // Otherwise fall back to the default config
        if (!utils.is.boolean(active)) {
            ({ active } = this.config.playlist);
        } else {
            this.playlist.active = active;
        }
        
        if (active) {
            utils.toggleClass(this.elements.container, this.config.classNames.playlist.active, true);
            utils.toggleState(this.elements.buttons.playlist, true);
        }
    },
};

export default playlist;
