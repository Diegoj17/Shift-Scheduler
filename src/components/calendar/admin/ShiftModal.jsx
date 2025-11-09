// components/calendar/admin/ShiftModal.jsx

import { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaCheck, FaExclamationTriangle, FaUser, FaClock, FaBriefcase, FaTrash } from 'react-icons/fa';
import { detectShiftConflicts, calculateShiftDuration } from '../../../utils/shiftValidation';
import { formatDateForInput, formatTimeForInput, combineDateAndTime, timeStringToMinutes } from '../../../utils/dateUtils';
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
  const formatDateDisplay = (dateInput) => {
    if (!dateInput) return '';
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [y, m, d] = dateInput.split('-');
      return `${d}/${m}/${y}`;
    }
    try {
      const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
      return d.toLocaleDateString('es-ES');
    } catch {
      return String(dateInput);
    }
  };

  const [formData, setFormData] = useState({
    employeeId: '',
    shiftTypeId: '',
    date: formatDateForInput(new Date()),
    startTime: '09:00',
    endTime: '17:00',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [duration, setDuration] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [autoDetectedType, setAutoDetectedType] = useState(false);

  // ✅ ACTUALIZADO: useEffect para cargar datos del shift
  // ShiftModal.jsx - useEffect completo

// ✅ CORREGIDO: useEffect para cargar datos del shift
// ✅ CORREGIDO: useEffect para manejar correctamente employee_id vs user_id
useEffect(() => {
  if (shift) {
    console.log('🔍 [ShiftModal] SHIFT COMPLETO:', shift);
    console.log('🔍 [ShiftModal] shift.extendedProps:', shift.extendedProps);
    
    // ✅ CRÍTICO: Buscar el USER_ID correcto en los empleados disponibles
    const employeeNameFromShift = shift.employeeName || shift.extendedProps?.employeeName;
    console.log('🔍 [ShiftModal] Nombre del empleado en shift:', employeeNameFromShift);
    
    let employeeUserIdToUse = '';
    
    // ✅ ESTRATEGIA: Buscar por nombre en la lista de empleados
    if (employeeNameFromShift && Array.isArray(employees)) {
      const matchingEmployee = employees.find(emp => 
        emp.name === employeeNameFromShift || 
        emp.name?.includes(employeeNameFromShift) ||
        employeeNameFromShift?.includes(emp.name)
      );
      
      if (matchingEmployee) {
        employeeUserIdToUse = String(matchingEmployee.id);
        console.log('✅ [ShiftModal] Empleado encontrado por nombre:', {
          nombreBuscado: employeeNameFromShift,
          empleadoEncontrado: matchingEmployee,
          user_id: employeeUserIdToUse
        });
      }
    }
    
    // ✅ ESTRATEGIA ALTERNATIVA: Si no se encuentra por nombre, usar employeeUserId
    if (!employeeUserIdToUse) {
      employeeUserIdToUse = shift.employeeUserId || 
                           shift.extendedProps?.employeeUserId || 
                           shift.employee_user_id;
      console.log('🔍 [ShiftModal] Usando employeeUserId:', employeeUserIdToUse);
    }
    
    console.log('🔍 [ShiftModal] IDs encontrados:', {
      employeeNameFromShift,
      employeeUserIdToUse,
      employeeId: shift.employeeId,
      extendedProps_employeeUserId: shift.extendedProps?.employeeUserId
    });
    
    const startDate = shift.start ? new Date(shift.start) : new Date();
    const endDate = shift.end ? new Date(shift.end) : new Date();
    
    console.log('✅ [ShiftModal] User ID final seleccionado:', employeeUserIdToUse);
    console.log('📋 [ShiftModal] Total empleados disponibles:', employees?.length);
    
    // Verificar que el employee existe en la lista
    const employeeExists = employees?.find(emp => String(emp.id) === employeeUserIdToUse);
    console.log('🔍 [ShiftModal] ¿Usuario existe en lista?:', employeeExists ? 'SÍ' : 'NO');
    
    if (employeeExists) {
      console.log('✅ [ShiftModal] Employee encontrado:', {
        id: employeeExists.id,
        name: employeeExists.name,
        position: employeeExists.position
      });
    } else {
      console.error('❌ [ShiftModal] ERROR: Usuario no encontrado en la lista de empleados!');
      console.log('📋 [ShiftModal] IDs disponibles en employees:', 
        employees?.map(e => ({ id: e.id, name: e.name }))
      );
      
      // ✅ ESTRATEGIA DE FALLBACK: Usar el primer empleado disponible
      if (employees && employees.length > 0) {
        employeeUserIdToUse = String(employees[0].id);
        console.log('🔄 [ShiftModal] Usando primer empleado disponible:', employees[0]);
      }
    }
    
    const newFormData = {
      employeeId: employeeUserIdToUse,  // ✅ USER_ID correcto
      shiftTypeId: shift.extendedProps?.shiftTypeId ? 
                  String(shift.extendedProps.shiftTypeId) : 
                  shift.shiftTypeId ? 
                  String(shift.shiftTypeId) : '',
      date: shift.extendedProps?.date || shift.date || formatDateForInput(startDate),
      startTime: shift.extendedProps?.start_time || shift.startTime || formatTimeForInput(startDate),
      endTime: shift.extendedProps?.end_time || shift.endTime || formatTimeForInput(endDate),
      notes: shift.extendedProps?.notes || shift.notes || ''
    };
    
    console.log('✅ [ShiftModal] FormData configurado:', newFormData);
    console.log('✅ [ShiftModal] employeeId en formData (debe ser user_id):', newFormData.employeeId);
    
    setFormData(newFormData);
  } else if (isOpen) {
    console.log('📝 [ShiftModal] Modo creación - reseteando formulario');
    // Resetear form para nuevo turno
    setFormData({
      employeeId: '',
      shiftTypeId: '',
      date: formatDateForInput(new Date()),
      startTime: '09:00',
      endTime: '17:00',
      notes: ''
    });
  }
  
  setErrors({});
  setConflicts([]);
  setShowDeleteConfirm(false);
  setAutoDetectedType(false);
}, [shift, isOpen, employees]);

  // Función para detectar tipos de turno (memoizada)
  const detectShiftTypeByTime = useCallback((startTimeStr, endTimeStr) => {
    if (!shiftTypes.length) return null;

    const startTotalMinutes = timeStringToMinutes(startTimeStr);
    let endTotalMinutes = timeStringToMinutes(endTimeStr);

    if (isNaN(startTotalMinutes) || isNaN(endTotalMinutes)) return null;

    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 1440;
    }

    let bestMatch = null;
    let bestScore = -1;

    shiftTypes.forEach(type => {
      let typeStartTotalMinutes = timeStringToMinutes(type.startTime);
      let typeEndTotalMinutes = timeStringToMinutes(type.endTime);

      if (isNaN(typeStartTotalMinutes) || isNaN(typeEndTotalMinutes)) return;

      if (typeEndTotalMinutes < typeStartTotalMinutes) {
        typeEndTotalMinutes += 1440;
      }

      let score = 0;

      if (startTotalMinutes === typeStartTotalMinutes && endTotalMinutes === typeEndTotalMinutes) {
        score = 100;
      } else if (Math.abs(startTotalMinutes - typeStartTotalMinutes) <= 30 && 
                 Math.abs(endTotalMinutes - typeEndTotalMinutes) <= 30) {
        score = 80;
      } else if (startTotalMinutes >= typeStartTotalMinutes && endTotalMinutes <= typeEndTotalMinutes) {
        score = 60;
      } else if (startTotalMinutes < typeEndTotalMinutes && endTotalMinutes > typeStartTotalMinutes) {
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
      
      const detectedType = detectShiftTypeByTime(formData.startTime, formData.endTime);
      if (detectedType && detectedType.id !== formData.shiftTypeId) {
        setFormData(prev => ({ ...prev, shiftTypeId: detectedType.id }));
        setAutoDetectedType(true);
      }
    }
  }, [formData.startTime, formData.endTime, formData.date, autoDetectedType, detectShiftTypeByTime, formData.shiftTypeId]);

  useEffect(() => {
    setAutoDetectedType(false);
  }, [formData.shiftTypeId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    if (field === 'startTime' || field === 'endTime') {
      setAutoDetectedType(false);
    }
  };

  const handleTimeChange = (field, value) => {
    handleChange(field, value);
    
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
    
    if (formData.startTime && formData.endTime) {
      const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
      const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
      
      const startTotalMinutes = startHours * 60 + startMinutes;
      let endTotalMinutes = endHours * 60 + endMinutes;
      
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

  if (conflicts.length > 0) {
    return;
  }

  const selectedEmployee = Array.isArray(employees) ? 
    employees.find(emp => String(emp.id) === String(formData.employeeId)) : undefined;
  const selectedType = shiftTypes.find(type => type.id === formData.shiftTypeId);

  console.log('🔍 [ShiftModal] handleSubmit - Datos:', {
    formData_employeeId: formData.employeeId,
    selectedEmployee: selectedEmployee,
    employee_id: selectedEmployee?.employee_id, // ✅ Este es el importante
    user_id: selectedEmployee?.id
  });

  // ✅ CORRECCIÓN: Enviar employee_id (no user_id)
  const shiftData = {
    // Para el backend (formato Django esperado)
    date: formData.date,
    start_time: formData.startTime,
    end_time: formData.endTime,
    employee: parseInt(selectedEmployee?.employee_id),  // ✅ EMPLOYEE_ID (de shifts_employee)
    shift_type: parseInt(formData.shiftTypeId),
    notes: formData.notes.trim(),
    
    // Para actualización (si es edición) - campos adicionales
    ...(shift?.id && { 
      id: shift.id,
      employeeId: shift.employeeId, // mantener el employee_id original
    }),
    
    // Campos adicionales para el frontend
    employeeId: shift?.employeeId || parseInt(selectedEmployee?.employee_id), // ✅ EMPLOYEE_ID
    employeeUserId: parseInt(formData.employeeId),  // user_id para referencia
    employeeName: selectedEmployee?.name || '',
    shiftTypeId: parseInt(formData.shiftTypeId),
    shiftTypeName: selectedType?.name || '',
    backgroundColor: selectedType?.color || '#667eea'
  };

  console.log('🚀 [ShiftModal] Enviando datos:', {
    shiftData,
    employee_id_enviado: shiftData.employee,
    user_id_seleccionado: formData.employeeId,
    es_edicion: !!shift?.id
  });

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

  const selectedEmployee = Array.isArray(employees) ? 
    employees.find(emp => String(emp.id) === String(formData.employeeId)) : undefined;
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
          {/* ✅ DROPDOWN DE EMPLEADOS */}
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
                const employeeId = String(emp.id || '');  // ✅ USER_ID
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

          {/* TIPO DE TURNO */}
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

          {/* FECHA Y HORAS */}
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

          {/* DURACIÓN */}
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

          {/* NOTAS */}
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

          {/* CONFLICTOS */}
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

          {/* RESUMEN */}
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
                  <span className="calendar-summary-label">Fecha:</span>
                  <span className="calendar-summary-value">{formatDateDisplay(formData.date)}</span>
                </div>
                <div className="calendar-summary-item">
                  <span className="calendar-summary-label">Horario:</span>
                  <span className="calendar-summary-value">{formData.startTime} - {formData.endTime}</span>
                </div>
                <div className="calendar-summary-item">
                  <span className="calendar-summary-label">Puesto:</span>
                  <span className="calendar-summary-value">{selectedEmployee?.position || selectedEmployee?.puesto || 'Sin especificar'}</span>
                </div>
              </div>
            </div>
          )}

          {/* FOOTER */}
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

        {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
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
                  <div className="calendar-delete-accent" aria-hidden="true" />
                  <p className="calendar-delete-message">
                    ¿Estás seguro de que deseas eliminar este turno?
                  </p>
                  <div className="calendar-shift-details">
                    <p><strong>Empleado:</strong> {selectedEmployee?.name || 'Desconocido'}</p>
                    <p><strong>Fecha:</strong> {formatDateDisplay(formData.date)}</p>
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