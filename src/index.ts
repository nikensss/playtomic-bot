import { promises as fs } from 'fs';
import { Playtomic } from './Playtomic';
import { Availability } from './types';

const main = async (): Promise<void> => {
  const playtomic = new Playtomic(process.env.EMAIL, process.env.PASSWORD);

  const relevant_tenants = await playtomic.getRelevantTenants();
  await fs.writeFile('data/relevant_tenants.json', JSON.stringify(relevant_tenants, null, 2));

  const availability: Availability[] = await playtomic.getAvailability();

  await fs.writeFile('data/availability.json', JSON.stringify(availability, null, 2));
};

main()
  .then(() => console.log('Done!'))
  .catch(console.error);
