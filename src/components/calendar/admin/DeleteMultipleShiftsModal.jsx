import { useEffect, useRef } from 'react';
import { FaTrash } from 'react-icons/fa';
import '../../../styles/components/calendar/admin/DeleteMultipleShiftsModal.css';

const DeleteMultipleShiftsModal = ({
  isOpen,
  selectedCount = 0,
  selectedShifts = [],
  isDeleting = false,
  onCancel,
  onConfirm,
}) => {
  const backdropMouseDownRef = useRef(false);

  const handleBackdropMouseDown = (event) => {
    backdropMouseDownRef.current = event.target === event.currentTarget;
  };

  const handleBackdropClick = (event) => {
    if (event.target !== event.currentTarget) return;
    if (!backdropMouseDownRef.current) return;
    if (!isDeleting) onCancel?.();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape' && !isDeleting) {
        onCancel?.();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  const employeeCountMap = selectedShifts.reduce((acc, shift) => {
    const employeeName =
      shift?.extendedProps?.employeeName ||
      shift?.employeeName ||
      (shift?.title ? String(shift.title).split(' - ')[0] : '') ||
      'Sin nombre';

    acc[employeeName] = (acc[employeeName] || 0) + 1;
    return acc;
  }, {});

  const employeeEntries = Object.entries(employeeCountMap).sort((a, b) => b[1] - a[1]);

  const formatDate = (raw) => {
    if (!raw) return 'Sin fecha';
    try {
      return new Date(raw).toLocaleDateString('es-ES');
    } catch {
      return 'Sin fecha';
    }
  };

  const previewShifts = selectedShifts.slice(0, 4);

  return (
    <div className="calendar-delete-modal-overlay" onMouseDown={handleBackdropMouseDown} onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="calendar-delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-delete-modal-header">
          <h3 className="calendar-delete-modal-header-title">
            <FaTrash className="calendar-delete-modal-header-icon" /> Eliminar Turnos
          </h3>
          <button className="calendar-delete-modal-close" onClick={() => !isDeleting && onCancel?.()}>
            <span className="calendar-delete-modal-close-x" aria-hidden="true">X</span>
          </button>
        </div>

        <div className="calendar-delete-modal-content">
          <p className="calendar-delete-modal-message">
            ¿Estás seguro de que deseas eliminar {selectedCount} turno(s)?
          </p>

          <div className="calendar-delete-modal-details">
            <p><strong>Turnos seleccionados:</strong> {selectedCount}</p>
          </div>

          {employeeEntries.length > 0 && (
            <div className="calendar-delete-modal-employee-list">
              {employeeEntries.map(([name, count]) => (
                <div key={name} className="calendar-delete-modal-employee-item">
                  <span className="calendar-delete-modal-employee-name">{name}</span>
                  <span className="calendar-delete-modal-employee-count">{count} turno(s)</span>
                </div>
              ))}
            </div>
          )}

          {previewShifts.length > 0 && (
            <div className="calendar-delete-modal-preview">
              {previewShifts.map((shift) => (
                <p key={String(shift.id)}>
                  <strong>{shift?.extendedProps?.employeeName || String(shift?.title || '').split(' - ')[0] || 'Sin nombre'}:</strong>{' '}
                  {formatDate(shift?.start)}
                </p>
              ))}
              {selectedShifts.length > 4 && (
                <p className="calendar-delete-modal-more">+{selectedShifts.length - 4} turno(s) más</p>
              )}
            </div>
          )}

          <p className="calendar-delete-modal-warning">Esta acción no se puede deshacer.</p>

        </div>

        <div className="calendar-delete-modal-actions">
          <button
            type="button"
            className="calendar-delete-modal-btn calendar-delete-modal-btn-cancel"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="calendar-delete-modal-btn calendar-delete-modal-btn-confirm"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            <FaTrash /> {isDeleting ? 'Eliminando...' : 'Eliminar Turnos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMultipleShiftsModal;
