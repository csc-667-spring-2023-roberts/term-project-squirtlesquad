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

async function listJoinableGames(playerId){
  const joinableGamesQuery = `
    SELECT g.game_id, COUNT(cp.player_id) AS current_players
    FROM game g
    LEFT JOIN current_players cp ON g.game_id = cp.game_id
    WHERE g.game_status = 0
    GROUP BY g.game_id
    HAVING COUNT(cp.player_id) < 4;
  `;
  const joinableGames = await db.any(joinableGamesQuery);

  // Filter out games where the current player already participates
  const filteredJoinableGames = joinableGames.filter(async (game) => {
    const playerExistsQuery = `
      SELECT *
      FROM current_players
      WHERE game_id = $1 AND player_id = $2
    `;
    const playerExists = await db.oneOrNone(playerExistsQuery, [game.game_id, playerId]);
    
    return !playerExists;  // If player doesn't exist in the game, then the game is joinable
  });

  // Return the filtered games list
  return filteredJoinableGames;
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

  //Return game state
  return await getGameState(gameId);


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



async function drawCard(gameId, playerId) {
  // Retrieve the game state from the database
  const gameState = await getGameState(gameId);

  // Check if it is the current player's turn
  const currentPlayer = gameState.currentPlayers.find(player => player.player_id === playerId);
  const turnColors = {
    1: 'red',
    2: 'blue',
    3: 'yellow',
    4: 'green'
  };
  if (turnColors[gameState.currentTurn] !== currentPlayer.player_color) {
    throw new Error("It is not your turn");
  }

  // Check if the deck is empty
  if (gameState.deck.isEmpty()) {
    throw new Error("The deck is empty");
  }

  // Draw a card from the deck
  const card = gameState.deck.drawCard();

  // Update the database
  await updateGameState(gameState);

  // Return the card
  return card;
}


async function moveOutOfStart(gameId, playerId, start){
  /* start = {
    pawn: { color: 'red', position: 1, zone: 'start' },
    card: '1',
    target: { position: 1, zone: 'board' },
  } */
  
  // Retrieve the game state from the database
  const gameState = await getGameState(gameId);

  // Check if it is the current player's turn
  const currentPlayer = gameState.currentPlayers.find(player => player.player_id === playerId);
  const turnColors = {
    1: 'red',
    2: 'blue',
    3: 'yellow',
    4: 'green'
  };
  if (turnColors[gameState.currentTurn] !== currentPlayer.player_color) {
    throw new Error("It is not your turn");
  }

  //Check if it is allowed to move out of start
  const rules = new Rules(gameState.board, currentPlayer, start);
  if (rules.canMoveOutOfStart()){
    // Check if the destination has an opponent's pawn, and if so, send it back to its start zone
    const opponentPawnColor = gameState.board.getPawnAtPosition(start.target.position, start.target.zone, currentPlayer.player_color);
    if (opponentPawnColor) {
      let opponentStartSpace = gameState.board.getNextStartPosition(opponentPawnColor);
      gameState.board.changePawnPosition(start.target.position, start.target.zone, currentPlayer.player_color, opponentStartSpace, 'start', opponentPawnColor);
    }

    // Move the pawn
    gameState.board.changePawnPosition(start.pawn.position, start.pawn.zone, currentPlayer.player_color, start.target.position, start.target.zone, currentPlayer.player_color);

    // If card is not '2', advance the game to the next turn
    if (start.card !== '2') {
      gameState.currentTurn = (gameState.currentTurn % gameState.currentPlayers.length) + 1;
    }

    //Update the game state in the database
    await updateGameState(gameState);
  }
  else {
    throw new Error("Invalid move out of start");
  }
}

async function movePawn(gameId, playerId, move) {
  /* move = {
    pawn: { color: 'red', position: 4, zone: 'board' },
    card: '2',
    target: { position: 6, zone: 'board' },
  } */
  
  // Retrieve the game state from the database
  const gameState = await getGameState(gameId);

  // Check if it is the current player's turn
  const currentPlayer = gameState.currentPlayers.find(player => player.player_id === playerId);
  const turnColors = {
    1: 'red',
    2: 'blue',
    3: 'yellow',
    4: 'green'
  };
  if (turnColors[gameState.currentTurn] !== currentPlayer.player_color) {
    throw new Error("It is not your turn");
  }

  // Check if the move is valid
  const rules = new Rules(gameState.board, currentPlayer, move);
  if (rules.isMoveValid()){
    // Check if the destination has an opponent's pawn, and if so, send it back to its start zone
    const opponentPawnColor = gameState.board.getPawnAtPosition(move.target.position, move.target.zone, currentPlayer.player_color);
    if (opponentPawnColor) {
      let opponentStartSpace = gameState.board.getNextStartPosition(opponentPawnColor);
      gameState.board.changePawnPosition(move.target.position, move.target.zone, currentPlayer.player_color, opponentStartSpace, 'start', opponentPawnColor);
    }

    // Move the pawn
    gameState.board.changePawnPosition(move.pawn.position, move.pawn.zone, currentPlayer.player_color, move.target.position, move.target.zone, currentPlayer.player_color);

    //Check if pawn has landed on a slide
    const slide = gameState.board.checkForSlide(move.pawn.color, move.target.position);
    if (slide) {
      // Check if opponent's pawn is on the slide, and if so, send it back to its start zone
      for (let i = 0; i < slide.slideLength; i++) {
        const opponentPawnColor = gameState.board.getPawnAtPosition(slide.start + i, 'board', currentPlayer.player_color);
        if (opponentPawnColor) {
          let opponentStartSpace = gameState.board.getNextStartPosition(opponentPawnColor);
          gameState.board.changePawnPosition(slide.start + i, 'board', currentPlayer.player_color, opponentStartSpace, 'start', opponentPawnColor);
        }
      }
      // Move the pawn to the end of the slide
      gameState.board.changePawnPosition(move.target.position, move.target.zone, currentPlayer.player_color, slide.end, 'board', currentPlayer.player_color);
    }

    // If card is not '2', advance the game to the next turn
    if (start.card !== '2') {
      gameState.currentTurn = (gameState.currentTurn % gameState.currentPlayers.length) + 1;
    }

    //Update the game state in the database
    await updateGameState(gameState);
  }
  else {
    throw new Error("Invalid move");
  }
}

//To be somehow called when a player plays a 7 card....not sure how that will play out yet
async function moveTwoPawns(gameId, playerId, move1, move2) {
  
}

async function swapPawns(gameId, playerId, swap) {
  /* swap = {
    pawn: { color: 'red', position: 4, zone: 'board' },
    card: '11',
    target: { color: 'blue', position: 6, zone: 'board' },
  } */
  
  // Retrieve the game state from the database
  const gameState = await getGameState(gameId);

  // Check if it is the current player's turn
  const currentPlayer = gameState.currentPlayers.find(player => player.player_id === playerId);
  const turnColors = {
    1: 'red',
    2: 'blue',
    3: 'yellow',
    4: 'green'
  };
  if (turnColors[gameState.currentTurn] !== currentPlayer.player_color) {
    throw new Error("It is not your turn");
  }

  //Check if the swap is valid
  const rules = new Rules(gameState.board, currentPlayer, swap);
  if (rules.isSwapValid()){
    //Swap the pawns
    gameState.board.swapPawnPositions(swap.pawn.position, swap.pawn.zone, currentPlayer.player_color, swap.target.position, swap.target.zone, swap.target.color);

    //Check if pawn has landed on a slide
    const slide = gameState.board.checkForSlide(move.pawn.color, move.target.position);
    if (slide) {
      // Check if opponent's pawn is on the slide, and if so, send it back to its start zone
      for (let i = 0; i < slide.slideLength; i++) {
        const opponentPawnColor = gameState.board.getPawnAtPosition(slide.start + i, 'board', currentPlayer.player_color);
        if (opponentPawnColor) {
          let opponentStartSpace = gameState.board.getNextStartPosition(opponentPawnColor);
          gameState.board.changePawnPosition(slide.start + i, 'board', currentPlayer.player_color, opponentStartSpace, 'start', opponentPawnColor);
        }
      }
      // Move the pawn to the end of the slide
      gameState.board.changePawnPosition(move.target.position, move.target.zone, currentPlayer.player_color, slide.end, 'board', currentPlayer.player_color);
    }

    //Advance the game to the next turn
    gameState.currentTurn = (gameState.currentTurn % gameState.currentPlayers.length) + 1;

    //Update the game state in the database
    await updateGameState(gameState);
  }
  else {
    throw new Error("Invalid swap");
  }
}
  
  
  
  
  
  
  