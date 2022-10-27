export interface Availability {
  resource_id: string;
  start_date: Date;
  slots: Slot[];
}

export interface Slot {
  start_time: string;
  duration: number;
  price: `${number} ${string}`;
}
