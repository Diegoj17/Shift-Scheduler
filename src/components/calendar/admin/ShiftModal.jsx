import { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaCheck, FaExclamationTriangle, FaUser, FaClock, FaBriefcase, FaTrash } from 'react-icons/fa';
import { detectShiftConflicts, calculateShiftDuration } from '../../../utils/shiftValidation';
import { formatDateForInput, formatTimeForInput, combineDateAndTime, timeStringToMinutes  } from '../../../utils/dateUtils';
import '../../../styles/components/calendar/admin/ShiftModal.css';

const ShiftModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  shift = null,
  employees,
  shiftTypes,
  existingShifts,
  unavailabilities = []
}) => {
  // Log para depuración: ver qué prop llega aquí
  useEffect(() => {
    if (import.meta?.env?.DEV) {
      try {
        console.debug('[ShiftModal] employees prop:', employees);
      } catch {
        // ignore
      }
    }
  }, [employees]);
  const [formData, setFormData] = useState({
    employeeId: '',
    shiftTypeId: '',
    date: formatDateForInput(new Date()),
    startTime: '09:00',
    endTime: '17:00',
    role: '',
    notes: ''
  });

  useEffect(() => {
  if (isOpen) {
    console.log('🔍 [ShiftModal] Empleados recibidos:', {
      employees,
      count: employees?.length,
      sample: employees?.[0]
    });
    
    console.log('🔍 [ShiftModal] Tipos de turno recibidos:', {
      shiftTypes,
      count: shiftTypes?.length
    });
  }
}, [isOpen, employees, shiftTypes]);

  const [errors, setErrors] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [duration, setDuration] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [autoDetectedType, setAutoDetectedType] = useState(false);

  useEffect(() => {
  if (shift) {
    console.log('📝 [ShiftModal] Cargando datos del shift:', shift);
    console.log('📝 [ShiftModal] Notas del shift:', shift.notes);
    
    const startDate = new Date(shift.start);
    const endDate = new Date(shift.end);
    
    // ✅ Convertir IDs a strings para comparación consistente
    const employeeIdStr = shift.employeeId ? String(shift.employeeId) : '';
    const shiftTypeIdStr = shift.shiftTypeId ? String(shift.shiftTypeId) : '';
    
    const newFormData = {
      employeeId: employeeIdStr,
      shiftTypeId: shiftTypeIdStr,
      date: formatDateForInput(startDate),
      startTime: formatTimeForInput(startDate),
      endTime: formatTimeForInput(endDate),
      role: shift.role || '',
      notes: shift.notes || ''  // ✅ Cargar las notas
    };
    
    console.log('✅ [ShiftModal] FormData configurado con notas:', newFormData);
    console.log('✅ [ShiftModal] Valor de notes en formData:', newFormData.notes);
    
    setFormData(newFormData);
  } else if (isOpen) {
    // Resetear form para nuevo turno
    setFormData({
      employeeId: '',
      shiftTypeId: '',
      date: formatDateForInput(new Date()),
      startTime: '09:00',
      endTime: '17:00',
      role: '',
      notes: ''
    });
  }
  
  setErrors({});
  setConflicts([]);
  setShowDeleteConfirm(false);
  setAutoDetectedType(false);
}, [shift, isOpen]);

  // Función para detectar tipos de turno (memoizada)
  const detectShiftTypeByTime = useCallback((startTimeStr, endTimeStr) => {
    if (!shiftTypes.length) return null;

    const startTotalMinutes = timeStringToMinutes(startTimeStr);
    let endTotalMinutes = timeStringToMinutes(endTimeStr);

    // Ajustar para turnos que terminan después de medianoche
    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 1440;
    }

    let bestMatch = null;
    let bestScore = -1;

    shiftTypes.forEach(type => {
      let typeStartTotalMinutes = timeStringToMinutes(type.startTime);
      let typeEndTotalMinutes = timeStringToMinutes(type.endTime);

      // Ajustar para turnos que cruzan medianoche
      if (typeEndTotalMinutes < typeStartTotalMinutes) {
        typeEndTotalMinutes += 1440;
      }

      let score = 0;

      // Coincidencia exacta
      if (startTotalMinutes === typeStartTotalMinutes && endTotalMinutes === typeEndTotalMinutes) {
        score = 100;
      }
      // Coincidencia cercana (±30 minutos)
      else if (Math.abs(startTotalMinutes - typeStartTotalMinutes) <= 30 && 
               Math.abs(endTotalMinutes - typeEndTotalMinutes) <= 30) {
        score = 80;
      }
      // Dentro del rango
      else if (startTotalMinutes >= typeStartTotalMinutes && endTotalMinutes <= typeEndTotalMinutes) {
        score = 60;
      }
      // Solapamiento
      else if (startTotalMinutes < typeEndTotalMinutes && endTotalMinutes > typeStartTotalMinutes) {
        score = 40;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = type;
      }
    });

    return bestMatch;
  }, [shiftTypes]);

  useEffect(() => {
    if (formData.startTime && formData.endTime && !autoDetectedType) {
      const start = combineDateAndTime(formData.date, formData.startTime);
      const end = combineDateAndTime(formData.date, formData.endTime);
      const dur = calculateShiftDuration(start, end);
      setDuration(dur);
      
      // Detectar automáticamente el tipo de turno cuando cambian las horas
      const detectedType = detectShiftTypeByTime(formData.startTime, formData.endTime);
      if (detectedType && detectedType.id !== formData.shiftTypeId) {
        setFormData(prev => ({ ...prev, shiftTypeId: detectedType.id }));
        setAutoDetectedType(true);
      }
    }
  }, [formData.startTime, formData.endTime, formData.date, autoDetectedType, detectShiftTypeByTime, formData.shiftTypeId]);

  // Reset autoDetectedType cuando el usuario selecciona manualmente un tipo
  useEffect(() => {
    setAutoDetectedType(false);
  }, [formData.shiftTypeId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Si se cambian las horas manualmente, permitir nueva detección automática
    if (field === 'startTime' || field === 'endTime') {
      setAutoDetectedType(false);
    }
  };

  const handleTimeChange = (field, value) => {
    handleChange(field, value);
    
    // Detectar tipo de turno inmediatamente después del cambio de hora
    setTimeout(() => {
      if (formData.startTime && formData.endTime && !autoDetectedType) {
        const detectedType = detectShiftTypeByTime(
          field === 'startTime' ? value : formData.startTime,
          field === 'endTime' ? value : formData.endTime
        );
        if (detectedType && detectedType.id !== formData.shiftTypeId) {
          setFormData(prev => ({ 
            ...prev, 
            shiftTypeId: detectedType.id,
            startTime: field === 'startTime' ? value : prev.startTime,
            endTime: field === 'endTime' ? value : prev.endTime
          }));
          setAutoDetectedType(true);
        }
      }
    }, 100);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validaciones básicas
    if (!formData.employeeId) {
      newErrors.employeeId = 'Selecciona un empleado';
    }
    
    if (!formData.shiftTypeId) {
      newErrors.shiftTypeId = 'Selecciona un tipo de turno';
    }
    
    if (!formData.date) {
      newErrors.time = 'Selecciona una fecha';
    }
    
    if (!formData.startTime) {
      newErrors.time = 'Selecciona hora de inicio';
    }
    
    if (!formData.endTime) {
      newErrors.time = 'Selecciona hora de fin';
    }
    
    // El rol ahora se obtiene del empleado seleccionado (no es ingresado manualmente)

    // Validación simple de horas para turnos nocturnos
    if (formData.startTime && formData.endTime) {
      const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
      const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
      
      const startTotalMinutes = startHours * 60 + startMinutes;
      let endTotalMinutes = endHours * 60 + endMinutes;
      
      // Para turnos nocturnos, ajustar la hora de fin
      if (endTotalMinutes < startTotalMinutes) {
        endTotalMinutes += 24 * 60;
      }
      
      const durationMinutes = endTotalMinutes - startTotalMinutes;
      
      if (durationMinutes <= 0) {
        newErrors.time = 'La hora de fin debe ser posterior a la hora de inicio';
      }
      
      if (durationMinutes > 16 * 60) {
        newErrors.time = 'El turno no puede durar más de 16 horas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (formData.employeeId && formData.date && formData.startTime && formData.endTime) {
      const start = combineDateAndTime(formData.date, formData.startTime);
      const end = combineDateAndTime(formData.date, formData.endTime);
      
      const newShiftObj = {
        employeeId: formData.employeeId,
        start: start.toISOString(),
        end: end.toISOString(),
        id: shift?.id || null
      };

      const detectedConflicts = detectShiftConflicts(
        newShiftObj,
        existingShifts.filter(s => s.id !== shift?.id),
        unavailabilities
      );

      setConflicts(detectedConflicts);
    }
  }, [formData.employeeId, formData.date, formData.startTime, formData.endTime, existingShifts, unavailabilities, shift]);

  const applyShiftTypeHours = (typeId) => {
    const selectedType = shiftTypes.find(t => t.id === typeId);
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        shiftTypeId: typeId,
        startTime: selectedType.startTime,
        endTime: selectedType.endTime
      }));
      setAutoDetectedType(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // CORRECCIÓN: Aquí estaba el error - debe ser conflicts.length > 0
    if (conflicts.length > 0) {
      return;
    }

    const selectedEmployee = Array.isArray(employees) ? employees.find(emp => String(emp.id) === String(formData.employeeId)) : undefined;
    const selectedType = shiftTypes.find(type => type.id === formData.shiftTypeId);

    // Derivar rol del empleado seleccionado y garantizar un valor por defecto
    const derivedRole = (selectedEmployee?.position || selectedEmployee?.puesto || selectedEmployee?.role || '').toString().trim();
    const roleToSend = derivedRole.length > 0 ? derivedRole : 'Sin especificar';

    const shiftData = {
      id: shift?.id || undefined, // Dejar undefined para nuevos turnos
      employeeId: formData.employeeId,
      employeeName: selectedEmployee?.name || '',
      shiftTypeId: formData.shiftTypeId,
      shiftTypeName: selectedType?.name || '',
      // Datos para el backend Django
      date: formData.date,
      start_time: formData.startTime,
      end_time: formData.endTime,
      employee: formData.employeeId, // Para el backend
      shift_type: formData.shiftTypeId, // Para el backend
      // Enviar siempre un role no vacío (proviene del empleado o fallback)
      role: roleToSend,
      notes: formData.notes.trim(), // CORRECCIÓN: .trim() no .trial()
      backgroundColor: selectedType?.color || '#667eea' // CORRECCIÓN: Color hexadecimal correcto
    };

    // Log para verificar exactamente qué enviamos antes de pasar al servicio
    if (import.meta?.env?.DEV) {
      try {
        console.debug('[ShiftModal] Enviando shiftData:', shiftData);
      } catch {
        // ignore
      }
    }

    onSave(shiftData);
  };

  const handleDelete = () => {
    if (shift) {
      onDelete(shift.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedEmployee = Array.isArray(employees) ? employees.find(emp => String(emp.id) === String(formData.employeeId)) : undefined;
  const selectedShiftType = shiftTypes.find(type => type.id === formData.shiftTypeId);

  return (
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal-content calendar-shift-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-modal-header">
          <h3>
            <FaClock className="calendar-modal-header-icon" /> {shift ? 'Editar Turno' : 'Crear Turno'}
          </h3>
          <button className="calendar-btn-close-modal" onClick={onClose} aria-label="Cerrar modal">
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="calendar-shift-form">
          <div className="calendar-form-group">
  <label htmlFor="employeeId">
    <FaUser className="calendar-label-icon" /> Empleado *
  </label>
  <select
    id="employeeId"
    value={formData.employeeId}
    onChange={(e) => handleChange('employeeId', e.target.value)}
    className={errors.employeeId ? 'calendar-input-error' : ''}
    disabled={!employees || employees.length === 0}
  >
    <option value="">
      {!employees || employees.length === 0 
        ? 'Cargando empleados...' 
        : 'Seleccionar empleado...'
      }
    </option>
    {Array.isArray(employees) && employees.map(emp => {
      // Asegurar que el empleado tenga los campos necesarios
      const employeeId = String(emp.id || emp.pk || emp.user_id || '');
      const employeeName = emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Sin nombre';
      const employeePosition = emp.position || emp.puesto || emp.jobTitle || 'Sin puesto';
      
      return (
        <option key={employeeId} value={employeeId}>
          {employeeName} - {employeePosition}
        </option>
      );
    })}
  </select>
  {!employees || employees.length === 0 ? (
    <div className="calendar-warning-message">
      No hay empleados disponibles. Verifica que estén cargados en el sistema.
    </div>
  ) : null}
  {errors.employeeId && <span className="calendar-error-message">{errors.employeeId}</span>}
</div>

          <div className="calendar-form-group">
            <label htmlFor="shiftTypeId">
              <FaClock className="calendar-label-icon" /> Tipo de Turno *
            </label>
            <div className="calendar-shift-type-selector">
              {shiftTypes.map(type => (
                <div
                  key={type.id}
                  className={`calendar-shift-type-option ${formData.shiftTypeId === type.id ? 'calendar-shift-type-selected' : ''}`}
                  onClick={() => applyShiftTypeHours(type.id)}
                >
                  <div className="calendar-type-color-dot" style={{ backgroundColor: type.color }}></div>
                  <div className="calendar-type-option-info">
                    <span className="calendar-type-name">{type.name}</span>
                    <span className="calendar-type-hours">{type.startTime} - {type.endTime}</span>
                  </div>
                  {formData.shiftTypeId === type.id && <FaCheck className="calendar-check-icon" />}
                </div>
              ))}
            </div>
            {errors.shiftTypeId && <span className="calendar-error-message">{errors.shiftTypeId}</span>}
          </div>

          <div className="calendar-form-row">
            <div className="calendar-form-group">
              <label htmlFor="date">Fecha *</label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={errors.time ? 'calendar-input-error' : ''}
              />
            </div>

            <div className="calendar-form-group">
              <label htmlFor="startTime">Hora Inicio *</label>
              <input
                type="time"
                id="startTime"
                value={formData.startTime}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                className={errors.time ? 'calendar-input-error' : ''}
              />
            </div>

            <div className="calendar-form-group">
              <label htmlFor="endTime">Hora Fin *</label>
              <input
                type="time"
                id="endTime"
                value={formData.endTime}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                className={errors.time ? 'calendar-input-error' : ''}
              />
            </div>
          </div>

          {duration > 0 && (
            <div className="calendar-duration-info">
              <FaClock className="calendar-duration-icon" aria-hidden="true" />
              <span>Duración: {duration} horas</span>
              {autoDetectedType && selectedShiftType && (
                <span className="calendar-auto-detected-badge">
                  (Tipo detectado: {selectedShiftType.name})
                </span>
              )}
            </div>
          )}

          {errors.time && <span className="calendar-error-message">{errors.time}</span>}

                  {/* El campo de rol se removió: ahora usamos el rol/puesto del empleado seleccionado */}

          <div className="calendar-form-group">
            <label htmlFor="notes">Notas (Opcional)</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Notas adicionales sobre este turno..."
              rows="3"
            />
          </div>

          {conflicts.length > 0 && (
            <div className="calendar-conflict-alert">
              <div className="calendar-alert-header">
                <FaExclamationTriangle className="calendar-alert-icon" aria-hidden="true" />
                <strong>Conflictos Detectados</strong>
              </div>
              <ul className="calendar-conflict-list">
                {conflicts.map((conflict, idx) => (
                  <li key={idx}>{conflict.message}</li>
                ))}
              </ul>
              <p className="calendar-conflict-note">
                El turno no puede crearse con estos conflictos. Ajusta la información.
              </p>
            </div>
          )}

          {selectedEmployee && selectedShiftType && (
            <div className="calendar-shift-summary">
              <h4>Resumen del Turno</h4>
              <div className="calendar-summary-grid">
                <div className="calendar-summary-item">
                  <span className="calendar-summary-label">Empleado:</span>
                  <span className="calendar-summary-value">{selectedEmployee.name}</span>
                </div>
                <div className="calendar-summary-item">
                  <span className="calendar-summary-label">Tipo:</span>
                  <span className="calendar-summary-value">
                    <span className="calendar-summary-color-dot" style={{ backgroundColor: selectedShiftType.color }}></span>
                    {selectedShiftType.name}
                  </span>
                </div>
                <div className="calendar-summary-item">
                  <span className="calendar-summary-label">Horario:</span>
                  <span className="calendar-summary-value">{formData.startTime} - {formData.endTime}</span>
                </div>
                <div className="calendar-summary-item">
                  <span className="calendar-summary-label">Rol:</span>
                  <span className="calendar-summary-value">{selectedEmployee?.position || selectedEmployee?.puesto || selectedEmployee?.role || formData.role || '-'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="calendar-modal-footer">
            {shift && (
              <button 
                type="button" 
                className="calendar-btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <FaTrash /> Eliminar Turno
              </button>
            )}
            <div className="calendar-footer-actions">
              <button type="button" className="calendar-btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="calendar-btn-primary" disabled={conflicts.length > 0}>
                <FaCheck /> {shift ? 'Actualizar' : 'Crear'} Turno
              </button>
            </div>
          </div>
        </form>

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && (
          <div className="calendar-modal-overlay calendar-delete-confirm-overlay">
            <div className="calendar-modal-content calendar-delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="calendar-modal-header">
                <h3>
                  <FaTrash className="calendar-modal-header-icon" /> Eliminar Turno
                </h3>
                <button className="calendar-btn-close-modal" onClick={() => setShowDeleteConfirm(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="calendar-modal-body">
                <div className="calendar-delete-warning">
                  <FaExclamationTriangle className="calendar-warning-icon-large" />
                  <p className="calendar-delete-message">
                    ¿Estás seguro de que deseas eliminar este turno?
                  </p>
                  <div className="calendar-shift-details">
                    <p><strong>Empleado:</strong> {selectedEmployee?.name || 'Desconocido'}</p>
                    <p><strong>Fecha:</strong> {new Date(formData.date).toLocaleDateString('es-ES')}</p>
                    <p><strong>Horario:</strong> {formData.startTime} - {formData.endTime}</p>
                    <p><strong>Tipo:</strong> {selectedShiftType?.name || 'No especificado'}</p>
                  </div>
                  <p className="calendar-warning-note">Esta acción no se puede deshacer.</p>
                </div>
              </div>
              <div className="calendar-modal-footer">
                <button className="calendar-btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancelar
                </button>
                <button className="calendar-btn-danger" onClick={handleDelete}>
                  <FaTrash /> Eliminar Turno
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftModal;