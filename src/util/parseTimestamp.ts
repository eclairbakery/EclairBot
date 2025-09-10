export type Timestamp = number; // seconds
export const Second = 1;
export const Minute = 60 * Second;
export const Hour = 60 * Minute;
export const Day = 24 * Hour;
export const Week = 7 * Day;
export const Month = 30 * Day;

export interface TimestampFormat {
    aliases: string[];
    multiplier: number
};

const timeUnits: Record<string, TimestampFormat> = {
    seconds: {
        aliases: ['s', 'sec', 'sek', 'second', 'seconds', 'sekunda', 'sekund'],
        multiplier: 1,
    },
    minutes: {
        aliases: ['m', 'min', 'minute', 'minutes', 'minuta', 'minut'],
        multiplier: 60,
    },
    hours: {
        aliases: ['h', 'hr', 'hour', 'hours', 'godz', 'godzina', 'godzin'],
        multiplier: 60 * 60,
    },
    days: {
        aliases: ['d', 'day', 'days', 'dzień', 'dni'],
        multiplier: 60 * 60 * 24,
    },
    weeks: {
        aliases: ['w', 'wk', 'week', 'weeks', 'tydzień', 'tygodni'],
        multiplier: 60 * 60 * 24 * 7,
    },
    months: {
        aliases: ['mo', 'mon', 'month', 'months', 'miesiąc', 'miesięcy'],
        multiplier: 60 * 60 * 24 * 30, // assume 30 days
    },
};

for (const unit in timeUnits) {
    timeUnits[unit].aliases.sort((a, b) => b.length - a.length);
}

export default function parseTimestamp(timestampStr: string): Timestamp | null {
    const str = timestampStr.trim().toLowerCase();

    const regex = /(\d+(?:\.\d+)?)([a-ząćęłńóśźż]+)/gi;
    let match: RegExpExecArray | null;
    let total = 0;
    let found = false;

    while ((match = regex.exec(str)) !== null) {
        const value = parseFloat(match[1]);
        const unitStr = match[2];

        let matched = false;
        for (const unit of Object.values(timeUnits)) {
            for (const alias of unit.aliases) {
                if (unitStr === alias) {
                    total += value * unit.multiplier;
                    matched = true;
                    found = true;
                    break;
                }
            }
            if (matched) break;
        }
    }

    if (!found) {
        const num = parseFloat(str);
        if (!isNaN(num)) return num;
        else return null;
    }

    return total;
}
