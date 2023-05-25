const express = require("express");
const bcrypt = require("bcrypt");
const Users = require("../../db/users.js");

const router = express.Router();

const SALT_ROUNDS = 10;

router.get("/register", (request, response) => {
  response.render("register", { title: "SquirleSquad" });
});

router.post("/register", async (request, response) => {
  const { username, password } = request.body;

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);

  try {
    const { id } = await Users.create(username, hash);
    request.session.user = {
      id,
      username,
    };

    response.redirect("/lobby");
  } catch (error) {
    console.log({ error });
    response.render("register", { title: "SquirleSquad", username });
  }
});

router.get("/login", (request, response) => {
  response.render("login", { title: "SquirleSquad" });
});

router.post("/login", async (request, response) => {
  const { username, password } = request.body;

  try {
    const {
      id: userId,
      username: foundUsername,
      password: hash,
    } = await Users.findByUsername(username);
    const isValidUser = await bcrypt.compare(password, hash);

    if (isValidUser) {
      request.session.user = {
        id: userId,
        username: foundUsername,
      };
      response.redirect("/lobby");
    } else {
      throw "Credentials invalid";
    }
  } catch (error) {
    console.log({ error });
    response.render("login", { title: "SquirleSquad", username });
  }
});

router.get("/logout", (request, response) => {
  request.session.destroy((error) => {
    console.log({ error });
  });

  response.redirect("/");
});

module.exports = router;
