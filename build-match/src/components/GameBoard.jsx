import React, { useRef, useState, useEffect } from "react";
import Tile from "./Tile";
import "./GameBoard.css";

// --- Константы ---
const ROWS = 6;  // ← меняешь и всё работает
const COLS = 6;
const MATERIALS = ["red", "blue", "green", "yellow", "purple"];

// --- Утилиты ---
// --- Утилиты ---
const randMat = () => MATERIALS[Math.floor(Math.random() * MATERIALS.length)];
const cloneBoard = (b) => b.map((row) => [...row]);

// Создаём доску без стартовых матчей
function makeBoard() {
  let board;
  do {
    board = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => randMat())
    );
  } while (hasAnyMatches(board)); // пока есть совпадения — пересоздаём
  return board;
}

// Проверка на наличие совпадений (чтобы не использовать resolve)
function hasAnyMatches(b) {
  const mask = findMatchesMask(b);
  return mask.some(row => row.some(Boolean));
}
// --- Поиск совпадений ---
function findMatchesMask(b) {
  const mask = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

  // Горизонталь
  for (let r = 0; r < ROWS; r++) {
    let run = 1;
    for (let c = 1; c <= COLS; c++) {
      const same = c < COLS && b[r][c] && b[r][c] === b[r][c - 1];
      if (same) run++;
      else {
        if (run >= 3) for (let k = c - run; k < c; k++) mask[r][k] = true;
        run = 1;
      }
    }
  }

  // Вертикаль
  for (let c = 0; c < COLS; c++) {
    let run = 1;
    for (let r = 1; r <= ROWS; r++) {
      const same = r < ROWS && b[r][c] && b[r][c] === b[r - 1][c];
      if (same) run++;
      else {
        if (run >= 3) for (let k = r - run; k < r; k++) mask[k][c] = true;
        run = 1;
      }
    }
  }

  return mask;
}

const maskHasAny = (mask) => mask.some((row) => row.some((m) => m));
const maskCount = (mask) =>
  mask.reduce((acc, row) => acc + row.filter(Boolean).length, 0);

// Удаление по маске
function removeByMask(b, mask) {
  const nb = cloneBoard(b);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (mask[r][c]) nb[r][c] = null;
  return nb;
}

// Падение вниз
function applyGravity(b) {
  const nb = cloneBoard(b);
  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (nb[r][c]) {
        nb[write][c] = nb[r][c];
        if (write !== r) nb[r][c] = null;
        write--;
      }
    }
  }
  return nb;
}

// Заполнение пустых
function fillEmpty(b) {
  const nb = cloneBoard(b);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (!nb[r][c]) nb[r][c] = randMat();
  return nb;
}

export default function GameBoard() {
  const [board, setBoard] = useState(makeBoard());
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);

  const timerRef = useRef(null);
  const resolvingRef = useRef(false);

  useEffect(() => {
    // resolve(board);
    // eslint-disable-next-line
  }, []);

  // --- Основная логика ---
  function resolve(startBoard) {
    if (resolvingRef.current) return;
    resolvingRef.current = true;

    const step = (grid) => {
      const mask = findMatchesMask(grid);
      if (!maskHasAny(mask)) {
        setBoard(grid);
        resolvingRef.current = false;
        return;
      }

      const removedCount = maskCount(mask);
      setScore((s) => s + removedCount * 10);

      const removed = removeByMask(grid, mask);
      setBoard(removed);

      timerRef.current = setTimeout(() => {
        const dropped = applyGravity(removed);
        setBoard(dropped);

        timerRef.current = setTimeout(() => {
          const filled = fillEmpty(dropped);
          setBoard(filled);

          timerRef.current = setTimeout(() => step(filled), 160);
        }, 160);
      }, 160);
    };

    step(startBoard);
  }

  // --- Клик / своп ---
  function handleClick(r, c) {
    if (!selected) {
      setSelected([r, c]);
      return;
    }
    const [r1, c1] = selected;
    const r2 = r, c2 = c;

    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) {
      setSelected([r, c]);
      return;
    }

    const nb = cloneBoard(board);
    [nb[r1][c1], nb[r2][c2]] = [nb[r2][c2], nb[r1][c1]];

    const maskAfterSwap = findMatchesMask(nb);
    if (maskHasAny(maskAfterSwap)) {
      setBoard(nb);
      setSelected(null);
      resolve(nb);
    } else {
      setSelected(null);
      setBoard(cloneBoard(board));
    }
  }

  function restart() {
    if (timerRef.current) clearTimeout(timerRef.current);
    resolvingRef.current = false;
    const fresh = makeBoard();
    setBoard(fresh);
    setScore(0);
    setSelected(null);
  }

  return (
    <div className="game">
      <div className="hud">
        <h1>🏗 Match-3</h1>
        <div className="score">Очки: {score}</div>
        <button className="btn" onClick={restart}>🔄 Перезапуск</button>
      </div>

      <div 
  className="board" 
  style={{ 
    display: "grid",
    gridTemplateColumns: `repeat(${COLS}, 60px)`,
    gridTemplateRows: `repeat(${ROWS}, 60px)`,
    gap: "5px"
    // width: COLS * 60,
    // height: ROWS * 60
  }}
>
  {board.map((row, r) =>
    row.map((cell, c) => (
      <Tile
        key={`${r}-${c}-${cell}`} 
        type={cell}
        row={r}
        col={c}
        selected={selected && selected[0] === r && selected[1] === c}
        onClick={() => handleClick(r, c)}
      />
    ))
  )}
</div>
    </div>
  );
}