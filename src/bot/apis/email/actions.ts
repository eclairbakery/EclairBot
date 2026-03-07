import actionsManager from '@/features/actions/index.js';

import * as email from './mail.js';

export interface ReceivedNewEmail {
    email: email.ReceivedEmail;
};
export const ReceivedNewEmailEvent = actionsManager.mkEvent('ReceivedNewEmailEvent');

export async function initEmailActionsIntegration() {
    email.listenForNewEmails((email) => {
        actionsManager.emit<ReceivedNewEmail>(ReceivedNewEmailEvent, { email });
    });
}

export default actionsManager;
