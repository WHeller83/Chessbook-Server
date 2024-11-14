import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { getGameOverState } from "./functions/game-over.js";
import { loadGame } from "./functions/load-game.js";

const app = express();
const server = createServer(app);
const PORT = 5000;
const DBNAME = "games";

// open the database file
const db = await open({
  filename: `${DBNAME}.db`,
  driver: sqlite3.Database,
});

// create the moves and current_game tables
await db.exec(`
    CREATE TABLE IF NOT EXISTS moves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER, 
        move_number INTEGER,
        name TEXT,
        move_from TEXT,
        move_to TEXT,
        color TEXT,
        piece TEXT, 
        after_fen TEXT,
        game_result TEXT
        );
    CREATE TABLE IF NOT EXISTS current_game (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        current_game_id INTEGER
        );
    INSERT OR IGNORE INTO current_game(id, current_game_id) VALUES (1, 1);
        `);

// Load the current game and history.
let { history, current_game, game_id } = await loadGame(db);
const game = current_game;

// Create a socket server to connect to.
const io = new Server(server, {
  cors: {
    origin: "*"
  },
});

// Listen on our port
server.listen(PORT, () => console.log("Server running on port " + PORT));

// Create events for connected sockets (users).
io.on("connection", (socket) => {
  console.log("user connected");
  console.log(socket.client.conn.remoteAddress);

  // On connection, transmit the current game to the user.
  socket.emit("current_game", {
    currentFen: game.fen(),
    currentTurn: game.turn(),
    history: history,
    game_id: game_id
  });

  // Handle when a user submits a move
  socket.on("submit_move", async ({ name, move }) => {
      
      try {
        console.log(
          `Message from client: ${name} moved ${move.from} to ${move.to}`
        );

      // Make the move and push it to the history.
      game.move(move);
      history.push({
        name: name,
        move: { to: move.to, from: move.from, color: move.color },
        fen: move.after,
      });

      // Check if the game is completed
      const gameState = getGameOverState(game);

      // Insert this move into the database
      await db.run(
        `INSERT INTO moves 
                (game_id, name, move_from, move_to, move_number, color, piece, after_fen, game_result) 
                VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        game_id,
        name,
        move.from,
        move.to,
        game.moveNumber(),
        move.color,
        move.piece,
        game.fen(),
        gameState
      );

      // Start a new game and load it if the gamestate is not ''
      if (gameState) {
        db.run(
          "INSERT OR REPLACE INTO current_game(id, current_game_id) VALUES (1, ?);",
          ++game_id
        );
        history = [];
        game.reset();
        socket.emit("current_game", {
          currentFen: game.fen(),
          currentTurn: game.turn(),
          history: history,
          game_id: game_id
        });
      }
    } catch (e) {
      console.log(e);
      return;
    }
  });

  // Run a notice message if a user disconnects
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
