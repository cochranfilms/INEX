// Vercel API function for status updates
export default async function handler(req, res) {
  res.status(410).json({
    success: false,
    error: 'Deprecated endpoint. Use the Node server /api/status-update to write to inex-live-data.json.'
  });
}
