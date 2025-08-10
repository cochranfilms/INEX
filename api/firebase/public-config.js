export default async function handler(req, res) {
  // Basic CORS for cross-origin reads during static/local previews
  const origin = req.headers.origin || '';
  const allowed = [
    'https://inex.cochranfilms.com',
    'https://inex.vercel.app',
    'https://cochranfilms.vercel.app',
    'https://cochranfilms.com',
    'http://localhost:4321',
    'http://localhost:3000'
  ];
  // public config is safe to expose broadly
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Fallback to wildcard for simple GET access from static mirrors
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  // Expose only client-safe Firebase config values
  const cfg = {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  };
  res.setHeader('Content-Type', 'application/json');
  // Return 200 only if config present; otherwise 404 to reflect missing envs
  const ok = cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId;
  if (!ok) {
    res.status(404).send(JSON.stringify({ error: 'Missing Firebase env' }));
    return;
  }
  res.status(200).send(JSON.stringify(cfg));
}


