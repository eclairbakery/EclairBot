import { Color, PredefinedColors } from '../util/color.js';

export class Category {
    name: string;
    shortDesc: string;
    longDesc: string;
    color: Color;

    constructor(name: string, shortDesc: string, longDesc: string, color: Color) {
        this.name = name;
        this.shortDesc = shortDesc;
        this.longDesc = longDesc;
        this.color = color;
    }

    static readonly General = new Category(
        'Ogólne', 'Rózne rzeczy nie pasujące do innych kategorii',
        'Rózne rzeczy które poprostu nie pasują do innych kategorii',
        PredefinedColors.Cyan,
    );
    static readonly Economy = new Category(
        'Ekonomia', 'Komendy dotyczące ekonomi',
        'Chcesz troche popracować albo sprawdzić swój stan konta? Komendy z tej kategorii właśnie to umożliwiają!',
        PredefinedColors.DarkGreen,
    );
    static readonly Leveling = new Category(
        'Poziomy', 'Komendy do zarządzania poziomami',
        'W tej kategorii znajdziesz kilka ciekawych komend do sprawdzania levela swojego lub innych.'
            + 'Jeśli jesteś adminem to dodatkowo masz tu komendy do zarządzania levelem uzytkowników.',
        PredefinedColors.Green,
    );
    static readonly Mod = new Category(
        'Moderacja', 'Komendy do moderacji',
        'To kategoria z rzeczami stricte dla adminów do szeroko pojętej moderacji.',
        PredefinedColors.Yellow,
    );
};