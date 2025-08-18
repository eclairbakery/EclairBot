export type Timestamp = number; // seconds

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
    const str = timestampStr.trim().toLowerCase().trim();

    for (const unit of Object.values(timeUnits)) {
        for (const alias of unit.aliases) {
            if (str.endsWith(alias)) {
                const numPart = str.slice(0, -alias.length).trim();
                const num = numPart == '' ? 1 : parseFloat(numPart);
                if (!isNaN(num)) return num * unit.multiplier;
            }
        }
    }

    const num = parseFloat(str);
    if (!isNaN(num)) return num;
    else return null;
}
