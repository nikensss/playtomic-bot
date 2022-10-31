import clone from 'clone';
import { Availability } from './Availability';
import { SlotJson } from './Slot';
import { SportID } from './Tenant';

export interface Resource {
  resource_id: string;
  name: string;
  description: string;
  sport_id: SportID;
  reservation_priority: number;
  is_active: boolean;
  merchant_resource_id: null | string;
  properties: ResourceProperties;
  booking_settings: ResourceBookingSettings | null;
}

export interface ResourceBookingSettings {
  start_time_policy: StartTimePolicy;
  allowed_duration_increments: number[];
  is_bookable_online: boolean;
  allows_onsite_payment: boolean;
  shared_resources: unknown[];
}

export enum StartTimePolicy {
  Any = 'ANY'
}

export interface ResourceProperties {
  resource_type: ResourceType;
  resource_size: ResourceSize;
  resource_feature?: ResourceFeature;
}

export enum ResourceFeature {
  Crystal = 'crystal',
  Panoramic = 'panoramic',
  Quick = 'quick',
  SyntheticGrass = 'synthetic_grass',
  Wall = 'wall'
}

export enum ResourceSize {
  Double = 'double',
  Single = 'single'
}

export enum ResourceType {
  Indoor = 'indoor',
  Outdoor = 'outdoor'
}
export class Court {
  private resource: Resource;

  private availability: Availability[] = [];

  constructor(resource: Resource) {
    this.resource = clone(resource);
  }

  get id(): Resource['resource_id'] {
    return this.resource.resource_id;
  }

  get name(): Resource['name'] {
    return this.resource.name;
  }

  isIndoor(): boolean {
    return this.resource.properties.resource_type === 'indoor';
  }

  setAvailability(availability: Availability[]): void {
    this.availability = availability.filter(a => a.id === this.id).map(e => clone(e));
  }

  getAvailability(): Availability[] {
    return this.availability.map(e => clone(e));
  }

  isAvailableAt(...times: SlotJson['start_time'][]): boolean {
    return this.availability.some(a => a.isAvailableAt(...times));
  }

  keepAvailabilitiesWithSlotsAt(...times: SlotJson['start_time'][]): void {
    const availabilities = this.getAvailability().filter(a => a.isAvailableAt(...times));
    availabilities.forEach(a => a.keepSlotsAt(...times));

    this.setAvailability(availabilities);
  }
}
