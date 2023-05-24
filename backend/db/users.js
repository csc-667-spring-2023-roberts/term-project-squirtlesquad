const db = require("./connection.js");

const create = (username, email, hash) =>
  db.one(
    "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id",
    [username, email, hash]
  );

const findByUsername = (username) =>
  db.one("SELECT * FROM users WHERE username=$1", [username]);

module.exports = {
  create,
  findByUsername,
};
