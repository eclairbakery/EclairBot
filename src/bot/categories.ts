import { Color, PredefinedColors } from '../util/color.js';

export class Category {
    emoji: string;
    name: string;
    shortDesc: string;
    longDesc: string;
    color: Color;

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
};