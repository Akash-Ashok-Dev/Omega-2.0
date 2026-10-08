import { useEffect } from "react";

type ComingSoonModalProps = {
  message: string;
  onClose: () => void;
};

export function ComingSoonModal({ message, onClose }: ComingSoonModalProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="rules-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="rules-modal__window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="coming-soon-title"
      >
        <button
          className="rules-modal__close"
          type="button"
          onClick={onClose}
          aria-label="Close coming soon notice"
        >
          ×
        </button>
        <p className="eyebrow">STATUS UPDATE</p>
        <h2 id="coming-soon-title">Coming soon.</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default ComingSoonModal;
