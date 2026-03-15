export enum CommandFlags {
    None = 0,

    // command flags: command blocking by category
    Spammy = 1 << 0,
    Important = 1 << 1,
    Economy = 1 << 2,

    // command flags: other command blocking
    WorksInDM = 1 << 3,
    Unsafe = 1 << 4,
    Deprecated = 1 << 5,
}

export type CommandViolatedRule = "used-infinity" | "non-int-passed";
