import clone from 'clone';
import dayjs from 'dayjs';
import { Slot, SlotJson } from './Slot';

export interface AvailabilityJson {
  resource_id: string;
  start_date: Date;
  slots: SlotJson[];
}

export class Availability {
  private availabilityJson: AvailabilityJson;
  private slots: Slot[];

  constructor(availabilityJson: AvailabilityJson) {
    this.availabilityJson = clone(availabilityJson);
    this.slots = this.availabilityJson.slots.map(slotJson => new Slot(slotJson));
  }

  getId(): AvailabilityJson['resource_id'] {
    return this.availabilityJson.resource_id;
  }

  getStartDate(): AvailabilityJson['start_date'] {
    return this.availabilityJson.start_date;
  }

  getDayName(): string {
    return dayjs(this.getStartDate()).format('dddd').toLowerCase();
  }

  isAvailableAt(...times: SlotJson['start_time'][]): boolean {
    return this.getSlots().some(s => s.startsAt(...times) && s.isLongEnough());
  }

  keepSlotsAt(...times: SlotJson['start_time'][]): void {
    const slots = this.getSlots().filter(s => s.startsAt(...times) && s.isLongEnough());
    this.setSlots(slots);
  }

  getSlots(): Slot[] {
    return clone(this.slots);
  }

  setSlots(slots: Slot[]): void {
    this.slots = clone(slots);
  }

  toString(indentationLevel = 0): string {
    const prefix = '\t'.repeat(indentationLevel);
    const slots = this.getSlots().map(s => s.toString(indentationLevel + 1));
    return `${prefix}${this.getStartDate()}:\n${slots.join('\n')}`;
  }
}
