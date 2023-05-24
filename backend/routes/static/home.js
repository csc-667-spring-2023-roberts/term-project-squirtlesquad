const express = require("express");

const router = express.Router();

router.get("/", (request, response) => {
  response.render("home", { title: "Squirtlesquad's Term Project" });
});

//module.exports = router;
module.exports = router;
