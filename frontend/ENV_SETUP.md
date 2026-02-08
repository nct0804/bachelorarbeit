# Environment Variables Setup

## Frontend (.env file)

Create a `.env` file in the `frontend` directory with the following content:

```env
# API Configuration
VITE_API_URL=http://localhost:3000

# Social Authentication
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
VITE_APPLE_CLIENT_ID=your_apple_client_id_here

# Development
VITE_DEV_MODE=true
```

## Backend (.env file)

Make sure your backend `.env` file has:

```env
# Database
DATABASE_URL="postgresql://germangains:germangains@db:5432/germangainsdb?schema=public"

# JWT Secrets
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Social Authentication
GOOGLE_CLIENT_ID=your_google_client_id_here
APPLE_CLIENT_ID=your_apple_client_id_here
FACEBOOK_APP_ID=your_facebook_app_id_here

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4242
```

## Getting Social Provider Credentials

### Google Sign-In
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Set Application Type to "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:4242` (for Docker)
   - `http://localhost:5173` (for development)
7. Copy the Client ID

### Facebook Login
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select existing one
3. Add Facebook Login product
4. Go to Settings → Basic
5. Copy the App ID
6. Add authorized domains: `localhost`

### Apple Sign-In
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create a new app or select existing one
3. Enable Sign in with Apple capability
4. Create a Service ID
5. Copy the Service ID

## Testing

After setting up the environment variables:

1. Restart Docker containers: `docker-compose restart`
2. Open http://localhost:4242
3. Go to login/register page
4. Try the social login buttons
5. Check browser console for any errors 