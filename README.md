# Data Vault Backend - Data Science Escape Room

A complete backend API for the Data Vault escape room game built with Node.js, Express, and MongoDB.

## Features

- Team registration and authentication
- 10 sequential data science puzzles
- Real-time scoring system
- Hint system with penalties
- Admin dashboard
- Leaderboard functionality
- CSV export for results

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Copy .env file and update values
   cp .env.example .env
   ```

3. **Start MongoDB:**
   ```bash
   # If using local MongoDB
   mongod
   ```

4. **Seed the database:**
   ```bash
   npm run seed
   ```

5. **Start the server:**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/datavault
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## API Endpoints

### Team Routes
- `POST /api/team/register` - Register new team
- `GET /api/team/leaderboard` - Get leaderboard
- `POST /api/team/answer/submit` - Submit answer
- `POST /api/team/hint/use` - Use hint
- `POST /api/team/final/submit` - Submit final vault code
- `GET /api/team/progress` - Get team progress

### Question Routes
- `GET /api/question/:id` - Get question by ID

### Admin Routes
- `POST /api/admin/login` - Admin login
- `GET /api/admin/teams` - Get all teams
- `GET /api/admin/results` - Get game statistics
- `GET /api/admin/export-csv` - Export results as CSV
- `DELETE /api/admin/reset` - Reset game data

## Database Schema

### Team Model
```javascript
{
  teamName: String,
  collegeName: String,
  startTime: Date,
  endTime: Date,
  currentQuestion: Number,
  digitsUnlocked: [Number],
  attemptsPerQuestion: Map,
  hintsUsed: Map,
  score: Number,
  finished: Boolean,
  finalTime: Number
}
```

### Question Model
```javascript
{
  questionId: Number,
  questionText: String,
  dataset: Mixed,
  answer: String,
  hintText: String,
  learnContent: String,
  digitValue: Number
}
```

## Scoring System

- **Base Score:** 10 points per correct answer
- **Hint Penalty:** -2 points per hint used
- **Attempt Penalty:** -1 point per extra wrong attempt
- **Ranking:** Sorted by completion time (ascending), then score (descending)

## Game Flow

1. Team registers with name and college
2. Team progresses through 10 sequential puzzles
3. Each correct answer unlocks a digit (0-9)
4. After 2 wrong attempts, hint becomes available
5. Final 10-digit code must be entered to complete game
6. Teams are ranked on leaderboard

## Final Vault Code

The correct final code is: **7392518460**
(Digits from questions 1-10 in order)

## Security Features

- JWT authentication
- Rate limiting
- Helmet security headers
- CORS protection
- Password hashing
- Input validation

## Development

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Seed database with sample data
npm run seed

# Start production server
npm start
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Update CORS origin to your frontend domain
3. Use strong JWT secret
4. Use MongoDB Atlas or secure MongoDB instance
5. Enable HTTPS
6. Set up proper logging

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error:**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env

2. **JWT Token Issues:**
   - Verify JWT_SECRET is set
   - Check token format in requests

3. **CORS Errors:**
   - Update CORS origin in server.js
   - Ensure frontend URL matches

### Logs

Check console output for detailed error messages and debugging information.

## API Testing

Use tools like Postman or curl to test endpoints:

```bash
# Register team
curl -X POST http://localhost:5000/api/team/register \
  -H "Content-Type: application/json" \
  -d '{"teamName":"Test Team","collegeName":"Test College"}'

# Get question (requires auth token)
curl -X GET http://localhost:5000/api/question/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Support

For issues and questions, check the console logs and ensure all dependencies are properly installed.