import clone from 'clone';
import { Availability } from './Availability';
import { Court, Resource } from './Court';
import { SlotRaw } from './Slot';

export interface TenantRaw {
  default_currency: DefaultCurrency;
  tenant_id: string;
  tenant_uid: string;
  tenant_type: TenantType;
  tenant_status: Status;
  tenant_name: string;
  address: Address;
  images: string[];
  image_data?: ImageDatum[];
  properties: TentantsResponseProperties;
  resources: Resource[];
  booking_type: BookingType;
  playtomic_status: Status;
  is_playtomic_partner: boolean;
  default_cancelation_policy?: DefaultCancelationPolicy;
  opening_hours: OpeningHours;
  vat_rate: number;
  communications_language: CommunicationsLanguage;
  onboarding_status: OnboardingStatus;
  booking_settings?: TentantsResponseBookingSettings;
  sport_ids: SportID[];
  tenant_hostname: TenantName;
  cancelation_policies: CancelationPolicy[];
  url: string;
  google_place_id?: string;
  shared_secret?: string;
  tenant_short_name?: TenantName;
}

export interface Address {
  street: string;
  postal_code: string;
  city: string;
  sub_administrative_area: string;
  administrative_area: string;
  country: Country;
  country_code: CountryCode;
  coordinate: Coordinate;
  timezone: Timezone;
}

export interface Coordinate {
  lat: number;
  lon: number;
}

export enum Country {
  Netherlands = 'Netherlands'
}

export enum CountryCode {
  Nl = 'NL'
}

export enum Timezone {
  EuropeAmsterdam = 'Europe/Amsterdam'
}

export interface TentantsResponseBookingSettings {
  booking_ahead_limit: number;
  max_consecutive_bookable_time: number;
  max_bookable_time_per_day: number;
  max_number_of_active_bookings: number | null;
  max_number_of_bookings_per_day: number | null;
}

export enum BookingType {
  Public = 'PUBLIC'
}

export interface CancelationPolicy {
  sport_id: SportID;
  duration: DefaultCancelationPolicy;
  sport_ids: SportID[];
}

export interface DefaultCancelationPolicy {
  amount: number;
  unit: Unit;
}

export enum Unit {
  Hours = 'HOURS'
}

export enum SportID {
  Padel = 'PADEL',
  Squash = 'SQUASH',
  Tennis = 'TENNIS'
}

export enum CommunicationsLanguage {
  En = 'en',
  EnUS = 'en_US'
}

export enum DefaultCurrency {
  Eur = 'EUR'
}

export interface ImageDatum {
  image_id: string;
  url: string;
  client_type: ClientType;
}

export enum ClientType {
  Mobile = 'MOBILE',
  Web = 'WEB'
}

export enum OnboardingStatus {
  Finished = 'FINISHED'
}

export interface OpeningHours {
  SATURDAY: Friday;
  SUNDAY: Friday;
  THURSDAY: Friday;
  TUESDAY: Friday;
  FRIDAY: Friday;
  MONDAY: Friday;
  WEDNESDAY: Friday;
  HOLIDAYS?: Friday;
}

export interface Friday {
  opening_time: string;
  closing_time: string;
}

export enum Status {
  Active = 'ACTIVE'
}

export interface TentantsResponseProperties {
  [key: string]: unknown;
}

export enum TenantName {
  Anemone = 'anemone',
  Clubpadelrive = 'clubpadelrive',
  Nieuwesloot = 'nieuwesloot'
}

export enum TenantType {
  Anemone = 'ANEMONE',
  Syltekcrm = 'SYLTEKCRM'
}

export class Tenant {
  public static readonly RELEVANT_TENANTS = {
    PADEL_CITY: '19dd692d-32d8-4e22-8a25-989a00b2695f',
    ALLROUND_PADEL: 'cc65e668-bba9-42f6-8629-31c607c1b899',
    PLAZA_PADEL: '0bd51db2-7d73-4748-952e-2b628e4e7679'
  } as const;

  private tenantRaw: TenantRaw;
  private courts: Court[] = [];

  constructor(tenantRaw: TenantRaw) {
    this.tenantRaw = clone(tenantRaw);
    this.courts = this.tenantRaw.resources.map(r => new Court(r));
  }

  get id(): TenantRaw['tenant_id'] {
    return this.tenantRaw.tenant_id;
  }

  get name(): TenantRaw['tenant_name'] {
    return this.tenantRaw.tenant_name;
  }

  isRelevant(): boolean {
    const relevant_tenant_ids: string[] = Object.values(Tenant.RELEVANT_TENANTS);
    return relevant_tenant_ids.includes(this.tenantRaw.tenant_id);
  }

  get raw(): TenantRaw {
    return clone(this.tenantRaw);
  }

  setAvailability(availability: Availability[]): void {
    for (const court of this.courts) {
      court.setAvailability(availability.filter(a => a.id === court.id));
    }
  }

  getAvailableCourtsWithSlotsAt(...times: SlotRaw['start_time'][]): Court[] {
    const courts = clone(this.courts.filter(c => c.isIndoor() && c.isAvailableAt(...times)));
    courts.forEach(c => c.keepAvailabilitiesWithSlotsAt(...times));

    return courts;
  }

  summariseAvailableCourtsWithSlotsAt(...times: SlotRaw['start_time'][]): string {
    const courts = this.getAvailableCourtsWithSlotsAt(...times);

    const summary = [this.name];

    for (const court of courts) {
      summary.push(`\t${court.name}:`);
      for (const availability of court.getAvailability()) {
        summary.push(`\t\t${availability.toString()}`);
      }
    }

    if (summary.length === 1) return `${this.name}: 💩`;

    return summary.join('\n');
  }
}
