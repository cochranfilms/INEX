import fetch from 'node-fetch';

// Server-side finalize endpoint
// - Generates authoritative contractId and amounts
// - Sends EmailJS using server credentials
// - Returns values for client PDF generation, without exposing secrets

function buildContractId(now = new Date()){
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const rand = Math.random().toString(36).slice(2,8).toUpperCase();
  return `INEX-${y}${m}-${rand}`;
}

export default async function handler(req, res) {
  // Basic CORS to support same-origin and optional cross-origin tests
  // Allow only our public origins
  const origin = req.headers.origin || '';
  const allowed = [
    'https://inex.cochranfilms.com',
    'https://inex.vercel.app',
    'https://cochranfilms.vercel.app',
    'https://cochranfilms.com',
    'http://localhost:4321',
    'http://localhost:3000'
  ];
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') { res.status(405).send(JSON.stringify({ error: 'Method not allowed' })); return; }
  try {
    const { clientSignature, contactEmail } = req.body || {};
    if (!clientSignature || String(clientSignature).trim().length < 3) {
      res.status(400).send(JSON.stringify({ error: 'Invalid signature' }));
      return;
    }

    // Authoritative values (cannot be overridden by client)
    const contractId = buildContractId();
    const effectiveDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: '2-digit' });
    const amount = '$4,500';
    const carePlan = '$150/month';

    // EmailJS (server-side)
    const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
    const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
    const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
    const ALLOWED_EMAILS = ['info@inexsystemsdesigns.com','info@cochranfilms.com'];
    const requestedTo = (process.env.EMAILJS_TO_EMAIL || contactEmail || '').toLowerCase();
    const EMAILJS_TO_EMAIL = ALLOWED_EMAILS.includes(requestedTo)
      ? requestedTo
      : 'info@inexsystemsdesigns.com';

    let toEmailUsed = '';
    if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
      const params = {
        to_email: EMAILJS_TO_EMAIL,
        client_name: 'INEX Systems & Designs',
        company_name: 'Cochran Films LLC — Systems Division',
        contract_id: contractId,
        effective_date: effectiveDate,
        amount: amount,
        care_plan: carePlan,
        project_scope_summary: 'INEX‑branded Operations Portal (Dashboard, Jobs, Inventory, RMA, SLAs, Clients, Careers) with documentation and deployment.',
        portal_url: 'https://inex.cochranfilms.com',
        signed_timestamp: new Date().toLocaleString(),
        client_signature: String(clientSignature).trim()
      };
      // EmailJS REST API endpoint
      const url = 'https://api.emailjs.com/api/v1.0/email/send';
      const payload = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: params
      };
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!resp.ok) {
          const txt = await resp.text();
          // Continue but report warning
          console.warn('EmailJS send failed', resp.status, txt);
        } else {
          toEmailUsed = EMAILJS_TO_EMAIL;
        }
      } catch (e) {
        console.warn('EmailJS request error', e?.message);
      }
    }

    res.status(200).send(JSON.stringify({
      contractId,
      effectiveDate,
      amount,
      carePlan,
      toEmail: toEmailUsed
    }));
  } catch (e) {
    res.status(500).send(JSON.stringify({ error: e?.message || 'Finalize failed' }));
  }
}


