"use strict";
const GRID_SIZE = 9;

const Gameboard = (function () {
  let board = Array.from({ length: GRID_SIZE }, () => null);

  const resetBoard = () => board.fill(null);

  const addMark = (mark, pos) => (board[pos] = mark);

  const getEmptyCells = () =>
    board.reduce((cum, cell, i) => (cell == null && cum.push(i), cum), []);

  const getMarkPositions = (mark) => {
    const pos = [];
    for (let i = 0; i < board.length; i++) {
      board[i] === mark && pos.push(i);
    }
    return pos;
  };

  return { getMarkPositions, addMark, resetBoard, getEmptyCells };
})();

const Player = function ({ name, mark, isAI = false }) {
  const details = { name, mark, isAI };
  const score = {
    win: 0,
    lose: 0,
    tie: 0,
  };

  const setScore = (type) => score[type]++;
  const setPlayer = (prop, value) => (details[prop] = value);

  return { details, setScore, setPlayer, score };
};

const Players = (function () {
  const players = {
    "one player": [
      Player({ name: "player", mark: "x" }),
      Player({ name: "computer", mark: "o", isAI: true }),
    ],
    "two players": [
      Player({ name: "player1", mark: "x" }),
      Player({ name: "player2", mark: "o" }),
    ],
  };
  let turn = 0;

  const getPlayers = (mode) => players[mode];
  const getCurrentPlayer = (mode) => players[mode][turn % 2];
  const switchTurn = () => turn++;
  const startOver = () => (turn = 0);

  return {
    getCurrentPlayer,
    switchTurn,
    startOver,
    getPlayers,
  };
})();

const GameFlow = (function () {
  let currentMode = "one player";
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  let winningCombination = null;

  const getCurrentMode = () => currentMode;

  const checkWin = (positions) => {
    return winningCombinations.some((comb) => {
      if (comb.every((e) => positions.includes(e))) {
        winningCombination = comb;
        return true;
      }
      return false;
    });
  };

  const getComb = () => winningCombination;

  const endGame = () => {
    Gameboard.resetBoard();
    Players.startOver();
  };

  const changeOpponent = () => {
    endGame();
    currentMode = currentMode == "one player" ? "two players" : "one player";
  };

  return { checkWin, getComb, endGame, changeOpponent, getCurrentMode };
})();

// DOM manipulation

const board = document.querySelector(".board");
const firstPlayer = document.querySelector(".player1");
const secondPlayer = document.querySelector(".player2");
const tie = document.querySelector(".tie");
const toggleMode = document.querySelector("input");
let hasAnimationEnded = true;
renderCells();
renderScore();

async function displayMark(pos) {
  if (!hasAnimationEnded) return;

  const currentMode = GameFlow.getCurrentMode();
  const currentPlayer = Players.getCurrentPlayer(currentMode);
  const { name, mark, isAI } = currentPlayer.details;

  Gameboard.addMark(mark, pos);
  this.classList.add(mark);

  await animationEnded(this);
  if (hasPlayerWon(mark)) return gameOver(currentPlayer);
  if (isBoardFull()) return gameOver();

  Players.switchTurn();

  if (currentMode == "one player" && !isAI) playAiTurn(displayMark);
}

function hasPlayerWon(mark) {
  const markPositions = Gameboard.getMarkPositions(mark);
  return GameFlow.checkWin(markPositions);
}

function isBoardFull() {
  return Gameboard.getEmptyCells().length < 1;
}

function playAiTurn(cb) {
  const emptyCells = Gameboard.getEmptyCells();
  const random = Math.floor(Math.random() * emptyCells.length);
  const randomCell = document.querySelectorAll(".cell")[emptyCells[random]];
  cb.call(randomCell, emptyCells[random]);
}

function gameOver(winner = null) {
  if (winner) {
    const winnerComb = GameFlow.getComb();
    endGameAnimation(winner.details.mark, winnerComb);
    winner.setScore("win");
  } else {
    endGameAnimation();
    for (let p of Players.getPlayers(GameFlow.getCurrentMode())) {
      p.setScore("tie");
    }
  }
  renderScore();
  GameFlow.endGame();
  board.addEventListener("click", restartGame, { capture: true });
}

function restartGame(ev) {
  ev.stopPropagation();
  renderCells();
}

function changeOpponent() {
  GameFlow.changeOpponent();
  renderScore();
  renderCells();
}

function renderCells() {
  board.innerHTML = "";
  board.removeEventListener("click", restartGame, { capture: true });
  for (let i = 0; i < GRID_SIZE; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.addEventListener("click", (ev) => displayMark.call(cell, i));
    board.appendChild(cell);
  }
}

function renderScore() {
  const [p1, p2] = Players.getPlayers(GameFlow.getCurrentMode());

  firstPlayer.innerHTML = `<span class="name">${p1.details.name} (<span class="mark">${p1.details.mark}</span>)</span>
  <span class="score">${p1.score.win}</span>`;
  secondPlayer.innerHTML = `<span class="name">${p2.details.name} (<span class="mark">${p2.details.mark}</span>)</span>
  <span class="score">${p2.score.win}</span>`;
  tie.innerHTML = `<span class="name">Tie</span>
  <span class="score">${p2.score.tie}</span>`;
}

function endGameAnimation(winner, comb) {
  document.querySelectorAll(".cell").forEach((cell, i) => {
    if (!winner) {
      cell.classList.add("cell--tie");
      return;
    }
    if (comb.includes(i)) cell.classList.add("cell--win");
    if (!cell.matches(`.${winner}`)) cell.classList.add("cell--lose");
  });
}

function animationEnded(el) {
  return new Promise((res) => {
    hasAnimationEnded = false;
    function handleAnimation(e) {
      if (e.pseudoElement === "before") return;
      el.removeEventListener("animationend", handleAnimation);
      hasAnimationEnded = true;
      res();
    }
    el.addEventListener("animationend", handleAnimation);
  });
}

toggleMode.addEventListener("change", changeOpponent);
