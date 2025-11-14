import React, { useState, useEffect } from 'react';
import { MdCheckCircle, MdCancel, MdSchedule, MdVisibility } from 'react-icons/md';
import shiftChangeService from '../../../services/shiftChangeService';
import ShiftChangeReviewModal from '../ShiftChangeReviewModal';
import { formatTime } from '../../../utils/dateUtils';
import '../../../styles/components/request/admin/ShiftChangeRequestList.css';

const ShiftChangeRequestList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  const handleReviewSuccess = () => {
    loadRequests(); // Recargar lista
    handleCloseModal();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        icon: <MdSchedule size={18} />,
        text: 'Pendiente',
        class: 'shift-review-status-pending'
      },
      approved: {
        icon: <MdCheckCircle size={18} />,
        text: 'Aprobado',
        class: 'shift-review-status-approved'
      },
      rejected: {
        icon: <MdCancel size={18} />,
        text: 'Rechazado',
        class: 'shift-review-status-rejected'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`shift-review-status-badge ${config.class}`}>
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
      month: 'short',
      day: 'numeric'
    });
  };

  // Usamos formatTime importado desde utils (muestra AM/PM)

  if (loading) {
    return (
      <div className="shift-review-loading">
        <p>Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="shift-review-list-container">
      {/* Header con filtros */}
      <div className="shift-review-list-header">
        <div className="shift-review-list-info">
          <h2 className="shift-review-list-title">Solicitudes de Cambio</h2>
          <p className="shift-review-list-subtitle">
            Revisa y gestiona las solicitudes de cambio de turno
          </p>
        </div>

        <div className="shift-review-filters">
          <button
            className={`shift-review-filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pendientes ({requests.filter(r => r.status === 'pending').length})
          </button>
          <button
            className={`shift-review-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todas
          </button>
          <button
            className={`shift-review-filter-btn ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Aprobadas
          </button>
          <button
            className={`shift-review-filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rechazadas
          </button>
        </div>
      </div>

      {/* Tabla de solicitudes */}
      {requests.length === 0 ? (
        <div className="shift-review-empty">
          <MdSchedule size={48} />
          <p>No hay solicitudes {filter !== 'all' ? filter : 'disponibles'}</p>
        </div>
      ) : (
        <div className="shift-review-table-wrapper">
          <table className="shift-review-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Empleado</th>
                <th>Turno Original</th>
                <th>Compañero Propuesto</th>
                <th>Fecha Solicitud</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request.id}>
                  <td className="shift-review-cell-id">#{request.id}</td>
                  <td>
                    <div className="shift-review-employee-info">
                      <span className="shift-review-employee-name">
                        {request.requesting_employee_name}
                      </span>
                      <span className="shift-review-employee-position">
                        {request.requesting_employee_position}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="shift-review-shift-info">
                      <span className="shift-review-shift-date">{request.original_shift_date}</span>
                      <span className="shift-review-shift-time">
                        {formatTime(request.original_shift_start)} - {formatTime(request.original_shift_end)}
                      </span>
                      <span className="shift-review-shift-type">{request.original_shift_type}</span>
                    </div>
                  </td>
                  <td>
                    {request.proposed_employee_name ? (
                      <span className="shift-review-proposed-employee">
                        {request.proposed_employee_name}
                      </span>
                    ) : (
                      <span className="shift-review-no-proposal">Sin propuesta</span>
                    )}
                  </td>
                  <td>{formatDate(request.created_at)}</td>
                  <td>{getStatusBadge(request.status)}</td>
                  <td>
                    <button
                      className="shift-review-action-btn"
                      onClick={() => handleViewDetails(request)}
                      title="Ver detalles"
                      aria-label={`Ver detalles solicitud ${request.id}`}
                    >
                      <MdVisibility size={20} color="#fff" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de revisión */}
      {showModal && selectedRequest && (
        <ShiftChangeReviewModal
          request={selectedRequest}
          onClose={handleCloseModal}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
};

export default ShiftChangeRequestList;