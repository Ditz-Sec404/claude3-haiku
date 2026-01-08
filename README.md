# Claude 3 AI Chat

Modern, minimalist AI Chat interface powered by Claude 3, built with React, Vite, Tailwind CSS, and Framer Motion.

## Tech Stack

- **Framework**: React + Vite
- **Styling**: Tailwind CSS + Custom LobeUI-inspired Design
- **Animation**: Framer Motion
- **Icons**: Iconsax React
- **AI Backend**: Claude 3 Haiku (via MiniToolAI)
- **Charts**: Chart.js + react-chartjs-2
- **Markdown**: react-markdown + remark-gfm
- **Code Highlighting**: react-syntax-highlighter

## Setup & Run

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

## Project Structure

- `src/App.tsx`: Main Chat Interface and Logic
- `src/lib/claude.ts`: Client-side API caller
- `src/lib/db.ts`: IndexedDB for session storage
- `claude-core.js`: Claude 3 API integration for dev server
- `api/chat.js`: Edge API handler for Vercel deployment
- `vite.config.ts`: Vite configuration with Claude API middleware
- `src/index.css`: Tailwind and Global Styles

## Features

- 🎨 Minimalist, iOS-inspired UI
- 💬 Fast streaming text animation
- 🤖 Claude 3 Haiku AI Model
- ✨ Smooth & lightweight animations
- 📱 Mobile Responsive
- 🌙 Dark/Light mode toggle
- 💾 Persistent chat sessions (IndexedDB)
- 📊 Chart rendering support (Bar, Line, Pie, Donut)
- 📝 Markdown rendering with code syntax highlighting
- 🗂️ Multi-session chat management
- ⏰ Real-time date/time awareness

## Deployment

This project is configured for Vercel deployment with Edge Runtime API.
