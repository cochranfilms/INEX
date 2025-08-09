import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Api } from './api';
import { CALENDAR_URL, BRAND } from './config';
import type { DashboardData, Project, Ticket } from './types';

function useHashRoute(): [string, (hash: string) => void] {
  const [route, setRoute] = useState<string>(() => (window.location.hash || '#/dashboard'));
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/dashboard');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const set = (hash: string) => {
    if (!hash.startsWith('#')) hash = '#' + hash;
    window.location.hash = hash;
  };
  return [route, set];
}

export async function exportNodeToPDF(node: HTMLElement, fileName: string) {
  const rect = node.getBoundingClientRect();
  const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: rect.width, height: rect.height });
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({ orientation: rect.width >= rect.height ? 'l' : 'p', unit: 'pt', format: [rect.width, rect.height] });
  pdf.addImage(imgData, 'JPEG', 0, 0, rect.width, rect.height);
  pdf.save(fileName);
}

export default function INEXPortalPreview() {
  const [route] = useHashRoute();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    Api.dashboard().then((d: DashboardData) => setDashboard(d)).catch(() => setDashboard({ sites: 0, roomsThisWeek: 0, ticketsOpen: 0 }));
    Api.projects().then((p: Project[]) => setProjects(p)).catch(() => setProjects([]));
    Api.tickets().then((t: Ticket[]) => setTickets(t)).catch(() => setTickets([]));
  }, []);

  const chartData = useMemo(() => (
    [
      { name: 'Mon', rooms: 2, tickets: 1 },
      { name: 'Tue', rooms: 1, tickets: 2 },
      { name: 'Wed', rooms: 3, tickets: 1 },
      { name: 'Thu', rooms: 1, tickets: 2 },
      { name: 'Fri', rooms: 1, tickets: 1 },
    ]
  ), []);

  const ticketPie = useMemo(() => {
    const byStatus: Record<string, number> = {};
    tickets.forEach(t => { byStatus[t.status] = (byStatus[t.status] || 0) + 1; });
    return Object.entries(byStatus).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  const COLORS = ['#A62E3F', '#FFB200', '#22C55E', '#3B82F6', '#8B5CF6'];

  function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
    const active = route === to;
    return (
      <a href={to} className={`block px-3 py-2 rounded-md font-semibold ${active ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'}`}>
        {children}
      </a>
    );
  }

  function Toolbar() {
    return (
      <div className="flex items-center justify-between gap-3 p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <img src={BRAND.logo} alt={BRAND.name} className="h-8 w-8 rounded" />
          <span className="font-extrabold text-lg text-gray-900 dark:text-gray-100">{BRAND.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <a className="btn-ghost" href="/" rel="noreferrer">INEX Home</a>
          <a className="btn-secondary" href={CALENDAR_URL} target="_blank" rel="noreferrer">Schedule a Walkthrough</a>
          <button className="btn-ghost" onClick={() => setIsDark(v => !v)}>{isDark ? 'Light' : 'Dark'}</button>
        </div>
      </div>
    );
  }

  function DashboardView() {
    return (
      <section className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Active Sites" value={dashboard?.sites ?? '—'} />
          <StatCard title="Rooms This Week" value={dashboard?.roomsThisWeek ?? '—'} />
          <StatCard title="Open Tickets" value={dashboard?.ticketsOpen ?? '—'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Rooms Completed">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
                  <defs>
                    <linearGradient id="colorRooms" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A62E3F" stopOpacity={0.7}/>
                      <stop offset="95%" stopColor="#A62E3F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="rooms" stroke="#A62E3F" fillOpacity={1} fill="url(#colorRooms)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Tickets by Status">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ticketPie} dataKey="value" nameKey="name" outerRadius={80} label>
                    {ticketPie.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => exportNodeToPDF(mainRef.current as HTMLElement, 'INEX-Dashboard.pdf')}>Export PDF</button>
          <button className="btn-ghost" onClick={() => exportNodeToPDF(mainRef.current as HTMLElement, 'INEX-Portal-Press-OnePager.pdf')}>Export Press One-Pager</button>
        </div>
      </section>
    );
  }

  function ProjectsView() {
    return (
      <section className="p-6 space-y-4">
        <Card title="Active Projects">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="p-2">Project</th>
                  <th className="p-2">Site</th>
                  <th className="p-2">Phase</th>
                  <th className="p-2">Owner</th>
                  <th className="p-2">Due</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} className="border-t border-gray-200 dark:border-gray-800">
                    <td className="p-2 font-semibold">{p.name}</td>
                    <td className="p-2">{p.site}</td>
                    <td className="p-2">{p.phase}</td>
                    <td className="p-2">{p.owner}</td>
                    <td className="p-2">{p.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => exportNodeToPDF(mainRef.current as HTMLElement, 'INEX-Projects.pdf')}>Export PDF</button>
        </div>
      </section>
    );
  }

  function TicketsView() {
    const bars = useMemo(() => (
      [
        { name: 'P1', count: tickets.filter(t => t.priority === 'P1').length },
        { name: 'P2', count: tickets.filter(t => t.priority === 'P2').length },
        { name: 'P3', count: tickets.filter(t => t.priority === 'P3').length },
      ]
    ), [tickets]);

    return (
      <section className="p-6 space-y-6">
        <Card title="Open Tickets">
          <ul className="space-y-2">
            {tickets.map((t, idx) => (
              <li key={idx} className="flex items-center justify-between p-3 rounded-md border border-gray-200 dark:border-gray-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">{t.title}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-900">{t.priority}</span>
                  <span className="text-gray-600 dark:text-gray-300">{t.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Tickets by Priority">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#FFB200" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => exportNodeToPDF(mainRef.current as HTMLElement, 'INEX-Tickets.pdf')}>Export PDF</button>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] min-h-screen">
        <aside className="p-4 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-4">
              <img src={BRAND.logo} alt={BRAND.name} className="h-10 w-10 rounded" />
            </div>
            <nav className="space-y-1">
              <NavLink to="#/dashboard">Dashboard</NavLink>
              <NavLink to="#/projects">Projects</NavLink>
              <NavLink to="#/tickets">Tickets</NavLink>
            </nav>
          </motion.div>
        </aside>

        <div className="flex flex-col">
          <Toolbar />
          <main ref={node => { mainRef.current = node }} className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-4">
            <motion.div key={route} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              {route === '#/dashboard' && <DashboardView />}
              {route === '#/projects' && <ProjectsView />}
              {route === '#/tickets' && <TicketsView />}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
      <div className="text-3xl font-extrabold mt-1">{value}</div>
    </div>
  );
}


