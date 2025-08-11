// Vercel API function for message management - Using Firestore for data persistence
import { adminDb } from './_utils/firebaseAdmin.js';

export default async function handler(req, res) {
  // Enable CORS for global access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const messagesSnapshot = await adminDb.collection('messages').orderBy('timestamp', 'desc').get();
      const messages = [];
      
      messagesSnapshot.forEach(doc => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return res.status(200).json({
        success: true,
        messages: messages,
        count: messages.length,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(200).json({
        success: true,
        messages: [],
        count: 0,
        lastUpdated: new Date().toISOString()
      });
    }
  }

  if (req.method === 'POST') {
    const { name, text, email, priority, category } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
    }

    const newMessage = {
      id: Date.now().toString(),
      name: (name || 'Anonymous').trim(),
      text: text.trim(),
      email: email ? email.trim() : null,
      priority: priority || 'normal',
      category: category || 'general',
      timestamp: new Date().toISOString(),
      status: 'new',
      read: false,
      responded: false
    };

    try {
      // Add new message to Firestore
      const docRef = await adminDb.collection('messages').add(newMessage);
      
      // Get all messages for response
      const messagesSnapshot = await adminDb.collection('messages').orderBy('timestamp', 'desc').get();
      const allMessages = [];
      
      messagesSnapshot.forEach(doc => {
        allMessages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return res.status(201).json({
        success: true,
        message: 'Message created successfully',
        data: { ...newMessage, id: docRef.id },
        allMessages: allMessages
      });
    } catch (error) {
      console.error('Error creating message:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create message: ' + error.message
      });
    }
  }

  if (req.method === 'PUT') {
    const { id, action, responseText, responder } = req.body;
    
    if (!id || !action) {
      return res.status(400).json({
        success: false,
        error: 'Message ID and action are required'
      });
    }

    try {
      // Get the message document from Firestore
      const messageDoc = await adminDb.collection('messages').doc(id).get();
      
      if (!messageDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }
      
      const messageData = messageDoc.data();
      const updateData = {};
      
      // Update the message based on action
      if (action === 'markRead') {
        updateData.read = true;
      } else if (action === 'addResponse') {
        updateData.responded = true;
        updateData.responses = adminDb.FieldValue.arrayUnion({
          text: responseText,
          responder: responder || 'Development Team',
          timestamp: new Date().toISOString()
        });
      }
      
      // Update the document in Firestore
      await adminDb.collection('messages').doc(id).update(updateData);
      
      // Get the updated message
      const updatedDoc = await adminDb.collection('messages').doc(id).get();
      
      return res.status(200).json({
        success: true,
        message: 'Message updated successfully',
        data: { id: updatedDoc.id, ...updatedDoc.data() }
      });
    } catch (error) {
      console.error('Error updating message:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update message: ' + error.message
      });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Message ID is required'
      });
    }

    try {
      // Get the message document from Firestore
      const messageDoc = await adminDb.collection('messages').doc(id).get();
      
      if (!messageDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }
      
      // Soft delete by marking as archived
      await adminDb.collection('messages').doc(id).update({
        status: 'archived',
        archivedAt: new Date().toISOString()
      });
      
      return res.status(200).json({
        success: true,
        message: 'Message archived successfully'
      });
    } catch (error) {
      console.error('Error archiving message:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to archive message: ' + error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}
