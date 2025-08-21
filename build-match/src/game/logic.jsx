import {
  ALL_ROWS,
  COLS,
  TILE_TYPES,
  MIN_MATCH,
} from "./constants.jsx";

/**
 * Псевдослучайный генератор с seed для воспроизводимости.
 * @param {number} seed
 * @returns {() => number} возвращает функцию rand() в [0,1)
 */
export function seededRandom(seed) {
  let s = seed >>> 0;
  return function rand() {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    // нормализуем в [0,1)
    return ((s >>> 0) / 4294967296);
  };
}

/**
 * Создаёт изначальную доску ALL_ROWS × COLS.
 * Верхние HIDDEN_ROWS будут невидимы для игрока.
 * @param {() => number} rng
 */
export function createInitialBoard(rng) {
  const board = [];
  let nextId = 1;
  for (let r = 0; r < ALL_ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      row.push({
        id: nextId++,
        kind: pickKind(rng),
        state: "idle", // idle | falling | popping
      });
    }
    board.push(row);
  }
  // Важно: уберём стартовые большие совпадения, чтобы не «взорвалось» сразу.
  // Сделаем пару проходов: если есть матч — заменим центр.
  for (let pass = 0; pass < 2; pass++) {
    const matches = findAllMatches(board);
    if (matches.length === 0) break;
    for (const m of matches) {
      const mid = m.cells[Math.floor(m.cells.length / 2)];
      board[mid.r][mid.c] = {
        id: (nextId++),
        kind: pickKind(rng),
        state: "idle",
      };
    }
  }
  return board;
}

/**
 * Возвращает случайный тип плитки.
 * @param {() => number} rng
 */
function pickKind(rng) {
  const i = Math.floor(rng() * TILE_TYPES.length);
  return TILE_TYPES[i];
}

/**
 * Глубокая копия доски.
 * @param {Array<Array<object|null>>} board
 */
export function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

/**
 * Поиск всех матчей (3+ подряд) по горизонтали и вертикали.
 * Возвращает массив групп: { kind, cells: [{r,c}, ...] }
 * @param {Array<Array<object|null>>} board
 */
export function findAllMatches(board) {
  const R = board.length;
  const C = board[0].length;
  const visited = Array.from({ length: R }, () => Array(C).fill(false));
  const groups = [];

  // Хоризонтальные
  for (let r = 0; r < R; r++) {
    let start = 0;
    while (start < C) {
      if (!board[r][start]) { start++; continue; }
      let end = start + 1;
      while (
        end < C &&
        board[r][end] &&
        board[r][end].kind === board[r][start].kind
      ) {
        end++;
      }
      const len = end - start;
      if (len >= MIN_MATCH) {
        const cells = [];
        for (let c = start; c < end; c++) cells.push({ r, c });
        groups.push({ kind: board[r][start].kind, cells });
        for (let c = start; c < end; c++) visited[r][c] = true;
      }
      start = end;
    }
  }

  // Вертикальные
  for (let c = 0; c < C; c++) {
    let start = 0;
    while (start < R) {
      if (!board[start][c]) { start++; continue; }
      let end = start + 1;
      while (
        end < R &&
        board[end][c] &&
        board[end][c].kind === board[start][c].kind
      ) {
        end++;
      }
      const len = end - start;
      if (len >= MIN_MATCH) {
        const cells = [];
        for (let r = start; r < end; r++) {
          if (!visited[r][c]) cells.push({ r, c }); // избегаем дублей с горизонталью
        }
        if (cells.length) {
          groups.push({ kind: board[start][c].kind, cells });
          for (let r = start; r < end; r++) visited[r][c] = true;
        }
      }
      start = end;
    }
  }

  return groups;
}

/**
 * Применяет «гравитацию»: элементы падают вниз, заполняя null-дыры.
 * Отмечает упавшие state="falling" для анимации.
 * @param {Array<Array<object|null>>} board
 */
export function applyGravity(board) {
  const R = board.length;
  const C = board[0].length;
  const next = cloneBoard(board);

  for (let c = 0; c < C; c++) {
    let write = R - 1; // снизу вверх
    for (let r = R - 1; r >= 0; r--) {
      const cell = next[r][c];
      if (cell) {
        if (write !== r) {
          // "падаем" на позицию write
          next[write][c] = { ...cell, state: "falling" };
          next[r][c] = null;
        }
        write--;
      }
    }
    // всё, что выше write — пустоты
  }
  // после падения вернем state="idle" на следующем тике (делается в UI таймингом)
  return next;
}

/**
 * Рефилл скрытых рядов (самых верхних) новыми плитками.
 * Только там, где null.
 * @param {Array<Array<object|null>>} board
 * @param {() => number} rng
 */
export function refillHiddenRows(board, rng) {
  const R = board.length;
  const C = board[0].length;
  const next = cloneBoard(board);
  let nextId = getMaxId(next) + 1;

  // Заполняем только пустоты в верхних рядах (они всё равно потом упадут)
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (next[r][c] == null) {
        next[r][c] = {
          id: nextId++,
          kind: pickKind(rng),
          state: "idle",
        };
      }
    }
  }
  return next;
}

/**
 * Возвращает максимальный id на доске (для аккуратного инкремента).
 * @param {Array<Array<object|null>>} board
 */
function getMaxId(board) {
  let max = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.id > max) max = cell.id;
    }
  }
  return max;
}

/**
 * Пытается выполнить свап соседних клеток (a и b).
 * Если после свапа есть матч — возвращает новую доску и флаг swapped=true.
 * Если нет — откатывает и swapped=false.
 * @param {Array<Array<object|null>>} board
 * @param {{r:number,c:number}} a
 * @param {{r:number,c:number}} b
 */
export function swapIfValidAndResolve(board, a, b) {
  const next = cloneBoard(board);
  // свап
  const tmp = next[a.r][a.c];
  next[a.r][a.c] = next[b.r][b.c];
  next[b.r][b.c] = tmp;

  // проверим, появились ли матчи
  const matches = findAllMatches(next);
  if (matches.length === 0) {
    // откат
    return { nextBoard: board, swapped: false };
  }
  return { nextBoard: next, swapped: true };
}