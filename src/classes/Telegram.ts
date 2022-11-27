import TelegramBot, { Message, User, ChatId } from 'node-telegram-bot-api';
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
    this.bot.onText(/\/id/, msg => this.sendMessage(msg.chat.id, `${msg.chat.id}`));
    this.bot.onText(/\/ping/, msg => this.sendMessage(msg.chat.id, 'pong'));
    this.bot.onText(/\/courts/, msg => this.courts(msg));
    this.bot.onText(/\/add-club /, msg => this.addClub(msg));
    this.bot.onText(/\/show-clubs/, msg => this.showClubs(msg));

    this.bot.on('callback_query', async msg => this.callbackQuery(msg));

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

  async sendMessage(chatId: ChatId, message: string): Promise<void> {
    try {
      await this.bot.sendMessage(chatId, message);
    } catch (err) {
      logger.error({ err });
    }
  }

  private toCallbackData(origin: string, data: string): string {
    return `${origin}|${data}`;
  }

  private fromCallbackData(callbackData?: string): { origin: string; data: string } {
    if (!callbackData) return { origin: '', data: '' };
    const [origin, ...data] = callbackData.split('|');
    return { origin: origin || '', data: data.join('|') || '' };
  }

  private async callbackQuery(msg: TelegramBot.CallbackQuery): Promise<void> {
    const { origin, data } = this.fromCallbackData(msg.data);
    switch (origin) {
      case 'add-club':
        await this.addClubCallbackQuery(msg, data);
        break;
      default:
        logger.error({ err: new Error(`Unknown origin on callback query: ${origin}`), msg });
    }
  }

  private async courts(msg: Message): Promise<void> {
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
    return await new PlaytomicBotApi(user).availability();
  }

  private async showClubs(msg: Message): Promise<void> {
    const user = msg.from;
    if (!user) throw new Error('User info missing');

    const playtomicBotApi = new PlaytomicBotApi(user);
    const clubIds = await playtomicBotApi.getPreferredClubs();
    const clubs = await Promise.all(clubIds.map(c => playtomicBotApi.getClubInfo(c)));

    await this.bot.sendMessage(msg.chat.id, `You have ${clubs.length} favorite clubs:`);
    await Promise.all(clubs.map(c => this.bot.sendMessage(msg.chat.id, c.title)));
  }

  private async addClub(msg: Message): Promise<void> {
    const [name, user] = [msg.text?.replace(/^\/add-club (.*)$/, '$1'), msg.from];

    if (!user) throw new Error('User info missing');
    if (!name) throw new Error('Missing name');

    const clubs = await new PlaytomicBotApi(user).findClub(name);
    const inline_keyboard = clubs.map(c => [{ text: c.title, callback_data: this.toCallbackData('add-club', c.id) }]);

    await this.bot.sendMessage(msg.chat.id, 'Please, select a club:', { reply_markup: { inline_keyboard } });
  }

  private async addClubCallbackQuery(msg: TelegramBot.CallbackQuery, data: string): Promise<void> {
    const user = msg.from;
    if (!user) return logger.error({ err: new Error(`Cannot identify user!`), msg });
    if (!data) return logger.error({ err: new Error('Mising club ID!'), msg, data });

    const club = await new PlaytomicBotApi(user).getClubInfo(data);
    await this.bot.editMessageText(`Ok, I'm saving ${club.title}`, {
      chat_id: msg.message?.chat.id,
      message_id: msg.message?.message_id
    });

    const saved = await new PlaytomicBotApi(user).saveClub(club.id);

    const chatId = msg.message?.chat.id;
    if (!chatId) return logger.error({ err: new Error('Missing chat ID in message info'), msg });

    if (saved) return void (await this.bot.sendMessage(chatId, 'Saved!'));
    return void (await this.bot.sendMessage(chatId, 'I could not save it, sorry... 😢'));
  }

  private async showClubs(msg: Message): Promise<void> {
    const user = msg.from;
    if (!user) throw new Error('User info missing');

    const playtomicBotApi = new PlaytomicBotApi(user);
    const clubIds = await playtomicBotApi.getPreferredClubs();
    const clubs = await Promise.all(clubIds.map(c => playtomicBotApi.getClubInfo(c)));

    await this.bot.sendMessage(msg.chat.id, `You have ${clubs.length} favorite clubs:`);
    await Promise.all(clubs.map(c => this.bot.sendMessage(msg.chat.id, c.title)));
  }
}
