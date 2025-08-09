import type { DashboardData, Project, Ticket } from './types';

export async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

const BASE = import.meta.env.BASE_URL || '/portal/';

export const Api: {
  dashboard: () => Promise<DashboardData>;
  projects: () => Promise<Project[]>;
  tickets: () => Promise<Ticket[]>;
} = {
  dashboard: () => getJSON<DashboardData>(new URL('api/dashboard.json', BASE).pathname),
  projects: () => getJSON<Project[]>(new URL('api/projects.json', BASE).pathname),
  tickets: () => getJSON<Ticket[]>(new URL('api/tickets.json', BASE).pathname),
};


