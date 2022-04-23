"use strict";
const GRID_SIZE = 9;

const Gameboard = (function () {
  let board = Array.from({ length: GRID_SIZE }, () => null);
  const resetBoard = () => board.fill(null);
  const addMark = (mark, idx) => (board[idx] = mark);
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

const Players = (function () {
  const players = [];
  let turn = 0;

  const setPlayers = (...args) => {
    players.splice(0, 2);
    for (let [name, mark] of args) {
      players.push({ name, mark });
    }
  };
  const getPlayers = () => players;
  const getCurrentPlayer = () => players[turn % 2];
  const changePlayerName = (name) => {};
  const switchTurn = () => turn++;
  const startOver = () => (turn = 0);
  const handleSwitch = () => {
    let play = true;
    const canPlay = () => play;
    const setCanPlay = (p) => (play = p);
    return { canPlay, setCanPlay };
  };
  const handleAI = () => {
    let AI = true;
    const isAiActive = () => AI;
    const changeOpponent = () => (AI = !AI);
    return { isAiActive, changeOpponent };
  };

  return {
    ...handleSwitch(),
    ...handleAI(),
    getCurrentPlayer,
    switchTurn,
    changePlayerName,
    startOver,
    setPlayers,
    getPlayers,
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
  let comb = null;

  const setComb = (value) => (comb = value);
  const getComb = () => comb;
  const checkWin = (positions) => {
    return winningCombinations.some((comb) => {
      if (comb.every((e) => positions.includes(e))) {
        setComb(comb);
        return true;
      }
      return false;
    });
  };

  return { checkWin, setComb, getComb };
})();

const Control = (function (obj) {
  const score = [
    {
      x: 0,
      o: 0,
      tie: 0,
    },
    {
      x: 0,
      o: 0,
      tie: 0,
    },
  ];
  const firstPlayer = document.querySelector(".player1");
  const secondPlayer = document.querySelector(".player2");
  const tie = document.querySelector(".tie");
  const toggle = document.querySelector("input");
  obj.setPlayers(["player", "x"], ["computer", "o"]);
  render();

  toggle.addEventListener("change", changeOpponent);

  function render() {
    const [{ name: name1, mark: mark1 }, { name: name2, mark: mark2 }] =
      obj.getPlayers();
    const currentScore = score[+obj.isAiActive()];

    firstPlayer.innerHTML = `<span class="name">${name1} (<span class="mark">${mark1}</span>)</span>
    <span class="score">${currentScore[mark1]}</span>`;
    secondPlayer.innerHTML = `<span class="name">${name2} (<span class="mark">${mark2}</span>)</span>
    <span class="score">${currentScore[mark2]}</span>`;
    tie.innerHTML = `<span class="name">Tie</span>
    <span class="score">${currentScore.tie}</span>`;
  }
  const updateScore = (s) => {
    score[+obj.isAiActive()][s]++;
    render();
  };
  const switchPlayersClass = () => {
    firstPlayer.classList.toggle("active");
    secondPlayer.classList.toggle("active");
  };

  return { updateScore, render, switchPlayersClass };
})(Players);

// DOM manipulation
const board = document.querySelector(".board");
renderCells();

async function displayMark(pos) {
  if (!Players.canPlay()) return;
  const { name, mark } = Players.getCurrentPlayer();
  playTurn(this, mark, pos);

  await animationEnded(this);
  Players.setCanPlay(true);

  if (hasPlayerWon(mark)) return gameOver(mark);

  if (isBoardFull()) return gameOver();

  switchTurn();

  if (Players.isAiActive() && name.match("player")) playAiTurn(displayMark);
}

function playTurn(cell, mark, pos) {
  cell.classList.add(mark);
  Gameboard.addMark(mark, pos);
  Players.setCanPlay(false);
}

function hasPlayerWon(mark) {
  const markPositions = Gameboard.getMarkPositions(mark);
  return GameFlow.checkWin(markPositions);
}

function isBoardFull() {
  return Gameboard.getEmptyCells().length < 1;
}

function switchTurn() {
  Players.switchTurn();
  Control.switchPlayersClass();
}

function playAiTurn(cb) {
  const emptyCells = Gameboard.getEmptyCells();
  const random = Math.floor(Math.random() * emptyCells.length);
  const randomCell = document.querySelectorAll(".cell")[emptyCells[random]];
  cb.call(randomCell, emptyCells[random]);
}

function changeOpponent() {
  Players.changeOpponent();
  if (this.checked) Players.setPlayers(["player1", "x"], ["player2", "o"]);
  else Players.setPlayers(["player", "x"], ["computer", "o"]);
  Gameboard.resetBoard();
  Control.render();
  renderCells();
}

function gameOver(winner = null) {
  if (winner) {
    const winnerComb = GameFlow.getComb();
    Control.updateScore(winner);
    gameOverAnimation(winner, winnerComb);
  } else {
    Control.updateScore("tie");
    gameOverAnimation();
  }
  Gameboard.resetBoard();
  Players.startOver();
  board.addEventListener("click", restartGame, { capture: true });
}

function restartGame(ev) {
  ev.stopPropagation();
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

function gameOverAnimation(winner, comb) {
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
    function handleAnimation(e) {
      if (e.pseudoElement === "before") return;
      el.removeEventListener("animationend", handleAnimation);
      res();
    }
    el.addEventListener("animationend", handleAnimation);
  });
}
