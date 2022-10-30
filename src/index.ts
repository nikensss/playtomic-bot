import dayjs from 'dayjs';
import { promises as fs } from 'fs';
import { Playtomic } from './classes/Playtomic';
import { SlotRaw } from './classes/Slot';
import { Tenant } from './classes/Tenant';

const getTwoWeeksOfDates = (): Date[] => {
  const dates: Date[] = [];
  for (let i = 1; i < 15; i += 1) {
    dates.push(dayjs().add(i, 'days').toDate());
  }
  return dates;
};

const main = async (): Promise<void> => {
  const playtomic = new Playtomic(process.env.EMAIL, process.env.PASSWORD);

  const relevant_tenants: Tenant[] = await playtomic.getRelevantTenants();

  for (const tenant of relevant_tenants) {
    tenant.setAvailability(await playtomic.getAvailability(tenant, getTwoWeeksOfDates()));
  }

  const desiredSlots: SlotRaw['start_time'][] = ['17:00:00', '17:30:00'];
  const summary = relevant_tenants.reduce((t, c) => {
    const summary = c.summariseAvailableCourtsWithSlotsAt(...desiredSlots);

    return `${t}\n${summary}`;
  }, '');

  await fs.writeFile('./data/summary.txt', summary);
};

main()
  .then(() => console.log('Done!'))
  .catch(console.error);
