/**
 * INEX Git-Based Progress Tracker
 * Automatically tracks progress from Git commit messages
 * Integrates with GitHub → Vercel deployment workflow
 */

class INEXGitTracker {
  constructor() {
    this.commitPatterns = {
      // Standard format: feat: description - Phase: X - Progress: Y%
      standard: /^(feat|fix|docs|style|refactor|test|chore):\s*(.+?)(?:\s*-\s*Phase:\s*(\w+))?(?:\s*-\s*Progress:\s*(\d+)%)?$/i,
      
      // Alternative format: [Phase X] description - Progress: Y%
      bracket: /^\[Phase\s*(\w+)\]\s*(.+?)(?:\s*-\s*Progress:\s*(\d+)%)?$/i,
      
      // Simple format: Phase X: description - Y%
      simple: /^Phase\s*(\w+):\s*(.+?)(?:\s*-\s*(\d+)%)?$/i,
      
      // Progress only: description - Y%
      progress: /^(.+?)(?:\s*-\s*(\d+)%)?$/i
    };
    
    this.phases = {
      'Discovery': { order: 1, progress: 15, status: 'complete' },
      'Design': { order: 2, progress: 0, status: 'active' },
      'Shell': { order: 3, progress: 0, status: 'pending' },
      'Features': { order: 4, progress: 0, status: 'pending' },
      'Integration': { order: 5, progress: 0, status: 'pending' },
      'Testing': { order: 6, progress: 0, status: 'pending' },
      'Launch': { order: 7, progress: 0, status: 'pending' }
    };
    
    this.currentPhase = 'Design';
    this.overallProgress = 15;
    this.commitHistory = [];
    this.lastCommitHash = '';
    
    this.init();
  }

  init() {
    this.loadSavedState();
    this.setupEventListeners();
    this.startAutoSync();
    this.enableConsoleCommands();
    
    console.log('🚀 INEX Git Progress Tracker initialized');
    console.log('📝 Use git commit messages with progress info:');
    console.log('   feat: Complete design system - Phase: Design - Progress: 40%');
    console.log('   [Phase Design] Brand guidelines done - Progress: 50%');
    console.log('   Phase Design: Color palette finalized - 60%');
  }

  /**
   * Parse commit message for progress information
   */
  parseCommitMessage(commitMessage) {
    let parsed = {
      type: 'update',
      description: '',
      phase: null,
      progress: null,
      valid: false
    };

    // Try each pattern
    for (const [patternName, pattern] of Object.entries(this.commitPatterns)) {
      const match = commitMessage.match(pattern);
      if (match) {
        switch (patternName) {
          case 'standard':
            parsed.type = match[1] || 'update';
            parsed.description = match[2]?.trim() || '';
            parsed.phase = match[3] || null;
            parsed.progress = match[4] ? parseInt(match[4]) : null;
            break;
            
          case 'bracket':
            parsed.phase = match[1] || null;
            parsed.description = match[2]?.trim() || '';
            parsed.progress = match[3] ? parseInt(match[3]) : null;
            break;
            
          case 'simple':
            parsed.phase = match[1] || null;
            parsed.description = match[2]?.trim() || '';
            parsed.progress = match[3] ? parseInt(match[3]) : null;
            break;
            
          case 'progress':
            parsed.description = match[1]?.trim() || '';
            parsed.progress = match[2] ? parseInt(match[2]) : null;
            break;
        }
        
        parsed.valid = true;
        break;
      }
    }

    return parsed;
  }

  /**
   * Process a new commit and update progress
   */
  processCommit(commitHash, commitMessage, author, timestamp) {
    const parsed = this.parseCommitMessage(commitMessage);
    
    if (!parsed.valid) {
      console.log(`📝 Commit ${commitHash.slice(0, 8)}: No progress info found`);
      return null;
    }

    const commitData = {
      hash: commitHash,
      message: commitMessage,
      author,
      timestamp: timestamp || new Date().toISOString(),
      parsed,
      processed: false
    };

    // Update progress if phase or progress specified
    if (parsed.phase && this.phases[parsed.phase]) {
      this.updatePhase(parsed.phase);
    }
    
    if (parsed.progress !== null) {
      this.updateOverallProgress(parsed.progress);
    }

    // Add to commit history
    this.commitHistory.unshift(commitData);
    if (this.commitHistory.length > 50) {
      this.commitHistory.splice(50);
    }

    // Save state
    this.saveState();
    
    console.log(`✅ Commit processed: ${parsed.description}`);
    if (parsed.phase) console.log(`   Phase: ${parsed.phase}`);
    if (parsed.progress !== null) console.log(`   Progress: ${parsed.progress}%`);
    
    return commitData;
  }

  /**
   * Update current phase
   */
  updatePhase(newPhase) {
    if (!this.phases[newPhase]) {
      console.warn(`⚠️ Unknown phase: ${newPhase}`);
      return;
    }

    // Mark current phase as complete
    if (this.currentPhase && this.phases[this.currentPhase]) {
      this.phases[this.currentPhase].status = 'complete';
      this.phases[this.currentPhase].progress = 100;
    }

    // Set new phase as active
    this.currentPhase = newPhase;
    this.phases[newPhase].status = 'active';
    this.phases[newPhase].progress = 0;

    console.log(`🔄 Moved to phase: ${newPhase}`);
    this.saveState();
  }

  /**
   * Update overall progress
   */
  updateOverallProgress(newProgress) {
    const oldProgress = this.overallProgress;
    this.overallProgress = Math.max(0, Math.min(100, newProgress));
    
    if (oldProgress !== this.overallProgress) {
      console.log(`📊 Progress updated: ${oldProgress}% → ${this.overallProgress}%`);
      this.saveState();
    }
  }

  /**
   * Calculate progress based on completed phases
   */
  calculateProgressFromPhases() {
    const totalPhases = Object.keys(this.phases).length;
    const completedPhases = Object.values(this.phases).filter(p => p.status === 'complete').length;
    const currentPhaseProgress = this.phases[this.currentPhase]?.progress || 0;
    
    const baseProgress = (completedPhases / totalPhases) * 100;
    const currentPhaseWeight = (1 / totalPhases) * (currentPhaseProgress / 100);
    
    return Math.round(baseProgress + currentPhaseWeight);
  }

  /**
   * Get formatted updates for status.html
   */
  getFormattedUpdates() {
    return this.commitHistory
      .filter(commit => commit.parsed.valid)
      .slice(0, 10)
      .map(commit => ({
        date: new Date(commit.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        message: commit.parsed.description,
        status: commit.parsed.progress !== null ? `${commit.parsed.progress}%` : 'Update',
        commit: commit.hash.slice(0, 8),
        phase: commit.parsed.phase || this.currentPhase
      }));
  }

  /**
   * Export data for external use (API, build hooks, etc.)
   */
  exportData() {
    return {
      currentPhase: this.currentPhase,
      overallProgress: this.overallProgress,
      phases: this.phases,
      lastCommit: this.lastCommitHash,
      recentCommits: this.commitHistory.slice(0, 5),
      lastUpdate: new Date().toISOString(),
      updates: this.getFormattedUpdates()
    };
  }

  /**
   * Simulate Git workflow for testing
   */
  simulateGitWorkflow() {
    console.log('🧪 Simulating Git workflow...');
    
    const testCommits = [
      {
        hash: 'abc123456789',
        message: 'feat: Complete brand guidelines - Phase: Design - Progress: 40%',
        author: 'Cody Cochran',
        timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        hash: 'def987654321',
        message: '[Phase Design] Color palette finalized - Progress: 60%',
        author: 'Cody Cochran',
        timestamp: new Date(Date.now() - 1800000).toISOString() // 30 min ago
      },
      {
        hash: 'ghi456789123',
        message: 'Phase Design: Typography system complete - 80%',
        author: 'Cody Cochran',
        timestamp: new Date().toISOString()
      }
    ];

    testCommits.forEach(commit => {
      this.processCommit(commit.hash, commit.message, commit.author, commit.timestamp);
    });

    console.log('✅ Git workflow simulation complete');
    this.showStatus();
  }

  /**
   * Show current status
   */
  showStatus() {
    console.log(`
📊 INEX Git Progress Status:
Current Phase: ${this.currentPhase}
Overall Progress: ${this.overallProgress}%

Phase Status:
${Object.entries(this.phases).map(([name, data]) => 
  `  ${name}: ${data.progress}% (${data.status})`
).join('\n')}

Recent Commits:
${this.commitHistory.slice(0, 5).map(commit => 
  `  ${commit.hash.slice(0, 8)}: ${commit.parsed.description}`
).join('\n')}

Git Commands:
• git commit -m "feat: description - Phase: X - Progress: Y%"
• git commit -m "[Phase X] description - Progress: Y%"
• git commit -m "Phase X: description - Y%"
    `);
    
    return this.exportData();
  }

  /**
   * Setup event listeners for real-time updates
   */
  setupEventListeners() {
    // Listen for messages from other windows/iframes
    if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
        if (event.data.type === 'inex-git-update') {
          this.processCommit(
            event.data.data.hash,
            event.data.data.message,
            event.data.data.author,
            event.data.data.timestamp
          );
        }
      });
    }
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync() {
    // Check for updates every 10 seconds
    setInterval(() => {
      this.syncWithStorage();
    }, 10000);
  }

  /**
   * Sync with localStorage (for status.html integration)
   */
  syncWithStorage() {
    // Update localStorage for status.html to read
    localStorage.setItem('inex-git-phase', this.currentPhase);
    localStorage.setItem('inex-git-progress', this.overallProgress.toString());
    localStorage.setItem('inex-git-updates', JSON.stringify(this.getFormattedUpdates()));
    localStorage.setItem('inex-git-data', JSON.stringify(this.exportData()));
  }

  /**
   * Load saved state
   */
  loadSavedState() {
    try {
      const savedData = localStorage.getItem('inex-git-data');
      if (savedData) {
        const data = JSON.parse(savedData);
        this.currentPhase = data.currentPhase || this.currentPhase;
        this.overallProgress = data.overallProgress || this.overallProgress;
        this.phases = data.phases || this.phases;
        this.commitHistory = data.recentCommits || [];
      }
    } catch (error) {
      console.warn('Could not load saved Git tracker state:', error);
    }
  }

  /**
   * Save current state
   */
  saveState() {
    try {
      localStorage.setItem('inex-git-data', JSON.stringify(this.exportData()));
      this.syncWithStorage();
    } catch (error) {
      console.error('Error saving Git tracker state:', error);
    }
  }

  /**
   * Enable console commands for testing
   */
  enableConsoleCommands() {
    if (typeof window !== 'undefined') {
      window.inexGit = {
        processCommit: (hash, message, author, timestamp) => 
          this.processCommit(hash, message, author, timestamp),
        simulateWorkflow: () => this.simulateGitWorkflow(),
        showStatus: () => this.showStatus(),
        exportData: () => this.exportData(),
        updatePhase: (phase) => this.updatePhase(phase),
        updateProgress: (progress) => this.updateOverallProgress(progress)
      };

      console.log(`
🎯 INEX Git Commands Available:
• inexGit.processCommit(hash, message, author, timestamp) - Process a commit
• inexGit.simulateWorkflow() - Test the Git workflow
• inexGit.showStatus() - Show current status
• inexGit.exportData() - Export data for external use
• inexGit.updatePhase('phase-name') - Manually update phase
• inexGit.updateProgress(percentage) - Manually update progress
      `);
    }
  }
}

// Initialize the Git tracker
const inexGitTracker = new INEXGitTracker();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = INEXGitTracker;
} else if (typeof window !== 'undefined') {
  window.INEXGitTracker = INEXGitTracker;
  window.inexGitTracker = inexGitTracker;
}
