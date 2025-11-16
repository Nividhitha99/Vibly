# 💜 Vibely

> **Stop swiping on photos. Start matching on vibes.**

Vibely is an AI-powered dating application that matches people based on entertainment preferences and psychological compatibility, creating deeper connections through shared interests rather than surface-level attraction.

![Vibely](https://img.shields.io/badge/Vibely-AI%20Dating%20App-purple)
![React](https://img.shields.io/badge/React-18.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-orange)

## ✨ Features

### 🎯 Smart Matching
- **AI-Powered Compatibility**: Uses Google Gemini AI to analyze entertainment preferences and create psychological profiles
- **Dual Matching Modes**: 
  - **Smart Matching**: AI-based compatibility scoring (60%+ threshold) using embeddings and psychological analysis
  - **Location-Based Matching**: Proximity-focused matching for users who prefer geographic closeness
- **Compatibility Scoring**: Sophisticated algorithm combining:
  - Cosine similarity of entertainment preference embeddings
  - Personality trait alignment
  - Shared cultural and thematic interests
  - Psychological profile compatibility

### 💬 Interactive Features
- **Real-time Chat**: Socket.IO-powered messaging with room-based architecture
- **Jam Sessions**: Shared music experiences for matched users
- **Watch Parties**: Synchronized streaming experiences
- **Real-time Notifications**: Instant updates for matches, likes, and messages

### 🎨 User Experience
- **Modern UI**: Glassmorphism effects, smooth animations, and gradient designs
- **Inclusive Design**: Multiple gender options and flexible matching criteria
- **Entertainment Browsing**: Search and select from TMDB (movies/TV) and Spotify (music) databases
- **Profile Management**: Comprehensive user profiles with preferences and compatibility scores

## 🛠️ Tech Stack

### Frontend
- **React** - UI framework
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **lowdb** - JSON-based database

### AI/ML
- **Google Gemini API**
  - `text-embedding-004` - Vector embeddings for entertainment preferences
  - `gemini-flash-latest` - Psychological profiling and analysis
- **Cosine Similarity** - Matching algorithm
- **Vector Embeddings** - User preference representation

### External APIs
- **TMDB API** - Movies and TV shows database
- **Spotify API** - Music and artists database

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API key
- TMDB API key (optional, for movie/TV search)
- Spotify API credentials (optional, for music search)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Vibly
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend/vibly-ui
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the `backend` directory:
   ```env
   GEMINI_KEY=your_gemini_api_key
   TMDB_API_KEY=your_tmdb_api_key (optional)
   SPOTIFY_CLIENT_ID=your_spotify_client_id (optional)
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret (optional)
   ```

5. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   Server runs on `http://localhost:5001`

6. **Start the frontend development server**
   ```bash
   cd frontend/vibly-ui
   npm start
   ```
   App runs on `http://localhost:3000`

## 📁 Project Structure

```
Vibly/
├── backend/
│   ├── controllers/        # Request handlers
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   │   ├── matchingService.js
│   │   ├── embeddingService.js
│   │   ├── psychologicalProfileService.js
│   │   └── ...
│   ├── utils/            # Utility functions
│   ├── scripts/          # Database scripts
│   └── server.js         # Entry point
│
├── frontend/
│   └── vibly-ui/
│       ├── src/
│       │   ├── components/   # Reusable components
│       │   ├── pages/         # Page components
│       │   └── utils/         # Helper functions
│       └── public/
│
└── README.md
```

## 🎯 How It Works

### 1. User Onboarding
- Users create profiles with basic information
- Select entertainment preferences (movies, music, TV shows)
- Set age and location preferences
- Choose matching mode (Smart or Location-Based)

### 2. AI Processing
- Entertainment preferences are analyzed by Google Gemini AI
- Psychological profiles are generated from preferences
- Vector embeddings are created using `text-embedding-004`
- Compatibility factors are extracted (personality traits, cultural preferences, etc.)

### 3. Matching Algorithm
- Cosine similarity calculates base compatibility scores
- Personality trait overlap provides additional boosts
- Shared entertainment content increases compatibility
- Cultural and thematic alignment enhances scores
- Final scores are normalized (0-1 scale, displayed as percentages)

### 4. User Interaction
- Users swipe through potential matches
- Mutual likes create confirmed matches
- Real-time chat enables communication
- Interactive features (Jam Sessions, Watch Parties) enhance engagement

## 🔧 API Endpoints

### User Management
- `POST /api/user/register` - User registration
- `GET /api/user/:userId` - Get user profile
- `PUT /api/user/:userId` - Update user profile

### Matching
- `GET /api/match/:userId?mode=preferences` - Get potential matches
- `GET /api/match/confirmed/:userId` - Get confirmed matches
- `POST /api/match-status/like` - Send like
- `POST /api/match-status/pass` - Pass on a user

### Preferences
- `GET /api/taste/:userId` - Get user preferences
- `POST /api/taste` - Save preferences
- `GET /api/taste/search/movies` - Search movies (TMDB)
- `GET /api/taste/search/music` - Search music (Spotify)

### Chat
- `GET /api/chat/:roomId` - Get chat messages
- `POST /api/chat/send` - Send message
- Socket.IO events: `sendMessage`, `receiveMessage`

## 🧠 AI Integration

### Google Gemini API Usage

**Embeddings (`text-embedding-004`)**
- Converts entertainment preferences into vector representations
- Enables similarity calculations between users
- 768-dimensional vectors for rich preference encoding

**Psychological Profiling (`gemini-flash-latest`)**
- Analyzes entertainment choices to infer personality traits
- Identifies cultural preferences and thematic interests
- Generates compatibility factors for matching

### Matching Algorithm

```javascript
Base Score = Cosine Similarity(user1_embedding, user2_embedding)
+ Personality Trait Overlap Boost (up to 15%)
+ Shared Content Boost (movies, music, shows)
+ Cultural Alignment Boost
+ Thematic Similarity Boost
Final Score = Normalize(0-1) → Display as Percentage
```

## 🎨 Key Features Explained

### Smart Matching Mode
- Analyzes entertainment preferences using AI
- Creates psychological profiles from user choices
- Calculates compatibility using vector similarity
- Filters matches with 60%+ compatibility threshold

### Location-Based Mode
- Focuses on geographic proximity
- Considers age preferences
- Simpler matching algorithm
- Lower compatibility threshold (40%)

### Real-time Features
- **Chat**: Socket.IO rooms for private messaging
- **Notifications**: Real-time updates for matches and likes
- **Presence**: User online/offline status

## 📊 Database Schema

### Users
- Profile information (name, age, gender, location)
- Profile images
- Preferences (movies, music, shows)
- Psychological profile (generated by AI)
- Embeddings (vector representations)

### Matches
- Match records (fromUser, toUser, status)
- Compatibility scores
- Match timestamps

### Messages
- Chat messages
- Room associations
- Timestamps

## 🔐 Security Considerations

- User authentication via localStorage (development)
- API key management via environment variables
- Input validation on backend
- CORS configuration for frontend-backend communication

## 🚧 Future Enhancements

- [ ] Machine learning model refinement based on user feedback
- [ ] Mobile app development (iOS/Android)
- [ ] Direct streaming platform integration (Netflix, Spotify)
- [ ] Enhanced psychological profiling with more data points
- [ ] Video calls and voice messages
- [ ] Analytics dashboard for users
- [ ] Personalized entertainment recommendations
- [ ] Multi-language support

## 📝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- TMDB for movie and TV show data
- Spotify for music database
- React and Node.js communities
- All contributors and users

## 📧 Contact

For questions, suggestions, or support, please open an issue on GitHub.

---

**Built with 💜 for meaningful connections**

*Stop swiping on photos. Start matching on vibes.*

