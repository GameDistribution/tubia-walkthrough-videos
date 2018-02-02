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
        if (!utils.is.element(this.elements.controls.playlist)) {
            this.elements.controls.playlist = utils.createElement('div', utils.getAttributesFromSelector(this.config.selectors.playlist));
            const listItem = utils.createElement('ul');
            this.elements.controls.playlist.appendChild(listItem);
            this.elements.controls.middle.appendChild(this.elements.controls.playlist);
            // utils.insertAfter(this.elements.captions, this.elements.wrapper);
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

    // Display active playlist if it contains text
    setCue(input) {
        // Get the track from the event if needed
        const track = utils.is.event(input) ? input.target : input;
        const active = track.activeCues[0];
        const currentTrack = playlist.getCurrent.call(this);

        // Only display current track
        if (track !== currentTrack) {
            return;
        }

        // Display a cue, if there is one
        if (utils.is.cue(active)) {
            playlist.setText.call(this, active.getCueAsHTML());
        } else {
            playlist.setText.call(this, null);
        }

        utils.dispatchEvent.call(this, this.media, 'cuechange');
    },

    // Set the current playlist
    setText(input) {
        // Requires UI
        if (!this.supported.ui) {
            return;
        }

        if (utils.is.element(this.elements.controls.playlist)) {
            const content = utils.createElement('span');

            // Empty the container
            utils.emptyElement(this.elements.controls.playlist);

            // Default to empty
            const list = !utils.is.nullOrUndefined(input) ? input : '';

            // Set the span content
            if (utils.is.string(list)) {
                content.textContent = list.trim();
            } else {
                content.appendChild(list);
            }

            // Set new playlist text
            this.elements.controls.playlist.appendChild(content);
        } else {
            this.debug.warn('No playlist element to render to');
        }
    },

    // Display playlist container and button (for initialization)
    show() {
        // If there's no playlist toggle, bail
        if (!utils.is.element(this.elements.buttons.playlist)) {
            return;
        }

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
