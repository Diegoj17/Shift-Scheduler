import { useState } from 'react';
import { FaClock, FaPlus, FaTimes, FaCheck, FaTag, FaPalette, FaExclamationTriangle } from 'react-icons/fa';
import { MdEdit, MdDelete } from 'react-icons/md';
import { validateShiftTypeRange, validateShiftTypeName } from '../../../utils/shiftValidation';
import { formatTime } from '../../../utils/dateUtils';
import '../../../styles/components/calendar/admin/ShiftTypeManager.css';

const ShiftTypeManager = ({ shiftTypes, onSave, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    color: '#667eea'
  });
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const colorOptions = [
    { name: 'Azul', value: '#667eea' },
    { name: 'Púrpura', value: '#764ba2' },
    { name: 'Verde', value: '#4caf50' },
    { name: 'Rojo', value: '#f44336' },
    { name: 'Naranja', value: '#ff9800' },
    { name: 'Rosa', value: '#e91e63' },
    { name: 'Turquesa', value: '#00bcd4' },
    { name: 'Amarillo', value: '#ffc107' }
  ];

  const handleOpenModal = (type = null) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        startTime: type.startTime,
        endTime: type.endTime,
        color: type.color
      });
    } else {
      setEditingType(null);
      setFormData({ name: '', startTime: '09:00', endTime: '17:00', color: '#667eea' });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingType(null);
    setFormData({ name: '', startTime: '09:00', endTime: '17:00', color: '#667eea' });
    setErrors({});
  };

  const validateForm = () => {
  const newErrors = {};

  if (!formData.name.trim()) {
    newErrors.name = 'El nombre es requerido';
  } else {
    const nameValidation = validateShiftTypeName(formData.name, shiftTypes, editingType?.id);
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.message;
    }
  }

  // ✅ CORREGIDO: Validación mejorada para turnos nocturnos
  const start = new Date(`1970-01-01T${formData.startTime}`);
  const end = new Date(`1970-01-01T${formData.endTime}`);
  const isOvernight = end < start; // Si end < start, es turno nocturno

  if (!isOvernight && start >= end) {
    // Solo validar para turnos del mismo día
    newErrors.time = 'La hora de fin debe ser mayor a la hora de inicio';
  }

  // Para turnos nocturnos, no mostramos error (es normal)

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleSubmit = (e) => {
  e.preventDefault();
  
  if (!validateForm()) return;

  // ✅ CORREGIDO: Usar los nombres de campo que espera el backend
  const shiftTypeData = {
    name: formData.name.trim(),
    start_time: formData.startTime, // El servicio lo convertirá
    end_time: formData.endTime,     // El servicio lo convertirá  
    color: formData.color
  };


  if (editingType) {
    onUpdate(editingType.id, shiftTypeData); // Pasar ID y datos
  } else {
    onSave(shiftTypeData);
  }

  handleCloseModal();
};

  // Eliminar tipo de turno
  const handleDelete = (id) => {
    // Cerrar el overlay de confirmación primero
    setShowDeleteConfirm(null);

    if (onDelete && typeof onDelete === 'function') {
      try {
        onDelete(id);
      } catch (err) {
        console.error('Error al eliminar tipo de turno:', err);
      }
    } else {
      console.warn('onDelete prop no definida en ShiftTypeManager');
    }
  };

  return (
    <div className="calendar-shift-type-manager">
      <div className="calendar-shift-type-header">
        <div className="calendar-header-title">
          <FaClock className="calendar-header-title-icon" aria-hidden="true" />
          <h3>Tipos de Turno</h3>
        </div>
        <button className="calendar-btn-add-type" onClick={() => handleOpenModal()} aria-label="Crear nuevo tipo de turno">
          <FaPlus aria-hidden="true" /> <span>Nuevo Tipo</span>
        </button>
      </div>

      <div className="calendar-shift-types-grid">
        {shiftTypes.length === 0 ? (
          <div className="calendar-no-shift-types">
            <FaClock className="calendar-empty-icon" />
            <p>No hay tipos de turno configurados</p>
            <button className="calendar-btn-create-first" onClick={() => handleOpenModal()}>
              Crear primer tipo de turno
            </button>
          </div>
        ) : (
          shiftTypes.map(type => (
            <div key={type.id} className="calendar-shift-type-card">
              <div className="calendar-type-color-indicator" style={{ backgroundColor: type.color }}></div>
              <div className="calendar-type-info">
                <h4>{type.name}</h4>
                <p className="calendar-type-time">
                  <FaClock className="calendar-time-icon" aria-hidden="true" />
                  {formatTime(type.startTime)} - {formatTime(type.endTime)}
                </p>
              </div>
              <div className="calendar-type-actions">
                <button className="calendar-btn-icon calendar-btn-edit" onClick={() => handleOpenModal(type)} title="Editar">
                  <MdEdit aria-hidden="true" />
                </button>
                <button className="calendar-btn-icon calendar-btn-delete" onClick={() => setShowDeleteConfirm(type.id)} title="Eliminar">
                  <MdDelete aria-hidden="true" />
                </button>
              </div>

              {showDeleteConfirm === type.id && (
                <div className="calendar-delete-confirm-overlay">
                  <div className="calendar-delete-confirm-box">
                    <p className="calendar-delete-confirm-text">
                      <FaExclamationTriangle aria-hidden="true" />
                      <span>¿Eliminar este tipo de turno?</span>
                    </p>
                    <div className="calendar-confirm-actions">
                      <button className="calendar-btn-confirm-yes" onClick={() => handleDelete(type.id)}>
                        <FaCheck /> Sí
                      </button>
                      <button className="calendar-btn-confirm-no" onClick={() => setShowDeleteConfirm(null)}>
                        <FaTimes /> No
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="calendar-modal-overlay" onClick={handleCloseModal}>
          <div className="calendar-modal-content calendar-shift-type-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h3 className="calendar-modal-title-with-icon">
                {editingType ? <MdEdit aria-hidden="true" /> : <FaPlus aria-hidden="true" />}
                <span>{editingType ? 'Editar Tipo de Turno' : 'Crear Tipo de Turno'}</span>
              </h3>
              <button className="calendar-btn-close-modal" onClick={handleCloseModal}>
                <span className="calendar-close-x" aria-hidden="true">X</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="calendar-shift-type-form">
              <div className="calendar-form-group">
                <label htmlFor="name" className="calendar-label-with-icon">
                  <FaTag aria-hidden="true" />
                  <span>Nombre del Tipo de Turno *</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? 'calendar-input-error' : ''}
                  placeholder="Ej: Turno Mañana, Turno Tarde..."
                />
                {errors.name && <span className="calendar-error-message">{errors.name}</span>}
              </div>

              <div className="calendar-form-row">
                <div className="calendar-form-group">
                  <label htmlFor="startTime" className="calendar-label-with-icon">
                    <FaClock aria-hidden="true" />
                    <span>Hora de Inicio *</span>
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className={errors.time ? 'calendar-input-error' : ''}
                  />
                </div>

                <div className="calendar-form-group">
                  <label htmlFor="endTime" className="calendar-label-with-icon">
                    <FaClock aria-hidden="true" />
                    <span>Hora de Fin *</span>
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className={errors.time ? 'calendar-input-error' : ''}
                  />
                </div>
              </div>

              {errors.time && <span className="calendar-error-message">{errors.time}</span>}

              <div className="calendar-form-group">
                <label className="calendar-label-with-icon">
                  <FaPalette aria-hidden="true" />
                  <span>Color Identificador *</span>
                </label>
                <div className="calendar-color-picker-grid">
                  {colorOptions.map(color => (
                    <div
                      key={color.value}
                      className={`calendar-color-option ${formData.color === color.value ? 'calendar-color-selected' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      title={color.name}
                    >
                      {formData.color === color.value && <FaCheck />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="calendar-modal-footer">
                <button type="button" className="calendar-btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="calendar-btn-primary">
                  <FaCheck /> {editingType ? 'Actualizar' : 'Crear'} Tipo de Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftTypeManager;
