import express from "express";

const router = express.Router();

router.get("/:id", (request, response) => {
	const { id } = request.params;
	response.render("games", { id, title: "Squirtlesquad's Term Project"})
});

export default router;