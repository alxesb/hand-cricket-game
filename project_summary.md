# Hand Cricket Game Project Summary

This document provides an overview of the Hand Cricket game project, its technical stack, architecture, core logic, and recent development history to enable quick onboarding for future updates and maintenance.

## 1. Project Overview

This is a real-time, multiplayer Hand Cricket game played online. It consists of a frontend client and a backend server that communicate via WebSockets (Socket.IO). Players join a game using a code, make moves (numbers), and the server determines outcomes (runs, outs, winner).

## 2. Technical Stack

-   **Frontend:**
    -   **Framework:** React
    -   **Build Tool:** Vite
    -   **Language:** TypeScript
    -   **Styling:** CSS
    -   **Deployment:** Vercel (Deployed URL: `https://hand-cricket-game-chi.vercel.app`)
-   **Backend:**
    -   **Runtime:** Node.js
    -   **Framework:** Express (for HTTP server handling Socket.IO)
    -   **WebSocket Library:** Socket.IO
    -   **Language:** TypeScript
    -   **Deployment:** Render (Deployed URL: `https://hand-cricket-server.onrender.com`)

## 3. Project Structure

The project is a monorepo-like structure with two main directories:

-   `client/`: Contains the entire frontend application.
    -   `client/src/`: Core frontend source code.
    -   `client/src/components/`: React components (Lobby, GameScreen, Controls, Scorecard).
    -   `client/src/types.ts`: Frontend-specific TypeScript type definitions, mirroring backend types.
-   `server/`: Contains the entire backend application.
    -   `server/src/`: Core backend source code.
    -   `server/src/game.ts`: Contains the main game logic and Socket.IO event handlers.
    -   `server/src/index.ts`: Entry point for the Node.js server.
    -   `server/src/types.ts`: Backend-specific TypeScript type definitions.

## 4. Core Game Logic

-   **Game State:** Managed on the server in an in-memory `games` object. The `GameState` type (defined in `types.ts` on both client/server) includes:
    -   `players`: Player details (id, name).
    -   `gameCode`: Unique code for joining.
    -   `isGameActive`: Boolean indicating if game is in progress.
    -   `isTossDone`: Boolean indicating if toss is complete.
    -   `batter`, `bowler`: Current batting and bowling players.
    -   `score`, `balls`: Current score and balls faced in the inning.
    -   `target`: Target score for the second inning.
    -   `inning`: Current inning (1 or 2).
    -   `moves`: Stores moves made by players in the current round.
    -   `lastRoundResult`: Details of the last round (moves, outcome).
    -   `winner`: Player object if a winner is determined.
    -   `out`: Boolean if batter is out.
-   **Communication:** Real-time updates and moves are handled via Socket.IO events (`createGame`, `joinGame`, `makeMove`, `gameUpdate`, `tossResult`, `error`).
-   **Turns:** Players make moves simultaneously. Server processes moves once both players have submitted.

## 5. Recent Features and Changes

The following features and fixes have been recently implemented:

-   **Display Game Winner:**
    -   The `GameState` already included a `winner` field.
    -   Frontend (`client/src/App.tsx`) now displays a "Game Over!" screen with the winner's name and a "Play Again" button when `isGameActive` is `false` and `winner` is present.
-   **App Title Change:**
    -   The main title in the lobby (`client/src/components/Lobby.tsx`) was changed from "Hand Cricket Online" to "HCG".
-   **New Game Rules Implemented:**
    -   **Removed '5' move:** The number 5 is no longer an available move.
    -   **New '1' variations ('1a', '1b', '1c'):**
        -   These moves all score 1 run.
        -   To get the batter out, the bowler must play the *exact* matching variation (e.g., '1a' vs '1a').
        -   Implemented in `client/src/components/Controls.tsx` (UI) and `server/src/game.ts` (logic).
    -   **0-0 Defensive Play:**
        -   If `batterMove` is `0` and `bowlerMove` is `0`, it is **NOT** an out.
        -   If the batter's current `score` is greater than `0`, `1` run is deducted as a penalty. No penalty if score is `0`.
        -   Implemented in `server/src/game.ts`.
-   **Type System Enhancements:**
    -   Updated `moves` property in `GameState` (`client/src/types.ts`, `server/src/types.ts`) to `number | string` to accommodate '1a', '1b', '1c'.
    -   Updated `lastRoundResult.batterMove` and `lastRoundResult.bowlerMove` in `GameState` (`client/src/types.ts`, `server/src/types.ts`) to `number | string` to correctly handle and display the new move types.
-   **Frontend Display Fixes:**
    -   Resolved `TypeScript` errors in `client/src/App.tsx` and `client/src/components/GameScreen.tsx` related to `onMoveSelect` type.
    -   `client/src/components/Scorecard.tsx` now uses `getNumericDisplayValue` to show '1' instead of '1a', '1b', '1c' in the "Last Round" summary.
    -   Lobby display logic in `client/src/App.tsx` was fixed to correctly show game code before game start.

## 6. Key Files and Components

-   `client/index.html`: Main HTML file.
-   `client/src/main.tsx`: React app entry point.
-   `client/src/App.tsx`: Main React component, handles game flow and socket events.
-   `client/src/types.ts`: Frontend game state types.
-   `client/src/components/Lobby.tsx`: Component for creating/joining games.
-   `client/src/components/GameScreen.tsx`: Component for displaying active game (scorecard, controls).
-   `client/src/components/Controls.tsx`: Component for player move selection.
-   `client/src/components/Scorecard.tsx`: Component for displaying game score, roles, and last round result.
-   `server/src/index.ts`: Backend server entry point, initializes Socket.IO.
-   `server/src/game.ts`: Contains all core game logic, state management, and move processing.
-   `server/src/types.ts`: Backend game state types.

## 7. Development Workflow

The project uses a Git-based workflow with automatic deployments:

1.  **Local Development:** Make changes in `client/` or `server/`. Test locally.
2.  **Commit:** Stage and commit changes to your local Git repository.
    `git add .`
    `git commit -m "Descriptive commit message"`
3.  **Push to GitHub:** Push your local `main` branch to the `origin` remote.
    `git push origin main`
4.  **Automatic Deployment:**
    -   **Vercel** (frontend) detects changes on GitHub and automatically builds and deploys to `https://hand-cricket-game-chi.vercel.app`.
    -   **Render** (backend) detects changes on GitHub and automatically builds and deploys to `https://hand-cricket-server.onrender.com`.
5.  **Environment Variables:** If new environment variables are needed, they must be manually added via the Vercel and Render dashboards.

## 8. Outstanding Tasks (TODO)

-   [ ] Verify the lobby display fix, the title change, displaying the winner, and all new game rules on Vercel. (User is currently performing this verification).
-   [ ] Implement displaying "runs to win" in `client/src/components/GameScreen.tsx` or `Scorecard.tsx`.

---
_Generated by Gemini_