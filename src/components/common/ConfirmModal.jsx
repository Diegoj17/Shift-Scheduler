import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import '../../styles/components/common/Modal.css';

const ConfirmModal = ({ isOpen, title = 'Confirmar', message, onCancel, onConfirm, confirmLabel = 'Eliminar', cancelLabel = 'Cancelar' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="modal error" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-icon-wrapper">
            <FaExclamationTriangle className="modal-icon error" aria-hidden="true" />
          </div>
          <div className="modal-text">
            <h3 className="modal-title">{title}</h3>
            <p className="modal-message error">{message}</p>
          </div>
          <div className="modal-actions">
            <button className="modal-btn" onClick={onCancel} style={{ background: '#f8fafc', color: '#111827', border: '1px solid rgba(0,0,0,0.06)', marginRight: 12 }}>
              {cancelLabel}
            </button>
            <button className="modal-btn error" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
