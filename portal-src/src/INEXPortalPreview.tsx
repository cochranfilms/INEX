import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Api } from './api';
import { CALENDAR_URL, BRAND } from './config';
import type { DashboardData, Ticket } from './types';

// Single-screen pitch: no routing

export async function exportNodeToPDF(node: HTMLElement, fileName: string) {
  const rect = node.getBoundingClientRect();
  const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: rect.width, height: rect.height });
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({ orientation: rect.width >= rect.height ? 'l' : 'p', unit: 'pt', format: [rect.width, rect.height] });
  pdf.addImage(imgData, 'JPEG', 0, 0, rect.width, rect.height);
  pdf.save(fileName);
}

export default function INEXPortalPreview() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    Api.dashboard().then((d: DashboardData) => setDashboard(d)).catch(() => setDashboard({ sites: 0, roomsThisWeek: 0, ticketsOpen: 0 }));
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

  // No sidebar navigation in pitch mode

  function Toolbar() {
    return (
      <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-800 glass">
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

  // Pitch layout handled directly in main

  // No projects/tickets routes in pitch mode

  return (
    <div className="min-h-screen h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 overflow-hidden">
      <Toolbar />
      <main ref={node => { mainRef.current = node }} className="h-[calc(100vh-64px)] max-w-[1200px] w-full mx-auto px-4 py-6 overflow-hidden">
        <div className="grid grid-cols-12 gap-6 h-full">
          <div className="col-span-12 lg:col-span-6 flex flex-col justify-center">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center gap-3 mb-3">
                <img src={BRAND.logo} alt={BRAND.name} className="h-10 w-10 rounded" />
                <h1 className="text-3xl font-black tracking-tight">INEX Client Portal Preview</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-lg max-w-prose">
                A one-screen pitch of the experience: standardized rooms, predictable installs, and proactive service with clear reporting.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a className="btn-secondary" href={CALENDAR_URL} target="_blank" rel="noreferrer">Schedule a Walkthrough</a>
                <a className="btn-ghost" href="/" rel="noreferrer">Visit INEX Homepage</a>
                <button className="btn-ghost" onClick={() => exportNodeToPDF(mainRef.current as HTMLElement, 'INEX-Portal-OnePager.pdf')}>Export One‑Pager</button>
              </div>
            </motion.div>
          </div>
          <div className="col-span-12 lg:col-span-6 flex items-center">
            <motion.div className="w-full grid grid-cols-1 gap-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
              <div className="grid grid-cols-3 gap-4">
                <StatCard title="Active Sites" value={dashboard?.sites ?? '—'} />
                <StatCard title="Rooms This Week" value={dashboard?.roomsThisWeek ?? '—'} />
                <StatCard title="Open Tickets" value={dashboard?.ticketsOpen ?? '—'} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Rooms Completed">
                  <div className="h-48">
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
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={ticketPie} dataKey="value" nameKey="name" outerRadius={70}>
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
            </motion.div>
          </div>
        </div>
      </main>
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


