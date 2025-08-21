/**
 * Константы игрового поля и параметров анимаций.
 */

// Видимая часть поля: 6×6
export const VISIBLE_ROWS = 6;
export const COLS = 6;

// Скрытая часть сверху для спавна: 6 строк
export const HIDDEN_ROWS = 6;

// Полное количество рядов
export const ALL_ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

// Типы плиток (строительные материалы)
export const TILE_TYPES = ["BRICK", "WOOD", "STEEL", "GLASS", "CEMENT", "STONE"];

// Минимальная длина матча
export const MIN_MATCH = 3;

// Очки за одну плитку в матче
export const SCORE_PER_TILE = 10;

// Тайминги анимации (миллисекунды)
export const TILE_FALL_MS = 500;       // падение
export const TILE_POP_MS = 220;        // исчезновение
export const TILE_SPAWN_DELAY_MS = 80; // задержка между «волнами»