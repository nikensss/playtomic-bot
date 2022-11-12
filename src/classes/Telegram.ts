import { promises as fs } from 'fs';
import TelegramBot from 'node-telegram-bot-api';
import { logger } from '.';
import { getTwoWeeksOfDates } from '../utils';
import { Playtomic } from './Playtomic';
import { SlotJson } from './Slot';
import { Tenant } from './Tenant';

export class Telegram {
  private token: string;
  private bot: TelegramBot;

  constructor(token?: string) {
    if (!token) throw new Error('Invalid token');

    this.token = token;
    this.bot = new TelegramBot(this.token, { polling: true });
  }

  init(): this {
    this.bot.onText(/\/check/, async msg => {
      try {
        logger.info({ msg });
        await this.bot.sendMessage(msg.chat.id, 'Let me check for you, just a moment...');
        const messages = (await this.onCheck()).map(s => this.bot.sendMessage(msg.chat.id, s));
        await Promise.all(messages);
      } catch (err) {
        logger.error({ err });
        await this.sendError(err, msg);
      }
    });

    this.bot.onText(/\/ping/, msg => this.sendMessage(msg.chat.id, 'pong'));

    this.bot.onText(/\/id/, msg => this.sendMessage(msg.chat.id, `${msg.chat.id}`));

    this.sendAdminMessage("I'm listening...").catch(err => logger.error({ err }));

    return this;
  }

  private async sendError(err: unknown, msg: TelegramBot.Message): Promise<void> {
    await this.sendAdminMessage(`Error in chat with "${msg.chat.username}": ${err}`);
  }

  private async sendAdminMessage(message: string): Promise<void> {
    if (!process.env.TELEGRAM_CHAT_ID) return;
    await this.sendMessage(process.env.TELEGRAM_CHAT_ID, message);
  }

  async sendMessage(chatId: TelegramBot.ChatId, message: string): Promise<void> {
    try {
      await this.bot.sendMessage(chatId, message);
    } catch (err) {
      logger.error({ err });
    }
  }

  private async onCheck(): Promise<string[]> {
    const playtomic = new Playtomic(process.env.EMAIL, process.env.PASSWORD);
    const relevantTenants: Tenant[] = await playtomic.getRelevantTenants();
    for (const tenant of relevantTenants) {
      tenant.setAvailability(await playtomic.getAvailability(tenant, getTwoWeeksOfDates()));
    }

    const desiredSlots: SlotJson['start_time'][] = [
      '17:30:00',
      '18:00:00',
      '18:30:00',
      '19:00:00',
      '19:30:00',
      '20:00:00'
    ];

    const summaries = relevantTenants.map(t => t.summary(...desiredSlots));

    await fs.writeFile('./data/summary.txt', summaries.join('\n\n'));
    return summaries;
  }
}
