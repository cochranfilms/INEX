/**
 * INEX Development Tracker
 * Automatically tracks progress as you work on index.html
 * Updates status.html in real-time
 */

class INEXDevTracker {
  constructor() {
    this.tasks = {
      'brand-guidelines': { name: 'Brand Guidelines', status: 'in-progress', phase: 'Design' },
      'design-system': { name: 'Design System', status: 'pending', phase: 'Design' },
      'navigation-shell': { name: 'Navigation Shell', status: 'pending', phase: 'Shell' },
      'routing': { name: 'Routing System', status: 'pending', phase: 'Shell' },
      'themes': { name: 'Theme System', status: 'pending', phase: 'Shell' },
      'dashboard-kpis': { name: 'Dashboard KPIs', status: 'pending', phase: 'Features' },
      'core-views': { name: 'Core Views', status: 'pending', phase: 'Features' },
      'data-mock': { name: 'Mock Data', status: 'pending', phase: 'Features' },
      'responsive': { name: 'Responsive Design', status: 'pending', phase: 'Features' },
      'performance': { name: 'Performance', status: 'pending', phase: 'Testing' },
      'accessibility': { name: 'Accessibility', status: 'pending', phase: 'Testing' },
      'deployment': { name: 'Deployment', status: 'pending', phase: 'Launch' }
    };
    
    this.phases = {
      'Discovery': { progress: 15, status: 'complete' },
      'Design': { progress: 0, status: 'active' },
      'Shell': { progress: 0, status: 'pending' },
      'Features': { progress: 0, status: 'pending' },
      'Integration': { progress: 0, status: 'pending' },
      'Testing': { progress: 0, status: 'pending' },
      'Launch': { progress: 0, status: 'pending' }
    };
    
    this.currentPhase = 'Design';
    this.overallProgress = 15;
    
    this.init();
  }

  init() {
    this.loadSavedState();
    this.setupEventListeners();
    this.updateUI();
    this.startAutoSave();
  }

  loadSavedState() {
    // Load saved progress from localStorage
    const savedProgress = localStorage.getItem('inex-overall-progress');
    if (savedProgress) {
      this.overallProgress = parseInt(savedProgress);
    }

    // Load saved task states
    Object.keys(this.tasks).forEach(taskId => {
      const savedStatus = localStorage.getItem(`inex-task-${taskId}`);
      if (savedStatus) {
        this.tasks[taskId].status = savedStatus;
      }
    });

    // Load saved phase states
    Object.keys(this.phases).forEach(phaseName => {
      const savedPhase = localStorage.getItem(`inex-phase-${phaseName}`);
      if (savedPhase) {
        this.phases[phaseName] = JSON.parse(savedPhase);
      }
    });
  }

  setupEventListeners() {
    // Listen for file changes (if you're using a file watcher)
    if (typeof window !== 'undefined') {
      // Browser environment - set up development mode detection
      this.detectDevelopmentMode();
    }
  }

  detectDevelopmentMode() {
    // Check if we're in development mode by looking for common dev indicators
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.port !== '';
    
    if (isDev) {
      console.log('🚀 INEX Dev Tracker: Development mode detected');
      this.enableDevFeatures();
    }
  }

  enableDevFeatures() {
    // Add development shortcuts to console
    window.inexDev = {
      completeTask: (taskId) => this.completeTask(taskId),
      startTask: (taskId) => this.startTask(taskId),
      updatePhase: (phaseName) => this.updatePhase(phaseName),
      addUpdate: (message) => this.addUpdate(message),
      showStatus: () => this.showStatus()
    };

    console.log(`
🎯 INEX Development Commands Available:
• inexDev.completeTask('task-id') - Mark task complete
• inexDev.startTask('task-id') - Start working on task
• inexDev.updatePhase('phase-name') - Move to new phase
• inexDev.addUpdate('message') - Add progress update
• inexDev.showStatus() - Show current status
    `);
  }

  completeTask(taskId) {
    if (!this.tasks[taskId]) {
      console.error(`Task ${taskId} not found`);
      return;
    }

    this.tasks[taskId].status = 'complete';
    this.updateProgress();
    this.saveState();
    
    console.log(`✅ Completed: ${this.tasks[taskId].name}`);
    
    // Check if phase is complete
    this.checkPhaseCompletion();
    
    return this.tasks[taskId];
  }

  startTask(taskId) {
    if (!this.tasks[taskId]) {
      console.error(`Task ${taskId} not found`);
      return;
    }

    this.tasks[taskId].status = 'in-progress';
    this.saveState();
    
    console.log(`🚀 Started: ${this.tasks[taskId].name}`);
    return this.tasks[taskId];
  }

  updatePhase(phaseName) {
    if (!this.phases[phaseName]) {
      console.error(`Phase ${phaseName} not found`);
      return;
    }

    // Mark current phase as complete
    this.phases[this.currentPhase].status = 'complete';
    this.phases[this.currentPhase].progress = 100;
    
    // Set new phase as active
    this.currentPhase = phaseName;
    this.phases[phaseName].status = 'active';
    this.phases[phaseName].progress = 0;
    
    this.saveState();
    this.updateUI();
    
    console.log(`🔄 Moved to phase: ${phaseName}`);
    return this.phases[phaseName];
  }

  checkPhaseCompletion() {
    const currentPhaseTasks = Object.values(this.tasks).filter(
      task => task.phase === this.currentPhase
    );
    
    const completedTasks = currentPhaseTasks.filter(
      task => task.status === 'complete'
    );
    
    if (completedTasks.length === currentPhaseTasks.length) {
      console.log(`🎉 Phase ${this.currentPhase} complete!`);
      this.phases[this.currentPhase].status = 'complete';
      this.phases[this.currentPhase].progress = 100;
      
      // Auto-advance to next phase if available
      this.autoAdvancePhase();
    }
  }

  autoAdvancePhase() {
    const phaseOrder = ['Discovery', 'Design', 'Shell', 'Features', 'Integration', 'Testing', 'Launch'];
    const currentIndex = phaseOrder.indexOf(this.currentPhase);
    const nextPhase = phaseOrder[currentIndex + 1];
    
    if (nextPhase && this.phases[nextPhase]) {
      console.log(`🔄 Auto-advancing to ${nextPhase}`);
      this.updatePhase(nextPhase);
    }
  }

  updateProgress() {
    const totalTasks = Object.keys(this.tasks).length;
    const completedTasks = Object.values(this.tasks).filter(
      task => task.status === 'complete'
    ).length;
    
    this.overallProgress = Math.round((completedTasks / totalTasks) * 100);
    
    // Update phase progress
    Object.keys(this.phases).forEach(phaseName => {
      const phaseTasks = Object.values(this.tasks).filter(
        task => task.phase === phaseName
      );
      
      if (phaseTasks.length > 0) {
        const phaseCompleted = phaseTasks.filter(
          task => task.status === 'complete'
        ).length;
        
        this.phases[phaseName].progress = Math.round(
          (phaseCompleted / phaseTasks.length) * 100
        );
      }
    });
  }

  addUpdate(message, status = 'In Progress') {
    const update = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      message,
      status,
      timestamp: Date.now()
    };
    
    // Save to localStorage
    const updates = JSON.parse(localStorage.getItem('inex-updates') || '[]');
    updates.unshift(update);
    
    // Keep only last 20 updates
    if (updates.length > 20) {
      updates.splice(20);
    }
    
    localStorage.setItem('inex-updates', JSON.stringify(updates));
    
    console.log(`📝 Update added: ${message}`);
    return update;
  }

  showStatus() {
    console.log(`
📊 INEX Project Status:
Current Phase: ${this.currentPhase}
Overall Progress: ${this.overallProgress}%

Phase Progress:
${Object.entries(this.phases).map(([name, data]) => 
  `  ${name}: ${data.progress}% (${data.status})`
).join('\n')}

Recent Tasks:
${Object.entries(this.tasks).filter(([_, task]) => 
  task.status === 'in-progress' || task.status === 'complete'
).map(([id, task]) => 
  `  ${task.name}: ${task.status}`
).join('\n')}
    `);
    
    return {
      currentPhase: this.currentPhase,
      overallProgress: this.overallProgress,
      phases: this.phases,
      tasks: this.tasks
    };
  }

  updateUI() {
    // Update status.html if it's open
    if (window.parent && window.parent !== window) {
      // We're in an iframe, try to communicate with parent
      this.sendStatusToParent();
    }
    
    // Update localStorage for status.html to read
    this.saveState();
  }

  sendStatusToParent() {
    try {
      const statusData = {
        type: 'inex-status-update',
        data: {
          currentPhase: this.currentPhase,
          overallProgress: this.overallProgress,
          phases: this.phases,
          tasks: this.tasks
        }
      };
      
      window.parent.postMessage(statusData, '*');
    } catch (error) {
      // Parent window not accessible
    }
  }

  saveState() {
    localStorage.setItem('inex-overall-progress', this.overallProgress.toString());
    localStorage.setItem('inex-current-phase', this.currentPhase);
    
    Object.entries(this.tasks).forEach(([taskId, task]) => {
      localStorage.setItem(`inex-task-${taskId}`, task.status);
    });
    
    Object.entries(this.phases).forEach(([phaseName, phase]) => {
      localStorage.setItem(`inex-phase-${phaseName}`, JSON.stringify(phase));
    });
  }

  startAutoSave() {
    // Auto-save every 30 seconds
    setInterval(() => {
      this.saveState();
    }, 30000);
  }

  // Development workflow helpers
  markAsWorking(taskId) {
    this.startTask(taskId);
    this.addUpdate(`Started working on: ${this.tasks[taskId].name}`);
  }

  markAsDone(taskId) {
    this.completeTask(taskId);
    this.addUpdate(`Completed: ${this.tasks[taskId].name}`, 'Complete');
  }

  // Quick phase transitions
  moveToDesign() {
    this.updatePhase('Design');
    this.addUpdate('Moving to Design phase - focusing on branding and design system');
  }

  moveToShell() {
    this.updatePhase('Shell');
    this.addUpdate('Moving to Shell phase - building navigation and routing');
  }

  moveToFeatures() {
    this.updatePhase('Features');
    this.addUpdate('Moving to Features phase - implementing dashboard and core views');
  }
}

// Initialize the tracker
const inexTracker = new INEXDevTracker();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = INEXDevTracker;
} else if (typeof window !== 'undefined') {
  window.INEXDevTracker = INEXDevTracker;
  window.inexTracker = inexTracker;
}
