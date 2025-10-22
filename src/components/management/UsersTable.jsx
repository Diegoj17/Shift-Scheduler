import React from 'react';
import { 
  FaEnvelope, 
  FaIdCard, 
  FaBuilding, 
  FaCalendarAlt,
  FaEdit, 
  FaTrash, 
  FaLock, 
  FaUnlock,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUserTimes
} from "react-icons/fa";
import '../../styles/components/management/UsersTable.css';

const UsersTable = ({ 
  users = [], 
  sortConfig = { field: '', direction: 'asc' }, 
  onSort = () => {}, 
  onEditUser = () => {}, 
  onDeleteUser = () => {}, 
  onToggleStatus = () => {}
}) => {
  const getSortIcon = (field) => {
    if (!sortConfig || sortConfig.field !== field) return <FaSort />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'blocked': return 'Bloqueado';
      default: return status || 'Desconocido';
    }
  };

  return (
    <div className="management-users-table-container">
      <div className="management-users-table-scroll">
        <table className="management-users-table">
        <thead>
          <tr>
            <th onClick={() => onSort('name')}>
              Usuario {getSortIcon('name')}
            </th>
            <th onClick={() => onSort('status')}>
              Estado {getSortIcon('status')}
            </th>
            <th onClick={() => onSort('hireDate')}>
              Fecha Ingreso {getSortIcon('hireDate')}
            </th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users && users.length > 0 ? (
            users.map(user => (
              <tr key={user.id} className={`user-row status-${user.status}`}>
                <td>
                  <div className="management-user-info">
                    <div className="management-user-avatar">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        <div className="avatar-placeholder">{getInitials(user.name)}</div>
                      )}
                    </div>
                    <div className="management-user-details">
                      <div className="management-user-name">{user.name}</div>
                      <div className="management-user-email">
                        <FaEnvelope className="icon" /> {user.email}
                      </div>
                      <div className="management-user-id">
                        <FaIdCard className="icon" /> {user.employeeId}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`management-status-badge ${user.status}`}>
                    {user.status === 'blocked' ? <FaLock className="status-icon" /> : null}
                    {user.status === 'inactive' ? <FaUserTimes className="status-icon" /> : null}
                    {renderStatusText(user.status)}
                  </span>
                </td>
                <td>
                  <div className="hire-date"><FaCalendarAlt className="icon" /> <span>{user.hireDate ? new Date(user.hireDate).toLocaleDateString('es-ES') : '-'}</span></div>
                </td>
                <td>
                  <div className="management-actions">
                    <button
                      className="management-action-btn edit"
                      onClick={() => onEditUser(user)}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="management-action-btn toggle"
                      onClick={() => onToggleStatus(user)}
                      title={user.status === 'active' ? 'Bloquear' : (user.status === 'blocked' ? 'Desbloquear' : 'Activar')}
                    >
                      {user.status === 'active' ? <FaLock /> : (user.status === 'blocked' ? <FaUnlock /> : <FaUnlock />)}
                    </button>
                    <button
                      className="management-action-btn delete"
                      onClick={() => onDeleteUser(user)}
                      title="Eliminar"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="no-results">No se encontraron usuarios</td>
            </tr>
          )}
        </tbody>
        </table>
      </div>
    </div>

  );
};

export default UsersTable;