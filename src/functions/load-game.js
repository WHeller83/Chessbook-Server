import { Chess } from "chess.js";

export const loadGame = async (db) => {
  // Load current game_id
  let current_game = await db.get("SELECT current_game_id FROM current_game;");

  // load the game's moves from the db
  const query = await db.all(
    "SELECT * FROM moves WHERE game_id = ? ORDER BY move_number ASC;",
    current_game.current_game_id
  );

  // Create a Chess instance and load the last fen if we have any moves in the DB
  const game = new Chess();
  if (query.length > 0) game.load(query[query.length - 1].after_fen);

  // Populate the history with the last moves, names, and fens
  const history = [];
  query.map((obj) => {
    history.push({
      name: obj.name,
      move: { to: obj.move_to, from: obj.move_from, color: obj.color },
      fen: obj.after_fen,
    });
  });

  // return all of these as an object.
  return {
    history: history,
    current_game: game,
    game_id: current_game.current_game_id
  };
};
