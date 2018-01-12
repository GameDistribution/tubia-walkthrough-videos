// ==========================================================================
// Plyr Event Listeners
// ==========================================================================

import support from './support';
import utils from './utils';
import controls from './controls';
import fullscreen from './fullscreen';
import ui from './ui';

// Sniff out the browser
const browser = utils.getBrowser();

const listeners = {
    // Global listeners
    global() {
        let last = null;

        // Get the key code for an event
        const getKeyCode = event => (event.keyCode ? event.keyCode : event.which);

        // Handle key press
        const handleKey = event => {
            const code = getKeyCode(event);
            const pressed = event.type === 'keydown';
            const repeat = pressed && code === last;

            // Bail if a modifier key is set
            if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
                return;
            }

            // If the event is bubbled from the media element
            // Firefox doesn't get the keycode for whatever reason
            if (!utils.is.number(code)) {
                return;
            }

            // Seek by the number keys
            const seekByKey = () => {
                // Divide the max duration into 10th's and times by the number value
                this.currentTime = this.duration / 10 * (code - 48);
            };

            // Handle the key on keydown
            // Reset on keyup
            if (pressed) {
                // Which keycodes should we prevent default
                const preventDefault = [
                    48,
                    49,
                    50,
                    51,
                    52,
                    53,
                    54,
                    56,
                    57,
                    32,
                    75,
                    38,
                    40,
                    77,
                    39,
                    37,
                    70,
                    67,
                    73,
                    76,
                    79,
                ];

                // Check focused element
                // and if the focused element is not editable (e.g. text input)
                // and any that accept key input http://webaim.org/techniques/keyboard/
                const focused = utils.getFocusElement();
                if (utils.is.element(focused) && utils.matches(focused, this.config.selectors.editable)) {
                    return;
                }

                // If the code is found prevent default (e.g. prevent scrolling for arrows)
                if (preventDefault.includes(code)) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                switch (code) {
                    case 48:
                    case 49:
                    case 50:
                    case 51:
                    case 52:
                    case 53:
                    case 54:
                    case 55:
                    case 56:
                    case 57:
                        // 0-9
                        if (!repeat) {
                            seekByKey();
                        }
                        break;

                    case 32:
                    case 75:
                        // Space and K key
                        if (!repeat) {
                            this.togglePlay();
                        }
                        break;

                    case 38:
                        // Arrow up
                        this.increaseVolume(0.1);
                        break;

                    case 40:
                        // Arrow down
                        this.decreaseVolume(0.1);
                        break;

                    case 77:
                        // M key
                        if (!repeat) {
                            this.muted = !this.muted;
                        }
                        break;

                    case 39:
                        // Arrow forward
                        this.forward();
                        break;

                    case 37:
                        // Arrow back
                        this.rewind();
                        break;

                    case 70:
                        // F key
                        this.toggleFullscreen();
                        break;

                    case 67:
                        // C key
                        if (!repeat) {
                            this.toggleCaptions();
                        }
                        break;

                    case 76:
                        // L key
                        this.loop = !this.loop;
                        break;

                    /* case 73:
                        this.setLoop('start');
                        break;

                    case 76:
                        this.setLoop();
                        break;

                    case 79:
                        this.setLoop('end');
                        break; */

                    default:
                        break;
                }

                // Escape is handle natively when in full screen
                // So we only need to worry about non native
                if (!fullscreen.enabled && this.fullscreen.active && code === 27) {
                    this.toggleFullscreen();
                }

                // Store last code for next cycle
                last = code;
            } else {
                last = null;
            }
        };

        // Keyboard shortcuts
        if (this.config.keyboard.global) {
            utils.on(window, 'keydown keyup', handleKey, false);
        } else if (this.config.keyboard.focused) {
            utils.on(this.elements.container, 'keydown keyup', handleKey, false);
        }

        // Detect tab focus
        // Remove class on blur/focusout
        utils.on(this.elements.container, 'focusout', event => {
            utils.toggleClass(event.target, this.config.classNames.tabFocus, false);
        });

        // Add classname to tabbed elements
        utils.on(this.elements.container, 'keydown', event => {
            if (event.keyCode !== 9) {
                return;
            }

            // Delay the adding of classname until the focus has changed
            // This event fires before the focusin event
            window.setTimeout(() => {
                utils.toggleClass(utils.getFocusElement(), this.config.classNames.tabFocus, true);
            }, 0);
        });

        // Toggle controls visibility based on mouse movement
        if (this.config.hideControls) {
            // Toggle controls on mouse events and entering fullscreen
            utils.on(this.elements.container, 'mouseenter mouseleave mousemove touchstart touchend touchmove enterfullscreen exitfullscreen', event => {
                this.toggleControls(event);
            });
        }

        // Handle user exiting fullscreen by escaping etc
        if (fullscreen.enabled) {
            utils.on(document, fullscreen.eventType, event => {
                this.toggleFullscreen(event);
            });

            // Fullscreen toggle on double click
            utils.on(this.elements.container, 'dblclick', event => {
                this.toggleFullscreen(event);
            });
        }
    },

    // Listen for media events
    media() {
        // Time change on media
        utils.on(this.media, 'timeupdate seeking', event => ui.timeUpdate.call(this, event));

        // Display duration
        utils.on(this.media, 'durationchange loadedmetadata', event => ui.durationUpdate.call(this, event));

        // Check for audio tracks on load
        // We can't use `loadedmetadata` as it doesn't seem to have audio tracks at that point
        utils.on(this.media, 'loadeddata', () => {
            utils.toggleHidden(this.elements.volume, !this.hasAudio);
            utils.toggleHidden(this.elements.buttons.mute, !this.hasAudio);
        });

        // Handle the media finishing
        utils.on(this.media, 'ended', () => {
            // Show poster on end
            if (this.isHTML5 && this.isVideo && this.config.showPosterOnEnd) {
                // Restart
                this.restart();

                // Re-load media
                this.media.load();
            }
        });

        // Check for buffer progress
        utils.on(this.media, 'progress playing', event => ui.updateProgress.call(this, event));

        // Handle native mute
        utils.on(this.media, 'volumechange', event => ui.updateVolume.call(this, event));

        // Handle native play/pause
        utils.on(this.media, 'playing play pause ended', event => ui.checkPlaying.call(this, event));

        // Loading
        utils.on(this.media, 'stalled waiting canplay seeked playing', event => ui.checkLoading.call(this, event));

        // Check if media failed to load
        // utils.on(this.media, 'play', event => ui.checkFailed.call(this, event));

        // Click video
        if (this.supported.ui && this.config.clickToPlay && !this.isAudio) {
            // Re-fetch the wrapper
            const wrapper = utils.getElement.call(this, `.${this.config.classNames.video}`);

            // Bail if there's no wrapper (this should never happen)
            if (!utils.is.element(wrapper)) {
                return;
            }

            // On click play, pause ore restart
            utils.on(wrapper, 'click', () => {
                // Touch devices will just show controls (if we're hiding controls)
                if (this.config.hideControls && support.touch && !this.paused) {
                    return;
                }

                if (this.paused) {
                    this.play();
                } else if (this.ended) {
                    this.restart();
                    this.play();
                } else {
                    this.pause();
                }
            });
        }

        // Disable right click
        if (this.supported.ui && this.config.disableContextMenu) {
            utils.on(
                this.media,
                'contextmenu',
                event => {
                    event.preventDefault();
                },
                false
            );
        }

        // Volume change
        utils.on(this.media, 'volumechange', () => {
            // Save to storage
            this.storage.set({ volume: this.volume, muted: this.muted });
        });

        // Speed change
        utils.on(this.media, 'ratechange', () => {
            // Update UI
            controls.updateSetting.call(this, 'speed');

            // Save to storage
            this.storage.set({ speed: this.speed });
        });

        // Quality change
        utils.on(this.media, 'qualitychange', () => {
            // Update UI
            controls.updateSetting.call(this, 'quality');

            // Save to storage
            this.storage.set({ quality: this.quality });
        });

        // Caption language change
        utils.on(this.media, 'languagechange', () => {
            // Update UI
            controls.updateSetting.call(this, 'captions');

            // Save to storage
            this.storage.set({ language: this.language });
        });

        // Captions toggle
        utils.on(this.media, 'captionsenabled captionsdisabled', () => {
            // Update UI
            controls.updateSetting.call(this, 'captions');

            // Save to storage
            this.storage.set({ captions: this.captions.active });
        });

        // Proxy events to container
        // Bubble up key events for Edge
        utils.on(this.media, this.config.events.concat([
            'keyup',
            'keydown',
        ]).join(' '), event => {
            let detail = {};

            // Get error details from media
            if (event.type === 'error') {
                detail = this.media.error;
            }

            utils.dispatchEvent.call(this, this.elements.container, event.type, true, detail);
        });
    },

    // Listen for control events
    controls() {
        // IE doesn't support input event, so we fallback to change
        const inputEvent = browser.isIE ? 'change' : 'input';

        // Trigger custom and default handlers
        const proxy = (event, handlerKey, defaultHandler) => {
            const customHandler = this.config.listeners[handlerKey];

            // Execute custom handler
            if (utils.is.function(customHandler)) {
                customHandler.call(this, event);
            }

            // Only call default handler if not prevented in custom handler
            if (!event.defaultPrevented && utils.is.function(defaultHandler)) {
                defaultHandler.call(this, event);
            }
        };

        // Play/pause toggle
        utils.on(this.elements.buttons.play, 'click', event =>
            proxy(event, 'play', () => {
                this.togglePlay();
            })
        );

        // Pause
        utils.on(this.elements.buttons.restart, 'click', event =>
            proxy(event, 'restart', () => {
                this.restart();
            })
        );

        // Rewind
        utils.on(this.elements.buttons.rewind, 'click', event =>
            proxy(event, 'rewind', () => {
                this.rewind();
            })
        );

        // Rewind
        utils.on(this.elements.buttons.forward, 'click', event =>
            proxy(event, 'forward', () => {
                this.forward();
            })
        );

        // Mute toggle
        utils.on(this.elements.buttons.mute, 'click', event =>
            proxy(event, 'mute', () => {
                this.muted = !this.muted;
            })
        );

        // Captions toggle
        utils.on(this.elements.buttons.captions, 'click', event =>
            proxy(event, 'captions', () => {
                this.toggleCaptions();
            })
        );

        // Fullscreen toggle
        utils.on(this.elements.buttons.fullscreen, 'click', event =>
            proxy(event, 'fullscreen', () => {
                this.toggleFullscreen();
            })
        );

        // Picture-in-Picture
        utils.on(this.elements.buttons.pip, 'click', event =>
            proxy(event, 'pip', () => {
                this.pip = 'toggle';
            })
        );

        // Airplay
        utils.on(this.elements.buttons.airplay, 'click', event =>
            proxy(event, 'airplay', () => {
                this.airplay();
            })
        );

        // Settings menu
        utils.on(this.elements.buttons.settings, 'click', event => {
            controls.toggleMenu.call(this, event);
        });

        // Click anywhere closes menu
        utils.on(document.documentElement, 'click', event => {
            controls.toggleMenu.call(this, event);
        });

        // Settings menu
        utils.on(this.elements.settings.form, 'click', event => {
            event.stopPropagation();

            // Settings menu items - use event delegation as items are added/removed
            if (utils.matches(event.target, this.config.selectors.inputs.language)) {
                proxy(event, 'language', () => {
                    this.language = event.target.value;
                });
            } else if (utils.matches(event.target, this.config.selectors.inputs.quality)) {
                proxy(event, 'quality', () => {
                    this.quality = event.target.value;
                });
            } else if (utils.matches(event.target, this.config.selectors.inputs.speed)) {
                proxy(event, 'speed', () => {
                    this.speed = parseFloat(event.target.value);
                });
            } else {
                controls.showTab.call(this, event);
            }
        });

        // Seek
        utils.on(this.elements.inputs.seek, inputEvent, event =>
            proxy(event, 'seek', () => {
                this.currentTime = event.target.value / event.target.max * this.duration;
            })
        );

        // Current time invert
        // Only if one time element is used for both currentTime and duration
        if (this.config.toggleInvert && !utils.is.element(this.elements.display.duration)) {
            utils.on(this.elements.display.currentTime, 'click', () => {
                // Do nothing if we're at the start
                if (this.currentTime === 0) {
                    return;
                }

                this.config.invertTime = !this.config.invertTime;
                ui.timeUpdate.call(this);
            });
        }

        // Volume
        utils.on(this.elements.inputs.volume, inputEvent, event =>
            proxy(event, 'volume', () => {
                this.volume = event.target.value;
            })
        );

        // Polyfill for lower fill in <input type="range"> for webkit
        if (browser.isWebkit) {
            utils.on(utils.getElements.call(this, 'input[type="range"]'), 'input', event => {
                controls.updateRangeFill.call(this, event.target);
            });
        }

        // Seek tooltip
        utils.on(this.elements.progress, 'mouseenter mouseleave mousemove', event => controls.updateSeekTooltip.call(this, event));

        // Toggle controls visibility based on mouse movement
        if (this.config.hideControls) {
            // Watch for cursor over controls so they don't hide when trying to interact
            utils.on(this.elements.controls, 'mouseenter mouseleave', event => {
                this.elements.controls.hover = event.type === 'mouseenter';
            });

            // Watch for cursor over controls so they don't hide when trying to interact
            utils.on(this.elements.controls, 'mousedown mouseup touchstart touchend touchcancel', event => {
                this.elements.controls.pressed = [
                    'mousedown',
                    'touchstart',
                ].includes(event.type);
            });

            // Focus in/out on controls
            utils.on(this.elements.controls, 'focusin focusout', event => {
                this.toggleControls(event);
            });
        }

        // Mouse wheel for volume
        utils.on(
            this.elements.inputs.volume,
            'wheel',
            event =>
                proxy(event, 'volume', () => {
                    // Detect "natural" scroll - suppored on OS X Safari only
                    // Other browsers on OS X will be inverted until support improves
                    const inverted = event.webkitDirectionInvertedFromDevice;
                    const step = 1 / 50;
                    let direction = 0;

                    // Scroll down (or up on natural) to decrease
                    if (event.deltaY < 0 || event.deltaX > 0) {
                        if (inverted) {
                            this.decreaseVolume(step);
                            direction = -1;
                        } else {
                            this.increaseVolume(step);
                            direction = 1;
                        }
                    }

                    // Scroll up (or down on natural) to increase
                    if (event.deltaY > 0 || event.deltaX < 0) {
                        if (inverted) {
                            this.increaseVolume(step);
                            direction = 1;
                        } else {
                            this.decreaseVolume(step);
                            direction = -1;
                        }
                    }

                    // Don't break page scrolling at max and min
                    if ((direction === 1 && this.media.volume < 1) || (direction === -1 && this.media.volume > 0)) {
                        event.preventDefault();
                    }
                }),
            false
        );
    },
};

export default listeners;
