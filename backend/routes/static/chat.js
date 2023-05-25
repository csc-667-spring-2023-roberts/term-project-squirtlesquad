const express = require("express");
const bcrypt = require("bcrypt");
const Users = require("../../db/users.js");
const events = require("../../sockets/constants.js");

const router = express.Router();

router.post("/:id", (request, response, next) => {
  const io = request.app.get("io");
  const { message } = request.body;
  const { username } = request.session.user;

  io.emit(events.CHAT_MESSAGE_RECEIVED, {
    message,
    username,
    timestamp: Date.now(),
  });

  response.status(200);
  response.end();
});

module.exports = router;
