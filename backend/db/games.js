const db = require("./connection.js");
const Board = require('./board.js');
const Deck = require('./deck.js');
const Rules = require('./rules.js');

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

async function joinGame(gameId, playerId){
  const joinGameQuery = `INSERT INTO current_players (game_id, player_id) VALUES ($1, $2)`;
  
  //Check if the game exists
  const gameExistsQuery = `SELECT * FROM game WHERE game_id = $1`;
  const gameExists = await db.oneOrNone(gameExistsQuery, [gameId]);
  if(!gameExists){
    throw new Error("Game does not exist");
  }
  
  //Check if the player is already in the game
  const playerExistsQuery = `SELECT * FROM current_players WHERE game_id = $1 AND player_id = $2`;
  const playerExists = await db.oneOrNone(playerExistsQuery, [gameId, playerId]);
  if(playerExists){
    throw new Error("Player is already in the game");
  }
  
  //Check if the game has less than 4 players
  const playerCountQuery = `SELECT COUNT(*) FROM current_players WHERE game_id = $1`;
  const playerCount = await db.one(playerCountQuery, [gameId]);
  if(playerCount.count >= 4){
    throw new Error("Game is full");
  }
  
  //Add the player to the game
  await db.none(joinGameQuery, [gameId, playerId]);

}

async function startGame(gameId){
  const updateGameStatusQuery = `UPDATE game SET game_status = 1 WHERE game_id = $1`;

  //Check if the game exists
  const gameExistsQuery = `SELECT * FROM game WHERE game_id = $1`;
  const gameExists = await db.oneOrNone(gameExistsQuery, [gameId]);
  if(!gameExists){
    throw new Error("Game does not exist");
  }

  //Check if the game has at least 2 players
  const playerCountQuery = `SELECT COUNT(*) FROM current_players WHERE game_id = $1`;
  const playerCount = await db.one(playerCountQuery, [gameId]);
  if(playerCount.count < 2){
    throw new Error("Game does not have enough players");
  }

  //Check if the game has not already started
  const gameStatusQuery = `SELECT game_status FROM game WHERE game_id = $1`;
  const gameStatus = await db.one(gameStatusQuery, [gameId]);
  if(gameStatus.game_status == 1){
    throw new Error("Game has already started");
  }

  //Update the game status to started
  await db.none(updateGameStatusQuery, [gameId]);

  //Send the initial game state to all players

}

async function getGameState(gameId) {
  //Get the game and its players from the database
  const gameQuery = `SELECT * FROM game WHERE game_id = $1`;
  const game = await db.one(gameQuery, [gameId]);
  if (!game) {
    throw new Error("Game does not exist");
  }
  const playersQuery = `SELECT * FROM current_players WHERE game_id = $1`;
  const players = await db.any(playersQuery, [gameId]);
  
  //Get the current turn
  const currentTurn = game.current_turn;

  //Get the pawns from the database and construct the board
  const pawnsQuery = `SELECT * FROM pawns WHERE current_player_id IN (SELECT current_player_id FROM current_players WHERE game_id = $1)`;
  const pawns = await db.any(pawnsQuery, [gameId]);

  // Create a map of current_player_id to color
  const currentPlayerIdToColor = new Map(players.map(player => [player.current_player_id, player.color]));

  const board = new Board();
  board.initializeFromPawns(pawns, currentPlayerIdToColor);

  // Get the cards from the database and construct the Deck object
  const cards = await db.any("SELECT * FROM cards WHERE game_id=$1", [gameId]);
  const deck = new Deck();
  deck.initializeFromCards(cards);

  // Construct the game state object
  const gameState = {
    game_id: gameId,
    currentPlayerIdToColor,
    currentTurn,
    players,
    board,
    deck,
  };

  return gameState;
  
}

async function updateGameState(gameState) {
  // Update the game table
  const updateGameQuery = `UPDATE game SET current_turn = $1 WHERE game_id = $2`;
  await db.none(updateGameQuery, [gameState.currentTurn, gameState.game_id]);

  // Delete the existing pawns in the database
  const deletePawnsQuery = `DELETE FROM pawns WHERE current_player_id IN (SELECT current_player_id FROM current_players WHERE game_id = $1)`;
  await db.none(deletePawnsQuery, [gameState.game_id]);

  // Insert updated pawns into the database
  const insertPawnQuery = 'INSERT INTO pawns (current_player_id, zone, position) VALUES ($1, $2, $3)';
  for (const pawn of gameState.board.getPawns()) {
    await db.none(insertPawnQuery, [pawn.currentPlayerId, pawn.zone, pawn.position]);
  }

  // Delete all cards associated with the game
  const deleteCardsQuery = `DELETE FROM card WHERE game_id = $1`;
  await db.none(deleteCardsQuery, [gameState.game_id]);

  // Insert the updated card information
  const cards = gameState.deck.getCards();
  for (const card of cards) {
    const insertCardQuery = 'INSERT INTO card (game_id, card_type, is_used) VALUES ($1, $2, $3)';
    await db.none(insertCardQuery, [gameState.game_id, card.type, card.isUsed]);
  }
}


async function movePawn(gameId, currentPlayerId, move) {
  /* move = {
    pawn: { color: 'red', position: 4, zone: 'board' },
    card: '2',
    destination: { position: 6, zone: 'board' },
  } */
  
  // Retrieve the game state from the database
  const gameState = await getGameState(gameId);

  // Check if it is the player's turn


  // Check if the move is valid
}

//To be somehow called when a player plays a 7 card....not sure how that will play out yet
async function moveTwoPawns(gameId, currentPlayerId, move1, move2) {
  
  
  // Retrieve the game state from the database
  const gameState = await getGameState(gameId);

  // Check if it is the player's turn

  //Check if the moves are valid
}

async function swapPawns(gameId, currentPlayerId, swap) {
  /* swap = {
    pawn1: { color: 'red', position: 4, zone: 'board' },
    pawn2: { color: 'blue', position: 6, zone: 'board' },
    card: '11',
    destination: { position: 6, zone: 'board' },
  } */
  
  // Retrieve the game state from the database
  const gameState = await getGameState(gameId);

  // Check if it is the player's turn

  //Check if the swap is valid
}
  
  
  
  
  
  
  