import { CommandArgType } from "@/bot/command.js";

export class ArgParseError extends Error {};

export class MissingRequiredArgError extends ArgParseError {
    public argName: string;
    public argType: CommandArgType;
    constructor(argName: string, argType: CommandArgType) { super(); this.argName = argName; this.argType = argType };
}

export class ArgMustBeSomeTypeError extends ArgParseError {
    public argName: string;
    public argType: CommandArgType;
    constructor(argName: string, argType: CommandArgType) { super(); this.argName = argName;  this.argType = argType; };
};