import clone from 'clone';

export interface SlotRaw {
  start_time: `${string}:${string}:${string}`;
  duration: number;
  price: `${number} ${string}`;
}

export class Slot {
  private slot_raw: SlotRaw;

  constructor(slot_raw: SlotRaw) {
    this.slot_raw = clone(slot_raw);
  }

  get duration(): SlotRaw['duration'] {
    return this.slot_raw.duration;
  }

  isLongEnough(): boolean {
    return [90, 120].includes(this.slot_raw.duration);
  }

  startsAt(...times: SlotRaw['start_time'][]): boolean {
    return times.includes(this.slot_raw.start_time);
  }

  toString(): string {
    return `${this.slot_raw.start_time} (${this.duration})`;
  }
}
