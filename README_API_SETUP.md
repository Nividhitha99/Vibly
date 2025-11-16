# API Setup Instructions

This application uses TMDB (The Movie Database) and Spotify APIs to provide rich search functionality for movies, TV shows, and music.

## TMDB API Setup

1. Go to https://www.themoviedb.org/
2. Create a free account
3. Go to Settings → API → Request an API Key
4. Choose "Developer" option
5. Fill out the application form
6. Copy your API key

### Setting TMDB API Key

**Option 1: Environment Variable (Recommended)**
Create a `.env` file in the `backend` directory:
```
TMDB_API_KEY=your_tmdb_api_key_here
```

**Option 2: Direct in Code (For Testing Only)**
Edit `backend/services/tmdbService.js` and replace:
```javascript
const TMDB_API_KEY = process.env.TMDB_API_KEY || "YOUR_TMDB_API_KEY_HERE";
```
with your actual API key.

## Spotify API Setup

1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in:
   - App name: "Vibely" (or any name)
   - App description: "Entertainment matching app"
   - Redirect URI: `http://localhost:3000` (for now)
5. Accept the terms and create
6. Copy your **Client ID** and **Client Secret**

### Setting Spotify API Credentials

**Option 1: Environment Variables (Recommended)**
Add to your `.env` file in the `backend` directory:
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

**Option 2: Direct in Code (For Testing Only)**
Edit `backend/services/spotifyService.js` and replace:
```javascript
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "YOUR_SPOTIFY_CLIENT_ID";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "YOUR_SPOTIFY_CLIENT_SECRET";
```
with your actual credentials.

## Features Enabled

Once the APIs are configured:

- **Movies & TV Shows**: Search and select from TMDB database with posters, genres, and metadata
- **Music/Artists**: Search and select from Spotify database with artist images, genres, and popularity
- **Enhanced Matching**: Matching algorithm uses genre overlap, popularity scores, and API metadata for better scoring
- **Rich Display**: Selected items show posters/images in the preferences page

## Testing

After setting up the APIs, restart your backend server and try searching for:
- Movies: "Inception", "The Matrix", etc.
- TV Shows: "Breaking Bad", "Game of Thrones", etc.
- Artists: "The Beatles", "Taylor Swift", etc.

