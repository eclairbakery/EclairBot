import { Color, PredefinedColors } from '@/util/color.ts';

export class Category {
    public emoji: string;
    public name: string;
    public shortDesc: string;
    public longDesc: string;
    public color: Color;

    constructor(emoji: string, name: string, shortDesc: string, longDesc: string, color: Color) {
        this.emoji = emoji;
        this.name = name;
        this.shortDesc = shortDesc;
        this.longDesc = longDesc;
        this.color = color;
    }

    stringId(): string | undefined {
        switch (this) {
            case Category.General:
                return 'general';
            case Category.Mod:
                return 'mod';
            case Category.Economy:
                return 'economy';
            case Category.Leveling:
                return 'leveling';
            case Category.DevelopersOnly:
                return 'dev';
            case Category.ForFun:
                return 'forfun';
            case Category.Email:
                return 'email';
            case Category.Music:
                return 'music';
        }
    }

    static fromString(str: string): Category | null {
        switch (str.toLowerCase()) {
            case 'general':
            case 'ogólne':
                return Category.General;

            case 'mod':
            case 'moderacja':
            case 'administracja':
                return Category.Mod;

            case 'ekonomia':
            case 'economy':
                return Category.Economy;

            case 'poziomy':
            case 'leveling':
            case 'levels':
            case 'level':
            case 'xp':
                return Category.Leveling;

            case 'deweloperskie':
            case 'dev':
                return Category.DevelopersOnly;

            case '4fun':
            case 'forfun':
            case 'for-fun':
                return Category.ForFun;

            case 'email':
            case 'e-mail':
            case 'mail':
                return Category.Email;

            case 'music':
            case 'muzyka':
            case 'radio':
                return Category.Music;

            default:
                return null;
        }
    }

    static readonly General = new Category(
        '💼',
        'Ogólne',
        'Rózne rzeczy nie pasujące do innych kategorii',
        'Rózne rzeczy które poprostu nie pasują do innych kategorii',
        PredefinedColors.Cyan,
    );
    static readonly Mod = new Category(
        '🔨',
        'Moderacja',
        'Komendy do moderacji',
        'To kategoria z rzeczami stricte dla adminów do szeroko pojętej moderacji.',
        PredefinedColors.Yellow,
    );
    static readonly Economy = new Category(
        '💸',
        'Ekonomia',
        'Komendy dotyczące ekonomi',
        'Chcesz troche popracować albo sprawdzić swój stan konta? Komendy z tej kategorii właśnie to umożliwiają!',
        PredefinedColors.DarkGreen,
    );
    static readonly DevelopersOnly = new Category(
        '💻',
        'Deweloperskie',
        'Komendy dla deweloperów',
        'Komendy które Ci nie zadziałają, bo nie jesteś deweloperem. A jak jesteś to dużo i tak zablokowałem bo są limity o których nie wiesz / są potencjalnie unsafe, np. restart może być tylko raz na 60 sekund, a eval to... well... jest unsafe.',
        PredefinedColors.DarkGreen,
    );
    static readonly Leveling = new Category(
        '🔵',
        'Poziomy',
        'Komendy do zarządzania poziomami',
        'W tej kategorii znajdziesz kilka ciekawych komend do sprawdzania levela swojego lub innych.' +
            'Jeśli jesteś adminem to dodatkowo masz tu komendy do zarządzania levelem uzytkowników.',
        PredefinedColors.Green,
    );
    static readonly ForFun = new Category(
        '🔥',
        '4fun',
        'Komendy bez celu. Do zabawy czy coś.',
        'Masz tu komendy i możesz się nimi bawić. Są bezcelowe i istnieją bo są fajne.',
        PredefinedColors.Blurple,
    );
    static readonly Email = new Category(
        '📧',
        "E-mail'e",
        'Możesz wysyłać e-maile.',
        "Kontaktuj się z innymi za pomocą przełomowej technologii XXI wieku - e-mail'i!",
        PredefinedColors.Aqua,
    );
    static readonly Music = new Category(
        '🔊',
        "Muzyczne",
        'Steruj radiem tego serwera.',
        "Wysyłaj do radia piekarnii zawaansowane komendy i nim steruj.",
        PredefinedColors.Pink,
    );
}
