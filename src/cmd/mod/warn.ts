import { prettyPrint } from 'util/objects';
import { Command } from 'bot/command';

import * as log from 'util/log';
import * as cfgManager from 'bot/cfgManager';
import * as automod from 'bot/automod';

import * as dotenv from 'dotenv';
import * as dsc from 'discord.js';
import * as sqlite from 'sqlite3';
