import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Only POST requests are supported.'
    });
  }

  try {
    const { 
      progress, 
      phase, 
      status, 
      phaseName, 
      eta, 
      scope, 
      owner, 
      client, 
      phases, 
      updates, 
      nextActions 
    } = req.body;
    
    // Validate required input
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid progress value. Must be a number between 0 and 100.' 
      });
    }
    
    if (!phase || typeof phase !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phase value. Must be a string.' 
      });
    }
    
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status value. Must be a string.' 
      });
    }
    
    // Create the updated data structure
    const updatedData = {
      progress,
      phase,
      phaseName: phaseName || 'Discovery Phase',
      status,
      lastUpdated: new Date().toISOString(),
      eta: eta || 'Sep 11-18, 2025',
      scope: scope || 'Scope v1.0',
      owner: owner || 'Cochran Full Stack Solutions',
      client: client || 'INEX',
      phases: phases || [
        {
          name: "Discovery",
          progress: 0,
          status: "active",
          tasks: [
            {
              id: "requirements-gathering",
              name: "Gather project requirements and specifications",
              status: "in-progress"
            },
            {
              id: "project-planning",
              name: "Create project timeline and milestones",
              status: "pending"
            },
            {
              id: "team-setup",
              name: "Set up development team and tools",
              status: "pending"
            },
            {
              id: "stakeholder-interviews",
              name: "Conduct stakeholder interviews and feedback sessions",
              status: "pending"
            },
            {
              id: "technical-assessment",
              name: "Perform technical assessment and feasibility study",
              status: "pending"
            }
          ]
        },
        {
          name: "Phase 1",
          progress: 0,
          status: "pending",
          tasks: [
            {
              id: "inex-branding",
              name: "INEX branding integration and color tokens",
              status: "planned"
            },
            {
              id: "ui-framework",
              name: "Basic UI framework (Dark/Light themes)",
              status: "planned"
            },
            {
              id: "dashboard-structure",
              name: "Core dashboard structure and navigation",
              status: "planned"
            },
            {
              id: "project-docs",
              name: "Project documentation and specs",
              status: "planned"
            },
            {
              id: "deployment-prep",
              name: "Deployment preparation and testing",
              status: "planned"
            }
          ]
        },
        {
          name: "Phase 2",
          progress: 0,
          status: "pending",
          tasks: [
            {
              id: "authentication",
              name: "Authentication system",
              status: "planned"
            },
            {
              id: "data-connectors",
              name: "Data connectors and integration",
              status: "planned"
            }
          ]
        },
        {
          name: "Phase 3",
          progress: 0,
          status: "pending",
          tasks: [
            {
              id: "client-portal",
              name: "Client portal development",
              status: "planned"
            },
            {
              id: "reporting",
              name: "Reporting and analytics",
              status: "planned"
            }
          ]
        }
      ],
      updates: updates || [
        {
          date: "Jan 8",
          update: "Project initiated - gathering requirements and specifications",
          status: "In Progress"
        },
        {
          date: "Jan 9",
          update: "Requirements analysis and project planning",
          status: "Planned"
        },
        {
          date: "Jan 10",
          update: "Team setup and development environment preparation",
          status: "Planned"
        }
      ],
      nextActions: nextActions || [
        "Complete requirements gathering and stakeholder interviews",
        "Finalize project timeline and milestones",
        "Set up development team and tools",
        "Conduct technical feasibility assessment",
        "Prepare project scope document"
      ],
      messages: [
        {
          id: "1754906153138",
          name: "API Test",
          text: "Testing the comprehensive messaging system integration",
          email: null,
          priority: "high",
          category: "test",
          timestamp: "2025-08-11T09:55:53.138Z",
          status: "new",
          read: false,
          responded: false
        },
        {
          id: "1754892665931",
          name: "Test User",
          text: "This is a test message",
          email: null,
          priority: "normal",
          category: "general",
          timestamp: "2025-08-11T06:11:05.931Z",
          status: "new",
          read: false,
          responded: false
        },
        {
          id: "1754887660763",
          name: "Urgent Client",
          text: "We have an urgent request for additional features. Please respond ASAP.",
          email: "urgent@client.com",
          priority: "urgent",
          category: "feature-request",
          timestamp: "2025-08-11T04:47:40.763Z",
          status: "responded",
          read: true,
          responded: true,
          lastUpdated: "2025-08-11T04:47:40.767Z",
          responses: [
            {
              text: "Thank you for your message! We are working on your request.",
              timestamp: "2025-08-11T04:47:40.767Z",
              responder: "Development Team"
            }
          ]
        },
        {
          id: "1754887660760",
          name: "Test User",
          text: "This is a test message to verify the messaging system is working correctly.",
          email: "test@example.com",
          priority: "low",
          category: "test",
          timestamp: "2025-08-11T04:47:40.760Z",
          status: "new",
          read: false,
          responded: false
        },
        {
          id: "1754887660757",
          name: "Zebadiah Henry",
          text: "Hi team! I wanted to check on the progress of the INEX portal development. Everything looking good?",
          email: "zeb@inexsystemsdesigns.com",
          priority: "normal",
          category: "client-feedback",
          timestamp: "2025-08-11T04:47:40.757Z",
          status: "new",
          read: false,
          responded: false
        },
        {
          id: "1754887531321",
          name: "Zebadiah Henry",
          text: "Hi team! I wanted to check on the progress of the INEX portal development. Everything looking good?",
          email: "zeb@inexsystemsdesigns.com",
          priority: "normal",
          category: "client-feedback",
          timestamp: "2025-08-11T04:47:31.321Z",
          status: "responded",
          read: true,
          responded: true,
          lastUpdated: "2025-08-11T04:47:43.247Z",
          responses: [
            {
              text: "Thank you for your message! We are working hard on the INEX portal development. Everything is progressing well and we should have Phase 1 completed soon.",
              timestamp: "2025-08-11T04:47:43.247Z",
              responder: "Development Team"
            }
          ]
        }
      ]
    };
    
    console.log('Status update processed successfully for Vercel deployment');
    
    return res.json({ 
      success: true, 
      message: 'Status update received and processed successfully',
      data: updatedData
    });
    
  } catch (error) {
    console.error('Error processing status update:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error processing status update' 
    });
  }
}
