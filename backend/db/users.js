const db = require("./connection.js");

const create = (username, hash) =>
  db.one(
    "INSERT INTO players (username, password) VALUES ($1, $2) RETURNING id",
    [username, hash]
  );

const findByUsername = (username) =>
  db.one("SELECT * FROM players WHERE username=$1", [username]);

module.exports = {
  create,
  findByUsername,
};
