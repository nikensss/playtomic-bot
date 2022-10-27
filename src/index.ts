import { request } from 'undici';
import { promises as fs } from 'fs';
import { Availability, Tenant } from './types';

const RELEVANT_TENANTS = {
  PADEL_CITY: '19dd692d-32d8-4e22-8a25-989a00b2695f',
  ALLROUND_PADEL: 'cc65e668-bba9-42f6-8629-31c607c1b899',
  PLAZA_PADEL: '0bd51db2-7d73-4748-952e-2b628e4e7679'
};

const main = async (): Promise<void> => {
  await fs.mkdir('./data', { recursive: true });

  const login = await request('https://playtomic.io/api/v3/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: process.env.EMAIL,
      password: process.env.PASSWORD
    }),
    headers: { 'content-type': 'application/json' }
  });

  const { access_token } = await login.body.json();

  const tenants: Tenant[] = await (
    await request('https://playtomic.io/api/v1/tenants', {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${access_token}`
      },
      query: {
        user_id: 'me',
        playtomic_status: 'active',
        with_properties: 'ALLOWS_CASH_PAYMENT',
        coordinate: '51.99556897,4.36451191,Delft',
        sport_id: 'PADEL',
        radiu: 50000,
        size: 40
      }
    })
  ).body.json();

  const relevantTenants = tenants.filter(t => Object.values(RELEVANT_TENANTS).includes(t.tenant_id));

  await fs.writeFile('data/tenants.json', JSON.stringify(tenants, null, 2));
  await fs.writeFile('data/relevant_tenants.json', JSON.stringify(relevantTenants, null, 2));

  const availability: Availability[] = await (
    await request('https://playtomic.io/api/v1/availability', {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${access_token}`
      },
      query: {
        user_id: 'me',
        local_start_min: '2022-10-31T00:00:00',
        local_start_max: '2022-10-31T23:59:59',
        sport_id: 'PADEL',
        tenant_id: Object.values(RELEVANT_TENANTS).join(',')
      }
    })
  ).body.json();

  await fs.writeFile('data/availability.json', JSON.stringify(availability, null, 2));
};

main()
  .then(() => console.log('Done!'))
  .catch(console.error);
