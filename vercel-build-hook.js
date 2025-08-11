/**
 * INEX Vercel Build Hook Integration
 * Reads progress data from GitHub Actions and updates live system
 * Runs during Vercel build/deployment process
 */

const fs = require('fs');
const path = require('path');

class INEXVercelIntegration {
  constructor() {
    this.progressDataPath = path.join(process.cwd(), 'inex-progress.json');
    this.outputPath = path.join(process.cwd(), 'inex-live-data.json');
    this.buildTime = new Date().toISOString();
  }

  /**
   * Main build hook execution
   */
  async execute() {
    try {
      console.log('🚀 INEX Vercel Build Hook: Starting progress integration...');
      
      // Check if we're in a Vercel build environment
      if (!this.isVercelBuild()) {
        console.log('ℹ️ Not in Vercel build environment, skipping...');
        return;
      }

      // Read progress data from GitHub Actions
      const progressData = await this.readProgressData();
      
      if (!progressData) {
        console.log('ℹ️ No progress data found, using default state...');
        await this.createDefaultData();
        return;
      }

      // Process and validate progress data
      const processedData = this.processProgressData(progressData);
      
      // Generate live data for frontend consumption
      const liveData = this.generateLiveData(processedData);
      
      // Write live data to public directory
      await this.writeLiveData(liveData);
      
      // Update environment variables if needed
      this.updateEnvironmentVariables(liveData);
      
      console.log('✅ INEX Vercel integration complete!');
      console.log(`📊 Current Phase: ${liveData.currentPhase}`);
      console.log(`📈 Overall Progress: ${liveData.overallProgress}%`);
      console.log(`🔄 Last Update: ${liveData.lastUpdate}`);
      
    } catch (error) {
      console.error('❌ INEX Vercel integration failed:', error);
      // Don't fail the build, just log the error
    }
  }

  /**
   * Check if we're in a Vercel build environment
   */
  isVercelBuild() {
    return process.env.VERCEL === '1' || 
           process.env.VERCEL_ENV || 
           process.env.VERCEL_URL ||
           process.env.NODE_ENV === 'production';
  }

  /**
   * Read progress data from GitHub Actions
   */
  async readProgressData() {
    try {
      if (!fs.existsSync(this.progressDataPath)) {
        console.log('📁 No inex-progress.json found');
        return null;
      }

      const data = fs.readFileSync(this.progressDataPath, 'utf8');
      const progressData = JSON.parse(data);
      
      console.log('📖 Progress data loaded from GitHub Actions');
      return progressData;
      
    } catch (error) {
      console.warn('⚠️ Could not read progress data:', error.message);
      return null;
    }
  }

  /**
   * Process and validate progress data
   */
  processProgressData(rawData) {
    const processed = {
      currentPhase: 'Design',
      overallProgress: 15,
      phases: {
        'Discovery': { order: 1, progress: 15, status: 'complete' },
        'Design': { order: 2, progress: 0, status: 'active' },
        'Shell': { order: 3, progress: 0, status: 'pending' },
        'Features': { order: 4, progress: 0, status: 'pending' },
        'Integration': { order: 5, progress: 0, status: 'pending' },
        'Testing': { order: 6, progress: 0, status: 'pending' },
        'Launch': { order: 7, progress: 0, status: 'pending' }
      },
      updates: [],
      lastCommit: rawData.commit || 'unknown',
      lastUpdate: rawData.lastUpdate || this.buildTime,
      deployment: rawData.deployment || {}
    };

    // Process progress updates from commits
    if (rawData.progressUpdates && Array.isArray(rawData.progressUpdates)) {
      rawData.progressUpdates.forEach(update => {
        if (update.phase && update.progress !== undefined) {
          // Update phase status
          if (processed.phases[update.phase]) {
            processed.phases[update.phase].progress = update.progress;
            
            // Mark previous phases as complete
            Object.keys(processed.phases).forEach(phaseName => {
              if (processed.phases[phaseName].order < processed.phases[update.phase].order) {
                processed.phases[phaseName].status = 'complete';
                processed.phases[phaseName].progress = 100;
              }
            });
            
            // Set current phase
            processed.currentPhase = update.phase;
            processed.phases[update.phase].status = 'active';
          }
          
          // Update overall progress
          processed.overallProgress = Math.max(processed.overallProgress, update.progress);
          
          // Add to updates
          processed.updates.push({
            date: new Date(update.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            message: update.message,
            status: `${update.progress}%`,
            commit: update.hash.slice(0, 8),
            phase: update.phase
          });
        }
      });
    }

    // Calculate overall progress from phases if no specific progress given
    if (processed.overallProgress === 15) {
      processed.overallProgress = this.calculateProgressFromPhases(processed.phases);
    }

    return processed;
  }

  /**
   * Calculate progress based on completed phases
   */
  calculateProgressFromPhases(phases) {
    const totalPhases = Object.keys(phases).length;
    const completedPhases = Object.values(phases).filter(p => p.status === 'complete').length;
    const activePhase = Object.values(phases).find(p => p.status === 'active');
    const activeProgress = activePhase ? activePhase.progress : 0;
    
    const baseProgress = (completedPhases / totalPhases) * 100;
    const currentPhaseWeight = (1 / totalPhases) * (activeProgress / 100);
    
    return Math.round(baseProgress + currentPhaseWeight);
  }

  /**
   * Generate live data for frontend consumption
   */
  generateLiveData(processedData) {
    return {
      ...processedData,
      buildInfo: {
        buildTime: this.buildTime,
        environment: process.env.VERCEL_ENV || 'development',
        version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
      },
      api: {
        endpoints: {
          progress: '/api/inex/progress',
          updates: '/api/inex/updates',
          phases: '/api/inex/phases'
        },
        lastSync: this.buildTime
      }
    };
  }

  /**
   * Write live data to public directory
   */
  async writeLiveData(liveData) {
    try {
      // Ensure public directory exists
      const publicDir = path.dirname(this.outputPath);
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Write live data
      fs.writeFileSync(this.outputPath, JSON.stringify(liveData, null, 2));
      
      console.log(`📝 Live data written to: ${this.outputPath}`);
      
      // Also write to root for easy access
      const rootPath = path.join(process.cwd(), 'inex-live-data.json');
      fs.writeFileSync(rootPath, JSON.stringify(liveData, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to write live data:', error);
      throw error;
    }
  }

  /**
   * Update environment variables for build
   */
  updateEnvironmentVariables(liveData) {
    // Set environment variables that can be used during build
    process.env.NEXT_PUBLIC_INEX_PHASE = liveData.currentPhase;
    process.env.NEXT_PUBLIC_INEX_PROGRESS = liveData.overallProgress.toString();
    process.env.NEXT_PUBLIC_INEX_LAST_UPDATE = liveData.lastUpdate;
    
    console.log('🔧 Environment variables updated for build');
  }

  /**
   * Create default data if no progress data exists
   */
  async createDefaultData() {
    const defaultData = {
      currentPhase: 'Design',
      overallProgress: 15,
      phases: {
        'Discovery': { order: 1, progress: 15, status: 'complete' },
        'Design': { order: 2, progress: 0, status: 'active' },
        'Shell': { order: 3, progress: 0, status: 'pending' },
        'Features': { order: 4, progress: 0, status: 'pending' },
        'Integration': { order: 5, progress: 0, status: 'pending' },
        'Testing': { order: 6, progress: 0, status: 'pending' },
        'Launch': { order: 7, progress: 0, status: 'pending' }
      },
      updates: [],
      lastCommit: 'initial',
      lastUpdate: this.buildTime,
      deployment: { environment: 'initial', triggeredBy: 'system', timestamp: this.buildTime },
      buildInfo: {
        buildTime: this.buildTime,
        environment: 'development',
        version: 'initial'
      }
    };

    await this.writeLiveData(defaultData);
    console.log('📝 Default data created');
  }
}

// Execute if this file is run directly
if (require.main === module) {
  const integration = new INEXVercelIntegration();
  integration.execute().catch(console.error);
}

module.exports = INEXVercelIntegration;
