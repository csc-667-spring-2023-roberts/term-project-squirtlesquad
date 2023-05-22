const express = require("express");
const router = express.Router();

router.get("/", (request, response) => {
  const name = "squirtlesquad";

  response.render("home", {
    title: "SquirtleSquad's term project",
    name: name,
  });
});

module.exports = router;
