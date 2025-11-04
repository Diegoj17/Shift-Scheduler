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
    targetStartDate: formatDateForInput(new Date())
  });

  const [errors, setErrors] = useState({});
  const [shiftsInRange, setShiftsInRange] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      setFormData({
        sourceStartDate: formatDateForInput(today),
        sourceEndDate: formatDateForInput(today),
        targetStartDate: formatDateForInput(nextWeek)
      });
      setErrors({});
      setShiftsInRange([]);
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
      
      console.log('📊 [ShiftDuplicateModal] Turnos en rango:', shiftsToShow);
      setShiftsInRange(shiftsToShow);
    } else {
      setShiftsInRange([]);
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

    if (!formData.sourceStartDate) {
      newErrors.source = 'La fecha de inicio origen es requerida';
    }

    if (!formData.sourceEndDate) {
      newErrors.source = 'La fecha de fin origen es requerida';
    }

    if (!formData.targetStartDate) {
      newErrors.target = 'La fecha de inicio destino es requerida';
    }

    const sourceStart = new Date(formData.sourceStartDate);
    const sourceEnd = new Date(formData.sourceEndDate);

    if (sourceStart > sourceEnd) {
      newErrors.source = 'La fecha de inicio debe ser anterior a la fecha fin';
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

    // ✅ Enviar solo las fechas al backend
    const duplicateData = {
      sourceStartDate: formData.sourceStartDate,
      sourceEndDate: formData.sourceEndDate,
      targetStartDate: formData.targetStartDate
    };

    console.log('📤 [ShiftDuplicateModal] Enviando datos:', duplicateData);
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

            {shiftsInRange.length > 0 && (
              <div className="calendar-preview-info">
                <FaCheck className="calendar-preview-icon" />
                <span>Se duplicarán {shiftsInRange.length} turno(s)</span>
              </div>
            )}
          </div>

          {/* Rango Destino */}
          <div className="calendar-section-container">
            <div className="calendar-section-header">
              <FaCalendarAlt className="calendar-section-icon" />
              <h4>Rango Destino</h4>
            </div>
            <p className="calendar-section-description">
              Selecciona el período donde se copiarán los turnos
            </p>
            
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

            {errors.target && (
              <span className="calendar-error-message">{errors.target}</span>
            )}
          </div>

          {/* Vista Previa */}
          {shiftsInRange.length > 0 && (
            <div className="calendar-shifts-preview">
              <h4>Vista Previa de Turnos a Duplicar</h4>
              <div className="calendar-preview-list">
                {shiftsInRange.slice(0, 5).map((shift, idx) => {
                  // ✅ Buscar empleado correctamente
                  const employeeId = shift.extendedProps?.employeeId;
                  const employee = employees.find(e => String(e.id) === String(employeeId));
                  const employeeName = shift.extendedProps?.employeeName || employee?.name || 'Desconocido';
                  const shiftDate = new Date(shift.start);
                  const startTime = shift.start.split('T')[1]?.substring(0, 5) || '';
                  const endTime = shift.end.split('T')[1]?.substring(0, 5) || '';
                  
                  console.log('👤 Shift preview:', { 
                    employeeId, 
                    employee, 
                    employeeName,
                    extendedProps: shift.extendedProps 
                  });
                  
                  return (
                    <div key={idx} className="calendar-preview-item">
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
            </div>
          )}

          <div className="calendar-modal-footer">
            <button type="button" className="calendar-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="calendar-btn-primary"
              disabled={shiftsInRange.length === 0}
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