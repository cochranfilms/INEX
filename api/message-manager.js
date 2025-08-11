// Vercel API function for message management
export default async function handler(req, res) {
  res.status(410).json({
    success: false,
    error: 'Deprecated endpoint. Use /api/messages and /api/message-manager on the Node server.'
  });
}
