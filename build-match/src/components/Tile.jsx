// Tile.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./GameBoard.css";

export default function Tile({ type, selected, onClick }) {
  if (!type) {
    // когда ячейка пустая (удалённая) — мы всё равно рендерим с AnimatePresence
    return (
      <AnimatePresence>
        <motion.div
          className="tile tile-empty"
          initial={{ opacity: 1, scale: 0 }}
          animate={{ opacity: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 1 }}
        />
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        layout
        onClick={onClick}
        className={`tile tile-${type} ${selected ? "tile-selected" : ""}`}
        initial={{ y: -100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: "200" }}
      />
    </AnimatePresence>
  );
}