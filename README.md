# Turtle Clock

A zen/ambient 3D browser game featuring a cute low-poly turtle walking around a real-time clock.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to play.

## Controls

- **WASD / Arrow Keys**: Move the turtle
  - Left/Right: Rotate in place
  - Up/Down: Move forward/backward
- **1**: First-person camera (turtle's eye view)
- **2**: Third-person camera (behind turtle)
- **3**: Bird's eye camera (top-down view)

## Features

- Real-time clock with smooth sweeping second hand
- Low-poly turtle built from Three.js primitives
- Idle animation (head bobbing) and walk cycle
- Boundary collision (turtle slides along clock edge)
- Three camera views with smooth transitions
- White void aesthetic with fog effect

## Tech Stack

- Next.js 14 (App Router)
- Three.js via @react-three/fiber and @react-three/drei
- Jest for testing

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React/Three.js components
│   ├── Game.jsx         # Main canvas wrapper
│   ├── Scene.jsx        # Scene setup (lights, fog)
│   ├── Clock.jsx        # Clock face and hands
│   ├── Turtle.jsx       # Turtle character model
│   ├── CameraController.jsx
│   └── UI.jsx           # Overlay UI
├── hooks/               # Custom React hooks
│   ├── useKeyboard.js   # Keyboard input
│   ├── useGameLoop.js   # Delta time, pause
│   └── useTurtleMovement.js
├── utils/               # Utility functions
│   ├── clockMath.js     # Time to angle conversion
│   ├── collision.js     # Boundary detection
│   └── movement.js      # Movement calculations
└── __tests__/           # Jest tests
```
