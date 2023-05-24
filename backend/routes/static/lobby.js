const express = require("express");

const router = express.Router();

router.get("/", (request, response) => {
  response.render("lobby", { title: "Squirtlesquad Term Project" });
});

module.exports = router;
