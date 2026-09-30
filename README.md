# 🧣 SHMAGH — AI-Powered Jordan Travel Planner

> **Discover Jordan like never before.** SHMAGH is a luxury travel planning platform powered by Google Gemini AI, designed to help travelers explore the rich culture, history, and nature of Jordan with a personalized touch.

🌐 **Live Website:** [https://shmagh-77695.web.app](https://shmagh-77695.web.app)

---

## ✨ Features

- 🤖 **AI Itinerary Generator** — Powered by Google Gemini, generates a fully personalized multi-day travel plan based on your selected destinations, dates, budget, and preferences.
- 🗺️ **Interactive Map** — Explore each destination on a live Mapbox map with markers, routes, and location details.
- 🌤️ **Live Weather** — Real-time 7-day weather forecast for Jordan powered by Open-Meteo API.
- 🍽️ **Restaurant Recommendations** — AI-suggested local Jordanian restaurants for each destination.
- 💎 **Hidden Gems** — Discover off-the-beaten-path spots curated by AI for each location.
- 📖 **Stories & Culture** — Curated travel stories and cultural insights about Jordan.
- 🖼️ **Gallery** — Visual showcase of Jordan's most breathtaking landscapes.
- 🌍 **Bilingual (AR/EN)** — Full Arabic and English support with instant language switching.
- 📱 **Fully Responsive** — Optimized for Desktop, Tablet, and Mobile devices.
- 🔐 **Authentication** — Secure login and registration with Firebase Auth.
- ❤️ **Favorites** — Save your favorite destinations to your profile.
- 🧮 **Currency Converter** — Built-in JOD currency converter toolkit.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| HTML5 / CSS3 / JavaScript | Core web technologies |
| Firebase Hosting | Live website deployment |
| Firebase Firestore | Real-time database |
| Firebase Authentication | User login & registration |
| Mapbox GL JS | Interactive maps |
| Open-Meteo API | Live weather data |
| Phosphor Icons | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| Python / FastAPI | REST API server |
| Google Gemini AI | AI itinerary generation |
| Render.com | Cloud backend hosting |
| httpx | Async HTTP requests |
| firebase-admin | Server-side Firebase access |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (for Firebase CLI)
- Python 3.11+
- A Google Gemini API Key
- A Firebase project

### 1. Clone the Repository
```bash
git clone https://github.com/mm1itriq-dotcom/SHMAGH.git
cd SHMAGH
```

### 2. Run the Backend Locally
```bash
cd backend
pip install -r requirements.txt

# Create a .env file with your API key
echo "GEMINI_API_KEY=your_key_here" > .env

# Start the server
uvicorn main:app --reload
```

### 3. Open the Frontend
Just open `frontend/index.html` in your browser, or use a local server:
```bash
cd frontend
npx serve .
```

---

## 🌐 Deployment

### Frontend → Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

### Backend → Render.com
1. Push your code to GitHub
2. Connect your repo to [Render.com](https://render.com)
3. Set **Build Command:** `pip install -r requirements.txt`
4. Set **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable: `GEMINI_API_KEY=your_key`

---

## 📁 Project Structure

```
SHMAGH/
├── frontend/
│   ├── index.html          # Login / Register page
│   ├── home.html           # Homepage
│   ├── destinations.html   # Destinations explorer
│   ├── finalize.html       # AI journey generator
│   ├── story.html          # Stories & culture
│   ├── gallery.html        # Photo gallery
│   ├── profile.html        # User profile
│   ├── css/                # Stylesheets
│   ├── js/                 # JavaScript modules
│   ├── locales/            # Translation files (en.json, ar.json)
│   └── assets/             # Images and media
├── backend/
│   ├── main.py             # FastAPI app & routes
│   ├── requirements.txt    # Python dependencies
│   └── ai_engine/          # AI planning modules
│       ├── planner.py      # Core travel plan generator
│       ├── models.py       # Data models
│       └── external_apis.py # External API integrations
├── firebase.json           # Firebase hosting config
├── .firebaserc             # Firebase project config
└── README.md
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for AI generation |

---

## 👨‍💻 Built By

**Mohammed Itriq** — Built as part of a travel-tech competition project showcasing the power of AI in tourism and journey planning for Jordan.

---

## 📄 License

This project was created for educational and competition purposes.

---

<div align="center">
  <strong>🧣 SHMAGH — Where Jordan's story begins.</strong>
</div>