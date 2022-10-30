import clone from 'clone';

export interface SlotRaw {
  start_time: `${string}:${string}:${string}`;
  duration: number;
  price: `${number} ${string}`;
}

export class Slot {
  private slotRaw: SlotRaw;

  constructor(slotRaw: SlotRaw) {
    this.slotRaw = clone(slotRaw);
  }

  get duration(): SlotRaw['duration'] {
    return this.slotRaw.duration;
  }

  isLongEnough(): boolean {
    return [90, 120].includes(this.slotRaw.duration);
  }

  startsAt(...times: SlotRaw['start_time'][]): boolean {
    return times.includes(this.slotRaw.start_time);
  }

  toString(): string {
    return `${this.slotRaw.start_time} (${this.duration})`;
  }
}
