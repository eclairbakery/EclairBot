export enum PredefinedColors {
    Default           = 0x000000,
    White             = 0xFFFFFF,
    Aqua              = 0x1ABC9C,
    Green             = 0x2ECC40,
    Blue              = 0x3498DB,
    Yellow            = 0xFFFF00,
    Purple            = 0x9B59B6,
    LuminousVividPink = 0xE91E63,
    Gold              = 0xF1C40F,
    Orange            = 0xE67E22,
    Red               = 0xE74C3C,
    Grey              = 0x95A5A6,
    Navy              = 0x34495E,
    DarkAqua          = 0x11806A,
    DarkGreen         = 0x1F8B4C,
    DarkBlue          = 0x206694,
    DarkPurple        = 0x71368A,
    DarkVividPink     = 0xAD1457,
    DarkGold          = 0xC27C0E,
    DarkOrange        = 0xA84300,
    DarkRed           = 0x992D22,
    DarkGrey          = 0x979C9F,
    DarkNavy          = 0x2C3E50,
    LightGrey         = 0xBCC0C0,
    DarkerGrey        = 0x7F8C8D,
    NotQuiteBlack     = 0x23272A,
    Blurple           = 0x5865F2,
    Greyple           = 0x99AAB5,
    DarkButNotBlack   = 0x2C2F33,
    Fuchsia           = 0xEB459E,
    YellowGreen       = 0x9ACD32,
    Teal              = 0x008080,
    Magenta           = 0xFF00FF,
    Cyan              = 0x00FFFF,
    Brown             = 0xA52A2A,
    Pink              = 0xFFC0CB
}

export enum RarelyUsedColors {
    Red               = 0xff0000
}

export type Color = PredefinedColors | RarelyUsedColors | number;