const instance = null;

/**
 * EventBus
 */
class EventBus {
    /**
     * Constructor of EventBus.
     * @return {*}
     */
    constructor() {
        // Make this a singleton.
        if (instance) {
            return instance;
        }

        this.listeners = {};
    }

    /**
     * Get event listeners.
     * @param {String} eventName
     * @param {Function} callback
     * @param {String} scope
     * @return {number}
     * @private
     */
    getListenerIdx(eventName, callback, scope) {
        const eventListeners = this.listeners[eventName];
        let i;
        let idx = -1;

        if (!eventListeners || eventListeners.length === 0) {
            return idx;
        }

        for (i = 0; i < eventListeners.length; i += 1) {
            if (eventListeners[i].callback === callback &&
                (!scope || scope === eventListeners[i].scope)) {
                idx = i;
                break;
            }
        }

        return idx;
    }

    /**
     * Subscribe to events.
     * @param {String} eventName
     * @param {Function} callback
     * @param {String} scope
     */
    subscribe(eventName, callback, scope) {
        if (!eventName) {
            throw new Error('Event name cannot be null or undefined.');
        }

        if (!callback || typeof(callback) !== 'function') {
            throw new Error('Listener must be of type function.');
        }

        const idx = this.getListenerIdx(eventName, callback, scope);

        if (idx >= 0) return;

        const listener = {
            callback,
            scope,
        };

        this.listeners[eventName] = this.listeners[eventName] || [];
        this.listeners[eventName].push(listener);
    }

    /**
     * Broadcast event.
     * @param {String} eventName
     * @param {Object} args
     */
    broadcast(eventName, args) {
        const eventListeners = this.listeners[eventName];

        if (!eventName || !this.listeners[eventName]) {
            return;
        }

        const ourArgs = args || {};

        eventListeners.forEach((listener) => {
            listener.callback.call(listener.scope, ourArgs);
        });
    }
}

export default EventBus;
