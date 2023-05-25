require("dotenv").config();
const db = require("./db/connection.js");
const path = require("path");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const express = require("express");
const app = express();

const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const addSessionLocals = require("./middleware/add-session-locals.js");
const isAuthenticated = require("./middleware/is-authenticated.js");

const rootRoutes = require("./routes/root");
const homeRoutes = require("./routes/static/home.js");
const gamesRoutes = require("./routes/static/games.js");
const lobbyRoutes = require("./routes/static/lobby.js");
const authenticationRoutes = require("./routes/static/authentication.js");
const testRoutes = require("./routes/static/test.js");
const apiGamesRoutes = require("./routes/api/games.js");

app.use("/test", testRoutes);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "static")));

if (process.env.NODE_ENV === "development") {
  const livereload = require("livereload");
  const connectLiveReload = require("connect-livereload");

  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(path.join(__dirname, "backend", "static"));
  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 100);
  });

  app.use(connectLiveReload());
}

const sessionMiddleware = session({
  store: new pgSession({ pgPromise: db }),
  secret: "supersecret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
});

app.use(sessionMiddleware);
app.use(addSessionLocals);

app.use("/", rootRoutes);

const PORT = process.env.PORT || 3000;

app.use("/home", homeRoutes);
app.use("/games", isAuthenticated, gamesRoutes);
app.use("/lobby", isAuthenticated, lobbyRoutes);
app.use("/authentication", authenticationRoutes);
//app.use("/static/test", testRoutes);
app.use("/api/games", apiGamesRoutes);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

app.use((request, response, next) => {
  next(createError(404));
});
