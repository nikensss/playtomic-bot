import clone from 'clone';

export interface SlotJson {
  start_time: `${string}:${string}:${string}`;
  duration: number;
  price: `${number} ${string}`;
}

export class Slot {
  private slotJson: SlotJson;

  constructor(slotJson: SlotJson) {
    this.slotJson = clone(slotJson);
  }

  get duration(): SlotJson['duration'] {
    return this.slotJson.duration;
  }

  isLongEnough(): boolean {
    return this.slotJson.duration >= 90;
  }

  startsAt(...times: SlotJson['start_time'][]): boolean {
    return times.includes(this.slotJson.start_time);
  }

  toString(indentationLevel = 0): string {
    const prefix = '\t'.repeat(indentationLevel);
    return `${prefix}${this.slotJson.start_time} (${this.duration})`;
  }
}
