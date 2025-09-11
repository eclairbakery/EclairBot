import { Color, PredefinedColors } from '@/util/color.js';

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

        case 'gify':
        case 'gifs':
            return Category.Gifs;

        case 'deweloperskie':
        case 'dev':
            return Category.DevelopersOnly;

        case '4fun':
        case 'forfun':
        case 'for-fun':
            return Category.ForFun;

        default:
            return null;
        }
    }

    static readonly General = new Category(
        '💼', 'Ogólne', 'Rózne rzeczy nie pasujące do innych kategorii',
        'Rózne rzeczy które poprostu nie pasują do innych kategorii',
        PredefinedColors.Cyan,
    );
    static readonly Mod = new Category(
        '🔨', 'Moderacja', 'Komendy do moderacji',
        'To kategoria z rzeczami stricte dla adminów do szeroko pojętej moderacji.',
        PredefinedColors.Yellow,
    );
    static readonly Economy = new Category(
        '💸', 'Ekonomia', 'Komendy dotyczące ekonomi',
        'Chcesz troche popracować albo sprawdzić swój stan konta? Komendy z tej kategorii właśnie to umożliwiają!',
        PredefinedColors.DarkGreen,
    );
    static readonly DevelopersOnly = new Category(
        '💻', 'Deweloperskie', 'Komendy dla deweloperów',
        'Komendy które Ci nie zadziałają, bo nie jesteś deweloperem. A jak jesteś to dużo i tak zablokowałem bo są limity o których nie wiesz / są potencjalnie unsafe, np. restart może być tylko raz na 60 sekund, a eval to... well... jest unsafe.',
        PredefinedColors.DarkGreen,
    );
    static readonly Leveling = new Category(
        '🔵', 'Poziomy', 'Komendy do zarządzania poziomami',
        'W tej kategorii znajdziesz kilka ciekawych komend do sprawdzania levela swojego lub innych.'
            + 'Jeśli jesteś adminem to dodatkowo masz tu komendy do zarządzania levelem uzytkowników.',
        PredefinedColors.Green,
    );
    static readonly Gifs = new Category(
        '🎬', 'Gify', 'Poprostu pokazują ci losowe gify... co tu więcej mówić',
        'Poprostu pokazują ci losowe gify... co tu więcej mówić',
        PredefinedColors.Cyan,
    );
    static readonly ForFun = new Category(
        '🔥', '4fun', 'opis dam potem',
        'opis dam potem',
        PredefinedColors.Blurple,
    );
};
