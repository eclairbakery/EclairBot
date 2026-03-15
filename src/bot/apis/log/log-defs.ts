import { PredefinedColors, RarelyUsedColors } from "@/util/color.ts";
import { APIEmbedField, Snowflake } from "discord.js";

export interface LogData {
    title: string;
    description: string;
    fields?: APIEmbedField[];
    color?: PredefinedColors | RarelyUsedColors;
    where?: Snowflake;
}
