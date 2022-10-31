import clone from 'clone';
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

  get id(): AvailabilityJson['resource_id'] {
    return this.availabilityJson.resource_id;
  }

  get startDate(): AvailabilityJson['start_date'] {
    return this.availabilityJson.start_date;
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

  toString(): string {
    const slots = this.getSlots().map(s => s.toString());
    return `${this.startDate}: ${slots.join(', ')}`;
  }

  get json(): AvailabilityJson {
    return clone(this.availabilityJson);
  }
}
