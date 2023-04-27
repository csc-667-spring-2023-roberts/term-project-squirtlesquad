const db = require("./connection.js");
const Board = require('./board.js');
const Deck = require('./deck.js');

async function createNewGame(hostId, gameTitle){
    // Instantiate the Board and Deck objects
    const board = new Board();
    const deck = new Deck();
    
    // Create a new game in the database
    const createGameQuery = 'INSERT INTO game (game_name, game_status) VALUES ($1, $2) RETURNING game_id';
    const gameResult = await db.one(createGameQuery, [gameTitle, 0]);
    const gameId = gameResult.game_id;

    // Associate the host with the new game
    const hostQuery = 'INSERT INTO player (player_id, game_id) VALUES ($1, $2)';
    await db.none(hostQuery, [hostId, gameId]);

    // Store the initial game state in the database
    await storeInitialState(gameId, hostId, board, deck);
}

async function storeInitialState(gameId, hostId, board, deck) {
    // Insert a new row in the current_players table for the host
    const insertCurrentPlayerQuery = 'INSERT INTO current_players (game_id, player_id) VALUES ($1, $2) RETURNING current_player_id';
    const currentPlayerResult = await db.one(insertCurrentPlayerQuery, [gameId, hostId]);
    const currentHostPlayerId = currentPlayerResult.current_player_id;
  
    // Insert the initial state of the board/pawns into the pawn table
    const pawns = board.getPawns();
    for (const pawn of pawns) {
      const insertPawnQuery = 'INSERT INTO pawns (current_player_id, zone, position) VALUES ($1, $2, $3)';
      await db.none(insertPawnQuery, [currentHostPlayerId, pawn.zone, pawn.position]);
    }
  
    // Insert the initial state of the deck/cards into the card table
    const cards = deck.getCards();
    for (const card of cards) {
      const insertCardQuery = 'INSERT INTO card (game_id, card_type, is_used) VALUES ($1, $2, $3)';
      await db.none(insertCardQuery, [gameId, card.type, card.isUsed]);
    }
  }
  
  
  
  
  
  
  