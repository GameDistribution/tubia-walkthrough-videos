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
        if (!this.player.config.report.active) return;
        ReportPlayer.createReportScreen.call(this);
    }

    static createReportScreen() {
        const container = document.querySelector('.plyr');
        const subjects = [
            'Video cannot be loaded/played.',
            'Mismatched video content.',
            'Copyright infringement.',
        ];
        const list = utils.createElement('div', {
            class: 'subjects-list',
        });
        subjects.forEach((subject, index) => {
            list.insertAdjacentHTML('afterbegin', `
                <div class="form-group subject">
                    <input type="checkbox" id="item${index}" name="language" />
                    <label for="item${index}">
                        <svg
                        class="tick"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        >
                        <path
                            d="M5 13L6 14L7 15L8 16L9 17L11 15L12 14L13 13L14 12L15 11L16 10L17 9L18 8"
                        />
                        </svg>
                        ${subject}
                    </label>
                </div>
            `);
        });

        const wrapper = utils.createElement('div', {
            class: 'plyr-report hide',
        });

        const title = utils.createElement('h2', {
            class: 'title',
        }, 'Aww what is wrong?');

        const reportContainer = utils.createElement('div', {
            class: 'plyr-report-container',
        });

        const detailedAnswer = utils.createElement('div', {
            class: 'details',
        });
        detailedAnswer.insertAdjacentHTML('afterbegin', `
            <h3>Any detail you want to share?</h3>
        `);
        const details = utils.createElement('textarea', {
            rows: 2,
            cols: 50,
            id: 'details',
        });
        detailedAnswer.appendChild(details);

        const sendButton = utils.createElement('button', {
            class: 'send-button',
        }, 'Send');

        this.closeButton = utils.createElement('button', {
            class: 'report-close-button',
        });

        this.closeButton.insertAdjacentHTML('afterbegin', '<span class="icon-close"></span>');
        this.closeButton.addEventListener('click', () => ReportPlayer.hideReportScreen.call(this));
        this.closeButton.setAttribute('data-plyr', 'reportCloseButton');
        
        utils.appendChildren(reportContainer, [
            this.closeButton,
            title,
            list,
            detailedAnswer,
            sendButton,
        ]);
        
        wrapper.appendChild(reportContainer);
        container.appendChild(wrapper);    
    }

    static hideReportScreen() {
        const reportContainer = document.querySelector('.plyr-report');
        if (!utils.is.nullOrUndefined(reportContainer)) {
            if (!reportContainer.classList.contains('hide')) {
                reportContainer.classList.add('hide');
            }
        }
    }
}

export default ReportPlayer;
