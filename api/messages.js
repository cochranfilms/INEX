// Vercel API function for messages
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.status(410).json({
    success: false,
    error: 'Deprecated endpoint. Use /api/messages on the Node server.'
  });
}
