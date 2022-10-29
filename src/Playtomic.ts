import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import { promisify } from 'util';
import child_process from 'child_process';
import { request } from 'undici';
import { Availability, Tenant } from './types';

const exec = promisify(child_process.exec);

export class Playtomic {
  private static RELEVANT_TENANTS = {
    PADEL_CITY: '19dd692d-32d8-4e22-8a25-989a00b2695f',
    ALLROUND_PADEL: 'cc65e668-bba9-42f6-8629-31c607c1b899',
    PLAZA_PADEL: '0bd51db2-7d73-4748-952e-2b628e4e7679'
  } as const;

  private access_token: string | undefined;

  constructor(private email?: string, private password?: string) {
    if (!email) throw new Error('Missing email for login');
    if (!password) throw new Error('Missing password for login');
  }

  private isRelevantTenant(tenant_id: string): boolean {
    const relevant_tenant_ids = Object.values(Playtomic.RELEVANT_TENANTS) as string[];
    return relevant_tenant_ids.includes(tenant_id);
  }

  private isAccessTokenExpired(): boolean {
    try {
      const { payload } = jwt.decode(this.access_token || '', { json: true }) || { payload: { exp: 0 } };
      return new Date((payload?.exp || 0) * 1000).getTime() <= Date.now();
    } catch {
      return false;
    }
  }

  private async getAccessToken(): Promise<string> {
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
    const tenants: Tenant[] = await (
      await request('https://playtomic.io/api/v1/tenants', {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${await this.getAccessToken()}`
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

    return tenants;
  }

  async getRelevantTenants(): Promise<Tenant[]> {
    return (await this.getTenants()).filter(t => this.isRelevantTenant(t.tenant_id));
  }

  async getAvailability(d = new Date()): Promise<Availability[]> {
    const availabilityResponse = await request('https://playtomic.io/api/v1/availability', {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${await this.getAccessToken()}`
      },
      query: {
        user_id: 'me',
        sport_id: 'PADEL',
        tenant_id: Object.values(Playtomic.RELEVANT_TENANTS).join(','),
        local_start_min: dayjs(d).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
        local_start_max: dayjs(d).endOf('day').format('YYYY-MM-DDTHH:mm:ss')
      }
    });

    return await availabilityResponse.body.json();
  }
}
