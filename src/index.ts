import dayjs from 'dayjs';
import { promises as fs } from 'fs';
import { Playtomic } from './classes/Playtomic';
import { SlotJson } from './classes/Slot';
import { Tenant } from './classes/Tenant';

const getTwoWeeksOfDates = (): Date[] => {
  const dates: Date[] = [];
  for (let i = 0; i < 15; i += 1) {
    dates.push(dayjs().add(i, 'days').toDate());
  }
  return dates;
};

const main = async (): Promise<void> => {
  const playtomic = new Playtomic(process.env.EMAIL, process.env.PASSWORD);

  const relevantTenants: Tenant[] = await playtomic.getRelevantTenants();

  for (const tenant of relevantTenants) {
    tenant.setAvailability(await playtomic.getAvailability(tenant, getTwoWeeksOfDates()));
  }

  const desiredSlots: SlotJson['start_time'][] = ['17:00:00', '17:30:00'];
  const summary = relevantTenants.reduce((t, c) => {
    const summary = c.summariseAvailableCourtsWithSlotsAt(...desiredSlots);

    return `${t}\n${summary}`;
  }, '');

  await fs.writeFile('./data/summary.txt', summary);
};

main()
  .then(() => console.log('Done!'))
  .catch(console.error);
