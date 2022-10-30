import clone from 'clone';
import { Slot, SlotRaw } from './Slot';

export interface AvailabilityRaw {
  resource_id: string;
  start_date: Date;
  slots: SlotRaw[];
}

export class Availability {
  private availability_raw: AvailabilityRaw;
  private slots: Slot[];

  constructor(availability_raw: AvailabilityRaw) {
    this.availability_raw = clone(availability_raw);
    this.slots = this.availability_raw.slots.map(slow_raw => new Slot(slow_raw));
  }

  get id(): AvailabilityRaw['resource_id'] {
    return this.availability_raw.resource_id;
  }

  get start_date(): AvailabilityRaw['start_date'] {
    return this.availability_raw.start_date;
  }

  isAvailableAt(...times: SlotRaw['start_time'][]): boolean {
    return this.slots.some(s => s.startsAt(...times) && s.isLongEnough());
  }

  keepSlotsAt(...times: SlotRaw['start_time'][]): void {
    this.slots = this.slots.filter(s => s.startsAt(...times) && s.isLongEnough());
  }

  getSlots(): Slot[] {
    return clone(this.slots);
  }

  toString(): string {
    const slots = this.getSlots()
      .map(s => s.toString())
      .join(', ');

    return `${this.start_date}: ${slots}`;
  }

  get raw(): AvailabilityRaw {
    return clone(this.availability_raw);
  }
}
