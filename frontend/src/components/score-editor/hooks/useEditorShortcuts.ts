"use client";

import { useEffect, useRef } from "react";

type Handlers = {
  onSave: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onCut: () => void;
};

const isTextFieldTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
};

// Wires Cmd/Ctrl based editor shortcuts (save / copy / paste / cut) to the
// window. Handlers are read through a ref so the listener is registered once
// and never goes stale even though the ops are recreated each render.
export const useEditorShortcuts = (handlers: Handlers) => {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const key = event.key.toLowerCase();

      // Save works everywhere, including while editing the title field.
      if (key === "s") {
        event.preventDefault();
        handlersRef.current.onSave();
        return;
      }

      // Leave native clipboard behaviour intact inside text fields.
      if (isTextFieldTarget(event.target)) return;

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
