import { FaExclamationTriangle, FaTrash, FaLock, FaUnlock, FaTimes } from 'react-icons/fa';
import '../../styles/components/management/ConfirmationModal.css';

const ConfirmationModal = ({ user, action, onConfirm, onClose }) => {
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
          <button className={`btn-confirm ${config.confirmClass}`} onClick={onConfirm}>
            {config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;