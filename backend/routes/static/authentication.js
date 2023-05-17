import express from "express";

const router = express.Router();

router.get("/sign-up", (_request, response) => {
	response.render("sign-up", { title: "Squirtlesquad's Term Project"})
});

router.get("/login", (_request, response) => {
	response.render("login", { title: "Squirtlesquad's Term Project"})
});

export default router;