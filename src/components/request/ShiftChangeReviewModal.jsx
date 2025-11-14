import React, { useState } from 'react';
import { MdClose, MdCheckCircle, MdCancel, MdPerson, MdCalendarToday, MdNotes } from 'react-icons/md';
import shiftChangeService from '../../services/shiftChangeService';
import { formatTime } from '../../utils/dateUtils';
import '../../styles/components/request/ShiftChangeReviewModal.css';

const ShiftChangeReviewModal = ({ request, onClose, onSuccess }) => {
  const [action, setAction] = useState(null); // 'approve' o 'reject'
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleSubmit = async () => {
    // Validar comentario si rechaza
    if (action === 'reject') {
      if (!comment || comment.trim().length < 10) {
        showNotification('error', 'Debe ingresar un motivo para el rechazo (mínimo 10 caracteres)');
        return;
      }
    }

    setLoading(true);

    try {
      await shiftChangeService.reviewChangeRequest(request.id, action, comment.trim());
      
      showNotification('success', `Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'} exitosamente`);
      
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (error) {
      showNotification('error', error.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Usamos formatTime importado desde utils (muestra AM/PM)

  return (
    <div className="shift-review-modal-overlay" onClick={onClose}>
      <div className="shift-review-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="shift-review-modal-header">
          <h2 className="shift-review-modal-title">
            Revisar Solicitud #{request.id}
          </h2>
          <button className="shift-review-modal-close" onClick={onClose}>
            <MdClose size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="shift-review-modal-body">
          {/* Información del empleado */}
          <div className="shift-review-modal-section">
            <h3 className="shift-review-modal-section-title">
              <MdPerson size={20} />
              Información del Empleado
            </h3>
            <div className="shift-review-modal-info-grid">
              <div className="shift-review-modal-info-item">
                <span className="shift-review-modal-label">Nombre:</span>
                <span className="shift-review-modal-value">{request.requesting_employee_name}</span>
              </div>
              <div className="shift-review-modal-info-item">
                <span className="shift-review-modal-label">Puesto:</span>
                <span className="shift-review-modal-value">{request.requesting_employee_position}</span>
              </div>
              <div className="shift-review-modal-info-item">
                <span className="shift-review-modal-label">Fecha de solicitud:</span>
                <span className="shift-review-modal-value">{formatDate(request.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Turno original */}
          <div className="shift-review-modal-section">
            <h3 className="shift-review-modal-section-title">
              <MdCalendarToday size={20} />
              Turno a Cambiar
            </h3>
            <div className="shift-review-modal-shift-card shift-review-original">
              <div className="shift-review-modal-info-item">
                <span className="shift-review-modal-label">Fecha:</span>
                <span className="shift-review-modal-value">{formatDate(request.original_shift_date)}</span>
              </div>
              <div className="shift-review-modal-info-item">
                <span className="shift-review-modal-label">Horario:</span>
                <span className="shift-review-modal-value">
                  {formatTime(request.original_shift_start)} - {formatTime(request.original_shift_end)}
                </span>
              </div>
              <div className="shift-review-modal-info-item">
                <span className="shift-review-modal-label">Tipo:</span>
                <span className="shift-review-modal-value">{request.original_shift_type}</span>
              </div>
            </div>
          </div>

          {/* Compañero propuesto */}
          {request.proposed_employee_name && (
            <div className="shift-review-modal-section">
              <h3 className="shift-review-modal-section-title">
                <MdPerson size={20} />
                Compañero Propuesto para Intercambio
              </h3>
              <div className="shift-review-modal-shift-card shift-review-proposed">
                <div className="shift-review-modal-info-item">
                  <span className="shift-review-modal-label">Empleado:</span>
                  <span className="shift-review-modal-value">{request.proposed_employee_name}</span>
                </div>
                {request.proposed_shift_date && (
                  <>
                    <div className="shift-review-modal-info-item">
                      <span className="shift-review-modal-label">Fecha:</span>
                      <span className="shift-review-modal-value">{formatDate(request.proposed_shift_date)}</span>
                    </div>
                    <div className="shift-review-modal-info-item">
                      <span className="shift-review-modal-label">Horario:</span>
                      <span className="shift-review-modal-value">
                        {formatTime(request.proposed_shift_start)} - {formatTime(request.proposed_shift_end)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Motivo */}
          <div className="shift-review-modal-section">
            <h3 className="shift-review-modal-section-title">
              <MdNotes size={20} />
              Motivo de la Solicitud
            </h3>
            <p className="shift-review-modal-reason">{request.reason}</p>
          </div>

          {/* Decisión (solo si está pendiente) */}
          {request.status === 'pending' && (
            <div className="shift-review-modal-section">
              <h3 className="shift-review-modal-section-title">
                Decisión
              </h3>

              {/* Botones de acción */}
              <div className="shift-review-modal-actions">
                <button
                  className={`shift-review-action-approve ${action === 'approve' ? 'active' : ''}`}
                  onClick={() => setAction('approve')}
                  disabled={loading}
                >
                  <MdCheckCircle size={20} />
                  Aprobar
                </button>
                <button
                  className={`shift-review-action-reject ${action === 'reject' ? 'active' : ''}`}
                  onClick={() => setAction('reject')}
                  disabled={loading}
                >
                  <MdCancel size={20} />
                  Rechazar
                </button>
              </div>

              {/* Comentario */}
              {action && (
                <div className="shift-review-modal-comment">
                  <label htmlFor="managerComment" className="shift-review-modal-label">
                    Comentario {action === 'reject' && <span className="required">*</span>}
                  </label>
                  <textarea
                    id="managerComment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="shift-review-modal-textarea"
                    rows="4"
                    placeholder={action === 'reject' 
                      ? 'Ingresa el motivo del rechazo (mínimo 10 caracteres)' 
                      : 'Comentario opcional sobre la aprobación'}
                    required={action === 'reject'}
                    minLength={action === 'reject' ? 10 : 0}
                  />
                  <small className="shift-review-modal-help">
                    {comment.length}/500 caracteres
                  </small>
                </div>
              )}
            </div>
          )}

          {/* Información de revisión (si ya fue revisada) */}
          {request.status !== 'pending' && (
            <div className="shift-review-modal-section">
              <h3 className="shift-review-modal-section-title">
                Información de Revisión
              </h3>
              <div className="shift-review-modal-review-info">
                <div className="shift-review-modal-info-item">
                  <span className="shift-review-modal-label">Estado:</span>
                  <span className={`shift-review-modal-status ${request.status}`}>
                    {request.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                  </span>
                </div>
                <div className="shift-review-modal-info-item">
                  <span className="shift-review-modal-label">Revisado por:</span>
                  <span className="shift-review-modal-value">{request.reviewed_by_name || 'N/A'}</span>
                </div>
                <div className="shift-review-modal-info-item">
                  <span className="shift-review-modal-label">Fecha de revisión:</span>
                  <span className="shift-review-modal-value">{formatDate(request.reviewed_at)}</span>
                </div>
                {request.manager_comment && (
                  <div className="shift-review-modal-info-item full-width">
                    <span className="shift-review-modal-label">Comentario del gerente:</span>
                    <p className="shift-review-modal-manager-comment">{request.manager_comment}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {request.status === 'pending' && (
          <div className="shift-review-modal-footer">
            <button
              className="shift-review-modal-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              className="shift-review-modal-btn-submit"
              onClick={handleSubmit}
              disabled={!action || loading}
            >
              {loading ? 'Procesando...' : 'Confirmar Decisión'}
            </button>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className={`shift-review-notification shift-review-notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)}>×</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftChangeReviewModal;