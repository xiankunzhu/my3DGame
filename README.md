# 3D Survival Shooter

A web-based 3D survival shooting game built with **React**, **Three.js**, and **Node.js**.

Fight waves of enemies, collect supplies, and survive as long as you can!

![WebGL](https://img.shields.io/badge/WebGL-3D-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Three.js](https://img.shields.io/badge/Three.js-r160-black)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green)

---

## Features

- **3D First-Person Shooter** — WebGL-powered 3D graphics in the browser
- **Dual Weapons** — Switch between a rifle (ranged) and knife (melee)
- **Enemy AI** — Humanoid enemies spawn and walk toward you to attack
- **Supply Drops** — Ammo crates and health packs spawn randomly on the map
- **Health System** — Player and enemies have health bars
- **Score Tracking** — Earn points for each kill
- **User Accounts** — Register/login to save high scores
- **Leaderboard** — Global top scores from all players
- **Responsive Design** — Works on different screen sizes
- **Cross-Browser** — Compatible with Chrome, Firefox, and Edge

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **3D Rendering** | Three.js (WebGL) via @react-three/fiber |
| **Frontend UI** | React 18 + React Router |
| **State Management** | Zustand |
| **Styling** | CSS3 with custom properties |
| **Build Tool** | Vite |
| **Backend** | Node.js + Express |
| **Database** | SQLite (via better-sqlite3) |
| **Authentication** | JWT + bcrypt |

## Design Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           BROWSER (Client)                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────────┐ │
│  │  React Router │  │   Zustand Store   │  │  React Three Fiber   │ │
│  │              │  │  (Global State)   │  │  (3D Rendering)      │ │
│  │  / → Menu    │  │                  │  │                       │ │
│  │  /play → Game│  │  • playerHealth  │  │  Canvas (WebGL)       │ │
│  │  /login      │  │  • ammo / weapon │  │  ├── GameScene        │ │
│  │  /register   │  │  • enemies[]     │  │  │   ├── Player       │ │
│  │  /leaderboard│  │  • supplies[]    │  │  │   ├── Enemies      │ │
│  │              │  │  • score / time  │  │  │   ├── Supplies     │ │
│  └──────┬───────┘  │  • user / token  │  │  │   ├── Bullets      │ │
│         │          └────────┬─────────┘  │  │   ├── Ground       │ │
│         │                   │            │  │   └── Buildings     │ │
│  ┌──────┴───────────────────┴──────────┐ │  └───────────────────────┘ │
│  │         UI Layer (React + CSS3)      │ │                         │
│  │  ┌─────┐ ┌─────┐ ┌──────┐ ┌──────┐ │ │                         │
│  │  │ HUD │ │Menu │ │GameOvr│ │Auth  │ │ │                         │
│  │  └─────┘ └─────┘ └──────┘ └──────┘ │ │                         │
│  └──────────────────┬──────────────────┘ │                         │
│                     │ API calls (fetch)                             │
└─────────────────────┼──────────────────────────────────────────────┘
                      │  HTTP (JSON)
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVER (Node.js + Express)                   │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   Auth Routes     │  │   Score Routes    │  │   Middleware      │  │
│  │  POST /register   │  │  POST /scores     │  │  • CORS          │  │
│  │  POST /login      │  │  GET /scores/top  │  │  • JSON parser   │  │
│  │  GET  /me         │  │  GET /scores/me   │  │  • JWT verify    │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────────────┘  │
│           │                     │                                    │
│           ▼                     ▼                                    │
│  ┌──────────────────────────────────────────┐                       │
│  │           SQLite Database                 │                       │
│  │  ┌──────────────┐  ┌──────────────────┐  │                       │
│  │  │    users      │  │   high_scores     │  │                       │
│  │  │  • id         │  │  • id             │  │                       │
│  │  │  • username   │  │  • user_id (FK)   │  │                       │
│  │  │  • email      │  │  • score          │  │                       │
│  │  │  • password   │  │  • enemies_killed │  │                       │
│  │  │  • created_at │  │  • survival_time  │  │                       │
│  │  └──────────────┘  └──────────────────┘  │                       │
│  └──────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Game Loop Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                        GAME LOOP (60 FPS)                       │
│                   Runs every frame via useFrame()               │
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │ 1. INPUT     │───▶│ 2. UPDATE     │───▶│ 3. RENDER         │  │
│  │              │    │              │    │                   │  │
│  │ • WASD keys  │    │ • Move player│    │ • Three.js scene  │  │
│  │ • Mouse look │    │ • Move enemies│   │ • WebGL draw call │  │
│  │ • Click shoot│    │ • Move bullets│   │ • HTML overlays   │  │
│  │ • Q switch   │    │ • Collisions │    │ • HUD update      │  │
│  │ • ESC pause  │    │ • Spawn logic│    │                   │  │
│  └─────────────┘    └──────────────┘    └───────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Player-Enemy Interaction Flow

```
                    ┌──────────────┐
                    │  Game Start   │
                    └──────┬───────┘
                           │
                           ▼
               ┌───────────────────────┐
               │  Player Spawns at     │
               │  Center of Map        │
               └───────────┬───────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌──────────────┐ ┌────────┐ ┌────────────┐
     │ Enemies Spawn │ │Supplies│ │  Timer     │
     │ at Map Edges  │ │ Spawn  │ │  +1s       │
     │ (every 3s)    │ │(every  │ │            │
     └──────┬───────┘ │ 8s)    │ └────────────┘
            │          └───┬────┘
            ▼              ▼
     ┌──────────────┐ ┌────────────────┐
     │ Enemy Walks   │ │ Player Moves   │
     │ Toward Player │ │ Near Supply    │
     └──────┬───────┘ └───────┬────────┘
            │                  │
            ▼                  ▼
     ┌──────────────┐  ┌──────────────┐
     │ In Range?     │  │ Auto-Collect  │
     │ (dist < 1.5)  │  │ +Ammo or +HP  │
     └──┬───────┬───┘  └──────────────┘
        │Yes    │No
        ▼       ▼
  ┌──────────┐  │ (keep walking)
  │ Attack   │  │
  │ Player   │  │
  │ -10 HP   │  │
  └────┬─────┘  │
       │        │
       ▼        │
  ┌──────────┐  │       ┌──────────────┐
  │ HP <= 0? │  │       │ Player Shoots│
  └──┬───┬───┘  │       │ or Knifes    │
     │   │No    │       └──────┬───────┘
     │   └──────┘              │
     │Yes                      ▼
     ▼                  ┌──────────────┐
  ┌──────────┐          │ Hit Enemy?    │
  │ GAME     │          └──┬───────┬───┘
  │ OVER     │             │Yes    │No
  │          │             ▼       └──── (bullet continues)
  │ • Score  │       ┌──────────┐
  │ • Submit │       │ -25 (gun)│
  │ • Retry  │       │ -15(knife│
  └──────────┘       └────┬─────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Enemy HP ≤ 0?│
                   └──┬───────┬───┘
                      │Yes    │No
                      ▼       └──── (enemy survives)
               ┌──────────────┐
               │ Enemy Dies   │
               │ Score +100   │
               └──────────────┘
```

### Authentication & Score Flow

```
  ┌──────────┐     ┌───────────┐     ┌───────────┐
  │ Register │────▶│  Server    │────▶│  SQLite   │
  │ Form     │POST │  Hash PW   │     │  Store    │
  └──────────┘     │  Create JWT│     │  User     │
                   └─────┬─────┘     └───────────┘
                         │
                         ▼ JWT Token
                   ┌───────────┐
                   │ Store in  │
                   │ localStorage│
                   └─────┬─────┘
                         │
                         ▼
  ┌──────────┐     ┌───────────┐     ┌───────────┐
  │ Game Over │────▶│  POST     │────▶│  SQLite   │
  │ Screen   │     │  /scores  │     │  Store    │
  │          │     │  + JWT    │     │  Score    │
  └──────────┘     └───────────┘     └───────────┘
                         │
                         ▼
                   ┌───────────┐     ┌───────────┐
                   │ GET       │────▶│ Return    │
                   │ /scores/top│    │ Top 50    │
                   └───────────┘     └───────────┘
```

## Getting Started

### Prerequisites

- **Node.js** 18+ installed
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my3DGame
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

   This starts:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

4. **Open in browser** — Navigate to http://localhost:5173

### Production Build

```bash
# Build the frontend
npm run build

# Start the production server (serves both API and static files)
NODE_ENV=production npm start
```

## How to Play

### Controls

| Key | Action |
|-----|--------|
| **W/A/S/D** | Move forward/left/backward/right |
| **Mouse** | Look around |
| **Left Click** | Shoot (gun) / Slash (knife) |
| **Q** or **Scroll Wheel** | Switch weapon (gun ↔ knife) |
| **ESC** | Pause/Resume |

### Gameplay

1. **Click to start** — Click the game screen to lock your mouse for FPS controls
2. **Survive** — Enemies spawn at the edges and walk toward you
3. **Shoot or slash** — Use the rifle for ranged attacks or switch to the knife for melee
4. **Manage ammo** — Ammo is limited! Collect blue supply crates for more
5. **Stay healthy** — Collect green health packs when your HP is low
6. **Score points** — Each enemy kill gives 100 points
7. **Game Over** — When your health reaches zero, the game ends

### Tips

- The knife does less damage but doesn't require ammo
- Use buildings and walls for cover
- Health packs and ammo crates glow and spin — easy to spot
- Register an account to save your scores to the leaderboard!

## Project Structure

```
my3DGame/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/        # Login & Register pages
│   │   │   ├── game/        # 3D game components
│   │   │   │   ├── GameScreen.jsx   # Main game container
│   │   │   │   ├── GameScene.jsx    # Three.js scene & game loop
│   │   │   │   ├── Player.jsx       # FPS controller
│   │   │   │   ├── WeaponModel.jsx  # Gun & knife models
│   │   │   │   ├── Enemy.jsx        # Humanoid enemy
│   │   │   │   ├── Supply.jsx       # Ammo/health pickups
│   │   │   │   ├── Bullet.jsx       # Projectile
│   │   │   │   ├── Ground.jsx       # Terrain & walls
│   │   │   │   └── Buildings.jsx    # Obstacles & cover
│   │   │   └── ui/          # UI overlays
│   │   │       ├── HUD.jsx          # Health, ammo, score display
│   │   │       ├── MainMenu.jsx     # Title screen
│   │   │       ├── GameOver.jsx     # Game over screen
│   │   │       ├── PauseMenu.jsx    # Pause overlay
│   │   │       └── Leaderboard.jsx  # High score table
│   │   ├── services/
│   │   │   └── api.js       # HTTP client for backend
│   │   ├── store/
│   │   │   └── gameStore.js # Zustand state management
│   │   └── styles/
│   │       └── global.css   # Global CSS with variables
│   ├── index.html
│   └── vite.config.js
├── server/                  # Node.js backend
│   ├── src/
│   │   ├── index.js         # Express server entry
│   │   ├── database.js      # SQLite setup
│   │   ├── middleware/
│   │   │   └── auth.js      # JWT verification
│   │   └── routes/
│   │       ├── auth.js      # Login/Register endpoints
│   │       └── scores.js    # Score CRUD endpoints
│   └── data/                # SQLite database (auto-created)
├── package.json             # Root scripts
├── requirements.txt         # Project requirements
└── README.md                # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login, returns JWT
- `GET /api/auth/me` — Get current user (requires auth)

### Scores
- `POST /api/scores` — Submit score (requires auth)
- `GET /api/scores/top` — Get leaderboard (top 50)
- `GET /api/scores/me` — Get user's scores (requires auth)

### Health
- `GET /api/health` — Server status check

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Backend server port |
| `JWT_SECRET` | (built-in) | Secret for JWT signing (change in production!) |
| `CLIENT_URL` | http://localhost:5173 | CORS allowed origin |

## Browser Compatibility

- Google Chrome 90+
- Mozilla Firefox 90+
- Microsoft Edge 90+
- Safari 15+ (WebGL required)

## Credits

- Built with [Three.js](https://threejs.org/) for 3D rendering
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) for React integration
- [Zustand](https://zustand-demo.pmnd.rs/) for state management
- [Vite](https://vitejs.dev/) for fast builds
- [Express](https://expressjs.com/) for the backend server
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for the database

## License

MIT
