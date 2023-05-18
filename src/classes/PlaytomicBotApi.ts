import { request } from 'undici';
import jwt from 'jsonwebtoken';
import { User } from 'node-telegram-bot-api';
import { z } from 'zod';

const isPlaytomicBotApiAvailabilityResponse = z
  .object({
    name: z.string(),
    courts: z
      .object({
        name: z.string(),
        type: z.string(),
        availability: z
          .object({
            startDate: z.string(),
            slots: z
              .object({
                startTime: z.string(),
                duration: z.number(),
                link: z.string()
              })
              .array()
          })
          .array()
      })
      .array()
  })
  .array();

export type PlaytomicBotApiAvailabilityResponse = z.infer<typeof isPlaytomicBotApiAvailabilityResponse>;
export type Courts = PlaytomicBotApiAvailabilityResponse[number]['courts'];
export type Availability = Courts[number]['availability'];
export type Slots = Availability[number]['slots'];

const isPlaytomicBotApiClub = z
  .object({
    tenant_id: z.string(),
    tenant_name: z.string(),
    address: z.object({
      street: z.string(),
      postal_code: z.string(),
      city: z.string(),
      country: z.string()
    })
  })
  .array();
export type PlaytomicBotApiClubsResponse = z.infer<typeof isPlaytomicBotApiClub>;
export type PlaytomicBotApiClub = PlaytomicBotApiClubsResponse[number];

export type SummarizedClub = { title: string; id: string };

export class PlaytomicBotApi {
  private url: string;
  private secret: string;
  private authorization: string;

  constructor(user: User) {
    const [url, secret] = [process.env.PLAYTOMIC_BOT_API, process.env.JWT_SECRET];
    if (!url) throw new Error('Missing Playtomic Bot API URL');
    if (!secret) throw new Error('Missing JWT secret');

    this.url = url;
    this.secret = secret;
    this.authorization = `Bearer ${jwt.sign(user, this.secret, { algorithm: 'HS512' })}`;
  }

  async availability(): Promise<string[]> {
    const authorization = this.authorization;
    const response = await request(`${this.url}/playtomic/availability`, { headers: { authorization } });
    const availability = isPlaytomicBotApiAvailabilityResponse.parse(await response.body.json());

    if (!availability?.length) return ['No availability found'];

    return availability.map(({ name, courts }) => {
      const stringifiedCourts = courtsToString(courts);
      if (stringifiedCourts) return `${name}:\n${courtsToString(courts) || '💩'}`;
      return `${name}: 💩`;
    });
  }

  async findClub(name: string): Promise<SummarizedClub[]> {
    const response = await request(`${this.url}/playtomic/clubs`, { query: { name } });
    return (await response.body.json()).map(toSummarizedClub);
  }

  async getClubInfo(clubId: string): Promise<SummarizedClub> {
    const authorization = this.authorization;
    const response = await request(`${this.url}/playtomic/clubs/${clubId}`, { headers: { authorization } });
    return toSummarizedClub(await response.body.json());
  }

  async getPreferredClubs(): Promise<string[]> {
    const authorization = this.authorization;
    const response = await request(`${this.url}/users/preferred-clubs`, { headers: { authorization } });
    return await response.body.json();
  }

  async addPreferredClub(clubId: string): Promise<boolean> {
    const { statusCode } = await request(`${this.url}/users/preferred-clubs`, {
      method: 'POST',
      body: JSON.stringify({ clubId }),
      headers: { authorization: this.authorization, 'content-type': 'application/json' }
    });

    return 200 <= statusCode && statusCode < 300;
  }

  async deletePreferredClub(clubId: string): Promise<boolean> {
    const { statusCode } = await request(`${this.url}/users/preferred-clubs`, {
      method: 'DELETE',
      body: JSON.stringify({ clubId }),
      headers: { authorization: this.authorization, 'content-type': 'application/json' }
    });

    return 200 <= statusCode && statusCode < 300;
  }

  async getPreferredTimes(): Promise<string[]> {
    const authorization = this.authorization;
    const response = await request(`${this.url}/users/preferred-times`, { headers: { authorization } });
    return await response.body.json();
  }

  async addPreferredTime(time: string): Promise<boolean> {
    const { statusCode } = await request(`${this.url}/users/preferred-times`, {
      method: 'POST',
      body: JSON.stringify({ time }),
      headers: { authorization: this.authorization, 'content-type': 'application/json' }
    });

    return 200 <= statusCode && statusCode < 300;
  }

  async deletePreferredTime(time: string): Promise<boolean> {
    const { statusCode } = await request(`${this.url}/users/preferred-times`, {
      method: 'DELETE',
      body: JSON.stringify({ time }),
      headers: { authorization: this.authorization, 'content-type': 'application/json' }
    });

    return 200 <= statusCode && statusCode < 300;
  }
}

const toSummarizedClub = ({ tenant_id, tenant_name, address }: PlaytomicBotApiClub): SummarizedClub => {
  const fullAddress = `${address.street}, ${address.postal_code}, ${address.city}, ${address.country}`;
  return { title: `${tenant_name.trim()}: ${fullAddress}`, id: tenant_id };
};

const slotsToString = (slots: Slots): string => {
  const timeToDurations = new Map<string, string[]>();
  for (const slot of slots) {
    const durations = timeToDurations.get(slot.startTime) || [];
    const durationWithLink = `<a href="${slot.link}">${slot.duration}</a>`;
    timeToDurations.set(slot.startTime, [...durations, durationWithLink]);
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
