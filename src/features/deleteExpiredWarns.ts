import { db, sqlite } from '@/bot/db.js';
import { output } from '@/bot/logging.js';

const EXPIRED_WARNS_CHECK_INTERVAL = 10 * 60 * 1000; // 10m in ms
const SHORT_TERM_THRESHOLD = 10 * 60; // 10m in seconds

interface WarnRow {
    rowid: number;
    expires_at: number;
}

export function initExpiredWarnsDeleter() {
    try {
        restoreTimers();

        const interval = setInterval(
            checkLongTermWarns,
            EXPIRED_WARNS_CHECK_INTERVAL
        );

        process.on('SIGINT', () => {
            clearInterval(interval);
            process.exit(0);
        });

        return interval;
    } catch (error) {
        output.err( error);
    }
}

function checkLongTermWarns() {
    const now = Math.floor(Date.now() / 1000);

    db.run(
        'DELETE FROM warns WHERE expires_at < ?',
        [now],
        function(err) {
            if (err) {
                output.err(err);
            }
        }
    );
}

export function scheduleWarnDeletion(warnId: number, expiresAt: number) {
    const now = Math.floor(Date.now() / 1000);
    const delay = (expiresAt - now) * 1000;

    if (delay <= SHORT_TERM_THRESHOLD * 1000) {
        setTimeout(() => {
            db.run(
                'DELETE FROM warns WHERE rowid = ?',
                [warnId],
                function(err) {
                    if (err) {
                        output.err(err);
                    }
                }
            );
        }, delay).unref();
    }
}

function restoreTimers() {
    const now = Math.floor(Date.now() / 1000);
    const threshold = now + SHORT_TERM_THRESHOLD;

    db.all<WarnRow>(
        'SELECT rowid, expires_at FROM warns WHERE expires_at BETWEEN ? AND ?',
        [now, threshold],
        (err, rows) => {
            if (err) {
                output.err(err);
                return;
            }
            rows.forEach(row => {
                scheduleWarnDeletion(row.rowid, row.expires_at);
            });
        }
    );
}