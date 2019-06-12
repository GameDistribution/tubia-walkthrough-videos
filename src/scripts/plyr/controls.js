// ==========================================================================
// Plyr controls
// ==========================================================================

import support from './support';
import utils from './utils';
import ui from './ui';
import i18n from './i18n';
import captions from './captions';
import html5 from './html5';
import playlist from './playlist';
import morevideos from './morevideos';
import Mark from './cuemark';
import lotties from './lotties';

// Sniff out the browser
const browser = utils.getBrowser();

const controls = {
    // Webkit polyfill for lower fill range
    updateRangeFill(target) {
        // WebKit only
        if (!browser.isWebkit) {
            return;
        }

        // Get range from event if event passed
        const range = utils.is.event(target) ? target.target : target;

        // Needs to be a valid <input type='range'>
        if (
            !utils.is.element(range) ||
            range.getAttribute('type') !== 'range'
        ) {
            return;
        }

        // Set CSS custom property
        range.style.setProperty(
            '--value',
            `${(range.value / range.max) * 100}%`
        );
    },

    // Get icon URL
    getIconUrl() {
        return {
            url: this.config.iconUrl,
            absolute: this.config.iconUrl.indexOf('http') === 0 ||
                (browser.isIE && !window.svg4everybody),
        };
    },

    // Create <svg> icon
    createIcon(type, attributes) {
        const namespace = 'http://www.w3.org/2000/svg';
        const iconUrl = controls.getIconUrl.call(this);
        const iconPath = `${!iconUrl.absolute ? iconUrl.url : ''}#${
            this.config.iconPrefix
        }`;

        // Create <svg>
        const icon = document.createElementNS(namespace, 'svg');
        utils.setAttributes(
            icon,
            utils.extend(attributes, {
                role: 'presentation',
            })
        );

        // Create the <use> to reference sprite
        const use = document.createElementNS(namespace, 'use');
        const path = `${iconPath}-${type}`;

        // Set `href` attributes
        // https://github.com/sampotts/plyr/issues/460
        // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/xlink:href
        if ('href' in use) {
            use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', path);
        } else {
            use.setAttributeNS(
                'http://www.w3.org/1999/xlink',
                'xlink:href',
                path
            );
        }

        // Add <use> to <svg>
        icon.appendChild(use);

        return icon;
    },

    // Create hidden text label
    createLabel(type, attr) {
        let text = i18n.get(type, this.config);
        const attributes = Object.assign({}, attr);

        switch (type) {
            case 'pip':
                text = 'PIP';
                break;

            case 'airplay':
                text = 'AirPlay';
                break;

            default:
                break;
        }

        if ('class' in attributes) {
            attributes.class += ` ${this.config.classNames.hidden}`;
        } else {
            attributes.class = this.config.classNames.hidden;
        }

        return utils.createElement('span', attributes, text);
    },

    // Create a badge
    createBadge(text) {
        if (utils.is.empty(text)) {
            return null;
        }

        const badge = utils.createElement('span', {
            class: this.config.classNames.menu.value,
        });

        badge.appendChild(
            utils.createElement(
                'span', {
                    class: this.config.classNames.menu.badge,
                },
                text
            )
        );

        return badge;
    },

    // Create a <button>
    createButton(buttonType, attr) {


        const button = utils.createElement('button');
        const attributes = Object.assign({}, attr);
        let type = utils.toCamelCase(buttonType);

        let toggle = false;
        let label;
        let icon;
        let labelPressed;
        let iconPressed;
        let lottieClass;

        if (!('type' in attributes)) {
            attributes.type = 'button';
        }

        if ('class' in attributes) {
            if (attributes.class.includes(this.config.classNames.control)) {
                attributes.class += ` ${this.config.classNames.control}`;
            }
        } else {
            attributes.class = this.config.classNames.control;
        }

        // Large play button
        switch (buttonType) {
            case 'play':
                toggle = true;
                label = 'play';
                labelPressed = 'pause';
                icon = 'play';
                iconPressed = 'pause';
                lottieClass = false;
                break;

            case 'mute':
                toggle = true;
                label = 'mute';
                labelPressed = 'unmute';
                icon = 'volume';
                iconPressed = 'muted';
                lottieClass = false;
                break;

            case 'captions':
                toggle = true;
                label = 'enableCaptions';
                labelPressed = 'disableCaptions';
                icon = 'captions-off';
                iconPressed = 'captions-on';
                lottieClass = false;
                break;

            case 'fullscreen':
                toggle = true;
                label = 'enterFullscreen';
                labelPressed = 'exitFullscreen';
                icon = '';
                iconPressed = '';
                lottieClass = 'plyr--button-fullscreen';
                break;

            case 'play-large':
                attributes.class += ` ${
                    this.config.classNames.control
                }--overlaid`;
                type = 'play';
                label = 'play';
                icon = 'play';
                lottieClass = false;
                break;

            case 'share':
                attributes.class += ` ${
                    this.config.classNames.share.button
                }`;
                toggle = true;
                label = 'shareOpen';
                labelPressed = 'shareClose';
                icon = '';
                iconPressed = 'close';
                lottieClass = 'plyr--share-button';
                break;

            case 'playlist':
                attributes.class += ` ${
                    this.config.classNames.playlist.button
                }`;
                toggle = true;
                label = 'playlistOpen';
                labelPressed = 'playlistClose';
                icon = 'playlist';
                iconPressed = 'close';
                lottieClass = 'plyr--bar-playlist';
                break;
            case 'morevideos':
                attributes.class += ` ${
                    this.config.classNames.morevideos.button
                }`;
                // if you want it to show -> !this.config.hideControls
                if(this.config.hideControls)  {
                    attributes.class += ' hide';
                }
                toggle = true;
                label = 'morevideosOpen';
                break;
            default:
                label = type;
                icon = buttonType;
                lottieClass = false;
        }

        // Setup toggle icon and labels
        if (toggle) {
            // Icon
            button.appendChild(
                controls.createIcon.call(this, iconPressed, {
                    class: 'icon--pressed',
                })
            );
            button.appendChild(
                controls.createIcon.call(this, icon, {
                    class: 'icon--not-pressed',
                })
            );

            // Label/Tooltip
            button.appendChild(
                controls.createLabel.call(this, labelPressed, {
                    class: 'label--pressed',
                })
            );
            button.appendChild(
                controls.createLabel.call(this, label, {
                    class: 'label--not-pressed',
                })
            );

            // Set lottie class
            if (lottieClass) {
                button.setAttribute('lottie-class', lottieClass);
            };

            // Add aria attributes
            attributes['aria-pressed'] = false;
            attributes['aria-label'] = i18n.get(label, this.config);
        } else {
            button.appendChild(controls.createIcon.call(this, icon));
            button.appendChild(controls.createLabel.call(this, label));
        }

        // Merge attributes
        utils.extend(
            attributes,
            utils.getAttributesFromSelector(
                this.config.selectors.buttons[type],
                attributes
            )
        );

        utils.setAttributes(button, attributes);

        if (type === 'play-large') {
            const html = `
                <button class="tubia__play-button">
                    <svg class="tubia__play-icon" viewBox="0 0 18 18" version="1.1" xmlns="http://www.w3.org/2000/svg">
                        <g>
                            <path d="M15.5615866,8.10002147 L3.87056367,0.225209313 C3.05219207,-0.33727727 2,0.225209313 2,1.12518784 L2,16.8748122 C2,17.7747907 3.05219207,18.3372773 3.87056367,17.7747907 L15.5615866,9.89997853 C16.1461378,9.44998927 16.1461378,8.55001073 15.5615866,8.10002147 L15.5615866,8.10002147 Z"/>
                        </g>
                    </svg>
                    <svg class="tubia__hexagon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 129.78 150.37">
                        <path class="tubia__hexagon-base" d="M-1665.43,90.94V35.83a15.09,15.09,0,0,1,6.78-12.59l48.22-31.83a15.09,15.09,0,0,1,16-.38L-1547,19.13a15.09,15.09,0,0,1,7.39,13V90.94a15.09,15.09,0,0,1-7.21,12.87l-47.8,29.24a15.09,15.09,0,0,1-15.75,0l-47.8-29.24A15.09,15.09,0,0,1-1665.43,90.94Z" transform="translate(1667.43 13.09)"/>
                        <path class="tubia__hexagon-line-animation" d="M-1665.43,90.94V35.83a15.09,15.09,0,0,1,6.78-12.59l48.22-31.83a15.09,15.09,0,0,1,16-.38L-1547,19.13a15.09,15.09,0,0,1,7.39,13V90.94a15.09,15.09,0,0,1-7.21,12.87l-47.8,29.24a15.09,15.09,0,0,1-15.75,0l-47.8-29.24A15.09,15.09,0,0,1-1665.43,90.94Z" transform="translate(1667.43 13.09)"/>
                    </svg>
                </button>
            `;
            button.insertAdjacentHTML('beforeend', html);
        }

        if (type === 'morevideos') {
            const html = "<button class='plyr_morevideos_button'></button>";
            button.insertAdjacentHTML('beforeend', html);
        }

        if (type === 'playlist') {
            const html = `
                <span class="plyr__playlist-button-title">
                    ${
    this.config.playlist.type === 'related'
        ? 'Related'
        : ''
}
                </span>
            `;
            button.insertAdjacentHTML('beforeend', html);
        }

        // We have multiple play buttons
        if (type === 'play') {
            if (!utils.is.array(this.elements.buttons[type])) {
                this.elements.buttons[type] = [];
            }

            this.elements.buttons[type].push(button);
        } else {
            this.elements.buttons[type] = button;
        }

        return button;
    },
    

    // Create an <input type='range'>
    createRange(type, attributes) {
        // Seek label
        const label = utils.createElement(
            'label', {
                for: attributes.id,
                class: this.config.classNames.hidden,
            },
            i18n.get(type, this.config)
        );

        // Seek input
        const input = utils.createElement(
            'input',
            utils.extend(
                utils.getAttributesFromSelector(
                    this.config.selectors.inputs[type]
                ), {
                    type: 'range',
                    min: 0,
                    max: 100,
                    step: 0.01,
                    value: 0,
                    autocomplete: 'off',
                },
                attributes
            )
        );

        this.elements.inputs[type] = input;

        // Set the fill for webkit now
        controls.updateRangeFill.call(this, input);

        return {
            label,
            input,
        };
    },

    // Create a <progress>
    createProgress(type, attributes) {
        const progress = utils.createElement(
            'progress',
            utils.extend(
                utils.getAttributesFromSelector(
                    this.config.selectors.display[type]
                ), {
                    min: 0,
                    max: 100,
                    value: 0,
                },
                attributes
            )
        );

        // Create the label inside
        if (type !== 'volume') {
            progress.appendChild(utils.createElement('span', null, '0'));

            let suffix = '';
            switch (type) {
                case 'played':
                    suffix = i18n.get('played', this.config);
                    break;

                case 'buffer':
                    suffix = i18n.get('buffered', this.config);
                    break;

                default:
                    break;
            }

            progress.textContent = `% ${suffix.toLowerCase()}`;
        }

        this.elements.display[type] = progress;

        return progress;
    },

    // Create time display
    createTime(type) {
        const container = utils.createElement('div', {
            class: 'plyr__time',
        });

        container.appendChild(
            utils.createElement(
                'span', {
                    class: this.config.classNames.hidden,
                },
                i18n.get(type, this.config)
            )
        );

        container.appendChild(
            utils.createElement(
                'span',
                utils.getAttributesFromSelector(
                    this.config.selectors.display[type]
                ),
                '00:00'
            )
        );

        this.elements.display[type] = container;

        return container;
    },

    leftTopCreateLogo() {
        const svg = ` 
                <svg preserveAspectRatio="xMinYMin meet" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 60 74" style="enable-background:new 0 0 60 74;" xml:space="preserve">
                    
                <g>
                    <path class="st0" d="M33.9,63.7c-0.9,0-1.8-0.2-2.6-0.7L13.2,52.3c-1.6-0.9-2.5-2.6-2.5-4.4V26.2c0-1.8,1-3.5,2.5-4.4l18.1-10.7
                        c1.6-1,3.6-1,5.3,0l18.1,10.7c1.6,0.9,2.5,2.6,2.5,4.4v21.6c0,1.8-1,3.5-2.5,4.4L36.5,63C35.7,63.5,34.8,63.7,33.9,63.7z
                        M33.9,13.5c-0.4,0-0.7,0.1-1,0.3L14.8,24.5c-0.6,0.4-1,1-1,1.7v21.6c0,0.7,0.4,1.4,1,1.7l18.1,10.7c0.6,0.4,1.4,0.4,2.1,0L53,49.6
                        c0.6-0.4,1-1,1-1.7V26.2c0-0.7-0.4-1.4-1-1.7L34.9,13.8C34.6,13.6,34.3,13.5,33.9,13.5z"></path>
                    <path class="st0" d="M41.2,36.2l-11-7.7l0,0l0,0c-0.1-0.1-0.3-0.1-0.5-0.1c-0.2,0-0.3,0-0.5,0.1c-0.3,0.2-0.5,0.5-0.5,0.8v15.4
                        c0,0.4,0.2,0.7,0.5,0.8l0.1,0.1h0c0.1,0,0.2,0.1,0.3,0.1c0.1,0,0.3,0,0.6-0.2l10.9-7.6c0.3-0.2,0.5-0.5,0.5-0.8
                        S41.4,36.4,41.2,36.2z"></path>
                </g>
                </svg>
            `;
        const container = utils.createElement('span', {
            class: 'plyr__logo plyr__logo-top',
        });
        container.insertAdjacentHTML('beforeend', svg);

        return container;
    },

    createLogo() {
        const container = utils.createElement('button', {
            class: 'plyr--bar-morevideos plyr__control',
            'lottie-class': 'plyr--bar-morevideos',
            type: 'button',

        });

        container.addEventListener('click', () => {
            controls.toggleInterestingVideos();
        });

        return container;
    },

    toggleInterestingVideos() {
        const element = document.querySelector('.plyr__morevideos');
        const isHidden = element.classList.contains('hide');

        if (isHidden) {
            controls.showInterestingVideos();
        } else {
            controls.hideInterestingVideos();
        }
    },

    showInterestingVideos() {
        const element = document.querySelector('.plyr__morevideos');
        const isHidden = element.classList.contains('hide');
        lotties.playLottie('plyr--bar-morevideos');

        if (isHidden) {
            element.classList.remove('hide');
        }
    },

    hideInterestingVideos() {
        const element = document.querySelector('.plyr__morevideos');
        lotties.reversePlayLottie('plyr--bar-morevideos');
        element.classList.add('hide');
    },

    // Create title
    createTitle() {
        const container = utils.createElement('span', {
            class: 'plyr__title',
        });
        container.innerText = this.config.title;
        return container;
    },

    // Create a settings menu item
    createMenuItem(value, list, type, title, badge = null, checked = false) {
        const item = utils.createElement('li');

        const label = utils.createElement('label', {
            class: this.config.classNames.control,
        });


        const radio = utils.createElement(
            'input',
            utils.extend(
                utils.getAttributesFromSelector(
                    this.config.selectors.inputs[type]
                ), {
                    type: 'radio',
                    name: `plyr-${type}`,
                    value,
                    checked,
                    class: 'plyr__sr-only',
                }
            )
        );

        const faux = utils.createElement('span', {
            'aria-hidden': true,
        });

        label.appendChild(radio);
        label.appendChild(faux);
        label.insertAdjacentHTML('beforeend', title);

        if (utils.is.element(badge)) {
            label.appendChild(badge);
        }

        item.appendChild(label);
        list.appendChild(item);
    },

    // Update hover tooltip for seeking
    updateSeekTooltip(event) {
        // Bail if setting not true
        if (
            !this.config.tooltips.seek ||
            !utils.is.element(this.elements.inputs.seek) ||
            !utils.is.element(this.elements.display.seekTooltip) ||
            this.duration === 0
        ) {
            return;
        }

        // Calculate percentage
        let percent = 0;
        const clientRect = this.elements.inputs.seek.getBoundingClientRect();
        const visible = `${this.config.classNames.tooltip}--visible`;

        const toggle = toggleEvent => {
            utils.toggleClass(
                this.elements.display.seekTooltip,
                visible,
                toggleEvent
            );
        };

        // Hide on touch
        if (this.touch) {
            toggle(false);
            return;
        }

        // Determine percentage, if already visible
        if (utils.is.event(event)) {
            percent =
                (100 / clientRect.width) * (event.pageX - clientRect.left);
        } else if (utils.hasClass(this.elements.display.seekTooltip, visible)) {
            percent = parseFloat(
                this.elements.display.seekTooltip.style.left,
                10
            );
        } else {
            return;
        }

        // Set bounds
        if (percent < 0) {
            percent = 0;
        } else if (percent > 100) {
            percent = 100;
        }

        // Display the time a click would seek to
        ui.updateTimeDisplay.call(
            this,
            this.elements.display.seekTooltip,
            (this.duration / 100) * percent
        );

        // Set position
        this.elements.display.seekTooltip.style.left = `${percent}%`;
        // Show/hide the tooltip
        // If the event is a moues in/out and percentage is inside bounds
        if (
            utils.is.event(event) && [
                'mouseenter',
                'mouseleave',
            ].includes(event.type)
        ) {
            toggle(event.type === 'mouseenter');
        }
    },

    // Hide/show a tab
    toggleTab(setting, toggle) {
        const tab = this.elements.settings.tabs[setting];
        const pane = this.elements.settings.panes[setting];

        utils.toggleHidden(tab, !toggle);
        utils.toggleHidden(pane, !toggle);
    },

    // Hide/show the playlist
    togglePlaylist(setting, toggle) {
        const tab = this.elements.playlist[setting];
        utils.toggleHidden(tab, !toggle);
    },

    // Hide/show the morevideos
    toggleMoreVideos(setting, toggle) {
        const tab = this.elements.morevideos[setting];
        utils.toggleHidden(tab, !toggle);
    },

    // Set the quality menu
    // TODO: Vimeo support
    setQualityMenu(options) {
        // Menu required
        if (!utils.is.element(this.elements.settings.panes.quality)) {
            return;
        }

        const type = 'quality';
        const list = this.elements.settings.panes.quality.querySelector('ul');

        // Set options if passed and filter based on config
        if (utils.is.array(options)) {
            this.options.quality = options.filter(quality =>
                this.config.quality.options.includes(quality)
            );
        }

        // Toggle the pane and tab
        const toggle = !utils.is.empty(this.options.quality) &&
            this.options.quality.length > 1;
        controls.toggleTab.call(this, type, toggle);

        // If we're hiding, nothing more to do
        if (!toggle) {
            return;
        }

        // Empty the menu
        utils.emptyElement(list);

        // Get the badge HTML for HD, 4K etc
        const getBadge = quality => {
            let label = '';

            switch (quality) {
                case 2160:
                    label = '4K';
                    break;

                case 1440:
                case 1080:
                case 720:
                    label = 'HD';
                    break;

                case 576:
                    label = 'SD';
                    break;

                default:
                    break;
            }

            if (!label.length) {
                return null;
            }

            return controls.createBadge.call(this, label);
        };

        // Sort options by the config and then render options
        this.options.quality
            .sort((a, b) => {
                const sorting = this.config.quality.options;
                return sorting.indexOf(a) > sorting.indexOf(b) ? 1 : -1;
            })
            .forEach(quality => {
                const label = controls.getLabel.call(this, 'quality', quality);
                controls.createMenuItem.call(
                    this,
                    quality,
                    list,
                    type,
                    label,
                    getBadge(quality)
                );
            });

        controls.updateSetting.call(this, type, list);
    },

    // Translate a value into a nice label
    // TODO: Localisation
    getLabel(setting, value) {
        switch (setting) {
            case 'speed':
                return value === 1 ? 'Normal' : `${value}&times;`;

            case 'quality':
                if (utils.is.number(value)) {
                    return `${value}p`;
                }
                return utils.toTitleCase(value);

            case 'captions':
                return controls.getLanguage.call(this);

            default:
                return null;
        }
    },

    // Update the selected setting
    updateSetting(setting, container, input) {
        const pane = this.elements.settings.panes[setting];
        let value = null;
        let list = container;

        switch (setting) {
            case 'captions':
                value = this.captions.active ?
                    this.captions.language :
                    i18n.get('disabled', this.config);
                break;

            default:
                value = !utils.is.empty(input) ? input : this[setting];

                // Get default
                if (utils.is.empty(value)) {
                    value = this.config[setting].default;
                }

                // Unsupported value
                if (
                    !utils.is.empty(this.options[setting]) &&
                    !this.options[setting].includes(value)
                ) {
                    this.debug.warn(
                        `Unsupported value of '${value}' for ${setting}`
                    );
                    return;
                }

                // Disabled value
                if (!this.config[setting].options.includes(value)) {
                    this.debug.warn(
                        `Disabled value of '${value}' for ${setting}`
                    );
                    return;
                }

                break;
        }

        // Get the list if we need to
        if (!utils.is.element(list)) {
            list = pane && pane.querySelector('ul');
        }

        // Update the label
        if (!utils.is.empty(value)) {
            if (this.elements.settings.tabs[setting]) {
                const label = this.elements.settings.tabs[
                    setting
                ].querySelector(`.${this.config.classNames.menu.value}`);
                label.innerHTML = controls.getLabel.call(this, setting, value);
            }
        }

        // Find the radio option
        const target = list && list.querySelector(`input[value="${value}"]`);

        if (utils.is.element(target)) {
            // Check it
            target.checked = true;
        }
    },

    // Set the looping options
    /* setLoopMenu() {
        // Menu required
        if (!utils.is.element(this.elements.settings.panes.loop)) {
            return;
        }

        const options = ['start', 'end', 'all', 'reset'];
        const list = this.elements.settings.panes.loop.querySelector('ul');

        // Show the pane and tab
        utils.toggleHidden(this.elements.settings.tabs.loop, false);
        utils.toggleHidden(this.elements.settings.panes.loop, false);

        // Toggle the pane and tab
        const toggle = !utils.is.empty(this.loop.options);
        controls.toggleTab.call(this, 'loop', toggle);

        // Empty the menu
        utils.emptyElement(list);

        options.forEach(option => {
            const item = utils.createElement('li');

            const button = utils.createElement(
                'button',
                utils.extend(utils.getAttributesFromSelector(this.config.selectors.buttons.loop), {
                    type: 'button',
                    class: this.config.classNames.control,
                    'data-plyr-loop-action': option,
                }),
                i18n.get(option, this.config)
            );

            if (['start', 'end'].includes(option)) {
                const badge = controls.createBadge.call(this, '00:00');
                button.appendChild(badge);
            }

            item.appendChild(button);
            list.appendChild(item);
        });
    }, */

    // Get current selected caption language
    // TODO: rework this to user the getter in the API?
    getLanguage() {
        if (!this.supported.ui) {
            return null;
        }

        if (
            support.textTracks &&
            captions.getTracks.call(this).length &&
            this.captions.active
        ) {
            const currentTrack = captions.getCurrentTrack.call(this);

            if (utils.is.track(currentTrack)) {
                return currentTrack.label;
            }
        }

        return i18n.get('disabled', this.config);
    },

    // Set a list of available captions languages
    setCaptionsMenu() {
        // TODO: Captions or language? Currently it's mixed
        const type = 'captions';
        const list = this.elements.settings.panes.captions.querySelector('ul');

        // Toggle the pane and tab
        const toggle = captions.getTracks.call(this).length;
        controls.toggleTab.call(this, type, toggle);

        // Empty the menu
        utils.emptyElement(list);

        // If there's no captions, bail
        if (!toggle) {
            return;
        }

        // Re-map the tracks into just the data we need
        const tracks = captions.getTracks.call(this).map(track => ({
            language: track.language,
            label: !utils.is.empty(track.label) ?
                track.label : track.language.toUpperCase(),
        }));

        // Add the "Disabled" option to turn off captions
        tracks.unshift({
            language: '',
            label: i18n.get('disabled', this.config),
        });

        // Generate options
        tracks.forEach(track => {
            controls.createMenuItem.call(
                this,
                track.language,
                list,
                'language',
                track.label || track.language,
                controls.createBadge.call(this, track.language.toUpperCase()),
                track.language.toLowerCase() ===
                this.captions.language.toLowerCase()
            );
        });

        controls.updateSetting.call(this, type, list);
    },

    // Set a list of available captions languages
    setSpeedMenu(options) {
        // Do nothing if not selected
        if (
            !this.config.controls.includes('settings') ||
            !this.config.settings.includes('speed')
        ) {
            return;
        }

        // Menu required
        if (!utils.is.element(this.elements.settings.panes.speed)) {
            return;
        }

        const type = 'speed';

        // Set the speed options
        if (utils.is.array(options)) {
            this.options.speed = options;
        } else if (this.isHTML5 || this.isVimeo) {
            this.options.speed = [
                0.5,
                0.75,
                1,
                1.25,
                1.5,
                1.75,
                2,
            ];
        }

        // Set options if passed and filter based on config
        this.options.speed = this.options.speed.filter(speed =>
            this.config.speed.options.includes(speed)
        );

        // Toggle the pane and tab
        const toggle = !utils.is.empty(this.options.speed) &&
            this.options.speed.length > 1;
        controls.toggleTab.call(this, type, toggle);

        // Check if we need to toggle the parent
        controls.checkMenu.call(this);

        // If we're hiding, nothing more to do
        if (!toggle) {
            return;
        }

        // Get the list to populate
        const list = this.elements.settings.panes.speed.querySelector('ul');

        // Show the pane and tab
        utils.toggleHidden(this.elements.settings.tabs.speed, false);
        utils.toggleHidden(this.elements.settings.panes.speed, false);

        // Empty the menu
        utils.emptyElement(list);

        // Create items
        this.options.speed.forEach(speed => {
            const label = controls.getLabel.call(this, 'speed', speed);
            controls.createMenuItem.call(this, speed, list, type, label);
        });

        controls.updateSetting.call(this, type, list);
    },

    // Check if we need to hide/show the settings menu
    checkMenu() {
        const {
            tabs,
        } = this.elements.settings;
        const visible = !utils.is.empty(tabs) &&
            Object.values(tabs).some(tab => !tab.hidden);

        utils.toggleHidden(this.elements.settings.menu, !visible);
    },

    // Show/hide menu
    toggleMenu(event) {

        const {
            form,
        } = this.elements.settings;
        const button = this.elements.buttons.settings;

        // Menu and button are required
        if (!utils.is.element(form) || !utils.is.element(button)) {
            return;
        }

        const show = utils.is.boolean(event) ?
            event :
            utils.is.element(form) &&
            form.getAttribute('aria-hidden') === 'true';



        if (utils.is.event(event)) {
            const isMenuItem =
                utils.is.element(form) && form.contains(event.target);
            const isButton = event.target === this.elements.buttons.settings;

            // If the click was inside the form or if the click
            // wasn't the button or menu item and we're trying to
            // show the menu (a doc click shouldn't show the menu)
            if (isMenuItem || (!isMenuItem && !isButton && show)) {
                return;
            }

            // Prevent the toggle being caught by the doc listener
            if (isButton) {
                event.stopPropagation();
            }
        }

        // Set form and button attributes
        if (utils.is.element(button)) {
            button.setAttribute('aria-expanded', show);
        }

        if (utils.is.element(form)) {
            form.setAttribute('aria-hidden', !show);
            utils.toggleClass(
                this.elements.container,
                this.config.classNames.menu.open,
                show
            );

            if (show) {
                form.removeAttribute('tabindex');
            } else {
                form.setAttribute('tabindex', -1);
            }
        }
    },

    // Get the natural size of a tab
    getTabSize(tab) {
        const clone = tab.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.opacity = 0;
        clone.setAttribute('aria-hidden', false);

        // Prevent input's being unchecked due to the name being identical
        Array.from(clone.querySelectorAll('input[name]')).forEach(input => {
            const name = input.getAttribute('name');
            input.setAttribute('name', `${name}-clone`);
        });

        // Append to parent so we get the "real" size
        tab.parentNode.appendChild(clone);

        // Get the sizes before we remove
        const width = clone.scrollWidth;
        const height = clone.scrollHeight;

        // Remove from the DOM
        utils.removeElement(clone);

        return {
            width,
            height,
        };
    },

    // Toggle Menu
    showTab(event) {
        const {
            menu,
        } = this.elements.settings;
        const tab = event.target;
        const show = tab.getAttribute('aria-expanded') === 'false';
        const pane = document.getElementById(tab.getAttribute('aria-controls'));

        // Nothing to show, bail
        if (!utils.is.element(pane)) {
            return;
        }

        // Are we targetting a tab? If not, bail
        const isTab = pane.getAttribute('role') === 'tabpanel';
        if (!isTab) {
            return;
        }

        // Hide all other tabs
        // Get other tabs
        const current = menu.querySelector(
            '[role="tabpanel"][aria-hidden="false"]'
        );
        const container = current.parentNode;

        // Set other toggles to be expanded false
        Array.from(
            menu.querySelectorAll(
                `[aria-controls="${current.getAttribute('id')}"]`
            )
        ).forEach(toggle => {
            toggle.setAttribute('aria-expanded', false);
        });

        // If we can do fancy animations, we'll animate the height/width
        if (support.transitions && !support.reducedMotion) {
            // Set the current width as a base
            container.style.width = `${current.scrollWidth}px`;
            container.style.height = `${current.scrollHeight}px`;

            // Get potential sizes
            const size = controls.getTabSize.call(this, pane);

            // Restore auto height/width
            const restore = e => {
                // We're only bothered about height and width on the container
                if (
                    e.target !== container ||
                    ![
                        'width',
                        'height',
                    ].includes(e.propertyName)
                ) {
                    return;
                }

                // Revert back to auto
                container.style.width = '';
                container.style.height = '';

                // Only listen once
                utils.off(container, utils.transitionEndEvent, restore);
            };

            // Listen for the transition finishing and restore auto height/width
            utils.on(container, utils.transitionEndEvent, restore);

            // Set dimensions to target
            container.style.width = `${size.width}px`;
            container.style.height = `${size.height}px`;
        }

        // Set attributes on current tab
        current.setAttribute('aria-hidden', true);
        current.setAttribute('tabindex', -1);

        // Set attributes on target
        pane.setAttribute('aria-hidden', !show);
        tab.setAttribute('aria-expanded', show);
        pane.removeAttribute('tabindex');

        // Focus the first item
        pane.querySelectorAll(
            'button:not(:disabled), input:not(:disabled), [tabindex]'
        )[0].focus();
    },

    // Show morevideos
    setmoreVideoList() {
        const type = 'morevideos';

        const list = this.elements.morevideos.querySelector('ul');

        // Toggle the morevideos
        const hasItems = morevideos.getData.call(this).length;

        controls.toggleMoreVideos.call(this, type, hasItems);

        // Empty the menu
        utils.emptyElement(list);

        // If there's no items, bail
        if (!hasItems) {
            return;
        }

        // Re-map the tracks into just the data we need
        const items = morevideos.getData.call(this).map(item => ({
            link: item.cuePoint / 1000,
            name: item.name,
        }));

        // Generate options
        items.forEach((item, index) => {
            const counter = index + 1;
            let itemNumber = 0;
            if (counter.toString().length === 1) {
                itemNumber = `0${counter}`;
            } else {
                itemNumber = counter;
            }
            controls.createMoreVideosItem.call(
                this,
                list,
                item.link,
                item.name,
                itemNumber
            );
        });
    },

    // Show playlist
    setPlaylist() {

        const type = 'playlist';
        const list = this.elements.playlist.querySelector('ul');

        // Toggle the playlist
        const hasItems = playlist.getData.call(this).length;
        controls.togglePlaylist.call(this, type, hasItems);


        // Empty the menu
        utils.emptyElement(list);


        // If there's no items, bail
        if (!hasItems) {
            return;
        }

        if (this.config.playlist.type === 'cue') {
            // Re-map the tracks into just the data we need
            const items = playlist.getData.call(this).map(item => ({
                link: item.cuePoint / 1000,
                name: item.name,
            }));


            // Generate options
            items.forEach((item, index) => {
                const counter = index + 1;
                let itemNumber = 0;
                if (counter.toString().length === 1) {
                    itemNumber = `0${counter}`;
                } else {
                    itemNumber = counter;
                }
                controls.createPlaylistItemCue.call(
                    this,
                    list,
                    item.link,
                    item.name,
                    itemNumber
                );
            });
        } else if (this.config.playlist.type === 'related') {
            // Re-map the tracks into just the data we need
            const items = playlist.getData.call(this).map(item => ({
                link: item.PageUrl,
                name: item.Title && item.Title !== '' ?
                    item.Title : 'Check out this game!',
                image: item.GameImage,
            }));

            // Generate options
            items.forEach((item, index) => {
                const counter = index + 1;
                let itemNumber = 0;
                if (counter.toString().length === 1) {
                    itemNumber = `0${counter}`;
                } else {
                    itemNumber = counter;
                }
                controls.createPlaylistItemRelated.call(
                    this,
                    list,
                    item.link,
                    item.name,
                    item.image,
                    itemNumber
                );
            });
        }
    },

    // Create a morevideos item for seeking
    createMoreVideosItem(list, cue, title, counter) {
        const label = utils.createElement('span', {
            class: 'plyr_name',
        });
        const count = utils.createElement('span', {
            class: 'plyr__count',
        });
        const imageItem = utils.createElement('div', {
            class: 'plyr__background',
        });

        const item = utils.createElement('li', {
            class: counter === '01' ? 'active' : '',
        });

        // Jump to the time we want.
        utils.on(item, 'click', () => {
            // Todo: we want to set the current active class based on seekTime.
            // this.jumpTo(cue);
        });

        label.insertAdjacentHTML('beforeend', title);
        count.insertAdjacentHTML('beforeend', counter);

        item.appendChild(imageItem);
        item.appendChild(count);
        item.appendChild(label);
        list.appendChild(item);
    },

    // Create a playlist cue item for seeking
    createPlaylistItemCue(list, cue, title, counter) {
        const label = utils.createElement('span', {
            class: 'plyr_name',
        });
        const count = utils.createElement('span', {
            class: 'plyr__count',
        });
        const imageItem = utils.createElement('div', {
            class: 'plyr__background',
        });

        const item = utils.createElement('li', {
            class: counter === '01' ? 'active' : '',
        });

        // Jump to the time we want.
        utils.on(item, 'click', () => {
            // Todo: we want to set the current active class based on seekTime.
            this.jumpTo(cue);
        });

        label.insertAdjacentHTML('beforeend', title);
        count.insertAdjacentHTML('beforeend', counter);

        item.appendChild(imageItem);
        item.appendChild(count);
        item.appendChild(label);
        list.appendChild(item);
    },

    // Create a playlist related item
    createPlaylistItemRelated(list, link, title, image, counter) {
        const label = utils.createElement('span', {
            class: 'plyr_name',
        });
        const count = utils.createElement('span', {
            class: 'plyr__count',
        });
        const imageItem = utils.createElement('div', {
            class: 'plyr__background',
        });

        const item = utils.createElement('li', {
            class: counter === '01' ? 'active' : '',
        });

        // Jump to the time we want.
        utils.on(item, 'click', () => {
            window.open(link, '_blank');
        });

        label.insertAdjacentHTML('beforeend', title);
        count.insertAdjacentHTML('beforeend', counter);

        item.appendChild(imageItem);
        item.appendChild(count);
        item.appendChild(label);
        list.appendChild(item);
    },

    // Build the default HTML
    // TODO: Set order based on order in the config.controls array?
    create(data) {

        // Do nothing if we want no controls
        if (utils.is.empty(this.config.controls)) {
            return null;
        }

        // Create the container
        const container = utils.createElement(
            'div',
            utils.getAttributesFromSelector(
                this.config.selectors.controls.wrapper
            )
        );
        const containerLeft = utils.createElement(
            'div',
            utils.getAttributesFromSelector(this.config.selectors.controls.left)
        );
        const containerRight = utils.createElement(
            'div',
            utils.getAttributesFromSelector(
                this.config.selectors.controls.right
            )
        );

        // Video title
        if (this.config.controls.includes('title')) {
            container.appendChild(controls.createTitle.call(this, 'title'));
        }

        // Share button
        if (this.config.controls.includes('share')) {
            container.appendChild(controls.createButton.call(this, 'share'));
        }

        // Restart button
        if (this.config.controls.includes('restart')) {
            containerLeft.appendChild(
                controls.createButton.call(this, 'restart')
            );
        }

        // Rewind button
        if (this.config.controls.includes('rewind')) {
            containerLeft.appendChild(
                controls.createButton.call(this, 'rewind')
            );
        }

        // Play/Pause button
        if (this.config.controls.includes('play')) {
            containerLeft.appendChild(controls.createButton.call(this, 'play'));
        }

        // Fast forward button
        if (this.config.controls.includes('fast-forward')) {
            const item = containerLeft.appendChild(
                controls.createButton.call(this, 'fast-forward')
            );
            // eslint-disable-next-line no-shadow
            const captions = utils.createElement('div', {
                class: 'plyr__levelCaptions',
            });
            this.on('timeupdate', () => {

                const playingTime = this.currentTime;
                if (this.config.playlist.type === 'cue') {
                    // eslint-disable-next-line no-shadow
                    const items = playlist.getData.call(this).map(item => ({
                        link: item.cuePoint / 1000,
                        name: item.name,
                    }));
                    // eslint-disable-next-line no-shadow
                    items.forEach((item, i) => {
                        const counter = i + 1;
                        // const itemNumber = 0;
                        if (i < items.length - 1) {
                            if (
                                playingTime > item.link &&
                                playingTime < items[counter].link
                            ) {
                                this.nextCuePoint = items[counter].link;
                                captions.innerHTML =
                                    `<span>${  item.name  }</span>`;
                            } else if (
                                playingTime < items[0].link ||
                                (i === items.length - 1 &&
                                    playingTime > item.link)
                            ) {
                                this.nextCuePoint = items[0].link;
                            }
                        } else if (
                            i === items.length - 1 &&
                            playingTime > item.link
                        ) {
                            this.nextCuePoint = items[0].link;
                            items[counter].link = item.link;
                        }
                    });
                    // Jump to the time we want.
                    utils.on(item, 'click', () => {
                        this.jumpTo(this.nextCuePoint);
                    });
                }
            });
        }



        // Progress
        if (this.config.controls.includes('progress')) {
            const progress = utils.createElement(
                'div',
                utils.getAttributesFromSelector(this.config.selectors.progress)
            );

            // Seek range slider
            const seek = controls.createRange.call(this, 'seek', {
                id: `plyr-seek-${data.id}`,
            });
            progress.appendChild(seek.label);
            progress.appendChild(seek.input);


            // controls.CreateProgressLevel.call(this, progress);
            if (this.config.playlist.type === 'cue') {
                const items = playlist.getData.call(this).map(item => ({
                    link: item.cuePoint / 1000,
                    name: item.name,
                }));

          
                setTimeout(() => {
                    this.mark = new Mark(this);
                    items.forEach((item, index) => {
                        const counter = index + 1;
                        // eslint-disable-next-line no-unused-vars
                        let itemNumber = 0;
                        if (counter > 1) {
                            const cuePercentage = counter === 1 ? 0 : (item.link / this.duration) * 100;
                            if (counter.toString().length === 1) {
                                itemNumber = `0${counter}`;
                            } else {
                                itemNumber = counter;
                            }
                            const cueElement = utils.createElement('span', {
                                class: 'plyr__cues--progress',
                            });


                            cueElement.style.left = `${cuePercentage.toString()}%`;


                        
                            cueElement.dataset.cue = item.link;
                            cueElement.dataset.value = counter;

                            progress.appendChild(cueElement);
                            this.mark.create(cueElement);

                            
                        }

                    });
                }, 2000);
            }








            // Buffer progress
            progress.appendChild(controls.createProgress.call(this, 'buffer'));

            // TODO: Add loop display indicator

            // Seek tooltip
            if (this.config.tooltips.seek) {
                const tooltip = utils.createElement(
                    'span', {
                        class: this.config.classNames.tooltip,
                    },
                    '00:00'
                );

                progress.appendChild(tooltip);
                this.elements.display.seekTooltip = tooltip;
            }

            this.elements.progress = progress;
            container.appendChild(this.elements.progress);
        }




        // Toggle mute button
        if (this.config.controls.includes('mute')) {
            containerLeft.appendChild(controls.createButton.call(this, 'mute'));
        }

        // Volume range control
        if (this.config.controls.includes('volume')) {
            const volume = utils.createElement('div', {
                class: 'plyr__volume',
            });

            // Set the attributes
            const attributes = {
                max: 1,
                step: 0.05,
                value: this.config.volume,
            };

            // Create the volume range slider
            const range = controls.createRange.call(
                this,
                'volume',
                utils.extend(attributes, {
                    id: `plyr-volume-${data.id}`,
                })
            );
            volume.appendChild(range.label);
            volume.appendChild(range.input);

            this.elements.volume = volume;

            containerLeft.appendChild(volume);
        }

        // Media current time display
        if (this.config.controls.includes('current-time')) {
            containerLeft.appendChild(
                controls.createTime.call(this, 'currentTime')
            );
        }

        // Media duration display
        if (this.config.controls.includes('duration')) {
            containerLeft.appendChild(
                controls.createTime.call(this, 'duration')
            );
        }

        // Toggle captions button
        if (this.config.controls.includes('captions')) {
            containerRight.appendChild(
                controls.createButton.call(this, 'captions')
            );
        }

        // Settings button / menu
        if (
            this.config.controls.includes('settings') &&
            !utils.is.empty(this.config.settings)
        ) {
            const menu = utils.createElement('div', {
                class: 'plyr__menu',
                hidden: '',
            });

            menu.appendChild(
                controls.createButton.call(this, 'settings', {
                    id: `plyr-settings-toggle-${data.id}`,
                    'aria-haspopup': true,
                    'aria-controls': `plyr-settings-${data.id}`,
                    'aria-expanded': false,
                })
            );

            const form = utils.createElement('form', {
                class: 'plyr__menu__container',
                id: `plyr-settings-${data.id}`,
                'aria-hidden': true,
                'aria-labelled-by': `plyr-settings-toggle-${data.id}`,
                role: 'tablist',
                tabindex: -1,
            });

            const inner = utils.createElement('div');

            const home = utils.createElement('div', {
                id: `plyr-settings-${data.id}-home`,
                'aria-hidden': false,
                'aria-labelled-by': `plyr-settings-toggle-${data.id}`,
                role: 'tabpanel',
            });

            // Create the tab list
            const tabs = utils.createElement('ul', {
                role: 'tablist',
            });

            // Build the tabs
            this.config.settings.forEach(type => {
                const tab = utils.createElement('li', {
                    role: 'tab',
                    hidden: '',
                });

                const button = utils.createElement(
                    'button',
                    utils.extend(
                        utils.getAttributesFromSelector(
                            this.config.selectors.buttons.settings
                        ), {
                            type: 'button',
                            class: `${this.config.classNames.control} ${
                                this.config.classNames.control
                            }--forward`,
                            id: `plyr-settings-${data.id}-${type}-tab`,
                            'aria-haspopup': true,
                            'aria-controls': `plyr-settings-${data.id}-${type}`,
                            'aria-expanded': false,
                        }
                    ),
                    i18n.get(type, this.config)
                );

                const value = utils.createElement('span', {
                    class: this.config.classNames.menu.value,
                });

                // Speed contains HTML entities
                value.innerHTML = data[type];

                button.appendChild(value);
                tab.appendChild(button);
                tabs.appendChild(tab);

                this.elements.settings.tabs[type] = tab;
            });

            home.appendChild(tabs);
            inner.appendChild(home);

            // Build the panes
            this.config.settings.forEach(type => {
                const pane = utils.createElement('div', {
                    id: `plyr-settings-${data.id}-${type}`,
                    'aria-hidden': true,
                    'aria-labelled-by': `plyr-settings-${data.id}-${type}-tab`,
                    role: 'tabpanel',
                    tabindex: -1,
                    hidden: '',
                });

                const back = utils.createElement(
                    'button', {
                        type: 'button',
                        class: `${this.config.classNames.control} ${
                            this.config.classNames.control
                        }--back`,
                        'aria-haspopup': true,
                        'aria-controls': `plyr-settings-${data.id}-home`,
                        'aria-expanded': false,
                    },
                    i18n.get(type, this.config)
                );

                pane.appendChild(back);

                const options = utils.createElement('ul');

                pane.appendChild(options);
                inner.appendChild(pane);

                this.elements.settings.panes[type] = pane;
            });

            form.appendChild(inner);
            menu.appendChild(form);
            containerRight.appendChild(menu);

            this.elements.settings.form = form;
            this.elements.settings.menu = menu;
        }

        // Picture in picture button
        if (this.config.controls.includes('pip') && support.pip) {
            containerRight.appendChild(controls.createButton.call(this, 'pip'));
        }

        // Airplay button
        if (this.config.controls.includes('airplay') && support.airplay) {
            containerRight.appendChild(
                controls.createButton.call(this, 'airplay')
            );
        }


        // Playlist button
        if (this.config.controls.includes('playlist')) {
            containerRight.appendChild(
                controls.createButton.call(this, 'playlist')
            );
        }

        // morevideos button
        if (this.config.controls.includes('morevideos')) {
            this.elements.container.appendChild(
                controls.createButton.call(this, 'morevideos')
            );
        }

        // Toggle fullscreen button
        if (this.config.controls.includes('fullscreen')) {
            containerRight.appendChild(
                controls.createButton.call(this, 'fullscreen')
            );
        }

        // Show a logo
        if (this.config.controls.includes('logo')) {
            this.elements.container.appendChild(
                controls.leftTopCreateLogo.call(this, 'logo')
            );
            containerRight.appendChild(controls.createLogo.call(this, 'logo'));
        }

        // Larger overlaid play button
        if (this.config.controls.includes('play-large')) {
            const button = controls.createButton.call(this, 'play-large');
            const hexagon = `
                <svg class="plyr__hexagon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 129.78 150.37">
                    <path class="plyr__hexagon-base" d="M-1665.43,90.94V35.83a15.09,15.09,0,0,1,6.78-12.59l48.22-31.83a15.09,15.09,0,0,1,16-.38L-1547,19.13a15.09,15.09,0,0,1,7.39,13V90.94a15.09,15.09,0,0,1-7.21,12.87l-47.8,29.24a15.09,15.09,0,0,1-15.75,0l-47.8-29.24A15.09,15.09,0,0,1-1665.43,90.94Z" transform="translate(1667.43 13.09)"/>
                    <path class="plyr__hexagon-line-animation" d="M-1665.43,90.94V35.83a15.09,15.09,0,0,1,6.78-12.59l48.22-31.83a15.09,15.09,0,0,1,16-.38L-1547,19.13a15.09,15.09,0,0,1,7.39,13V90.94a15.09,15.09,0,0,1-7.21,12.87l-47.8,29.24a15.09,15.09,0,0,1-15.75,0l-47.8-29.24A15.09,15.09,0,0,1-1665.43,90.94Z" transform="translate(1667.43 13.09)"/>
                </svg>
            `;
            button.insertAdjacentHTML('beforeend', hexagon);
            this.elements.container.appendChild(button);
        }

        container.appendChild(containerLeft);
        container.appendChild(containerRight);
        this.elements.controls = container;

        if (this.isHTML5) {
            controls.setQualityMenu.call(
                this,
                html5.getQualityOptions.call(this)
            );
        }

        controls.setSpeedMenu.call(this);

        return container;
    },

    ClearAllLevels() {

        [].forEach.call(document.querySelectorAll('.plyr__cues--progress'), (e) => {
            e.parentNode.removeChild(e);

        });
    },

    CreateProgressLevel(progress) {
        let counter = 0;
        let cuePercentage = 0;


        controls.ClearAllLevels.call(this);

        if (this.config.playlist.type === 'cue') {
            const items = playlist.getData.call(this).map(item => ({
                link: item.cuePoint / 1000,
                name: item.name,
            }));



            items.forEach((item, index) => {
                counter = index + 1;
                // eslint-disable-next-line no-unused-vars
                let itemNumber = 0;
                setTimeout(() => {
                    cuePercentage = (item.link / this.duration) * 100;


                    if (counter.toString().length === 1) {
                        itemNumber = `0${counter}`;
                    } else {
                        itemNumber = counter;
                    }

                    const cueElement = utils.createElement('span', {
                        class: 'plyr__cues--progress',
                    });
                    cueElement.style.left = `${cuePercentage.toString()}%`;

                    progress.appendChild(cueElement);
                }, 1000);
            });
        }
    },

    // Insert controls
    inject() {
        // Sprite
        if (this.config.loadSprite) {
            const icon = controls.getIconUrl.call(this);

            // Only load external sprite using AJAX
            if (icon.absolute) {
                utils.loadSprite(icon.url, 'sprite-plyr');
            }
        }

        // Create a unique ID
        this.id = Math.floor(Math.random() * 10000);

        // Null by default
        let container = null;
        this.elements.controls = null;

        // HTML or Element passed as the option
        if (
            utils.is.string(this.config.controls) ||
            utils.is.element(this.config.controls)
        ) {
            container = this.config.controls;
        } else if (utils.is.function(this.config.controls)) {
            // A custom function to build controls
            // The function can return a HTMLElement or String
            container = this.config.controls({
                id: this.id,
                seektime: this.config.seekTime,
                title: this.config.title,
            });
        } else {
            // Create controls
            container = controls.create.call(this, {
                id: this.id,
                seektime: this.config.seekTime,
                speed: this.speed,
                quality: this.quality,
                captions: controls.getLanguage.call(this),
                // TODO: Looping
                // loop: 'None',
            });
        }

        // Controls container
        let target;

        // Inject to custom location
        if (utils.is.string(this.config.selectors.controls.container)) {
            target = document.querySelector(
                this.config.selectors.controls.container
            );
        }

        // Inject into the container by default
        if (!utils.is.element(target)) {
            target = this.elements.container;
        }

        // Inject controls HTML
        if (utils.is.element(container)) {
            target.appendChild(container);
        } else if (container) {
            target.insertAdjacentHTML('beforeend', container);
        }

        // Find the elements if need be
        if (!utils.is.element(this.elements.controls)) {
            utils.findElements.call(this);
        }

        // Edge sometimes doesn't finish the paint so force a redraw
        if (window.navigator.userAgent.includes('Edge')) {
            utils.repaint(target);
        }

        // Setup tooltips
        if (this.config.tooltips.controls) {
            const labels = utils.getElements.call(
                this,
                [
                    this.config.selectors.controls.wrapper,
                    ' ',
                    this.config.selectors.labels,
                    ' .',
                    this.config.classNames.hidden,
                ].join('')
            );

            Array.from(labels).forEach(label => {
                utils.toggleClass(label, this.config.classNames.hidden, false);
                utils.toggleClass(label, this.config.classNames.tooltip, true);
                label.setAttribute('role', 'tooltip');
            });
        }
    },
};

export default controls;
