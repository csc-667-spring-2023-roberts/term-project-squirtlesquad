const path = require("path");
const createError = require("http-errors");

const express = require("express");
const app = express();

app.use(morgan("dev"));

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
}
  
    app.use(connectLiveReload());

app.set("views", path.join(__dirname, "backend", "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "backend", "static")));

const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "backend", "static")));

const rootRoutes = require("./backend/routes/root");

app.use("/", rootRoutes);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
app.use((request, response, next) => {
    next(createError(404));
  });