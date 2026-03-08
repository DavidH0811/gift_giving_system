import { Activity, GiftRecord, Guest } from './types';

const API_BASE = 'http://localhost:5000/api';

export const api = {
  getActivities: async (): Promise<Activity[]> => {
    const res = await fetch(`${API_BASE}/activities`);
    if (!res.ok) throw new Error('Failed to fetch activities');
    return res.json();
  },
  createActivity: async (data: Partial<Activity>): Promise<Activity> => {
    const res = await fetch(`${API_BASE}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create activity');
    return res.json();
  },
  getRecords: async (): Promise<GiftRecord[]> => {
    const res = await fetch(`${API_BASE}/records`);
    if (!res.ok) throw new Error('Failed to fetch records');
    return res.json();
  },
  createRecord: async (data: Partial<GiftRecord>): Promise<GiftRecord> => {
    const res = await fetch(`${API_BASE}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create record');
    return res.json();
  },
  updateRecord: async (id: string, data: Partial<GiftRecord>): Promise<GiftRecord> => {
    const res = await fetch(`${API_BASE}/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update record');
    return res.json();
  },
  getGuests: async (): Promise<Guest[]> => {
    const res = await fetch(`${API_BASE}/guests`);
    if (!res.ok) throw new Error('Failed to fetch guests');
    return res.json();
  }
};
