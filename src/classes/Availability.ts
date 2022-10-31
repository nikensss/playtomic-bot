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

  get id(): AvailabilityJson['resource_id'] {
    return this.availabilityJson.resource_id;
  }

  get startDate(): AvailabilityJson['start_date'] {
    return this.availabilityJson.start_date;
  }

  isWeekend(): boolean {
    return ['saturday', 'sunday'].includes(dayjs(this.startDate).format('dddd').toLowerCase());
  }

  isAvailableAt(...times: SlotJson['start_time'][]): boolean {
    return this.getSlots().some(s => s.startsAt(...times) && s.isLongEnough());
  }

  keepSlotsAt(...times: SlotJson['start_time'][]): void {
    const slots = this.isWeekend() ? [] : this.getSlots();
    this.setSlots(slots.filter(s => s.startsAt(...times) && s.isLongEnough()));
  }

  getSlots(): Slot[] {
    return clone(this.slots);
  }

  setSlots(slots: Slot[]): void {
    this.slots = clone(slots);
  }

  toString(prefix = ''): string {
    const slots = this.getSlots().map(s => s.toString(`${prefix}\t`));
    return `${prefix}${this.startDate}:\n${slots.join('\n')}`;
  }

  get json(): AvailabilityJson {
    return clone(this.availabilityJson);
  }
}
