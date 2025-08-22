# Freestyle App - Complete Documentation

## 🎯 What This App Does
Freestyle is a goal tracking app where users set goals, complete daily actions, and share progress with their circle (close friends) or followers (broader network).

---

## 📱 App Screens (4 Main Tabs)

### 1. **Social Tab** (`src/features/social/SocialScreen.tsx`)
- **Purpose**: See posts from your circle and people you follow
- **Components**:
  - `LiquidGlassTabs` - Toggle between "Your Circle" and "Following"
  - `FeedCard` - Shows each post (check-ins, photos, status updates)
  - `ShareComposer` - Create new posts
- **User Actions**:
  - Switch between Circle/Following feeds
  - Create posts (text, photo, audio)
  - React with emojis
  - Comment on posts

### 2. **Daily Tab** (`src/features/daily/DailyScreen.tsx`)
- **Purpose**: Today's tasks and habits
- **Components**:
  - `RadialProgress` - Big circular progress indicator
  - `ActionItem` - Each task/habit to complete
  - `DailyReviewModal` - End-of-day review
- **User Actions**:
  - View today's actions
  - Mark actions as complete
  - See current streak
  - Review day at evening

### 3. **Progress Tab** (`src/features/progress/ProgressMVPEnhanced.tsx`)
- **Purpose**: Track goal progress over time
- **Components**:
  - Dual ring progress visualization
  - Goal cards with milestones
  - Linked actions display
- **User Actions**:
  - View all goals
  - See milestone progress
  - Track consistency metrics
  - Edit goals

### 4. **Profile Tab** (`src/features/profile/ProfileEnhanced.tsx`)
- **Purpose**: User settings and achievements
- **Components**:
  - Avatar and stats display
  - Achievement badges
  - Recent posts
  - Settings buttons
- **User Actions**:
  - Change avatar
  - View stats
  - Logout

---

## 🔄 User Flows (How Users Use The App)

### New User Flow:
```
1. Open App → Login Screen
2. Sign Up with email/password
3. Onboarding Flow:
   - Choose journey type
   - Set main goal
   - Create milestones
   - Define daily actions
   - Review and commit
4. Land on Social tab
```

### Daily Usage Flow:
```
1. Open App → Auto-login
2. Go to Daily tab
3. Complete actions (mark as done)
4. Choose to share or keep private
5. If shared → Creates post in Social feed
6. Evening → Review prompt appears
```

### Social Interaction Flow:
```
1. Social tab shows two feeds:
   - "Your Circle" - Close friends only
   - "Following" - People you follow
2. Scroll feed → See posts
3. Tap emoji → React to post
4. Tap comment → Add comment
5. Tap + → Create new post
```

---

## 🗄️ Database Tables (What We Store)

### Users & Auth
```sql
users
- id (unique identifier)
- email
- name
- avatar (emoji or image URL)
- circle_id (which circle they belong to)
```

### Goals & Actions
```sql
goals
- id
- user_id (who owns this goal)
- title ("Run a marathon")
- metric ("26.2 miles")
- deadline ("2025-06-01")
- category ("fitness")

actions
- id
- user_id
- goal_id (linked goal, optional)
- title ("Morning run")
- date (YYYY-MM-DD)
- completed (true/false)
- time ("07:00")
```

### Social Content
```sql
posts
- id
- user_id
- type ('checkin'|'status'|'photo'|'audio')
- visibility ('circle'|'follow')
- content (text)
- media_url (for photos/audio)
- created_at

reactions
- post_id
- user_id
- emoji ('🔥'|'💪'|'👏'|etc)
```

---

## 🔌 API Endpoints (How Frontend Talks to Backend)

### Authentication
```javascript
// Sign up new user
supabaseService.signUp(email, password, name)

// Sign in existing user
supabaseService.signIn(email, password)

// Sign out
supabaseService.signOut()
```

### Goals
```javascript
// Get all user's goals
supabaseService.getGoals()
// Returns: [{id, title, metric, deadline, category}]

// Create new goal
supabaseService.createGoal({
  title: "Run marathon",
  metric: "26.2 miles",
  deadline: "2025-06-01",
  category: "fitness"
})

// Update goal
supabaseService.updateGoal(goalId, {title: "New title"})

// Delete goal
supabaseService.deleteGoal(goalId)
```

### Daily Actions
```javascript
// Get today's actions
supabaseService.getDailyActions()
// Returns: [{id, title, completed, time, goalId}]

// Create action
supabaseService.createAction({
  title: "Morning run",
  time: "07:00",
  goalId: "abc123" // optional
})

// Mark as complete
supabaseService.completeAction(actionId)
```

### Social Feed
```javascript
// Get feed posts
supabaseService.getFeed('circle') // or 'follow'
// Returns: [{id, user, content, type, reactions, timestamp}]

// Create post
supabaseService.createPost({
  type: 'checkin',
  visibility: 'circle',
  content: "Just finished my morning run!",
  mediaUrl: null // or base64 image
})

// React to post
supabaseService.reactToPost(postId, '🔥')
```

---

## 🧩 Component Structure

### Screen Components (Full Pages)
```
src/features/
├── auth/LoginScreen.tsx          - Login page
├── daily/DailyScreen.tsx         - Daily tasks page
├── social/SocialScreen.tsx       - Social feed page
├── progress/ProgressMVPEnhanced.tsx - Progress page
└── profile/ProfileEnhanced.tsx   - Profile page
```

### Reusable UI Components
```
src/ui/
├── Button.tsx          - Standard button
├── Card.tsx           - Card container
├── EmptyState.tsx     - "No items" display
├── HapticButton.tsx   - Button with vibration
├── RadialProgress.tsx - Circular progress
└── atoms/
    ├── CheckmarkAnimated.tsx  - Animated checkmark
    ├── StreakBadgeAnimated.tsx - Streak counter
    └── NeonDivider.tsx        - Glowing divider
```

---

## 🎨 Styling System

### Theme Colors
```javascript
Primary: {
  gold: '#FFD700',      // Main accent
  darkGold: '#B8860B'   // Darker variant
}
Secondary: {
  platinum: '#E5E4E2',  // Light gray
  silver: '#C0C0C0'     // Medium gray
}
Background: '#000000'   // Pure black
```

### Common Styles
```javascript
// Glass effect
backgroundColor: 'rgba(255,255,255,0.05)'
borderColor: 'rgba(255,255,255,0.1)'

// Gold glow
shadowColor: '#FFD700'
shadowOpacity: 0.3

// Standard spacing
padding: 16
marginBottom: 12
borderRadius: 16
```

---

## 🔧 Technical Details

### State Management (Zustand)
```javascript
// Access state anywhere
const user = useStore(s => s.user)
const goals = useStore(s => s.goals)

// Update state
const setUser = useStore(s => s.setUser)
setUser({name: "John", email: "john@example.com"})
```

### Field Name Mapping
```javascript
// Frontend uses camelCase
{goalId, mediaUrl, createdAt}

// Supabase uses snake_case
{goal_id, media_url, created_at}

// Mapping happens in supabaseService.ts
```

### Backend Switching
```javascript
// In src/config/app.config.ts
backend: 'supabase' // or 'custom'

// backendService.ts automatically routes to correct backend
```

---

## 🚀 Quick Start for New Developers

### 1. Setup
```bash
npm install
npx expo start
```

### 2. Key Files to Understand
- `App.tsx` - Entry point
- `src/AppWithAuth.tsx` - Main navigation
- `src/state/rootStore.ts` - Global state
- `src/services/supabase.service.ts` - API calls

### 3. Making Changes
- **Add new screen**: Create in `src/features/[feature]/`
- **Add UI component**: Create in `src/ui/`
- **Add API call**: Add to `supabaseService.ts`
- **Update state**: Modify relevant slice in `src/state/slices/`

### 4. Testing
```bash
# Run locally
npm start

# Deploy to TestFlight
eas build --platform ios --auto-submit
```

---

## ⚠️ Important Notes

1. **Always use SafeAreaView** for iOS notch/Dynamic Island
2. **Map field names** between camelCase (frontend) and snake_case (backend)
3. **Test on real device** - Some features don't work in browser
4. **Email verification disabled** in Supabase for easier testing
5. **Build number** must increment for each TestFlight submission

---

## 📞 Getting Help

- Check this documentation first
- Look at similar components for patterns
- Test locally before deploying
- Use console.log for debugging

---

This is a living document. Update it when you add new features!