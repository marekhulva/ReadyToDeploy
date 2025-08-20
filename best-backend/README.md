# Best App Backend API

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Run the server
```bash
# Simple JavaScript server (no database required)
node src/server.js

# Or with TypeScript (requires database)
npm run dev
```

Server will run on http://localhost:3001

## 📋 API Endpoints

### Health Check
- `GET /health` - Check if server is running
- `GET /` - API info

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)

### Goals (Mock data for now)
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Daily Actions (Mock data for now)
- `GET /api/actions/daily` - Get today's actions
- `POST /api/actions` - Create action
- `PUT /api/actions/:id/complete` - Mark action complete

### Social Feed (Coming soon)
- `GET /api/feed/circle` - Get circle feed
- `GET /api/feed/follow` - Get following feed
- `POST /api/posts` - Create post
- `POST /api/posts/:id/react` - React to post

## 🔧 Development

### Project Structure
```
best-backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   ├── app.ts          # Express app setup
│   ├── server.ts       # TypeScript server
│   └── server.js       # Simple JS server (for testing)
├── prisma/
│   └── schema.prisma   # Database schema
├── .env                # Environment variables
└── package.json        # Dependencies
```

### Available Scripts
```bash
npm run dev          # Run TypeScript dev server
npm run build        # Build TypeScript
npm run start        # Run production build
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
```

## 🗄️ Database Setup

### Option 1: PostgreSQL (Local)
1. Install PostgreSQL
2. Create database: `createdb best_db`
3. Update DATABASE_URL in .env
4. Run migrations: `npm run prisma:migrate`

### Option 2: Supabase (Free Cloud)
1. Sign up at [supabase.com](https://supabase.com)
2. Create new project
3. Copy database URL to .env
4. Run migrations: `npm run prisma:migrate`

### Option 3: No Database (Testing)
Use `node src/server.js` for in-memory storage

## 🔑 Authentication

The API uses JWT tokens for authentication.

### Register Example
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login Example
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Using Token
```bash
curl http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔗 Frontend Integration

### Install API Service
The frontend already has an API service at:
```
src/services/api.service.ts
```

### Usage in React Native
```typescript
import { apiService } from './services/api.service';

// Login
const result = await apiService.login(email, password);

// Get goals
const goals = await apiService.getGoals();

// Create action
await apiService.createAction({
  title: 'Morning workout',
  time: '07:00'
});
```

### Using Hooks
```typescript
import { useAuth, useGoals } from './hooks/useApi';

function MyComponent() {
  const { login, isAuthenticated } = useAuth();
  const { goals, fetchGoals, loading } = useGoals();
  
  // Use in your component
}
```

## 🚀 Deployment

### Railway (Recommended)
```bash
railway login
railway init
railway add
railway up
```

### Render
1. Push to GitHub
2. Connect repo on render.com
3. Deploy as Web Service

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=your-production-db-url
JWT_SECRET=your-super-secret-key
CLIENT_URL=https://your-app.com
```

## 🛠️ Troubleshooting

### "Cannot connect to database"
- Check DATABASE_URL in .env
- Make sure PostgreSQL is running
- Try the simple server: `node src/server.js`

### "Port already in use"
- Change PORT in .env
- Or kill the process: `killall node`

### "TypeScript errors"
- Run `npm run build` to see all errors
- Use `node src/server.js` for quick testing

## 📚 Next Steps

1. ✅ Basic server setup
2. ✅ Authentication endpoints
3. ⏳ Connect real database
4. ⏳ Implement all CRUD operations
5. ⏳ Add file upload
6. ⏳ Add real-time updates
7. ⏳ Deploy to production

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📝 License

ISC