import { useState, useEffect } from 'react';
import { FaTimes, FaCopy, FaCheck, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';
import { formatDateForInput } from '../../../utils/dateUtils';
import '../../../styles/components/calendar/admin/ShiftDuplicateModal.css';

const ShiftDuplicateModal = ({ 
  isOpen, 
  onClose, 
  onDuplicate, 
  shifts,
  employees
}) => {
  const [formData, setFormData] = useState({
    sourceStartDate: formatDateForInput(new Date()),
    sourceEndDate: formatDateForInput(new Date()),
    targetStartDate: formatDateForInput(new Date()),
    targetEndDate: formatDateForInput(new Date())
  });

  const [errors, setErrors] = useState({});
  const [shiftsInRange, setShiftsInRange] = useState([]);
  const [duplicationStats, setDuplicationStats] = useState({ 
    days: 0, 
    totalShifts: 0,
    sourceDays: 1, // ✅ Valor por defecto
    repetitions: 1,
    shiftsPerPattern: 0
  });

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
      setShiftsInRange([]);
      setDuplicationStats({ 
        days: 0, 
        totalShifts: 0,
        sourceDays: 1, // ✅ Reset con valor por defecto
        repetitions: 1,
        shiftsPerPattern: 0
      });
    }
  }, [isOpen]);

  // ✅ Calcular turnos en el rango de origen
  useEffect(() => {
    if (formData.sourceStartDate && formData.sourceEndDate) {
      const start = new Date(formData.sourceStartDate);
      const end = new Date(formData.sourceEndDate);
      end.setHours(23, 59, 59, 999);
      
      const shiftsToShow = shifts.filter(shift => {
        const shiftDate = new Date(shift.start);
        return shiftDate >= start && shiftDate <= end;
      });
      
      console.log('📊 [ShiftDuplicateModal] Turnos en rango origen:', shiftsToShow.length);
      setShiftsInRange(shiftsToShow);
    } else {
      setShiftsInRange([]);
    }
  }, [formData.sourceStartDate, formData.sourceEndDate, shifts]);

  // ✅ MEJORADO: Calcular estadísticas con validaciones robustas
  useEffect(() => {
    // ✅ Calcular días origen siempre que haya fechas
    let sourceDays = 1; // Valor por defecto
    if (formData.sourceStartDate && formData.sourceEndDate) {
      const sourceStart = new Date(formData.sourceStartDate);
      const sourceEnd = new Date(formData.sourceEndDate);
      const sourceDiffTime = Math.abs(sourceEnd - sourceStart);
      sourceDays = Math.ceil(sourceDiffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // ✅ Validación: Mínimo 1 día
      if (sourceDays < 1 || isNaN(sourceDays)) {
        sourceDays = 1;
      }
    }

    // ✅ Calcular estadísticas completas si hay rango destino
    if (formData.targetStartDate && formData.targetEndDate && shiftsInRange.length > 0) {
      const targetStart = new Date(formData.targetStartDate);
      const targetEnd = new Date(formData.targetEndDate);
      
      // Calcular días en el rango destino
      const diffTime = Math.abs(targetEnd - targetStart);
      let targetDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // ✅ Validación: Mínimo 1 día
      if (targetDays < 1 || isNaN(targetDays)) {
        targetDays = 1;
      }
      
      // ✅ Calcular repeticiones (cuántas veces cabe el patrón)
      let repetitions = Math.ceil(targetDays / sourceDays);
      if (repetitions < 1 || isNaN(repetitions)) {
        repetitions = 1;
      }
      
      // ✅ CORRECCIÓN: Total de turnos = turnos del patrón × días destino
      // (si el patrón es 1 día, se duplica a cada día destino)
      const totalShifts = shiftsInRange.length * targetDays;
      
      setDuplicationStats({ 
        days: targetDays, 
        totalShifts,
        repetitions,
        sourceDays,
        shiftsPerPattern: shiftsInRange.length
      });
      
      console.log('📊 Stats calculados:', { 
        sourceDays, 
        targetDays, 
        repetitions, 
        totalShifts,
        shiftsInPattern: shiftsInRange.length
      });
    } else {
      // ✅ Si no hay rango destino completo, solo actualizar sourceDays
      setDuplicationStats(prev => ({ 
        ...prev,
        sourceDays,
        days: 0,
        totalShifts: 0,
        repetitions: 1,
        shiftsPerPattern: shiftsInRange.length
      }));
    }
  }, [formData.targetStartDate, formData.targetEndDate, formData.sourceStartDate, formData.sourceEndDate, shiftsInRange]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.sourceStartDate) {
      newErrors.source = 'La fecha de inicio origen es requerida';
    }

    if (!formData.sourceEndDate) {
      newErrors.source = 'La fecha de fin origen es requerida';
    }

    if (!formData.targetStartDate) {
      newErrors.target = 'La fecha de inicio destino es requerida';
    }

    if (!formData.targetEndDate) {
      newErrors.target = 'La fecha de fin destino es requerida';
    }

    const sourceStart = new Date(formData.sourceStartDate);
    const sourceEnd = new Date(formData.sourceEndDate);
    const targetStart = new Date(formData.targetStartDate);
    const targetEnd = new Date(formData.targetEndDate);

    if (sourceStart > sourceEnd) {
      newErrors.source = 'La fecha de inicio debe ser anterior o igual a la fecha fin';
    }

    if (targetStart > targetEnd) {
      newErrors.target = 'La fecha de inicio debe ser anterior o igual a la fecha fin';
    }

    if (shiftsInRange.length === 0) {
      newErrors.source = 'No hay turnos en el rango origen seleccionado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
  e.preventDefault();

  if (!validateForm()) {
    console.warn('⚠️ Validación fallida');
    return;
  }

  // ✅ CRÍTICO: Asegurar que TODOS los campos estén presentes
  const duplicateData = {
    sourceStartDate: formData.sourceStartDate,
    sourceEndDate: formData.sourceEndDate,
    targetStartDate: formData.targetStartDate,
    targetEndDate: formData.targetEndDate || formData.targetStartDate  // ✅ Fallback
  };

  console.log('📤 [ShiftDuplicateModal] Datos a enviar:', duplicateData);
  console.log('✅ Verificación de campos:');
  console.log('  - sourceStartDate:', duplicateData.sourceStartDate);
  console.log('  - sourceEndDate:', duplicateData.sourceEndDate);
  console.log('  - targetStartDate:', duplicateData.targetStartDate);
  console.log('  - targetEndDate:', duplicateData.targetEndDate);

  // ✅ Validar que ningún campo sea undefined
  if (!duplicateData.sourceStartDate || !duplicateData.sourceEndDate || 
      !duplicateData.targetStartDate || !duplicateData.targetEndDate) {
    console.error('❌ ERROR: Algún campo está undefined:', duplicateData);
    return;
  }

  onDuplicate(duplicateData);
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
          {/* Rango Origen */}
          <div className="calendar-section-container">
            <div className="calendar-section-header">
              <FaCalendarAlt className="calendar-section-icon" />
              <h4>Patrón Origen</h4>
            </div>
            <p className="calendar-section-description">
              Selecciona el patrón de turnos que deseas repetir
            </p>
            
            <div className="calendar-form-row">
              <div className="calendar-form-group">
                <label htmlFor="sourceStartDate">Fecha Inicio *</label>
                <input
                  type="date"
                  id="sourceStartDate"
                  value={formData.sourceStartDate}
                  onChange={(e) => handleChange('sourceStartDate', e.target.value)}
                  className={errors.source ? 'calendar-input-error' : ''}
                />
              </div>

              <div className="calendar-form-group">
                <label htmlFor="sourceEndDate">Fecha Fin *</label>
                <input
                  type="date"
                  id="sourceEndDate"
                  value={formData.sourceEndDate}
                  onChange={(e) => handleChange('sourceEndDate', e.target.value)}
                  className={errors.source ? 'calendar-input-error' : ''}
                  min={formData.sourceStartDate}
                />
              </div>
            </div>

            {errors.source && (
              <span className="calendar-error-message">{errors.source}</span>
            )}

            {/* ✅ PROTECCIÓN: Solo renderizar si sourceDays existe y es válido */}
            {shiftsInRange.length > 0 && duplicationStats.sourceDays > 0 && (
              <div className="calendar-preview-info">
                <FaCheck className="calendar-preview-icon" />
                <span>
                  Patrón: {shiftsInRange.length} turno(s) en {duplicationStats.sourceDays} día(s)
                </span>
              </div>
            )}
          </div>

          {/* Rango Destino */}
          <div className="calendar-section-container">
            <div className="calendar-section-header">
              <FaCalendarAlt className="calendar-section-icon" />
              <h4>Período Destino</h4>
            </div>
            <p className="calendar-section-description">
              Selecciona el período donde se repetirá el patrón
            </p>
            
            <div className="calendar-form-row">
              <div className="calendar-form-group">
                <label htmlFor="targetStartDate">Fecha Inicio *</label>
                <input
                  type="date"
                  id="targetStartDate"
                  value={formData.targetStartDate}
                  onChange={(e) => handleChange('targetStartDate', e.target.value)}
                  className={errors.target ? 'calendar-input-error' : ''}
                />
              </div>

              <div className="calendar-form-group">
                <label htmlFor="targetEndDate">Fecha Fin *</label>
                <input
                  type="date"
                  id="targetEndDate"
                  value={formData.targetEndDate}
                  onChange={(e) => handleChange('targetEndDate', e.target.value)}
                  className={errors.target ? 'calendar-input-error' : ''}
                  min={formData.targetStartDate}
                />
              </div>
            </div>

            {errors.target && (
              <span className="calendar-error-message">{errors.target}</span>
            )}

            {/* ✅ Estadísticas de duplicación con validaciones */}
            {duplicationStats.totalShifts > 0 && duplicationStats.days > 0 && (
              <div className="calendar-duplication-stats">
                <div className="calendar-stat-item">
                  <span className="calendar-stat-label">Días destino:</span>
                  <span className="calendar-stat-value">{duplicationStats.days}</span>
                </div>
                <div className="calendar-stat-item">
                  <span className="calendar-stat-label">Turnos/día:</span>
                  <span className="calendar-stat-value">{shiftsInRange.length}</span>
                </div>
                <div className="calendar-stat-item">
                  <span className="calendar-stat-label">Total turnos:</span>
                  <span className="calendar-stat-value">{duplicationStats.totalShifts}</span>
                </div>
              </div>
            )}
          </div>

          {/* Vista Previa */}
          {shiftsInRange.length > 0 && (
            <div className="calendar-shifts-preview">
              <h4>Vista Previa del Patrón</h4>
              <div className="calendar-preview-list">
                {shiftsInRange.slice(0, 5).map((shift, idx) => {
                  const employeeId = shift.extendedProps?.employeeId;
                  const employee = employees.find(e => String(e.id) === String(employeeId));
                  const employeeName = shift.extendedProps?.employeeName || employee?.name || 'Desconocido';
                  const shiftDate = new Date(shift.start);
                  const startTime = shift.start?.split('T')[1]?.substring(0, 5) || '';
                  const endTime = shift.end?.split('T')[1]?.substring(0, 5) || '';
                  
                  return (
                    <div key={`preview-${shift.id}-${idx}`} className="calendar-preview-item">
                      <div 
                        className="calendar-preview-color" 
                        style={{ backgroundColor: shift.backgroundColor || shift.color }}
                      ></div>
                      <div className="calendar-preview-info-text">
                        <span className="calendar-preview-name">{employeeName}</span>
                        <span className="calendar-preview-date">
                          {shiftDate.toLocaleDateString('es-ES')} • {startTime} - {endTime}
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
              
              {/* ✅ Mensaje informativo para duplicación de un día */}
              {duplicationStats.sourceDays === 1 && duplicationStats.days > 1 && (
                <div className="calendar-pattern-info">
                  <FaExclamationTriangle className="calendar-info-icon" />
                  <span>
                    Estos {shiftsInRange.length} turno(s) se copiarán a cada uno de los {duplicationStats.days} días
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="calendar-modal-footer">
            <button type="button" className="calendar-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="calendar-btn-primary"
              disabled={shiftsInRange.length === 0 || duplicationStats.totalShifts === 0}
            >
              <FaCopy /> Duplicar {shiftsInRange.length} Turno(s)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShiftDuplicateModal;