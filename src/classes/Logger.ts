import pino from 'pino';

class Logger {
  private log;

  constructor(optionsOrStream?: pino.LoggerOptions) {
    this.log = pino(optionsOrStream);
  }

  info(obj: unknown | string, msg?: string, ...args: unknown[]): void {
    this.log.info(obj, msg, ...args);
  }

  error(obj: unknown | string, msg?: string, ...args: unknown[]): void {
    this.log.error(obj, msg, ...args);
  }
}

export const logger = new Logger({
  ...(process.env.NODE_ENV === 'development' ? { transport: { target: 'pino-pretty' } } : {})
});
