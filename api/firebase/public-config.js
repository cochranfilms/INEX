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
  res.status(200).send(JSON.stringify(cfg));
}


