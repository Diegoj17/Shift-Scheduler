import React from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import '../../styles/components/common/Modal.css';

const Modal = ({ isOpen, type = 'success', title, message, onClose }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <FaExclamationTriangle className="modal-icon error" />;
      case 'success':
        return <FaCheckCircle className="modal-icon success" />;
      default:
        return <FaInfoCircle className="modal-icon default" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-icon-wrapper">
            {getIcon()}
          </div>
          <div className="modal-text">
            <h3 className="modal-title">{title}</h3>
            <p className="modal-message">{message}</p>
          </div>
          <div className="modal-actions">
            <button 
              className={`modal-btn ${type}`}
              onClick={onClose}
              autoFocus
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;