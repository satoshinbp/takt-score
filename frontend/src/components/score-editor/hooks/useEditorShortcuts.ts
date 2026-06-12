"use client";

import { useEffect, useRef } from "react";

type Handlers = {
  onSave: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onCut: () => void;
  onUndo: () => void;
  onRedo: () => void;
};

const isTextFieldTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
};

// Wires Cmd/Ctrl based editor shortcuts (save / copy / paste / cut / undo /
// redo) to the window. Handlers are read through a ref so the listener is
// registered once and never goes stale even though the ops are recreated each
// render.
export const useEditorShortcuts = (handlers: Handlers) => {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // A keydown mid IME composition (日本語変換中) carries an in-flight
      // candidate; never let it trigger an editor action.
      if (event.isComposing) return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const key = event.key.toLowerCase();

      // Save works everywhere, including while editing the title field.
      if (key === "s") {
        event.preventDefault();
        handlersRef.current.onSave();
        return;
      }

      // Every other shortcut is editor-scoped; inside a text field defer to the
      // browser so Cmd+Z/C/V/X act on the input's own value as the user expects.
      if (isTextFieldTarget(event.target)) return;

      // Undo/redo: Cmd+Z and Cmd+Shift+Z (Cmd+Y also redoes on some layouts).
      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) handlersRef.current.onRedo();
        else handlersRef.current.onUndo();
        return;
      }
      if (key === "y") {
        event.preventDefault();
        handlersRef.current.onRedo();
        return;
      }

      switch (key) {
        case "c":
          event.preventDefault();
          handlersRef.current.onCopy();
          break;
        case "v":
          event.preventDefault();
          handlersRef.current.onPaste();
          break;
        case "x":
          event.preventDefault();
          handlersRef.current.onCut();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
};
