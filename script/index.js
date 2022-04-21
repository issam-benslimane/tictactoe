"use strict";
const GRID_SIZE = 9;

const Gameboard = (function () {
  let board = Array.from({ length: GRID_SIZE }, () => null);
  const resetBoard = () => board.fill(null);
  const addMark = (mark, idx) => (board[idx] = mark);
  const findEmtyCells = () => board.find((cell) => cell == null);
  const getMarkPositions = (mark) => {
    const pos = [];
    for (let i = 0; i < board.length; i++) {
      board[i] === mark && pos.push(i);
    }
    return pos;
  };

  return { getMarkPositions, addMark, resetBoard, findEmtyCells };
})();

const Players = (function () {
  const players = [
    { name: "player1", mark: "x" },
    { name: "player2", mark: "circle" },
  ];
  let turn = 0;

  const isAllowedToPlay = () => {
    let play = true;
    const canPlay = () => play;
    const setCanPlay = (p) => (play = p);
    return { canPlay, setCanPlay };
  };
  const getCurrentPlayer = () => players[turn % 2];
  const changePlayerName = (name) => {};
  const switchTurn = () => turn++;
  const startOver = () => (turn = 0);

  return {
    ...isAllowedToPlay(),
    getCurrentPlayer,
    switchTurn,
    changePlayerName,
    startOver,
  };
})();

const GameFlow = (function () {
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
  const checkWin = (positions) => {
    return winningCombinations.some((comb) =>
      comb.every((e) => positions.includes(e))
    );
  };

  return { checkWin };
})();

// DOM manipulation
const board = document.querySelector(".board");
renderCells();

async function displayMark(ev, pos) {
  if (!Players.canPlay()) return;
  const { name, mark } = Players.getCurrentPlayer();
  this.classList.add(mark);
  Gameboard.addMark(mark, pos);
  Players.setCanPlay(false);

  // check if there's a winner
  await animationEnded(this);
  Players.setCanPlay(true);
  const markPositions = Gameboard.getMarkPositions(mark);
  if (GameFlow.checkWin(markPositions)) return gameOver(name);

  // check if board is full
  if (Gameboard.findEmtyCells() === undefined) return gameOver();

  // switch turn
  Players.switchTurn();
}

function gameOver(winner = null) {
  winner ? console.log(winner) : console.log("its a tie");
  Gameboard.resetBoard();
  Players.startOver();
}

function renderCells() {
  board.innerHTML = "";
  for (let i = 0; i < GRID_SIZE; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.addEventListener("click", (ev) => displayMark.apply(cell, [ev, i]));
    board.appendChild(cell);
  }
}

function animationEnded(el) {
  return new Promise((res) => {
    function handleAnimation(e) {
      if (e.pseudoElement === "before") return;
      el.removeEventListener("animationend", handleAnimation);
      res();
    }
    el.addEventListener("animationend", handleAnimation);
  });
}
