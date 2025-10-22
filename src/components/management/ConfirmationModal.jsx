import React from 'react';
import { FaExclamationTriangle, FaTrash, FaLock, FaUnlock, FaTimes } from 'react-icons/fa';
import '../../styles/components/management/ConfirmationModal.css';
import Modal from '../common/Modal';

const ConfirmationModal = ({ user, action, onConfirm, onClose }) => {
  const [resultModal, setResultModal] = React.useState({ isOpen: false, type: 'success', title: '', message: '' });

  const handleConfirm = async () => {
    try {
      await onConfirm();
      setResultModal({ isOpen: true, type: 'success', title: 'Usuario borrado', message: `${user?.name} ha sido eliminado correctamente.` });
      setTimeout(() => {
        setResultModal(prev => ({ ...prev, isOpen: false }));
        onClose();
      }, 1400);
    } catch (err) {
      console.error(err);
      setResultModal({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo eliminar el usuario. Intente nuevamente.' });
    }
  };
  const getModalConfig = () => {
    switch (action) {
      case 'delete':
        return {
          title: 'Eliminar Usuario',
          message: `¿Está seguro que desea eliminar a ${user?.name}? Esta acción no se puede deshacer.`,
          icon: <FaTrash />,
          confirmText: 'Eliminar',
          confirmClass: 'btn-danger'
        };
      case 'block':
        return {
          title: 'Bloquear Usuario',
          message: `¿Está seguro que desea bloquear a ${user?.name}? El usuario no podrá acceder al sistema.`,
          icon: <FaLock />,
          confirmText: 'Bloquear',
          confirmClass: 'btn-warning'
        };
      case 'unblock':
        return {
          title: 'Desbloquear Usuario',
          message: `¿Está seguro que desea desbloquear a ${user?.name}? El usuario podrá acceder al sistema nuevamente.`,
          icon: <FaUnlock />,
          confirmText: 'Desbloquear',
          confirmClass: 'btn-success'
        };
      default:
        return {
          title: 'Confirmar Acción',
          message: '¿Está seguro que desea realizar esta acción?',
          icon: <FaExclamationTriangle />,
          confirmText: 'Confirmar',
          confirmClass: 'btn-primary'
        };
    }
  };

  const config = getModalConfig();

  return (
    <div className="modal-overlay">
      <div className="confirmation-modal">
        <div className="modal-header">
          <h2>{config.title}</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="warning-icon">
            {config.icon}
          </div>
          <p>{config.message}</p>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className={`btn-confirm ${config.confirmClass}`} onClick={handleConfirm}>
            {config.confirmText}
          </button>
        </div>
      </div>
      <Modal
        isOpen={resultModal.isOpen}
        type={resultModal.type}
        title={resultModal.title}
        message={resultModal.message}
        onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ConfirmationModal;