export interface Tenant {
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

export enum TenantName {
  Anemone = 'anemone',
  Clubpadelrive = 'clubpadelrive',
  Nieuwesloot = 'nieuwesloot'
}

export enum TenantType {
  Anemone = 'ANEMONE',
  Syltekcrm = 'SYLTEKCRM'
}
