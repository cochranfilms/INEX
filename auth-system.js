// INEX Unified Authentication System
// This module provides consistent authentication across all INEX pages

class INEXAuthSystem {
  constructor() {
    this.firebaseAuth = null;
    this.currentUser = null;
    this.authStateListeners = [];
    this.isInitialized = false;
    
    // Allowed emails for access control
    this.allowedEmails = [
      'info@inexsystemsdesigns.com',
      'info@cochranfilms.com', 
      'codylcochran89@gmail.com'
    ];
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  async init() {
    try {
      // Load allowed users from JSON if available
      await this.hydrateAllowedEmails();
      
      // Initialize Firebase
      await this.initFirebase();
      
      // Set up auth state listener
      this.setupAuthStateListener();
      
      // Update UI based on current state
      this.updateAuthUI();
      
      this.isInitialized = true;
      console.log('✅ INEX Auth System initialized successfully');
      
      // Notify listeners
      this.notifyAuthStateChange();
      
    } catch (error) {
      console.error('❌ INEX Auth System initialization failed:', error);
    }
  }

  async hydrateAllowedEmails() {
    try {
      const response = await fetch('allowed-users.json', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.allowedEmails)) {
          this.allowedEmails = this.allowedEmails.concat(
            data.allowedEmails
              .map(email => String(email || '').trim().toLowerCase())
              .filter(Boolean)
          );
        }
      }
    } catch (error) {
      console.log('Using default allowed emails list');
    }
  }

  async initFirebase() {
    try {
      // Wait for Firebase to be available
      if (typeof firebase === 'undefined') {
        await new Promise(resolve => {
          const checkFirebase = () => {
            if (typeof firebase !== 'undefined') {
              resolve();
            } else {
              setTimeout(checkFirebase, 100);
            }
          };
          checkFirebase();
        });
      }

      // Initialize Firebase app
      if (!firebase.apps.length) {
        firebase.initializeApp(window.FIREBASE_CONFIG);
      }
      
      this.firebaseAuth = firebase.auth();
      console.log('Firebase initialized successfully');
      
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      throw error;
    }
  }

  setupAuthStateListener() {
    if (!this.firebaseAuth) return;
    
    this.firebaseAuth.onAuthStateChanged((user) => {
      this.currentUser = user;
      console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
      
      // Update UI
      this.updateAuthUI();
      
      // Notify listeners
      this.notifyAuthStateChange();
      
      // Store auth state in localStorage for cross-page consistency
      if (user) {
        localStorage.setItem('inex_auth_user', JSON.stringify({
          email: user.email,
          uid: user.uid,
          timestamp: Date.now()
        }));
      } else {
        localStorage.removeItem('inex_auth_user');
      }
    });
  }

  updateAuthUI() {
    // Update auth banner visibility
    const authBanner = document.getElementById('authBanner');
    const signOutBtn = document.getElementById('signOutBtn');
    const userInfo = document.getElementById('userInfo');
    
    if (this.currentUser && this.isAllowedEmail(this.currentUser.email)) {
      // User is authenticated and allowed
      if (authBanner) authBanner.style.display = 'none';
      if (signOutBtn) signOutBtn.style.display = 'inline-flex';
      if (userInfo) {
        userInfo.style.display = 'block';
        userInfo.innerHTML = `
          <span style="color: #22c55e; font-weight: 600;">
            <i class="fa-solid fa-user-check"></i> ${this.currentUser.email}
          </span>
        `;
      }
    } else {
      // User is not authenticated or not allowed
      if (authBanner) authBanner.style.display = 'block';
      if (signOutBtn) signOutBtn.style.display = 'none';
      if (userInfo) userInfo.style.display = 'none';
    }
  }

  isAllowedEmail(email) {
    if (!email) return false;
    return this.allowedEmails.includes(String(email).trim().toLowerCase());
  }

  async signIn(email, password) {
    try {
      if (!this.firebaseAuth) {
        throw new Error('Firebase not initialized');
      }
      
      const userCredential = await this.firebaseAuth.signInWithEmailAndPassword(email, password);
      
      if (!this.isAllowedEmail(userCredential.user.email)) {
        await this.firebaseAuth.signOut();
        throw new Error('Access restricted to authorized emails');
      }
      
      console.log('✅ Sign in successful:', userCredential.user.email);
      return userCredential.user;
      
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      throw error;
    }
  }

  async signUp(email, password) {
    try {
      if (!this.firebaseAuth) {
        throw new Error('Firebase not initialized');
      }
      
      if (!this.isAllowedEmail(email)) {
        throw new Error('Access restricted to authorized emails');
      }
      
      const userCredential = await this.firebaseAuth.createUserWithEmailAndPassword(email, password);
      console.log('✅ Account created successfully:', userCredential.user.email);
      return userCredential.user;
      
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      if (this.firebaseAuth) {
        await this.firebaseAuth.signOut();
      }
      
      // Clear local storage
      localStorage.removeItem('inex_auth_user');
      
      console.log('✅ Sign out successful');
      
      // Force page reload to ensure clean state
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }

  async sendSignInLink(email) {
    try {
      if (!this.firebaseAuth) {
        throw new Error('Firebase not initialized');
      }
      
      if (!this.isAllowedEmail(email)) {
        throw new Error('Access restricted to authorized emails');
      }
      
      const actionCodeSettings = {
        url: window.location.href,
        handleCodeInApp: true
      };
      
      await this.firebaseAuth.sendSignInLinkToEmail(email, actionCodeSettings);
      
      // Store email for later use
      localStorage.setItem('emailForSignIn', email);
      
      console.log('✅ Sign-in link sent to:', email);
      return true;
      
    } catch (error) {
      console.error('❌ Send sign-in link failed:', error);
      throw error;
    }
  }

  async completeSignInWithLink() {
    try {
      if (!this.firebaseAuth) {
        throw new Error('Firebase not initialized');
      }
      
      if (!this.firebaseAuth.isSignInWithEmailLink(window.location.href)) {
        return false;
      }
      
      let email = localStorage.getItem('emailForSignIn');
      if (!email) {
        email = prompt('Please confirm your email address:');
      }
      
      if (!email) {
        throw new Error('Email required to complete sign-in');
      }
      
      const result = await this.firebaseAuth.signInWithEmailLink(email, window.location.href);
      
      // Clean up
      localStorage.removeItem('emailForSignIn');
      
      console.log('✅ Sign-in with link completed:', result.user.email);
      return result.user;
      
    } catch (error) {
      console.error('❌ Complete sign-in with link failed:', error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser && this.isAllowedEmail(this.currentUser.email);
  }

  addAuthStateListener(callback) {
    this.authStateListeners.push(callback);
    // Call immediately with current state
    if (this.isInitialized) {
      callback(this.currentUser);
    }
  }

  removeAuthStateListener(callback) {
    const index = this.authStateListeners.indexOf(callback);
    if (index > -1) {
      this.authStateListeners.splice(index, 1);
    }
  }

  notifyAuthStateChange() {
    this.authStateListeners.forEach(callback => {
      try {
        callback(this.currentUser);
      } catch (error) {
        console.error('Auth state listener error:', error);
      }
    });
  }

  // Utility method to check if user should have access to specific features
  hasAccess(feature) {
    if (!this.isAuthenticated()) return false;
    
    // Add feature-based access control here if needed
    switch (feature) {
      case 'admin':
        return this.currentUser.email === 'codylcochran89@gmail.com';
      case 'inex':
        return this.currentUser.email === 'info@inexsystemsdesigns.com';
      case 'cochran':
        return this.currentUser.email === 'info@cochranfilms.com';
      default:
        return true;
    }
  }
}

// Create global instance
window.inexAuth = new INEXAuthSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = INEXAuthSystem;
}
