# HabitLink 📱

A beautiful habit tracking app built with React Native and Expo, featuring social connectivity to help you build better habits with friends.

## ✨ Features

### 🎯 Core Habit Tracking
- **Create & Manage Habits**: Add, edit, and delete personal habits with detailed descriptions
- **Progress Tracking**: Track daily completions with streak counters and progress visualization
- **Smart Analytics**: View completion rates, current streaks, and daily statistics
- **Flexible Habit Types**: Support for both binary (yes/no) and quantitative habits with custom targets

### 👥 Social Features
- **Friend System**: Connect with friends to stay motivated together
- **Activity Feed**: See your friends' habit completions and celebrate milestones
- **Friend Discovery**: Find and add new friends to expand your support network
- **Social Stats**: Compare progress with friends and stay accountable

### 🎨 Beautiful UI/UX
- **Modern Design**: Clean, intuitive interface with smooth animations
- **Dark Theme**: Eye-friendly dark theme with beautiful gradients
- **Responsive Layout**: Optimized for all screen sizes
- **Smooth Animations**: Delightful micro-interactions and transitions

### 🔔 Smart Notifications
- **Daily Reminders**: Get notified to complete your habits
- **Milestone Celebrations**: Celebrate achievement milestones
- **Friend Activity**: Stay updated on your friends' progress

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env` file:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start the app**
   ```bash
   npm start
   ```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React Context providers
├── navigation/         # Navigation configuration
├── screens/           # Application screens
│   ├── habit/         # Habit-related screens
│   ├── social/        # Social features
│   └── profile/       # User profile
├── services/          # External service integrations
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and constants
```

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation v7
- **State Management**: React Context API
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI Components**: Custom components with React Native
- **Animations**: React Native Reanimated
- **Charts**: React Native Chart Kit
- **Storage**: AsyncStorage for local data persistence

## 🔧 Setup

1. Create a Supabase project
2. Set up your database schema
3. Configure authentication and RLS policies
4. Add your Supabase credentials to `.env`

## 📦 Scripts

- `npm start` - Start development server
- `npm run ios` - Run on iOS
- `npm run android` - Run on Android
- `npm run web` - Run on web

## 🎨 Customization

The app uses a centralized theme system in `src/utils/theme.ts`. You can customize colors, typography, spacing, and more.

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Happy habit building! 🎯**
