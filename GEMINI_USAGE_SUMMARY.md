# Gemini API Usage Summary

## Overview
Gemini API (Google Generative AI) is being used extensively throughout the Vibely backend. Here's a comprehensive breakdown of all usage locations:

## Configuration
- **API Key**: Set in `backend/app.js` (line 5)
  - Environment variable: `GEMINI_KEY`
  - Fallback hardcoded key: `AIzaSyDwAi9MThmlibUi7pjXr2qEi3Kp-shFcMI`
- **Model**: `gemini-1.5-flash` (used consistently across all services)

---

## 1. **Embedding Service** (`backend/services/embeddingService.js`)
**Purpose**: Generate vector embeddings for user preferences using Gemini Embedding API

**API Calls**:
- **Embedding API** (REST): `text-embedding-004` model
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent`
  - Called when: User saves preferences (movies, music, shows)
  - Used for: Creating vector embeddings for matching algorithm

**Indirect Calls**:
- Calls `psychologicalProfileService.generatePsychologicalEmbeddingText()` which uses Gemini

**Logging**: 
- `[Embedding] 🧠 Generating psychological profile...`
- `[Gemini API] 🔗 Calling Gemini Embedding API...`
- `[Gemini API] ✅ Embedding API call successful!`

---

## 2. **Psychological Profile Service** (`backend/services/psychologicalProfileService.js`)
**Purpose**: Analyze entertainment preferences to extract psychological traits

**Functions**:
- `analyzePsychologicalProfile()` - Analyzes user preferences
- `generatePsychologicalEmbeddingText()` - Creates rich text for embeddings

**Indirect Calls**:
- Calls `itemAnalysisService.analyzeAllItems()` which makes multiple Gemini API calls

**Logging**:
- `[Psychological Profile] 🧠 Starting deep AI analysis...`
- `❌ [Gemini API] Psychological profiling error:`

---

## 3. **Item Analysis Service** (`backend/services/itemAnalysisService.js`)
**Purpose**: Deep analysis of individual entertainment items (movies, music, shows)

**API Calls**:
- `analyzeItem()` - Analyzes a single item
  - Called for each movie/music/show (up to 10 of each type)
  - Extracts: psychological traits, emotional themes, personality indicators
  
- `combineAnalyses()` - Combines all individual analyses
  - Creates comprehensive personality profile
  - Synthesizes traits into personality type

**Logging**:
- `[Item Analysis] Analyzing movie: "..."`
- `[Item Analysis] ✅ Analyzed "..."`
- `[Item Analysis] 🔄 Combining X individual analyses...`

**Note**: This service can make **many API calls** (up to 30+ per user if they have 10 movies, 10 music, 10 shows)

---

## 4. **Chat AI Controller** (`backend/controllers/chatAIController.js`)
**Purpose**: Enhance and moderate chat messages

**API Calls**:
- `enhanceChat()` - Rewrites messages in different styles
  - Modes: flirty, funny, shorter, nicer, clearer
  - Temperature: 0.7
  
- `moderateMessage()` - Content moderation
  - Checks for inappropriate content
  - Temperature: 0.1 (more deterministic)

**Routes**:
- `POST /api/ai-chat/enhance`
- `POST /api/ai-chat/moderate`

---

## 5. **AI Recommendation Controller** (`backend/controllers/aiRecommendationController.js`)
**Purpose**: Generate personalized entertainment recommendations

**API Calls**:
- `getRecommendations()` - Creates movie/music/show recommendations
  - Temperature: 0.9 (more creative)
  - Returns JSON with recommendations

**Route**:
- `GET /api/recommend/:userId`

---

## 6. **Conversation Controller** (`backend/controllers/conversationController.js`)
**Purpose**: Generate conversation starters for matched users

**API Calls**:
- `getConversationStarters()` - Creates icebreaker messages
  - Temperature: 0.8
  - Returns 5 unique conversation starters

**Route**:
- `POST /api/ai/starter`

---

## 7. **Auto Tag Service** (`backend/services/autoTagService.js`)
**Purpose**: Auto-tag entertainment items with metadata

**API Calls**:
- `autoTagItem()` - Predicts genre, language, mood, theme
  - Temperature: 0.4 (more factual)
  - Returns structured metadata

**Usage**: Called when items are added to preferences

---

## API Call Flow Examples

### When User Saves Preferences:
1. `tasteController.savePreferences()` is called
2. → `embeddingService.generateEmbedding()`
3. → `psychologicalProfileService.generatePsychologicalEmbeddingText()`
4. → `psychologicalProfileService.analyzePsychologicalProfile()`
5. → `itemAnalysisService.analyzeAllItems()`
   - Makes up to 30 API calls (10 movies + 10 music + 10 shows)
6. → `itemAnalysisService.combineAnalyses()` (1 more API call)
7. → `embeddingService` calls Gemini Embedding API (REST call)

**Total**: ~32+ Gemini API calls per user preference save!

### When User Requests Recommendations:
1. `aiRecommendationController.getRecommendations()` 
2. → 1 Gemini API call

### When User Requests Conversation Starters:
1. `conversationController.getConversationStarters()`
2. → 1 Gemini API call

---

## Monitoring & Debugging

### Console Logs to Watch For:
- `[Embedding] 🧠 Generating psychological profile...`
- `[Gemini API] 🔗 Calling Gemini Embedding API...`
- `[Item Analysis] Analyzing...`
- `[Psychological Profile] 🧠 Starting deep AI analysis...`
- `❌ [Gemini API]` - Error logs

### Error Handling:
- Most services have try-catch blocks
- Fallback to default values on errors
- Errors are logged but don't crash the server

---

## Potential Issues

1. **High API Call Volume**: 
   - Saving preferences triggers 30+ API calls
   - Could hit rate limits or be expensive

2. **No Rate Limiting**: 
   - No throttling mechanism visible
   - Could overwhelm Gemini API

3. **Error Recovery**: 
   - Some services return defaults on error
   - May silently fail without user notification

4. **API Key Security**: 
   - Hardcoded fallback key in code
   - Should use environment variables only

---

## Recommendations

1. **Add Rate Limiting**: Implement delays between API calls
2. **Batch Processing**: Consider batching item analyses
3. **Caching**: Cache psychological profiles to avoid re-analysis
4. **Monitoring**: Add metrics to track API usage
5. **Error Alerts**: Better error notification system

