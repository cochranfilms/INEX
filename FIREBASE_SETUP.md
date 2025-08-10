# Firebase Setup for Local Development

## Problem
The INEX Portal uses Firebase for authentication, but when running locally with a simple HTTP server, the Firebase configuration API endpoint (`/api/firebase/public-config`) is not available, causing the error:

```
Firebase public config missing API unreachable
```

## Solution
We've implemented a local Firebase configuration system that allows you to run the portal locally without needing the serverless API.

## Setup Steps

### 1. Get Your Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon (⚙️) next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. Click on your web app or create a new one
7. Copy the configuration values

### 2. Create Local Config File
1. Copy `firebase-config.example.js` to `firebase-config.js`
2. Fill in your actual Firebase project values:

```javascript
window.FIREBASE_CONFIG = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  appId: "your-app-id",
  messagingSenderId: "your-sender-id",
  storageBucket: "your-project.appspot.com"
};
```

### 3. Run Locally
```bash
./serve.sh
```

The portal will now use your local Firebase configuration instead of trying to call the API endpoint.

## How It Works
- **Local Development**: Uses `firebase-config.js` for Firebase configuration
- **Production**: Falls back to the API endpoint (`/api/firebase/public-config`) when available
- **Backward Compatibility**: Existing hardcoded values in some files still work as fallbacks

## Security Notes
- `firebase-config.js` is excluded from git (added to .gitignore)
- Only client-safe Firebase config values are exposed
- API keys are safe to expose in client-side code (Firebase security is handled server-side)

## Troubleshooting
- If you see "Firebase configuration incomplete", check that your `firebase-config.js` has the required fields
- Required fields: `apiKey`, `authDomain`, `projectId`
- Optional fields: `appId`, `messagingSenderId`, `storageBucket`
