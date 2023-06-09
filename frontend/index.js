import io from "socket.io-client";
import events from "../backend/sockets/constants";

const socket = io();

const messageContainer = document.querySelector("#messages");

socket.on(events.CHAT_MESSAGE_RECEIVED, ({ username, message, timestamp }) => {
  const entry = document.createElement("div");

  const displayName = document.createElement("span");
  displayName.innerText = username;
  const displayMessage = document.createElement("span");
  displayMessage.innerText = message;
  const displayTimestamp = document.createElement("span");
  displayTimestamp.innerText = timestamp;

  entry.append(displayName, displayMessage, displayTimestamp);

  messageContainer.appendChild(entry);
});

let inputchat = document.querySelector("input#chatMessage");
if (inputchat) {
  inputchat.addEventListener("keydown", (event) => {
    if (event.keyCode === 13) {
      const message = event.target.value;
      event.target.value = "";

      fetch("/chat/0", {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
    }
  });
}

import { GAME_UPDATED } from "../shared/constants";
import { GAME_CREATED } from "../shared/constants";

const getGameId = (location) => {
  const gameId = location.substring(location.lastIndexOf("/") + 1);

  if (gameId === "lobby") {
    return 0;
  } else {
    return parseInt(gameId);
  }
};

const game_id = getGameId(document.location.pathname);

const gameList = document.querySelector("#game-list");
const itemTemplate = document.querySelector("#available-game-item");

function createGameListItem(game_id) {
  const entry = itemTemplate.content.cloneNode(true);

  entry.querySelector("a").setAttribute("href", `/api/games/${game_id}/join`);
  entry.querySelector("span").innerText = game_id;

  return entry;
}

function gameCreatedHandler(socket) {
  socket.on(GAME_CREATED, (game_id) => {
    gameList.appendChild(createGameListItem(game_id));
  });
}

function gameUpdatedHandler(socket, game_id) {
  socket.on(GAME_UPDATED(game_id), (game_state) => {
    console.log(GAME_UPDATED(game_id), game_state);

    //Deserialize the game state
    const state = game_state;

    //Display the current active card
    const card = state.deck.activeCard;
    const cardElement = document.getElementById("current-card");
    cardElement.innerHTML = "<p>" + card + "</p>";

    //Disable the start game button if the game has started
    const startGameButton = document.getElementById("start-game-button");
    if (state.game_status === 1) {
      startGameButton.hidden = "true";
    }

    //Disable the draw card button if there is an active card
    const drawCardButton = document.getElementById("draw-card-button");
    if (state.deck.activeCard !== "none") {
      drawCardButton.hidden = "true";
    }

    //Render the board based on the game state
    const pawns = state.pawnList;
    const cards = state.cardList;

    const pawnImages = {
      red: "..\\images\\redpiece.png",
      blue: "..\\images\\bluepiece.png",
      green: "..\\images\\greenpiece.png",
      yellow: "..\\images\\yellowpiece.png",
    };

    const zonePrefixes = {
      board: "box",
      safety: "sf",
      start: "st",
      home: "hm",
    };

    //Iterate through pawns and set their positions on the board
    for (let i = 0; i < pawns.length; i++) {
      const pawn = pawns[i];
      const color = pawn.color;
      const zone = pawn.zone;
      const position = pawn.position;

      const imageSource = pawnImages[color];
      const elementId =
        zone === "board"
          ? `${zonePrefixes[zone]}${position}`
          : `${color[0]}${zonePrefixes[zone]}${position}`;
      const element = document.getElementById(elementId);

      element.innerHTML += `<img class="${color}piece" src="${imageSource}" />`;
    }
  });
}

async function fetchState(game_id) {
  console.log("fetching state...");
  const response = await fetch(`/api/games/${game_id}/state`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function testdrawcard(game_id) {
  const response = await fetch(`/api/games/${game_id}/draw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
}
async function testmoveoutofstart(game_id) {
  const response = await fetch(`/api/games/${game_id}/move/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pawn: { color: "red", zone: "start", position: 0 },
      card: "1",
      target: { position: 4, zone: "board" },
    }),
  });
}
async function testmove(game_id) {
  const response = await fetch(`/api/games/${game_id}/move/board`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pawn: { color: "red", zone: "board", position: 4 },
      card: "8",
      target: { position: 12, zone: "board" },
    }),
  });
}

function initializeBoard(game_id) {
  console.log("initializing board...");
  //testdrawcard(game_id);
  //testmoveoutofstart(game_id);
  //testmove(game_id);

  fetchState(game_id);
  let drawcardbutton = document.getElementById("draw-card-button");
  console.log("drawcardbutton " + drawcardbutton);
  if (drawcardbutton) {
    drawcardbutton.addEventListener("click", async () => {
      const response = await fetch(`/api/games/${game_id}/draw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const card = await response.json();

        console.log(card);
      } else {
        console.error("Error drawing card:", response.statusText);
      }
    });
  }

  let startgamebutton = document.getElementById("start-game-button");
  console.log("startgamebutton " + startgamebutton);
  if (startgamebutton) {
    startgamebutton.addEventListener("click", async () => {
      const response = await fetch(`/api/games/${game_id}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
  }

  let skipturnbutton = document.getElementById("skip-turn-button");
  console.log("skipturnbutton " + skipturnbutton);
  if (skipturnbutton) {
    skipturnbutton.addEventListener("click", async () => {
      const response = await fetch(`/api/games/${game_id}/skip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
  }
}
document.addEventListener("DOMContentLoaded", (event) => {
  gameCreatedHandler(socket);
  gameUpdatedHandler(socket, game_id);
  initializeBoard(game_id);
});
