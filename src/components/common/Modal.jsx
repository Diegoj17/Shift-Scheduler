import React from 'react';

const Modal = ({ isOpen, type = 'success', title, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className={`modal ${type === 'error' ? 'modal-error' : 'modal-success'}`}>
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-actions">
          <button className="modal-btn" onClick={onClose}>Aceptar</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
