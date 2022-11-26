import { request } from 'undici';
import jwt from 'jsonwebtoken';
import { User } from 'node-telegram-bot-api';

export type PlaytomicBotApiAvailabilityResponse = {
  name: string;
  courts: {
    name: string;
    type: string;
    availability: {
      startDate: string;
      slots: {
        startTime: string;
        duration: number;
      }[];
    }[];
  }[];
}[];

type Courts = PlaytomicBotApiAvailabilityResponse[number]['courts'];
type Availability = Courts[number]['availability'];
type Slots = Availability[number]['slots'];

export class PlaytomicBotApi {
  private url: string;
  private secret: string;

  constructor(url: string, secret: string) {
    this.url = url;
    this.secret = secret;
  }

  async availability(user: User): Promise<string[]> {
    const authorization = `Bearer ${jwt.sign(user, this.secret, { algorithm: 'HS512' })}`;
    const response = await request(`${this.url}/playtomic/availability`, { headers: { authorization } });
    const availability = (await response.body.json()) as PlaytomicBotApiAvailabilityResponse;

    return availability.map(({ name, courts }) => {
      const stringifiedCourts = courtsToString(courts);
      if (stringifiedCourts) return `${name}:\n${courtsToString(courts) || '💩'}`;
      return `${name}: 💩`;
    });
  }
}

const slotsToString = (slots: Slots): string => {
  const timeToDurations = new Map<string, number[]>();
  for (const slot of slots) {
    const durations = timeToDurations.get(slot.startTime) || [];
    timeToDurations.set(slot.startTime, [...durations, slot.duration]);
  }

  return [...timeToDurations.entries()]
    .map(([startTime, durations]) => `      ${startTime} (${durations.join(', ')})`)
    .join('\n');
};

const availabilitiesToString = (availabilities: Availability): string => {
  return availabilities.map(a => `    ${a.startDate}:\n${slotsToString(a.slots)}`).join('\n');
};

const courtsToString = (courts: Courts): string => {
  return courts.map(c => `  ${c.name}:\n${availabilitiesToString(c.availability)}`).join('\n');
};
