import React, { useState, useEffect } from 'react';
import { MdSwapHoriz, MdPerson, MdCalendarToday, MdNotes, MdWarning } from 'react-icons/md';
import shiftService from '../../../services/shiftService';
import shiftChangeService from '../../../services/shiftChangeService';
import { formatTime } from '../../../utils/dateUtils';
import '../../../styles/components/request/user/ShiftChangeRequestForm.css';

const ShiftChangeRequestForm = () => {
  const [myShifts, setMyShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeShifts, setEmployeeShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployeeShifts, setLoadingEmployeeShifts] = useState(false);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    originalShiftId: '',
    proposedEmployeeId: '',
    proposedShiftId: '',
    reason: ''
  });

  // Helper: obtener nombre del tipo de turno evitando mostrar la nota por error
  const getShiftTypeName = (shift) => {
    if (!shift) return 'Turno';
    // Priorizar campo específico de tipo
    if (shift.shift_type_name && String(shift.shift_type_name).trim() !== '') {
      // Si por alguna razón la nota coincide con el campo, preferimos no tomar la nota
      if (shift.notes && String(shift.notes).trim() !== '' && String(shift.notes).trim() === String(shift.shift_type_name).trim()) {
        // fallback: intentar otros campos
      } else {
        return shift.shift_type_name;
      }
    }

    // Si viene como objeto
    if (shift.shift_type && typeof shift.shift_type === 'object' && shift.shift_type.name) {
      return shift.shift_type.name;
    }

    // Si viene como string o id
    if (shift.shift_type && typeof shift.shift_type === 'string' && shift.shift_type.trim() !== '') {
      return shift.shift_type;
    }

    // Si existe un campo shift_type_name alternativo
    if (shift.shiftTypeName && String(shift.shiftTypeName).trim() !== '') return shift.shiftTypeName;

    // No mostrar la nota como tipo; devolver genérico
    return 'Turno';
  };

  useEffect(() => {
    loadMyShifts();
    loadEmployees();
  }, []);

  // Cargar turnos del empleado actual (próximos 30 días)
  const loadMyShifts = async () => {
  try {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 30);

    console.log('🕐 Fechas para filtro:', {
      hoy: today.toISOString(),
      hoyLocal: today.toString(),
      en30Dias: nextMonth.toISOString(),
      en30DiasLocal: nextMonth.toString()
    });

    const getLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const shifts = await shiftService.getMyShifts({
      start_date: getLocalDate(today),
      end_date: getLocalDate(nextMonth)
    });

    console.log('📋 Turnos recibidos del backend:', shifts);
    
    if (shifts.length === 0) {
      console.log('🔍 Debug: No hay turnos. Verificando parámetros enviados:', {
        start_date: getLocalDate(today),
        end_date: getLocalDate(nextMonth),
        hoy: today,
        hoyLocal: getLocalDate(today)
      });
    }

    setMyShifts(shifts);
  } catch (error) {
    console.error('Error cargando mis turnos:', error);
    showNotification('error', 'Error al cargar tus turnos');
  }
};

  // Cargar lista de empleados
  const loadEmployees = async () => {
    try {
      const empList = await shiftService.getEmployees();
      console.log('✅ Empleados cargados:', empList);
      setEmployees(empList);
    } catch (error) {
      console.error('Error cargando empleados:', error);
    }
  };

  // ✅ NUEVO: Cargar turnos del empleado seleccionado
  const loadEmployeeShifts = async (employeeId) => {
    if (!employeeId) {
      setEmployeeShifts([]);
      return;
    }

    setLoadingEmployeeShifts(true);
    
    try {
      console.log('🔄 Cargando turnos del empleado:', employeeId);
      const shifts = await shiftService.getEmployeeShifts(employeeId);
      
      console.log('✅ Turnos del empleado obtenidos:', shifts);
      setEmployeeShifts(shifts);
      
      if (shifts.length === 0) {
        showNotification('warning', 'Este empleado no tiene turnos disponibles para intercambio');
      }
    } catch (error) {
      console.error('Error cargando turnos del empleado:', error);
      setEmployeeShifts([]);
      showNotification('error', 'Error al cargar turnos del empleado');
    } finally {
      setLoadingEmployeeShifts(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Si cambia el empleado propuesto, cargar sus turnos
    if (name === 'proposedEmployeeId') {
      loadEmployeeShifts(value);
      setFormData(prev => ({
        ...prev,
        proposedShiftId: '' // Reset turno propuesto
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.originalShiftId) {
      showNotification('error', 'Debes seleccionar el turno que deseas cambiar');
      return;
    }

    if (!formData.reason || formData.reason.trim().length < 10) {
      showNotification('error', 'El motivo debe tener al menos 10 caracteres');
      return;
    }

    // Si propone empleado, debe seleccionar su turno
    if (formData.proposedEmployeeId && !formData.proposedShiftId) {
      showNotification('error', 'Debes seleccionar el turno del compañero propuesto');
      return;
    }

    setLoading(true);

    try {
      await shiftChangeService.createChangeRequest({
        originalShiftId: parseInt(formData.originalShiftId),
        proposedEmployeeId: formData.proposedEmployeeId ? parseInt(formData.proposedEmployeeId) : null,
        proposedShiftId: formData.proposedShiftId ? parseInt(formData.proposedShiftId) : null,
        reason: formData.reason.trim()
      });

      showNotification('success', '✓ Solicitud enviada exitosamente');

      // Limpiar formulario
      setFormData({
        originalShiftId: '',
        proposedEmployeeId: '',
        proposedShiftId: '',
        reason: ''
      });
      setEmployeeShifts([]);

      // Recargar turnos
      loadMyShifts();

    } catch (error) {
      showNotification('error', error.message || 'Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Obtener información del turno seleccionado
  const selectedShift = myShifts.find(s => s.id === parseInt(formData.originalShiftId));
  const selectedEmployee = employees.find(e => e.id === parseInt(formData.proposedEmployeeId));
  const selectedProposedShift = employeeShifts.find(s => s.id === parseInt(formData.proposedShiftId));

  return (
    <div className="shift-change-form-container">
      <div className="shift-change-form-header">
        <div className="shift-change-form-icon">
          <MdSwapHoriz size={28} />
        </div>
        <div>
          <h2 className="shift-change-form-title">Solicitar Cambio de Turno</h2>
          <p className="shift-change-form-subtitle">
            Completa el formulario para solicitar el cambio. Las solicitudes deben realizarse con al menos 24 horas de anticipación.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="shift-change-form">
        {/* Turno a cambiar */}
        <div className="shift-change-form-section">
          <h3 className="shift-change-section-title">
            <MdCalendarToday size={20} />
            Turno que deseas cambiar
          </h3>

          <div className="shift-change-form-group">
            <label htmlFor="originalShiftId" className="shift-change-label">
              Selecciona tu turno *
            </label>
            <select
              id="originalShiftId"
              name="originalShiftId"
              value={formData.originalShiftId}
              onChange={handleInputChange}
              className="shift-change-select"
              required
            >
              <option value="">-- Selecciona un turno --</option>
              {myShifts.map(shift => (
                <option key={shift.id} value={shift.id}>
                  {shift.date} • {formatTime(shift.start_time)} - {formatTime(shift.end_time)} • {getShiftTypeName(shift)}
                </option>
              ))}
            </select>

            {myShifts.length === 0 && (
              <p className="shift-change-help-text">
                No tienes turnos disponibles para cambiar en los próximos 30 días
              </p>
            )}
          </div>

          {/* Información del turno seleccionado */}
          {selectedShift && (
            <div className="shift-change-selected-info">
              <div className="shift-change-info-card">
                <span className="shift-change-info-label">Fecha:</span>
                <span className="shift-change-info-value">{selectedShift.date}</span>
              </div>
              <div className="shift-change-info-card">
                <span className="shift-change-info-label">Horario:</span>
                <span className="shift-change-info-value">
                  {formatTime(selectedShift.start_time)} - {formatTime(selectedShift.end_time)}
                </span>
              </div>
                <div className="shift-change-info-card">
                  <span className="shift-change-info-label">Tipo:</span>
                  <span className="shift-change-info-value">{getShiftTypeName(selectedShift)}</span>
                </div>
            </div>
          )}
        </div>

        {/* Compañero propuesto (opcional) */}
        <div className="shift-change-form-section">
          <h3 className="shift-change-section-title">
            <MdPerson size={20} />
            Proponer compañero para intercambio (opcional)
          </h3>

          <div className="shift-change-form-group">
            <label htmlFor="proposedEmployeeId" className="shift-change-label">
              Selecciona un compañero
            </label>
            <select
              id="proposedEmployeeId"
              name="proposedEmployeeId"
              value={formData.proposedEmployeeId}
              onChange={handleInputChange}
              className="shift-change-select"
            >
              <option value="">-- Sin propuesta --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.position}
                </option>
              ))}
            </select>
            <p className="shift-change-help-text">
              Opcional: Proponer un compañero aumenta la probabilidad de aprobación
            </p>
          </div>

          {/* ✅ NUEVO: Mostrar turnos del empleado seleccionado */}
          {formData.proposedEmployeeId && (
            <div className="shift-change-form-group">
              <label htmlFor="proposedShiftId" className="shift-change-label">
                Turno de {selectedEmployee?.name || 'compañero'} *
              </label>
              
              {loadingEmployeeShifts ? (
                <div className="shift-change-loading-shifts">
                  <p>Cargando turnos disponibles...</p>
                </div>
              ) : (
                <>
                  <select
                    id="proposedShiftId"
                    name="proposedShiftId"
                    value={formData.proposedShiftId}
                    onChange={handleInputChange}
                    className="shift-change-select"
                    required={!!formData.proposedEmployeeId}
                  >
                    <option value="">-- Selecciona el turno --</option>
                    {employeeShifts.map(shift => (
                      <option key={shift.id} value={shift.id}>
                        {shift.date} • {formatTime(shift.start_time)} - {formatTime(shift.end_time)} • {getShiftTypeName(shift)}
                      </option>
                    ))}
                  </select>

                  {employeeShifts.length === 0 && (
                    <div className="shift-change-warning-box">
                      <MdWarning size={20} />
                      <p>Este empleado no tiene turnos disponibles para intercambio</p>
                    </div>
                  )}

                  {/* Información del turno propuesto seleccionado */}
                  {selectedProposedShift && (
                    <div className="shift-change-proposed-info">
                      <h4 className="shift-change-proposed-title">Turno seleccionado:</h4>
                      <div className="shift-change-selected-info">
                        <div className="shift-change-info-card">
                          <span className="shift-change-info-label">Fecha:</span>
                          <span className="shift-change-info-value">{selectedProposedShift.date}</span>
                        </div>
                        <div className="shift-change-info-card">
                          <span className="shift-change-info-label">Horario:</span>
                          <span className="shift-change-info-value">
                            {formatTime(selectedProposedShift.start_time)} - {formatTime(selectedProposedShift.end_time)}
                          </span>
                        </div>
                        <div className="shift-change-info-card">
                <span className="shift-change-info-label">Tipo:</span>
                <span className="shift-change-info-value">{getShiftTypeName(selectedProposedShift)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Motivo */}
        <div className="shift-change-form-section">
          <h3 className="shift-change-section-title">
            <MdNotes size={20} />
            Motivo de la solicitud
          </h3>

          <div className="shift-change-form-group">
            <label htmlFor="reason" className="shift-change-label">
              Describe el motivo *
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="shift-change-textarea"
              rows="4"
              placeholder="Explica por qué necesitas cambiar este turno (mínimo 10 caracteres)"
              required
              minLength={10}
              maxLength={500}
            />
            <p className="shift-change-help-text">
              {formData.reason.length}/500 caracteres
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="shift-change-form-actions">
          <button
            type="button"
            onClick={() => {
              setFormData({
                originalShiftId: '',
                proposedEmployeeId: '',
                proposedShiftId: '',
                reason: ''
              });
              setEmployeeShifts([]);
            }}
            className="shift-change-btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="shift-change-btn-primary"
            disabled={loading || myShifts.length === 0}
          >
            {loading ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </div>
      </form>

      {/* Notification */}
      {notification && (
        <div className={`shift-change-notification shift-change-notification-${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>×</button>
        </div>
      )}
    </div>
  );
};

export default ShiftChangeRequestForm;