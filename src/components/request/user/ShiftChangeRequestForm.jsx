import React, { useState, useEffect } from 'react';
import { MdSwapHoriz, MdPerson, MdCalendarToday, MdNotes, MdWarning, MdError } from 'react-icons/md';
import shiftService from '../../../services/shiftService';
import shiftChangeService from '../../../services/shiftChangeService';
import { formatTime } from '../../../utils/dateUtils';
import '../../../styles/components/request/user/ShiftChangeRequestForm.css';

const ShiftChangeRequestForm = ({ initialOriginalShiftId = null }) => {
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

  const getShiftTypeName = (shift) => {
    if (!shift) return 'Turno';
    
    if (shift.shift_type_name && String(shift.shift_type_name).trim() !== '') {
      if (shift.notes && String(shift.notes).trim() !== '' && 
          String(shift.notes).trim() === String(shift.shift_type_name).trim()) {
        // Evitar usar la nota si coincide
      } else {
        return shift.shift_type_name;
      }
    }

    if (shift.shift_type && typeof shift.shift_type === 'object' && shift.shift_type.name) {
      return shift.shift_type.name;
    }

    if (shift.shift_type && typeof shift.shift_type === 'string' && shift.shift_type.trim() !== '') {
      return shift.shift_type;
    }

    if (shift.shiftTypeName && String(shift.shiftTypeName).trim() !== '') {
      return shift.shiftTypeName;
    }

    return 'Turno';
  };

  useEffect(() => {
    loadMyShifts();
    loadEmployees();
  }, []);

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
        console.log('🔍 Debug: No hay turnos.');
      }

      setMyShifts(shifts);

      // Si se proporcionó un turno inicial desde la navegación, pre-seleccionarlo
      if (initialOriginalShiftId) {
        const asString = String(initialOriginalShiftId);
        const found = shifts.find(s => String(s.id) === asString || String(s.id) === String(parseInt(asString)));
        if (found) {
          setFormData(prev => ({ ...prev, originalShiftId: asString }));
        }
      }
    } catch (error) {
      console.error('Error cargando mis turnos:', error);
      showNotification('error', 'Error al cargar tus turnos');
    }
  };

  const loadEmployees = async () => {
    try {
      const empList = await shiftService.getEmployees();
      console.log('✅ Empleados cargados:', empList);
      setEmployees(empList);
    } catch (error) {
      console.error('Error cargando empleados:', error);
    }
  };

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

    if (name === 'proposedEmployeeId') {
      loadEmployeeShifts(value);
      setFormData(prev => ({
        ...prev,
        proposedShiftId: '' // Reset turno propuesto
      }));
    }
  };

  // ✅ CORREGIDO: Validación estricta según serializer
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.originalShiftId) {
      showNotification('error', 'Debes seleccionar el turno que deseas cambiar');
      return;
    }

    // ✅ OBLIGATORIO: Validar compañero propuesto
    if (!formData.proposedEmployeeId) {
      showNotification('error', 'Debes seleccionar un compañero para el intercambio');
      return;
    }

    // ✅ OBLIGATORIO: Validar turno del compañero
    if (!formData.proposedShiftId) {
      showNotification('error', 'Debes seleccionar el turno del compañero propuesto');
      return;
    }

    // ✅ Validar motivo
    if (!formData.reason || formData.reason.trim().length < 10) {
      showNotification('error', 'El motivo debe tener al menos 10 caracteres');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        originalShiftId: parseInt(formData.originalShiftId),
        proposedEmployeeId: parseInt(formData.proposedEmployeeId),
        proposedShiftId: parseInt(formData.proposedShiftId),
        reason: formData.reason.trim()
      };

      console.log('📤 Enviando solicitud CON compañero:', payload);

      await shiftChangeService.createChangeRequest(payload);

      showNotification('success', '✓ Solicitud de intercambio enviada exitosamente');

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
      console.error('❌ Error al enviar solicitud:', error);
      showNotification('error', error.message || 'Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

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
            Completa el formulario para solicitar el cambio. <strong>Debes seleccionar un compañero y su turno</strong> para el intercambio y realizar la solicitud antes de 24 horas del turno original.
          </p>
        </div>
      </div>

      {/* ✅ NUEVO: Mensaje informativo sobre requisitos */}
      <div className="shift-change-requirement-box">
        <MdError size={20} />
        <div>
          <strong>Requisitos para solicitar cambio:</strong>
          <ul>
            <li>Debes seleccionar un compañero para intercambio</li>
            <li>Debes seleccionar el turno específico del compañero</li>
            <li>El motivo debe tener al menos 10 caracteres</li>
            <li>La solicitud debe hacerse con al menos 24 horas de anticipación</li>
          </ul>
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

        {/* ✅ CORREGIDO: Sección OBLIGATORIA de compañero propuesto */}
        <div className="shift-change-form-section">
          <h3 className="shift-change-section-title">
            <MdPerson size={20} />
            Compañero para intercambio *
          </h3>

          <div className="shift-change-form-group">
            <label htmlFor="proposedEmployeeId" className="shift-change-label">
              Selecciona un compañero *
            </label>
            <select
              id="proposedEmployeeId"
              name="proposedEmployeeId"
              value={formData.proposedEmployeeId}
              onChange={handleInputChange}
              className="shift-change-select"
              required
            >
              <option value="">-- Selecciona un compañero --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.position}
                </option>
              ))}
            </select>
            <p className="shift-change-help-text">
              Elige al compañero con quien deseas intercambiar turnos
            </p>
          </div>

          {/* Turnos del empleado seleccionado */}
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
                    required
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
                      <p>Este empleado no tiene turnos disponibles para intercambio en los próximos 60 días</p>
                    </div>
                  )}

                  {/* Información del turno propuesto seleccionado */}
                  {selectedProposedShift && (
                    <div className="shift-change-proposed-info">
                      <h4 className="shift-change-proposed-title">Turno seleccionado del compañero:</h4>
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
            Motivo de la solicitud *
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
              {formData.reason.length}/500 caracteres {formData.reason.length < 10 && `(mínimo 10)`}
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
            {loading ? 'Enviando...' : 'Enviar Solicitud de Intercambio'}
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