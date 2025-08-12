# INEX Unified Authentication System

## Overview

The INEX Unified Authentication System provides consistent authentication across all three main pages:
- `index.html` (Dashboard)
- `status.html` (Status Page) 
- `INEX-Portal-Agreement.html` (Agreement Page)

## Architecture

### Core Components

1. **`auth-system.js`** - Central authentication module
2. **Firebase Integration** - Handles all Firebase Auth operations
3. **Cross-page State Management** - Uses localStorage for persistence
4. **Unified Access Control** - Consistent email allowlist across all pages

### Key Features

- **Single Sign-On**: Login once, access all pages
- **Consistent UI**: Same authentication interface across all pages
- **Automatic State Sync**: Authentication state automatically updates across tabs
- **Secure Access Control**: Only authorized emails can access the system
- **Persistent Sessions**: Login persists across page refreshes and browser sessions

## Implementation Details

### Authentication Flow

1. **Page Load**: Each page loads `auth-system.js`
2. **Firebase Init**: System initializes Firebase automatically
3. **State Check**: Checks for existing authentication
4. **UI Update**: Updates authentication UI based on current state
5. **Event Listeners**: Sets up login/logout handlers

### Allowed Emails

The system allows access to these email addresses:
- `info@inexsystemsdesigns.com` (INEX team)
- `info@cochranfilms.com` (Cochran team)
- `codylcochran89@gmail.com` (Cody - admin access)

Additional emails can be added via `allowed-users.json` file.

### Cross-Page Communication

- **localStorage**: Stores authentication state
- **Auth State Listeners**: Each page listens for authentication changes
- **Automatic UI Updates**: UI updates when auth state changes

## Usage

### For Users

1. **Sign In**: Use email/password on any page
2. **Access All Pages**: Once signed in, access all three pages
3. **Sign Out**: Sign out from any page (affects all pages)

### For Developers

1. **Add New Pages**: Include `auth-system.js` and follow the pattern
2. **Customize UI**: Use the provided authentication UI elements
3. **Access Control**: Use `window.inexAuth.hasAccess(feature)` for feature gates

## Page-Specific Integration

### Dashboard (`index.html`)
- Authentication banner with login/signup forms
- User info display when authenticated
- Automatic message attribution to authenticated users

### Status Page (`status.html`)
- Same authentication interface as dashboard
- Access to development tracking features
- User-specific status information

### Agreement Page (`INEX-Portal-Agreement.html`)
- Authentication gate before contract access
- Secure signature verification
- User email tracking for contract notifications

## Testing

Use `test-auth.html` to test the authentication system:
- Test login/logout functionality
- Verify cross-page authentication persistence
- Check access control and permissions

## Security Features

- **Email Validation**: Only pre-approved emails can create accounts
- **Session Management**: Secure Firebase authentication
- **Access Control**: Feature-based permissions
- **Automatic Logout**: Inactive session handling

## Troubleshooting

### Common Issues

1. **Firebase Not Loading**: Check internet connection and Firebase config
2. **Authentication Fails**: Verify email is in allowlist
3. **Cross-page Issues**: Check localStorage and auth state listeners

### Debug Mode

Enable console logging by setting:
```javascript
window.inexAuth.enableDebugMode = true;
```

## Future Enhancements

- **Role-based Access Control**: More granular permissions
- **Session Timeout**: Automatic logout after inactivity
- **Multi-factor Authentication**: Additional security layers
- **Audit Logging**: Track authentication events

## File Structure

```
INEX/
├── auth-system.js              # Core authentication module
├── index.html                  # Dashboard with auth integration
├── status.html                 # Status page with auth integration
├── INEX-Portal-Agreement.html  # Agreement page with auth integration
├── test-auth.html              # Authentication testing page
├── allowed-users.json          # Additional allowed emails
└── UNIFIED_AUTH_SYSTEM.md     # This documentation
```

## Support

For authentication system issues:
1. Check browser console for error messages
2. Verify Firebase configuration
3. Test with `test-auth.html`
4. Check network connectivity to Firebase services
