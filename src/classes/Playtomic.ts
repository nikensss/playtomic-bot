import child_process from 'child_process';
import dayjs from 'dayjs';
import jwt from 'jsonwebtoken';
import { request } from 'undici';
import { promisify } from 'util';
import { Availability, AvailabilityJson } from './Availability';
import { Tenant, TenantJson } from './Tenant';
import { promises as fs } from 'fs';

const exec = promisify(child_process.exec);

export class Playtomic {
  private access_token: string | undefined;

  constructor(private email?: string, private password?: string) {
    if (!email) throw new Error('Missing email for login');
    if (!password) throw new Error('Missing password for login');
  }

  private isAccessTokenExpired(): boolean {
    try {
      const { payload } = jwt.decode(this.access_token || '', { json: true }) || { payload: { exp: 0 } };
      return new Date((payload?.exp || 0) * 1000).getTime() <= Date.now();
    } catch {
      return false;
    }
  }

  async getAccessToken(): Promise<string> {
    if (!this.access_token) this.access_token = process.env.ACCESS_TOKEN;
    if (!this.access_token || !this.isAccessTokenExpired()) this.access_token = await this.login();

    return this.access_token;
  }

  private async login(): Promise<string> {
    const login = await request('https://playtomic.io/api/v3/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: this.email,
        password: this.password
      }),
      headers: { 'content-type': 'application/json' }
    });

    const { access_token } = await login.body.json();

    // replace the token or add it if it's not present in the .env file
    await exec(`cat .env | gsed -i -n -e '/^ACCESS_TOKEN=.*$/!p' -e '$aACCESS_TOKEN=${access_token}' .env`);

    return access_token;
  }

  async getTenants(): Promise<Tenant[]> {
    console.log('getting tenants...');
    const tenants: TenantJson[] = await (
      await request('https://playtomic.io/api/v1/tenants', {
        method: 'GET',
        headers: { 'content-type': 'application/json' },
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

    console.log('got tenants!');
    await fs.writeFile('./data/tenants.json', JSON.stringify(tenants, null, 2));

    return tenants.map(t => new Tenant(t));
  }

  async getRelevantTenants(): Promise<Tenant[]> {
    return (await this.getTenants()).filter(t => t.isRelevant());
  }

  async getAvailability(tenant: Tenant, dates: Date[]): Promise<Availability[]> {
    const availabilities: Availability[] = [];
    for (const date of dates) {
      console.log(`getting ${tenant.getName()} availability for ${dayjs(date).format('YYYY-MM-DD')}...`);
      const { body } = await request('https://playtomic.io/api/v1/availability', {
        method: 'GET',
        headers: { 'content-type': 'application/json' },
        query: {
          user_id: 'me',
          sport_id: 'PADEL',
          tenant_id: tenant.getId(),
          local_start_min: dayjs(date).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
          local_start_max: dayjs(date).endOf('day').format('YYYY-MM-DDTHH:mm:ss')
        }
      });

      const _availabilities = (await body.json()).map((e: AvailabilityJson) => new Availability(e));
      availabilities.push(..._availabilities);
    }

    await fs.writeFile('./data/availabilities.json', JSON.stringify(availabilities, null, 2));
    return availabilities;
  }
}
