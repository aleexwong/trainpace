# GPX Chat RAG Pipeline

## Overview

A lightweight Retrieval Augmented Generation (RAG) pipeline that allows runners to have natural conversations with their GPX route data. The system provides intelligent, context-aware responses about elevation profiles, pacing strategies, and race insights.

## Architecture

```
┌─────────────────┐
│   GPX Upload    │
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GPX Analysis   │
│   & Parsing     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Chat Context   │──────▶│  Chat Interface  │
│    Builder      │      │    (UI Layer)    │
└────────┬────────┘      └────────┬─────────┘
         │                        │
         │                        │ User Query
         │                        ▼
         │              ┌──────────────────┐
         │              │   Frontend Chat  │
         │              │     Service      │
         │              └────────┬─────────┘
         │                       │
         │                       │ POST /api/gpx-chat
         │                       ▼
         │              ┌──────────────────┐
         └─────────────▶│   Backend API    │
           GPX Context  │   (RAG Engine)   │
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │   AI Model       │
                        │   (Gemini/GPT)   │
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │   Response       │
                        │   Generation     │
                        └──────────────────┘
```

## Frontend Components

### 1. Types (`src/features/chat/types.ts`)

Defines TypeScript interfaces for:
- `ChatMessage`: Individual message structure
- `GPXChatContext`: Complete route context sent to AI
- `ChatRequest`: API request payload
- `ChatResponse`: API response structure
- `ChatState`: React state management

### 2. Chat Service (`src/services/gpxChat.ts`)

**Key Functions:**

- `sendChatQuery()`: Sends user query + GPX context to backend
- `buildGPXContext()`: Constructs context from route analysis data
- `getSuggestedQuestions()`: Generates smart question suggestions

**GPX Context Structure:**
```typescript
{
  routeId: string,
  routeName: string,
  totalDistance: number,
  elevationGain: number,
  elevationLoss: number,
  segments: [
    {
      type: 'uphill' | 'downhill' | 'flat',
      startDistance: number,
      endDistance: number,
      grade: number,
      challengeRating: string,
      pacingAdvice: string
    }
  ],
  profile: [
    { distance: number, elevation: number, grade: number }
  ],
  goalPace: number,
  gradeThreshold: number
}
```

### 3. Chat Hook (`src/features/chat/hooks/useGPXChat.ts`)

React hook managing:
- Message history
- Loading states
- Error handling
- Context updates
- Message sending

### 4. UI Component (`src/components/chat/GPXChatInterface.tsx`)

Features:
- Clean, scrollable chat interface
- Suggested questions on first load
- Auto-scroll to latest message
- Error alerts
- Loading indicators
- Message timestamp tracking

## Backend API Specification

### Endpoint: `POST /api/gpx-chat`

**Purpose:** Process natural language queries about GPX routes using RAG

**Authentication:** Firebase ID Token (Bearer)

**Request Body:**
```json
{
  "query": "What are the most challenging parts of this route?",
  "context": {
    "routeId": "abc123",
    "routeName": "Boston Marathon 2024",
    "totalDistance": 42.2,
    "elevationGain": 142,
    "elevationLoss": 142,
    "maxElevation": 89,
    "minElevation": 3,
    "segments": [
      {
        "type": "uphill",
        "startDistance": 25.5,
        "endDistance": 27.2,
        "length": 1.7,
        "grade": 3.2,
        "challengeRating": "hard",
        "pacingAdvice": "Reduce pace by 15-20 seconds per km"
      }
    ],
    "profile": [
      { "distance": 0, "elevation": 10, "grade": 0 },
      { "distance": 1, "elevation": 15, "grade": 0.5 }
    ],
    "goalPace": 5.0,
    "gradeThreshold": 2.0
  },
  "conversationHistory": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "Previous question",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "message": "The most challenging part of this route is the uphill section from km 25.5 to 27.2, known as 'Heartbreak Hill'. With a 3.2% grade over 1.7km, you should reduce your pace by 15-20 seconds per km to conserve energy.",
  "suggestions": [
    "How should I fuel for this climb?",
    "What's my estimated time for this section?"
  ],
  "relevantSegments": [5, 6, 7],
  "processingTime": 1234
}
```

**Error Responses:**

- `401`: Authentication failed
- `429`: Rate limit exceeded
- `400`: Invalid request format
- `500`: Server error

### Implementation Guidelines

**Backend RAG Strategy:**

1. **Context Preparation**
   - Flatten GPX context into a searchable text format
   - Include segment details, elevation profile, and race strategy metadata

2. **Prompt Engineering**
   ```
   You are an expert running coach analyzing GPX route data.

   Route: {routeName}
   Distance: {totalDistance}km
   Elevation Gain: {elevationGain}m

   Segments:
   {formatted_segments}

   User Query: {query}

   Provide specific, actionable advice based on this route's terrain.
   Reference specific distances and elevations in your response.
   ```

3. **Conversation Memory**
   - Include last 10 messages for context
   - Maintain conversation flow across queries

4. **Response Enhancement**
   - Generate 2-3 follow-up question suggestions
   - Identify relevant segments referenced in the response
   - Return processing time for analytics

**Recommended AI Models:**

- **OpenAI GPT-4**: Best for complex pacing strategies
- **Google Gemini Pro**: Cost-effective, good for general queries
- **Claude 3**: Excellent for detailed race analysis

**Rate Limiting:**

- 30 requests per minute per user
- 500 requests per hour per user
- Implement exponential backoff on frontend

**Caching Strategy:**

- Cache common questions per route (e.g., "most challenging parts")
- Cache key: `{routeId}_{queryHash}`
- TTL: 24 hours

## Integration with Existing System

### ElevationPageV2 Integration

The chat interface is now integrated into the elevation finder page:

1. **Context Updates**: Automatically syncs when:
   - New GPX file is uploaded
   - Settings change (pace, grade threshold)
   - Route is loaded from URL

2. **Data Flow**:
   ```
   Upload/Load GPX → Analysis → Build Context → Update Chat
   ```

3. **UI Placement**: Below elevation insights, above debug info

## Example Queries

### Beginner Queries
- "What should I know about this route?"
- "Where are the hills?"
- "Is this route suitable for beginners?"

### Advanced Queries
- "How should I pace the climbs based on my 5:00/km goal?"
- "What's the best fueling strategy for the elevation profile?"
- "Should I adjust my race plan for the late-race downhills?"

### Strategic Queries
- "Where should I push hard and where should I conserve energy?"
- "How does this compare to a typical marathon elevation profile?"
- "What splits should I target for each segment?"

## Testing

### Frontend Testing
```bash
cd vite-project
npm run dev
```

1. Upload a GPX file
2. Wait for analysis to complete
3. Click suggested questions or type custom queries
4. Verify context is sent correctly (check Network tab)

### Backend Testing

**Sample cURL:**
```bash
curl -X POST https://api.trainpace.com/api/gpx-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "query": "What are the hardest climbs?",
    "context": { ... },
    "conversationHistory": []
  }'
```

## Performance Metrics

**Target Metrics:**
- Initial response: < 3 seconds
- Subsequent responses: < 2 seconds
- Context build time: < 100ms
- UI render time: < 50ms

## Future Enhancements

1. **Multi-Route Comparison**
   - "Compare this route to my previous marathon"

2. **Training Plan Integration**
   - "Create a training plan for this route"

3. **Weather Integration**
   - "How should I adjust for hot weather?"

4. **Historical Performance**
   - "Based on my last race, how should I pace this?"

5. **Voice Input**
   - Mobile voice queries during route preview

6. **Export Conversations**
   - Save chat as PDF race plan

## Security Considerations

1. **Authentication**: All requests require Firebase auth
2. **Rate Limiting**: Prevent abuse
3. **Input Validation**: Sanitize all user queries
4. **Context Size**: Limit context to prevent prompt injection
5. **PII Protection**: Never log user queries with identifying info

## Monitoring & Analytics

**Track:**
- Query types (categorize by intent)
- Response quality (user feedback)
- Error rates
- Response times
- Most common routes queried
- Suggested questions clicked vs custom queries

## Backend Implementation Checklist

- [ ] Set up `/api/gpx-chat` endpoint
- [ ] Integrate AI model (Gemini/GPT-4)
- [ ] Implement authentication middleware
- [ ] Add rate limiting
- [ ] Build RAG prompt templates
- [ ] Add response caching
- [ ] Implement error handling
- [ ] Add logging & monitoring
- [ ] Write unit tests
- [ ] Deploy to production
- [ ] Update CORS settings
- [ ] Document API in main docs

## Support

For issues or questions:
- Frontend: Check browser console for errors
- Backend: Check API logs for failed requests
- Chat not working: Verify Firebase auth token is valid
- Context issues: Check GPX analysis data structure
