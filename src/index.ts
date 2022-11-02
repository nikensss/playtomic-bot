import { logger } from './classes';
import { Telegram } from './classes/Telegram';

const main = async (): Promise<void> => {
  new Telegram(process.env.TELEGRAM_BOT_TOKEN).init();
};

main().catch(err => logger.error({ err }));
