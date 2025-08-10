import { adminAuth } from '../_utils/firebaseAdmin.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
    const { email, redirectUrl } = req.body || {};
    if (!email) return res.status(400).json({ ok:false, error:'Missing email' });
    const url = await adminAuth.generatePasswordResetLink(email, { url: redirectUrl || 'https://inex.cochranfilms.com' });
    // For now, return link; you can send via EmailJS or server mailer.
    res.json({ ok:true, link: url });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
}


