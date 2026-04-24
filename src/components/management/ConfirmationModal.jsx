import React from 'react';
import { FaExclamationTriangle, FaTrash, FaLock, FaUnlock, FaUserTimes } from 'react-icons/fa';
import '../../styles/components/management/ConfirmationModal.css';
import Modal from '../common/Modal';

const ConfirmationModal = ({ user, action, onConfirm, onClose }) => {
  const [resultModal, setResultModal] = React.useState({ isOpen: false, type: 'success', title: '', message: '' });

  React.useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  const handleConfirm = async () => {
    try {
      await onConfirm();
      const successByAction = {
        delete: {
          title: 'Usuario eliminado',
          message: `${user?.name} ha sido eliminado correctamente.`
        },
        block: {
          title: 'Usuario bloqueado',
          message: `${user?.name} ha sido bloqueado correctamente.`
        },
        unblock: {
          title: 'Usuario desbloqueado',
          message: `${user?.name} ya puede acceder al sistema.`
        },
        deactivate: {
          title: 'Usuario inactivado',
          message: `${user?.name} fue marcado como inactivo.`
        },
        activate: {
          title: 'Usuario activado',
          message: `${user?.name} fue activado correctamente.`
        }
      };

      const successConfig = successByAction[action] || {
        title: 'Acción completada',
        message: `La acción sobre ${user?.name} se ejecutó correctamente.`
      };

      setResultModal({ isOpen: true, type: 'success', ...successConfig });
      setTimeout(() => {
        setResultModal(prev => ({ ...prev, isOpen: false }));
        onClose();
      }, 1400);
    } catch (err) {
      console.error(err);
      setResultModal({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo completar la acción sobre el usuario. Intente nuevamente.' });
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
      case 'deactivate':
        return {
          title: 'Inactivar Usuario',
          message: `¿Está seguro que desea inactivar a ${user?.name}? El usuario no podrá iniciar sesión hasta ser activado nuevamente.`,
          icon: <FaUserTimes />,
          confirmText: 'Inactivar',
          confirmClass: 'btn-warning'
        };
      case 'activate':
        return {
          title: 'Activar Usuario',
          message: `¿Está seguro que desea activar a ${user?.name}? El usuario podrá iniciar sesión nuevamente.`,
          icon: <FaUnlock />,
          confirmText: 'Activar',
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{config.title}</h2>
          <button className="close-btn" onClick={onClose}>
            <span aria-hidden="true">X</span>
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
