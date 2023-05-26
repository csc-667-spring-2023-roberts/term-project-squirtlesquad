const express = require("express");
const Games = require("../../db/games.js");
const { GAME_CREATED, GAME_UPDATED } = require("../../../shared/constants.js");

const router = express.Router();

router.get("/", async (req, res) => {
  const { id: user_id } = req.session.user;
  try {
    const joinable_games = await Games.listJoinableGames(user_id);
    res.json(joinable_games);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.get("/create", async (req, res) => {
  const { id: user_id } = req.session.user;
  const io = req.app.get("io");

  try {
    const gameid = await Games.createNewGame(user_id);
    io.emit(GAME_CREATED, gameid);
    res.redirect(`/games/${gameid}`);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.get("/:id/join", async (req, res) => {
  const { id: user_id } = req.session.user;
  const { id: game_id } = req.params;
  const io = req.app.get("io");

  try {
    await Games.joinGame(game_id, user_id);
    const gamestate = await Games.getGameState(game_id);
    io.emit(GAME_UPDATED(game_id), gamestate);
    res.redirect(`/games/${game_id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.post("/:id/start", async (req, res) => {
  const { id: game_id } = req.params;
  const io = req.app.get("io");

  try {
    await Games.startGame(game_id, user_id);
    const gamestate = await Games.getGameState(game_id);
    io.emit(GAME_UPDATED(game_id), gamestate);
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.post("/:id/draw", async (req, res) => {
  const { id: user_id } = req.session.user;
  const { id: game_id } = req.params;
  const io = req.app.get("io");

  try {
    const card = await Games.drawCard(game_id, user_id);
    const gamestate = await Games.getGameState(game_id);
    io.emit(GAME_UPDATED(game_id), gamestate);
    res.status(200).json({ card });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.post("/:id/move/start", async (req, res) => {
  const { id: user_id } = req.session.user;
  const { id: game_id } = req.params;
  const action = req.body;
  const io = req.app.get("io");

  try {
    await Games.moveOutOfStart(game_id, user_id, action);
    const gamestate = await Games.getGameState(game_id);
    io.emit(GAME_UPDATED(game_id), gamestate);
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.post("/:id/move/board", async (req, res) => {
  const { id: user_id } = req.session.user;
  const { id: game_id } = req.params;
  const action = req.body;
  const io = req.app.get("io");

  try {
    await Games.movePawn(game_id, user_id, action);
    const gamestate = await Games.getGameState(game_id);
    //Also need to check if the game is over
    io.emit(GAME_UPDATED(game_id), gamestate);
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.post("/:id/swap", async (req, res) => {
  const { id: user_id } = req.session.user;
  const { id: game_id } = req.params;
  const action = req.body;
  const io = req.app.get("io");

  try {
    await Games.swapPawns(game_id, user_id, action);
    const gamestate = await Games.getGameState(game_id);
    io.emit(GAME_UPDATED(game_id), gamestate);
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.post("/:id/playsorry", async (req, res) => {
  const { id: user_id } = req.session.user;
  const { id: game_id } = req.params;
  const action = req.body;
  const io = req.app.get("io");

  try {
    await Games.playSorryCard(game_id, user_id, action);
    const gamestate = await Games.getGameState(game_id);
    io.emit(GAME_UPDATED(game_id), gamestate);
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.post("/:id/state", async (req, res) => {
  const { id: game_id } = req.params;
  const io = req.app.get("io");

  try {
    const gamestate = await Games.getGameState(game_id);
    io.emit(GAME_UPDATED(game_id), gamestate);
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.post("/:id/skip", async (req, res) => {
  const { id: user_id } = req.session.user;
  const { id: game_id } = req.params;
  const io = req.app.get("io");

  try {
    await Games.skipTurn(game_id, user_id);
    const gamestate = await Games.getGameState(game_id);
    io.emit(GAME_UPDATED(game_id), gamestate);
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

module.exports = router;
