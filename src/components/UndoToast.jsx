function UndoToast({ message, onUndo, onDismiss }) {
  return (
    <div className="undo-toast" role="status" aria-live="polite">
      <span className="undo-toast-message">{message}</span>
      <div className="undo-toast-actions">
        <button className="undo-toast-btn undo-toast-btn--undo" onClick={onUndo}>
          UNDO
        </button>
        <button className="undo-toast-btn undo-toast-btn--dismiss" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  );
}

export default UndoToast;
