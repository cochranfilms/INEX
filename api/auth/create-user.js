import { adminAuth } from '../_utils/firebaseAdmin.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
    const { email, displayName } = req.body || {};
    if (!email) return res.status(400).json({ ok:false, error:'Missing email' });

    let user;
    try { user = await adminAuth.getUserByEmail(email); }
    catch { user = await adminAuth.createUser({ email, displayName, emailVerified: false, disabled: false }); }

    res.json({ ok:true, uid: user.uid });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
}


