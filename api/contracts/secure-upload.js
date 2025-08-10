import { adminDb, adminStorage } from '../_utils/firebaseAdmin.js';
import crypto from 'crypto';

function getKey() {
  const b64 = process.env.ENCRYPTION_KEY;
  if (!b64) throw new Error('Missing ENCRYPTION_KEY');
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes base64');
  return key;
}

function encryptBase64(base64) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.from(base64, 'base64');
  const enc = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { enc, iv, tag };
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
    const { contractId, pdfBase64, userEmail } = req.body || {};
    if (!contractId || !pdfBase64) return res.status(400).json({ ok:false, error:'Missing contractId or pdfBase64' });

    const { enc, iv, tag } = encryptBase64(pdfBase64);
    const objectPath = `contracts/${contractId}.pdf.enc`;

    await adminStorage.file(objectPath).save(enc, {
      contentType: 'application/octet-stream',
      metadata: { cacheControl: 'private, max-age=0, no-store' }
    });

    await adminDb.collection('contracts').doc(contractId).set({
      userEmail: userEmail || null,
      objectPath,
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      size: enc.length,
      signedAt: new Date().toISOString(),
      status: 'uploaded'
    }, { merge: true });

    res.json({ ok:true, objectPath });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
}


