import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Hello Match-3 Game 🎮</h1>
      <p>Скоро тут будет игра!</p>
      <button onClick={() => setCount(count + 1)}>
        Нажато {count} раз
      </button>
    </div>
  );
}

export default App;