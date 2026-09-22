function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal">
        <h3 id="modal-title" className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn--cancel" onClick={onCancel}>
            CANCEL
          </button>
          <button className="modal-btn modal-btn--confirm" onClick={onConfirm}>
            CONFIRM DELETE
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
