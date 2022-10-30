import clone from 'clone';
import { Slot, SlotRaw } from './Slot';

export interface AvailabilityRaw {
  resource_id: string;
  start_date: Date;
  slots: SlotRaw[];
}

export class Availability {
  private availabilityRaw: AvailabilityRaw;
  private slots: Slot[];

  constructor(availabilityRaw: AvailabilityRaw) {
    this.availabilityRaw = clone(availabilityRaw);
    this.slots = this.availabilityRaw.slots.map(slotRaw => new Slot(slotRaw));
  }

  get id(): AvailabilityRaw['resource_id'] {
    return this.availabilityRaw.resource_id;
  }

  get start_date(): AvailabilityRaw['start_date'] {
    return this.availabilityRaw.start_date;
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
    return clone(this.availabilityRaw);
  }
}
