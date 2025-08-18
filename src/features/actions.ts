import * as log from '../util/log.js';
import * as dsc from 'discord.js';

export type ActionCallback = (msg: dsc.Message) => void

class PredefinedActionCallbacks {
    static reply(options: string | dsc.MessagePayload | dsc.MessageReplyOptions): ActionCallback {
        return (msg) => msg.reply(options)
    }

    static replyError
}