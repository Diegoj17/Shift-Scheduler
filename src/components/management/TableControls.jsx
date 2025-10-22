import React from 'react';
import { FaSearch } from "react-icons/fa";
import '../../styles/components/management/TableControls.css';

const TableControls = ({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  resultsCount
}) => {
  

  return (
    <div className="management-table-controls">
        <div className="management-controls-row">
          <div className="management-search-box">
            <span className="search-icon"><FaSearch /></span>
            <input
              type="text"
              placeholder="Buscar usuarios por nombre, email o puesto..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="management-filter-group">
            <select value={filterStatus} onChange={(e) => onStatusChange(e.target.value)}>
              <option value="all">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="blocked">Bloqueado</option>
            </select>

          </div>
        </div>

        <div className="management-results-count">
          <strong>{resultsCount}</strong> resultados
        </div>
      </div>
  );
};

export default TableControls;