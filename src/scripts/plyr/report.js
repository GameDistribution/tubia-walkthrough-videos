// ==========================================================================
// User Reports
// ==========================================================================
import utils from './utils';

class ReportPlayer {
    /**
     * User's reporting of Tubia Player.
     */

    constructor(player) {
        this.player = player;
        this.createReportScreen();
    }

    createReportScreen() {
        const wrapper = utils.createElement('div', {
            class: `${this.class.wrapper} ${this.class.hide}`,
        });
    }
}

export default ReportPlayer;
