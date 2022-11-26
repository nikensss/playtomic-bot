import TelegramBot, { User } from 'node-telegram-bot-api';
import { logger } from '.';
import { PlaytomicBotApi } from './PlaytomicBotApi';

export class Telegram {
  private token: string;
  private bot: TelegramBot;

  constructor(token?: string) {
    if (!token) throw new Error('Invalid token');

    this.token = token;
    this.bot = new TelegramBot(this.token, { polling: true });
  }

  init(): this {
    this.bot.onText(/\/courts/, msg => this.courts(msg));


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

  private async courts(msg: TelegramBot.Message): Promise<void> {
    try {
      logger.info({ msg });
      const user = msg.from;
      if (!user) throw new Error('User info missing in message');

      await this.bot.sendMessage(msg.chat.id, 'Let me check for you, just a moment...');
      const messages = (await this.getCourtsAvailability(user)).map(s => this.bot.sendMessage(msg.chat.id, s));

      await Promise.all(messages);
    } catch (err) {
      logger.error({ err });
      await this.sendError(err, msg);
    }
  }

  private async getCourtsAvailability(user: User): Promise<string[]> {
    const [url, secret] = [process.env.PLAYTOMIC_BOT_API, process.env.JWT_SECRET];
    if (!url) throw new Error('Missing Playtomic Bot API URL');
    if (!secret) throw new Error('Missing JWT secret');

    return await new PlaytomicBotApi(url, secret).availability(user);
  }
}
