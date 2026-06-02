# HR Manager SaaS System

A comprehensive HR management system built with React, TypeScript, Express, and Firebase.

## Features

- Employee Management
- Attendance Tracking
- Payroll Management
- Recruitment
- Performance Reviews
- Document Management
- AI Assistant Integration
- Real-time Notifications

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **AI:** Google Gemini
- **Deployment:** Vercel (Frontend), Render (Backend)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project
- Gemini API key

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd hr-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your Firebase config and Gemini API key

4. Run locally:
   ```bash
   npm run dev
   ```

## Build

```bash
npm run build
```

## Deployment

### Vercel (Frontend + API)
1. Connect your GitHub repo to Vercel
2. Vercel will automatically detect the settings from `vercel.json`
3. Set environment variables in Vercel dashboard

### Render (Backend - if separated)
1. Create a new Web Service on Render
2. Connect your GitHub repo
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables

## Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key
- `FIREBASE_API_KEY`: Firebase API key
- `FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `FIREBASE_APP_ID`: Firebase app ID

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run TypeScript linter

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License
