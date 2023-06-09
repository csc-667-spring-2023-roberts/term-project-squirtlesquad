const db = require("./connection.js");
const Board = require("../classes/board.js");
const Deck = require("../classes/deck.js");
const Rules = require("../classes/rules.js");

//test

async function createNewGame(hostId, gameTitle) {
  // Instantiate the Board and Deck objects
  const board = new Board();
  const deck = new Deck();

  // Create a new game in the database
  const createGameQuery =
    "INSERT INTO game (game_name, game_status, current_turn, active_card) VALUES ($1, $2, $3, $4) RETURNING id";
  const gameResult = await db.one(createGameQuery, [gameTitle, 0, 1, "none"]);
  const gameId = gameResult.id;

  // Associate the host with the new game
  // const hostQuery = "INSERT INTO player (player_id, game_id) VALUES ($1, $2)";
  // await db.none(hostQuery, [hostId, gameId]);

  // Store the initial game state in the database
  await storeInitialState(gameId, hostId, board, deck);

  return gameId;
}

async function storeInitialState(gameId, hostId, board, deck) {
  // Insert a new row in the current_players table for the host
  const insertCurrentPlayerQuery =
    'INSERT INTO current_players ("game_ID", "player_ID", player_color, score) VALUES ($1, $2, $3, $4) RETURNING id';
  const currentPlayerResult = await db.one(insertCurrentPlayerQuery, [
    gameId,
    hostId,
    "red",
    "0",
  ]);
  const currentHostPlayerId = currentPlayerResult.id;

  // Insert the initial state of the board/pawns into the pawn table
  const pawns = board.getPawns();
  const hostPawns = pawns.filter((pawn) => pawn.color === "red"); // Only insert the host's pawns
  for (const pawn of hostPawns) {
    const insertPawnQuery =
      'INSERT INTO pawns ("player_ID", "game_ID", zone, position) VALUES ($1, $2, $3, $4)';
    await db.none(insertPawnQuery, [
      currentHostPlayerId,
      gameId,
      pawn.zone,
      pawn.position,
    ]);
  }

  // Insert the initial state of the deck/cards into the card table
  const cards = deck.getCards();
  for (const card of cards) {
    const insertCardQuery =
      'INSERT INTO card ("game_ID", card_type, is_used) VALUES ($1, $2, $3)';
    await db.none(insertCardQuery, [gameId, card.type, card.isUsed]);
  }
}

async function listJoinableGames(playerId) {
  const joinableGamesQuery = `
    SELECT g.id, COUNT(cp.\"player_ID\") AS current_players
    FROM game g
    LEFT JOIN current_players cp ON g.id = cp.\"game_ID\"
    WHERE g.game_status = 0
    GROUP BY g.id
    HAVING COUNT(cp.\"player_ID\") < 4;
  `;
  const joinableGames = await db.any(joinableGamesQuery);

  // Filter out games where the current player already participates
  const filteredJoinableGames = joinableGames.filter(async (game) => {
    const playerExistsQuery = `
      SELECT *
      FROM current_players
      WHERE \"game_ID\" = $1 AND \"player_ID\" = $2
    `;
    const playerExists = await db.oneOrNone(playerExistsQuery, [
      game.id,
      playerId,
    ]);

    return !playerExists; // If player doesn't exist in the game, then the game is joinable
  });

  // Return the filtered games list
  return filteredJoinableGames;
}

async function joinGame(gameId, playerId) {
  // Order of player colors
  const playerColors = ["red", "blue", "yellow", "green"];

  const joinGameQuery = `INSERT INTO current_players (\"game_ID\", \"player_ID\", player_color, score) VALUES ($1, $2, $3, $4)`;

  // Check if the game exists
  const gameExistsQuery = `SELECT * FROM game WHERE id = $1`;
  const gameExists = await db.oneOrNone(gameExistsQuery, [gameId]);
  if (!gameExists) {
    throw new Error("Game does not exist");
  }

  // Check if the player is already in the game
  const playerExistsQuery = `SELECT * FROM current_players WHERE \"game_ID\" = $1 AND \"player_ID\" = $2`;
  const playerExists = await db.oneOrNone(playerExistsQuery, [
    gameId,
    playerId,
  ]);
  if (playerExists) {
    throw new Error("Player is already in the game");
  }

  // Get the number of current players
  const playerCountQuery = `SELECT COUNT(*) FROM current_players WHERE \"game_ID\" = $1`;
  const playerCountResult = await db.one(playerCountQuery, [gameId]);
  const playerCount = playerCountResult.count;

  // Check if the game is full
  if (playerCount >= 4) {
    throw new Error("Game is full");
  }

  // Add the new player to the game with their assigned color
  await db.none(joinGameQuery, [
    gameId,
    playerId,
    playerColors[playerCount],
    "0",
  ]);

  //Define initial pawn positions
  const initialPawnPositions = ["0", "1", "2", "3"];

  //Get the id of the newly added current player
  const currentPlayerIdQuery = `SELECT id FROM current_players WHERE \"game_ID\" = $1 AND \"player_ID\" = $2`;
  const currentPlayerIdResult = await db.one(currentPlayerIdQuery, [
    gameId,
    playerId,
  ]);
  const currentPlayerId = currentPlayerIdResult.id;

  //Insert the new player's pawns into the pawn table
  for (const position of initialPawnPositions) {
    const insertPawnQuery =
      'INSERT INTO pawns ("player_ID", "game_ID", zone, position) VALUES ($1, $2, $3, $4)';
    await db.none(insertPawnQuery, [currentPlayerId, gameId, "home", position]);
  }
}

async function startGame(gameId) {
  const updateGameStatusQuery = `UPDATE game SET game_status = 1 WHERE id = $1`;

  //Check if the game exists
  const gameExistsQuery = `SELECT * FROM game WHERE id = $1`;
  const gameExists = await db.oneOrNone(gameExistsQuery, [gameId]);
  if (!gameExists) {
    throw new Error("Game does not exist");
  }

  //Check if the game has at least 2 players
  const playerCountQuery = `SELECT COUNT(*) FROM current_players WHERE \"game_ID\" = $1`;
  const playerCount = await db.one(playerCountQuery, [gameId]);
  if (playerCount.count < 2) {
    throw new Error("Game does not have enough players");
  }

  //Check if the game has not already started
  const gameStatusQuery = `SELECT game_status FROM game WHERE \"game_ID\" = $1`;
  const gameStatus = await db.one(gameStatusQuery, [gameId]);
  if (gameStatus.game_status == 1) {
    throw new Error("Game has already started");
  }

  //Update the game status to started
  await db.none(updateGameStatusQuery, [gameId]);

  //Return game state
  return await getGameState(gameId);
}

async function getGameState(gameId) {
  //Get the game and its players from the database
  const gameQuery = `SELECT * FROM game WHERE id = $1`;
  const game = await db.one(gameQuery, [gameId]);
  if (!game) {
    throw new Error("Game does not exist");
  }
  const playersQuery = `SELECT * FROM current_players WHERE \"game_ID\" = $1`;
  const players = await db.any(playersQuery, [gameId]);

  //Get the current turn
  const currentTurn = game.current_turn;

  //Get the game status
  const gameStatus = game.game_status;

  //Get the pawns from the database and construct the board
  const pawnsQuery = `SELECT * FROM pawns WHERE \"player_ID\" IN (SELECT id FROM current_players WHERE \"game_ID\" = $1)`;
  const pawns = await db.any(pawnsQuery, [gameId]);

  // Create a map of current_player_ID to color
  const currentPlayerIdToColor = new Map(
    players.map((player) => [player.id, player.player_color])
  );

  const board = new Board();
  board.initializeFromPawns(pawns, currentPlayerIdToColor);

  // Get the cards from the database and construct the Deck object
  const cards = await db.any('SELECT * FROM card WHERE "game_ID"=$1', [gameId]);
  const deck = new Deck();
  deck.initializeFromCards(cards);
  deck.activeCard = game.active_card;

  // Construct serilized pawn and card lists
  const pawnList = board.getPawns();
  const cardList = deck.getCards();

  // Construct the game state object
  const gameState = {
    game_ID: gameId,
    game_status: gameStatus,
    currentPlayerIdToColor,
    currentTurn,
    players,
    board,
    deck,
    pawnList,
    cardList,
  };
  console.log(gameState);
  return gameState;
}

async function updateGameState(gameState) {
  // Update the game table
  const updateGameQuery = `UPDATE game SET current_turn = $1, active_card = $2 WHERE id = $3`;
  await db.none(updateGameQuery, [
    gameState.currentTurn,
    gameState.deck.activeCard,
    gameState.game_ID,
  ]);

  // Delete the existing pawns in the database
  const deletePawnsQuery = `DELETE FROM pawns WHERE \"player_ID\" IN (SELECT id FROM current_players WHERE \"game_ID\" = $1)`;
  await db.none(deletePawnsQuery, [gameState.game_ID]);

  // Insert updated pawns into the database
  const insertPawnQuery =
    'INSERT INTO pawns ("game_ID", "player_ID", zone, position) VALUES ($1, $2, $3, $4)';
  for (const pawn of gameState.board.getPawns()) {
    // Get currentPlayerId corresponding to pawn color
    const currentPlayerId = [...gameState.currentPlayerIdToColor].find(
      ([id, color]) => color === pawn.color
    )[0];

    await db.none(insertPawnQuery, [
      gameState.game_ID,
      currentPlayerId,
      pawn.zone,
      pawn.position,
    ]);
  }

  // Delete all cards associated with the game
  const deleteCardsQuery = `DELETE FROM card WHERE \"game_ID\" = $1`;
  await db.none(deleteCardsQuery, [gameState.game_ID]);

  // Insert the updated card information
  const cards = gameState.deck.getCards();
  for (const card of cards) {
    const insertCardQuery =
      'INSERT INTO card ("game_ID", card_type, is_used) VALUES ($1, $2, $3)';
    await db.none(insertCardQuery, [gameState.game_ID, card.type, card.isUsed]);
  }
}

async function drawCard(gameId, playerId) {
  // Retrieve the game state from the database
  const gameState = await getGameState(gameId);

  // Check if it is the current player's turn
  const currentPlayer = gameState.players.find(
    (player) => player.player_ID === playerId
  );
  const turnColors = {
    1: "red",
    2: "blue",
    3: "yellow",
    4: "green",
  };
  if (turnColors[gameState.currentTurn] !== currentPlayer.player_color) {
    throw new Error("It is not your turn");
  }

  // Draw a card from the deck
  const card = gameState.deck.drawCard();

  // Update the database
  await updateGameState(gameState);

  // Return the card
  return card;
}

async function moveOutOfStart(gameId, playerId, start) {
  /* start = {
    pawn: { color: 'red', position: 1, zone: 'start' },
    card: '1',
    target: { position: 1, zone: 'board' },
  } */

  // Retrieve the game state from the database
  const gameState = await getGameState(gameId);

  if (start.card !== gameState.deck.activeCard) {
    throw new Error("The card does not match the active card");
  }

  // Check if it is the current player's turn
  const currentPlayer = gameState.players.find(
    (player) => player.player_ID === playerId
  );
  const turnColors = {
    1: "red",
    2: "blue",
    3: "yellow",
    4: "green",
  };
  if (turnColors[gameState.currentTurn] !== currentPlayer.player_color) {
    throw new Error("It is not your turn");
  }

  //Check if it is allowed to move out of start
  const rules = new Rules(gameState.board, currentPlayer, start);
  if (rules.canMoveOutOfStart()) {
    // Check if the destination has an opponent's pawn, and if so, send it back to its start zone
    const opponentPawnColor = gameState.board.getPawnAtPosition(
      start.target.position,
      start.target.zone,
      currentPlayer.player_color
    );
    if (opponentPawnColor) {
      let opponentStartSpace =
        gameState.board.getNextStartPosition(opponentPawnColor);
      gameState.board.changePawnPosition(
        start.target.position,
        start.target.zone,
        currentPlayer.player_color,
        opponentStartSpace,
        "start",
        opponentPawnColor
      );
    }

    // Move the pawn
    gameState.board.changePawnPosition(
      start.pawn.position,
      start.pawn.zone,
      currentPlayer.player_color,
      start.target.position,
      start.target.zone,
      currentPlayer.player_color
    );

    // If card is not '2', advance the game to the next turn
    if (start.card !== "2") {
      gameState.currentTurn =
        (gameState.currentTurn % gameState.players.length) + 1;
    }

    //Discard the active card
    gameState.deck.discardCard(gameState.deck.activeCard);

    //Update the game state in the database
    await updateGameState(gameState);
  } else {
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

  if (move.card !== gameState.deck.activeCard) {
    throw new Error("The card does not match the active card");
  }

  // Check if it is the current player's turn
  const currentPlayer = gameState.players.find(
    (player) => player.player_ID === playerId
  );
  const turnColors = {
    1: "red",
    2: "blue",
    3: "yellow",
    4: "green",
  };
  if (turnColors[gameState.currentTurn] !== currentPlayer.player_color) {
    throw new Error("It is not your turn");
  }

  // Check if the move is valid
  const rules = new Rules(gameState.board, currentPlayer, move);
  if (rules.isMoveValid()) {
    // Check if the destination has an opponent's pawn, and if so, send it back to its start zone
    const opponentPawnColor = gameState.board.getPawnAtPosition(
      move.target.position,
      move.target.zone,
      currentPlayer.player_color
    );
    if (opponentPawnColor) {
      let opponentStartSpace =
        gameState.board.getNextStartPosition(opponentPawnColor);
      gameState.board.changePawnPosition(
        move.target.position,
        move.target.zone,
        currentPlayer.player_color,
        opponentStartSpace,
        "start",
        opponentPawnColor
      );
    }

    // Move the pawn
    gameState.board.changePawnPosition(
      move.pawn.position,
      move.pawn.zone,
      currentPlayer.player_color,
      move.target.position,
      move.target.zone,
      currentPlayer.player_color
    );

    //Check if pawn has landed on a slide
    const slide = gameState.board.checkForSlide(
      move.pawn.color,
      move.target.position
    );
    if (slide) {
      // Check if opponent's pawn is on the slide, and if so, send it back to its start zone
      for (let i = 0; i < slide.slideLength; i++) {
        const opponentPawnColor = gameState.board.getPawnAtPosition(
          slide.start + i,
          "board",
          currentPlayer.player_color
        );
        if (opponentPawnColor) {
          let opponentStartSpace =
            gameState.board.getNextStartPosition(opponentPawnColor);
          gameState.board.changePawnPosition(
            slide.start + i,
            "board",
            currentPlayer.player_color,
            opponentStartSpace,
            "start",
            opponentPawnColor
          );
        }
      }
      // Move the pawn to the end of the slide
      gameState.board.changePawnPosition(
        move.target.position,
        move.target.zone,
        currentPlayer.player_color,
        slide.end,
        "board",
        currentPlayer.player_color
      );
    }

    // If card is not '2', advance the game to the next turn
    if (start.card !== "2") {
      gameState.currentTurn =
        (gameState.currentTurn % gameState.players.length) + 1;
    }

    //Discard the active card
    gameState.deck.discardCard(gameState.deck.activeCard);

    //Update the game state in the database
    await updateGameState(gameState);
  } else {
    throw new Error("Invalid move");
  }
}

//To be somehow called when a player plays a 7 card....not sure how that will play out yet
async function moveTwoPawns(gameId, playerId, move1, move2) {}

async function swapPawns(gameId, playerId, swap) {
  /* swap = {
    pawn: { color: 'red', position: 4, zone: 'board' },
    card: '11',
    target: { color: 'blue', position: 6, zone: 'board' },
  } */

  // Retrieve the game state from the database
  const gameState = await getGameState(gameId);

  if (swap.card !== gameState.deck.activeCard) {
    throw new Error("The card does not match the active card");
  }

  // Check if it is the current player's turn
  const currentPlayer = gameState.players.find(
    (player) => player.player_ID === playerId
  );
  const turnColors = {
    1: "red",
    2: "blue",
    3: "yellow",
    4: "green",
  };
  if (turnColors[gameState.currentTurn] !== currentPlayer.player_color) {
    throw new Error("It is not your turn");
  }

  //Check if the swap is valid
  const rules = new Rules(gameState.board, currentPlayer, swap);
  if (rules.isSwapValid()) {
    //Swap the pawns
    gameState.board.swapPawnPositions(
      swap.pawn.position,
      swap.pawn.zone,
      currentPlayer.player_color,
      swap.target.position,
      swap.target.zone,
      swap.target.color
    );

    //Check if pawn has landed on a slide
    const slide = gameState.board.checkForSlide(
      move.pawn.color,
      move.target.position
    );
    if (slide) {
      // Check if opponent's pawn is on the slide, and if so, send it back to its start zone
      for (let i = 0; i < slide.slideLength; i++) {
        const opponentPawnColor = gameState.board.getPawnAtPosition(
          slide.start + i,
          "board",
          currentPlayer.player_color
        );
        if (opponentPawnColor) {
          let opponentStartSpace =
            gameState.board.getNextStartPosition(opponentPawnColor);
          gameState.board.changePawnPosition(
            slide.start + i,
            "board",
            currentPlayer.player_color,
            opponentStartSpace,
            "start",
            opponentPawnColor
          );
        }
      }
      // Move the pawn to the end of the slide
      gameState.board.changePawnPosition(
        move.target.position,
        move.target.zone,
        currentPlayer.player_color,
        slide.end,
        "board",
        currentPlayer.player_color
      );
    }

    //Advance the game to the next turn
    gameState.currentTurn =
      (gameState.currentTurn % gameState.players.length) + 1;

    //Discard the active card
    gameState.deck.discardCard(gameState.deck.activeCard);

    //Update the game state in the database
    await updateGameState(gameState);
  } else {
    throw new Error("Invalid swap");
  }
}

async function playSorryCard(gameId, playerId, action) {
  /* action = {
    pawn: { color: 'red', position: 4, zone: 'start' },
    card: 'sorry',
    target: { color: 'blue', position: 6, zone: 'board' },
  } */

  // Retrieve the game state from the database
  const gameState = await getGameState(gameId);

  if (action.card !== gameState.deck.activeCard) {
    throw new Error("The card does not match the active card");
  }

  // Check if it is the current player's turn
  const currentPlayer = gameState.players.find(
    (player) => player.player_ID === playerId
  );
  const turnColors = {
    1: "red",
    2: "blue",
    3: "yellow",
    4: "green",
  };
  if (turnColors[gameState.currentTurn] !== currentPlayer.player_color) {
    throw new Error("It is not your turn");
  }

  //Check if the action is valid
  const rules = new Rules(gameState.board, currentPlayer, action);
  if (rules.isSorryValid()) {
    //Move opponent's pawn to start
    let opponentStartSpace = gameState.board.getNextStartPosition(
      action.target.color
    );
    gameState.board.changePawnPosition(
      action.target.position,
      action.target.zone,
      action.target.color,
      opponentStartSpace,
      "start",
      action.target.color
    );

    //Move the pawn
    gameState.board.changePawnPosition(
      action.pawn.position,
      action.pawn.zone,
      currentPlayer.player_color,
      action.target.position,
      action.target.zone,
      currentPlayer.player_color
    );

    //Advance the game to the next turn
    gameState.currentTurn =
      (gameState.currentTurn % gameState.players.length) + 1;

    //Discard the active card
    gameState.deck.discardCard(gameState.deck.activeCard);

    //Update the game state in the database
    await updateGameState(gameState);
  } else {
    throw new Error("Invalid play of sorry card");
  }
}

async function skipTurn(gameId, playerId) {
  // Retrieve the game state from the database
  const gameState = await getGameState(gameId);

  // Check if it is the current player's turn
  const currentPlayer = gameState.players.find(
    (player) => player.player_ID === playerId
  );
  const turnColors = {
    1: "red",
    2: "blue",
    3: "yellow",
    4: "green",
  };
  if (turnColors[gameState.currentTurn] !== currentPlayer.player_color) {
    throw new Error("It is not your turn");
  }

  //Advance the game to the next turn
  gameState.currentTurn =
    (gameState.currentTurn % gameState.players.length) + 1;

  //Discard the active card
  gameState.deck.discardCard(gameState.deck.activeCard);

  //Update the game state in the database
  await updateGameState(gameState);
}

module.exports = {
  createNewGame,
  getGameState,
  joinGame,
  listJoinableGames,
  startGame,
  drawCard,
  moveOutOfStart,
  movePawn,
  moveTwoPawns,
  swapPawns,
  playSorryCard,
  skipTurn,
};
