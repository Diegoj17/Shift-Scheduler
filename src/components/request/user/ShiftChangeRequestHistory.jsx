import React, { useState, useEffect } from 'react';
import { MdCheckCircle, MdCancel, MdSchedule } from 'react-icons/md';
import shiftChangeService from '../../../services/shiftChangeService';
import { formatTime } from '../../../utils/dateUtils';
import '../../../styles/components/request/user/ShiftChangeRequestHistory.css';

const ShiftChangeRequestHistory = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const filters = filter !== 'all' ? { status: filter } : {};
      const data = await shiftChangeService.getChangeRequests(filters);
      setRequests(data);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        icon: <MdSchedule size={16} />,
        text: 'Pendiente',
        class: 'shift-change-status-pending'
      },
      approved: {
        icon: <MdCheckCircle size={16} />,
        text: 'Aprobado',
        class: 'shift-change-status-approved'
      },
      rejected: {
        icon: <MdCancel size={16} />,
        text: 'Rechazado',
        class: 'shift-change-status-rejected'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`shift-change-status-badge ${config.class}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Usamos `formatTime` centralizado para mostrar AM/PM

  if (loading) {
    return (
      <div className="shift-change-history-loading">
        <p>Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="shift-change-history-container">
      <div className="shift-change-history-header">
        <h2 className="shift-change-history-title">Mis Solicitudes</h2>
        
        <div className="shift-change-history-filters">
          <button
            className={`shift-change-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todas
          </button>
          <button
            className={`shift-change-filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pendientes
          </button>
          <button
            className={`shift-change-filter-btn ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Aprobadas
          </button>
          <button
            className={`shift-change-filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rechazadas
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="shift-change-history-empty">
          <p>No tienes solicitudes {filter !== 'all' ? filter : ''}</p>
        </div>
      ) : (
        <div className="shift-change-history-list">
          {requests.map(request => (
            <div key={request.id} className="shift-change-request-card">
              <div className="shift-change-card-header">
                <div className="shift-change-card-title">
                  <span className="shift-change-card-id">#{request.id}</span>
                  {getStatusBadge(request.status)}
                </div>
                <span className="shift-change-card-date">
                  {formatDate(request.created_at)}
                </span>
              </div>

              <div className="shift-change-card-body">
                {/* Turno original */}
                <div className="shift-change-card-section">
                  <h4 className="shift-change-card-section-title">Turno a cambiar</h4>
                  <div className="shift-change-card-info">
                    <span className="shift-change-card-label">Fecha:</span>
                    <span className="shift-change-card-value">{request.original_shift_date}</span>
                  </div>
                  <div className="shift-change-card-info">
                    <span className="shift-change-card-label">Horario:</span>
                    <span className="shift-change-card-value">
                      {formatTime(request.original_shift_start)} - {formatTime(request.original_shift_end)}
                    </span>
                  </div>
                  <div className="shift-change-card-info">
                    <span className="shift-change-card-label">Tipo:</span>
                    <span className="shift-change-card-value">{request.original_shift_type}</span>
                  </div>
                </div>

                {/* Compañero propuesto */}
                {request.proposed_employee_name && (
                  <div className="shift-change-card-section">
                    <h4 className="shift-change-card-section-title">Compañero propuesto</h4>
                    <div className="shift-change-card-info">
                      <span className="shift-change-card-label">Empleado:</span>
                      <span className="shift-change-card-value">{request.proposed_employee_name}</span>
                    </div>
                    {request.proposed_shift_date && (
                      <>
                        <div className="shift-change-card-info">
                          <span className="shift-change-card-label">Fecha:</span>
                          <span className="shift-change-card-value">{request.proposed_shift_date}</span>
                        </div>
                        <div className="shift-change-card-info">
                          <span className="shift-change-card-label">Horario:</span>
                          <span className="shift-change-card-value">
                            {formatTime(request.proposed_shift_start)} - {formatTime(request.proposed_shift_end)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Motivo */}
                <div className="shift-change-card-section">
                  <h4 className="shift-change-card-section-title">Motivo</h4>
                  <p className="shift-change-card-reason">{request.reason}</p>
                </div>

                {/* Comentario del gerente */}
                {request.manager_comment && (
                  <div className="shift-change-card-section">
                    <h4 className="shift-change-card-section-title">
                      Comentario del gerente
                    </h4>
                    <p className="shift-change-card-comment">{request.manager_comment}</p>
                    {request.reviewed_by_name && (
                      <small className="shift-change-card-reviewer">
                        Revisado por: {request.reviewed_by_name} • {formatDate(request.reviewed_at)}
                      </small>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShiftChangeRequestHistory;