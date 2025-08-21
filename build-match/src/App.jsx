import React, { useState } from "react";
import GameBoard from "./components/GameBoard.jsx";

/**
 * Корневой компонент приложения.
 * Держит глобальные элементы UI (шапка, счёт, кнопки перезапуска).
 */
export default function App() {
  const [seed, setSeed] = useState(0); // изменяем seed, чтобы "пересоздать" игру
  const [score, setScore] = useState(0);

  /**
   * Обработчик сброса игры
   */
  const handleReset = () => {
    setSeed((s) => s + 1);
    setScore(0);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>🏗 Build & Match — MVP</h1>
        <div className="score-box">
          <span>Очки:</span>
          <strong>{score}</strong>
        </div>
        <button className="btn" onClick={handleReset}>Перезапуск</button>
      </header>

      {/* Игровое поле. Передаём callback для обновления счета */}
      <GameBoard
        key={seed}
        onScore={(delta) => setScore((v) => v + delta)}
      />

      <footer className="app-footer">
        <p>
          MVP: 6×12 сетка, сверху невидимый спавн (6×6). Игрок видит нижние 6×6.
          Плавное падение, поочерёдное исчезновение совпавших групп (3+).
        </p>
      </footer>
    </div>
  );
}