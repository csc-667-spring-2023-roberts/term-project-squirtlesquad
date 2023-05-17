import express from "express";
import createHttpError from "http-errors";
import path from "path";
import livereload from "livereload";
import connectLiveReload from "connect-livereload";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import homeRoutes from "./routes/static/home.js";
import gamesRoutes from "./routes/static/games.js";
import lobbyRoutes from "./routes/static/lobby.js";
import authenticationRoutes from "./routes/static/authentication.js";




const path = require("path");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const express = require("express");
const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

if (process.env.NODE_ENV = "development"){
  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(path.join(".", "backend", "static"));
  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 100);
  });
  app.use(connectLiveReload());
}

app.set("views", path.join(".", "backend", "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(".", "backend", "static")));


const rootRoutes = require("./backend/routes/root");

app.use("/", homeRoutes);
app.use("/games", gamesRoutes);
app.use("/lobby", lobbyRoutes);
app.use("/authentication", authenticationRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

app.use((request, response, next) => {
  next(createHttpError(404));
});
