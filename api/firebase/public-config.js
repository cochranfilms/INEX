export default async function handler(req, res) {
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


