import { useState, useEffect } from 'react';
import { FaTimes, FaCopy, FaCheck, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';
import { formatDateForInput } from '../../../utils/dateUtils';
import '../../../styles/components/calendar/admin/ShiftDuplicateModal.css';

const ShiftDuplicateModal = ({ 
  isOpen, 
  onClose, 
  onDuplicate, 
  shifts,
  employees,
  unavailabilities = []
}) => {
  const [formData, setFormData] = useState({
    sourceStartDate: formatDateForInput(new Date()),
    sourceEndDate: formatDateForInput(new Date()),
    targetStartDate: formatDateForInput(new Date()),
    targetEndDate: formatDateForInput(new Date())
  });

  const [errors, setErrors] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [shiftsInRange, setShiftsInRange] = useState([]);
  const [previewCount, setPreviewCount] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      setFormData({
        sourceStartDate: formatDateForInput(today),
        sourceEndDate: formatDateForInput(today),
        targetStartDate: formatDateForInput(nextWeek),
        targetEndDate: formatDateForInput(nextWeek)
      });
      setErrors({});
      setConflicts([]);
      setShiftsInRange([]);
      setPreviewCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.sourceStartDate && formData.sourceEndDate) {
      const start = new Date(formData.sourceStartDate);
      const end = new Date(formData.sourceEndDate);
      end.setHours(23, 59, 59, 999);
      
      const shiftsToShow = shifts.filter(shift => {
        const shiftDate = new Date(shift.start);
        return shiftDate >= start && shiftDate <= end;
      });
      
      setShiftsInRange(shiftsToShow);
      setPreviewCount(shiftsToShow.length);
    }
  }, [formData.sourceStartDate, formData.sourceEndDate, shifts]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const sourceStart = new Date(formData.sourceStartDate);
    const sourceEnd = new Date(formData.sourceEndDate);
    const targetStart = new Date(formData.targetStartDate);
    const targetEnd = new Date(formData.targetEndDate);

    if (sourceStart > sourceEnd) {
      newErrors.sourceRange = 'La fecha de inicio debe ser anterior a la fecha fin';
    }

    if (targetStart > targetEnd) {
      newErrors.targetRange = 'La fecha de inicio debe ser anterior a la fecha fin';
    }

    if (shiftsInRange.length === 0) {
      newErrors.sourceRange = 'No hay turnos en el rango origen seleccionado';
    }

    const sourceDays = Math.ceil((sourceEnd - sourceStart) / (1000 * 60 * 60 * 24)) + 1;
    const targetDays = Math.ceil((targetEnd - targetStart) / (1000 * 60 * 60 * 24)) + 1;

    if (sourceDays !== targetDays) {
      newErrors.targetRange = `El rango destino debe tener la misma duración (${sourceDays} días)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const detectConflicts = () => {
    const detectedConflicts = [];
    const sourceStart = new Date(formData.sourceStartDate);
    const targetStart = new Date(formData.targetStartDate);
    const daysDiff = Math.ceil((targetStart - sourceStart) / (1000 * 60 * 60 * 24));

    shiftsInRange.forEach(shift => {
      const shiftDate = new Date(shift.start);
      const newDate = new Date(shiftDate);
      newDate.setDate(newDate.getDate() + daysDiff);

      // Verificar solapamiento con turnos existentes
      const overlapping = shifts.find(existingShift => {
        const existingStart = new Date(existingShift.start);
        const existingEnd = new Date(existingShift.end);
        
        const newShiftStart = new Date(shift.start);
        newShiftStart.setDate(newShiftStart.getDate() + daysDiff);
        const newShiftEnd = new Date(shift.end);
        newShiftEnd.setDate(newShiftEnd.getDate() + daysDiff);

        return existingShift.employeeId === shift.employeeId &&
               ((newShiftStart >= existingStart && newShiftStart < existingEnd) ||
                (newShiftEnd > existingStart && newShiftEnd <= existingEnd) ||
                (newShiftStart <= existingStart && newShiftEnd >= existingEnd));
      });

      if (overlapping) {
        const employee = employees.find(e => e.id === shift.employeeId);
        detectedConflicts.push({
          type: 'overlap',
          message: `${employee?.name || 'Empleado'} - ${newDate.toLocaleDateString('es-ES')}: Solapamiento con turno existente`,
          shiftId: shift.id
        });
      }

      // Verificar indisponibilidad
      const unavailable = unavailabilities.find(unav => {
        const unavStart = new Date(unav.start);
        const unavEnd = new Date(unav.end);
        
        const newShiftStart = new Date(shift.start);
        newShiftStart.setDate(newShiftStart.getDate() + daysDiff);
        const newShiftEnd = new Date(shift.end);
        newShiftEnd.setDate(newShiftEnd.getDate() + daysDiff);

        return unav.employeeId === shift.employeeId &&
               ((newShiftStart >= unavStart && newShiftStart < unavEnd) ||
                (newShiftEnd > unavStart && newShiftEnd <= unavEnd));
      });

      if (unavailable) {
        const employee = employees.find(e => e.id === shift.employeeId);
        detectedConflicts.push({
          type: 'unavailable',
          message: `${employee?.name || 'Empleado'} - ${newDate.toLocaleDateString('es-ES')}: Empleado no disponible`,
          shiftId: shift.id
        });
      }
    });

    setConflicts(detectedConflicts);
    return detectedConflicts;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const detectedConflicts = detectConflicts();

    const sourceStart = new Date(formData.sourceStartDate);
    const targetStart = new Date(formData.targetStartDate);
    const daysDiff = Math.ceil((targetStart - sourceStart) / (1000 * 60 * 60 * 24));

    // Filtrar turnos conflictuados
    const conflictedShiftIds = detectedConflicts.map(c => c.shiftId);
    const validShifts = shiftsInRange.filter(shift => !conflictedShiftIds.includes(shift.id));

    // Crear turnos duplicados
    const duplicatedShifts = validShifts.map(shift => {
      const newStart = new Date(shift.start);
      newStart.setDate(newStart.getDate() + daysDiff);
      const newEnd = new Date(shift.end);
      newEnd.setDate(newEnd.getDate() + daysDiff);

      return {
        ...shift,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
        createdAt: new Date().toISOString()
      };
    });

    onDuplicate(duplicatedShifts, detectedConflicts);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal-content calendar-shift-duplicate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-modal-header">
          <h3>
            <FaCopy className="calendar-modal-header-icon" /> Duplicar Horarios
          </h3>
          <button className="calendar-btn-close-modal" onClick={onClose} aria-label="Cerrar modal">
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="calendar-duplicate-form">
          <div className="calendar-section-container">
            <div className="calendar-section-header">
              <FaCalendarAlt className="calendar-section-icon" />
              <h4>Rango Origen</h4>
            </div>
            <p className="calendar-section-description">
              Selecciona el período de turnos que deseas duplicar
            </p>
            
            <div className="calendar-form-row">
              <div className="calendar-form-group">
                <label htmlFor="sourceStartDate">Fecha Inicio *</label>
                <input
                  type="date"
                  id="sourceStartDate"
                  value={formData.sourceStartDate}
                  onChange={(e) => handleChange('sourceStartDate', e.target.value)}
                  className={errors.sourceRange ? 'calendar-input-error' : ''}
                />
              </div>

              <div className="calendar-form-group">
                <label htmlFor="sourceEndDate">Fecha Fin *</label>
                <input
                  type="date"
                  id="sourceEndDate"
                  value={formData.sourceEndDate}
                  onChange={(e) => handleChange('sourceEndDate', e.target.value)}
                  className={errors.sourceRange ? 'calendar-input-error' : ''}
                />
              </div>
            </div>

            {errors.sourceRange && (
              <span className="calendar-error-message">{errors.sourceRange}</span>
            )}

            {previewCount > 0 && (
              <div className="calendar-preview-info">
                <FaCheck className="calendar-preview-icon" />
                <span>Se duplicarán {previewCount} turno(s)</span>
              </div>
            )}
          </div>

          <div className="calendar-section-container">
            <div className="calendar-section-header">
              <FaCalendarAlt className="calendar-section-icon" />
              <h4>Rango Destino</h4>
            </div>
            <p className="calendar-section-description">
              Selecciona el período donde se copiarán los turnos
            </p>
            
            <div className="calendar-form-row">
              <div className="calendar-form-group">
                <label htmlFor="targetStartDate">Fecha Inicio *</label>
                <input
                  type="date"
                  id="targetStartDate"
                  value={formData.targetStartDate}
                  onChange={(e) => handleChange('targetStartDate', e.target.value)}
                  className={errors.targetRange ? 'calendar-input-error' : ''}
                />
              </div>

              <div className="calendar-form-group">
                <label htmlFor="targetEndDate">Fecha Fin *</label>
                <input
                  type="date"
                  id="targetEndDate"
                  value={formData.targetEndDate}
                  onChange={(e) => handleChange('targetEndDate', e.target.value)}
                  className={errors.targetRange ? 'calendar-input-error' : ''}
                />
              </div>
            </div>

            {errors.targetRange && (
              <span className="calendar-error-message">{errors.targetRange}</span>
            )}
          </div>

          {shiftsInRange.length > 0 && (
            <div className="calendar-shifts-preview">
              <h4>Vista Previa de Turnos a Duplicar</h4>
              <div className="calendar-preview-list">
                {shiftsInRange.slice(0, 5).map((shift, idx) => {
                  const employee = employees.find(e => e.id === shift.employeeId);
                  const shiftDate = new Date(shift.start);
                  return (
                    <div key={idx} className="calendar-preview-item">
                      <div 
                        className="calendar-preview-color" 
                        style={{ backgroundColor: shift.backgroundColor }}
                      ></div>
                      <div className="calendar-preview-info-text">
                        <span className="calendar-preview-name">{employee?.name || 'Desconocido'}</span>
                        <span className="calendar-preview-date">
                          {shiftDate.toLocaleDateString('es-ES')} - {shift.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {shiftsInRange.length > 5 && (
                  <div className="calendar-preview-more">
                    +{shiftsInRange.length - 5} turno(s) más
                  </div>
                )}
              </div>
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="calendar-conflict-warning">
              <div className="calendar-warning-header">
                <FaExclamationTriangle className="calendar-warning-icon" />
                <strong>Conflictos Detectados</strong>
              </div>
              <p className="calendar-warning-description">
                Los siguientes turnos tienen conflictos y NO serán duplicados:
              </p>
              <ul className="calendar-conflict-list">
                {conflicts.slice(0, 3).map((conflict, idx) => (
                  <li key={idx}>{conflict.message}</li>
                ))}
                {conflicts.length > 3 && (
                  <li className="calendar-more-conflicts">
                    +{conflicts.length - 3} conflicto(s) más
                  </li>
                )}
              </ul>
              <p className="calendar-warning-note">
                Se crearán únicamente los turnos sin conflictos ({previewCount - conflicts.length} de {previewCount})
              </p>
            </div>
          )}

          <div className="calendar-modal-footer">
            <button type="button" className="calendar-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="calendar-btn-primary"
              disabled={previewCount === 0}
            >
              <FaCopy /> Duplicar Horarios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShiftDuplicateModal;