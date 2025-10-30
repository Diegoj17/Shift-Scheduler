/**
 * Valida si un turno se solapa con otro
 */
export const checkShiftOverlap = (shift1, shift2) => {
  const start1 = new Date(shift1.start);
  const end1 = new Date(shift1.end);
  const start2 = new Date(shift2.start);
  const end2 = new Date(shift2.end);

  return (start1 < end2 && end1 > start2);
};

/**
 * Valida si un empleado está disponible en un rango de tiempo
 */
export const checkEmployeeAvailability = (employeeId, start, end, unavailabilities) => {
  if (!unavailabilities || unavailabilities.length === 0) return true;

  const shiftStart = new Date(start);
  const shiftEnd = new Date(end);

  return !unavailabilities.some(unavail => {
    if (unavail.employeeId !== employeeId) return false;
    const unavailStart = new Date(unavail.start);
    const unavailEnd = new Date(unavail.end);
    return shiftStart < unavailEnd && shiftEnd > unavailStart;
  });
};

/**
 * Detecta conflictos al crear/modificar un turno
 */
export const detectShiftConflicts = (newShift, existingShifts, unavailabilities, excludeShiftId = null) => {
  const conflicts = [];

  // Verificar solapamiento con otros turnos del mismo empleado
  const employeeShifts = existingShifts.filter(
    shift => shift.employeeId === newShift.employeeId && shift.id !== excludeShiftId
  );

  employeeShifts.forEach(shift => {
    if (checkShiftOverlap(newShift, shift)) {
      conflicts.push({
        type: 'overlap',
        message: `El empleado ya tiene un turno asignado de ${formatTime(shift.start)} a ${formatTime(shift.end)}`,
        conflictingShift: shift
      });
    }
  });

  // Verificar disponibilidad del empleado
  if (!checkEmployeeAvailability(newShift.employeeId, newShift.start, newShift.end, unavailabilities)) {
    conflicts.push({
      type: 'unavailable',
      message: `El empleado no está disponible en este horario`,
    });
  }

  return conflicts;
};

/**
 * Valida el rango horario de un tipo de turno
 */
export const validateShiftTypeRange = (startTime, endTime) => {
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  
  if (end <= start) {
    // Verificar si el turno cruza medianoche
    const endNextDay = new Date(`2000-01-02 ${endTime}`);
    if (endNextDay > start) {
      return { valid: true, crossesMidnight: true };
    }
    return { valid: false, message: 'La hora de fin debe ser mayor a la hora de inicio' };
  }
  
  return { valid: true, crossesMidnight: false };
};

/**
 * Valida duplicación de nombre de tipo de turno
 */
export const validateShiftTypeName = (name, existingTypes, excludeId = null) => {
  const duplicate = existingTypes.find(
    type => type.name.toLowerCase() === name.toLowerCase() && type.id !== excludeId
  );
  
  if (duplicate) {
    return { valid: false, message: 'Ya existe un tipo de turno con este nombre' };
  }
  
  return { valid: true };
};

/**
 * Detecta conflictos al duplicar turnos
 */
export const detectDuplicationConflicts = (shiftsToClone, targetDate, existingShifts, unavailabilities) => {
  const conflicts = [];
  const validShifts = [];

  shiftsToClone.forEach(shift => {
    const dayDiff = targetDate.getDate() - new Date(shift.start).getDate();
    const newStart = new Date(shift.start);
    newStart.setDate(newStart.getDate() + dayDiff);
    const newEnd = new Date(shift.end);
    newEnd.setDate(newEnd.getDate() + dayDiff);

    const newShift = {
      ...shift,
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
      id: null // Nuevo turno
    };

    const shiftConflicts = detectShiftConflicts(newShift, existingShifts, unavailabilities);

    if (shiftConflicts.length > 0) {
      conflicts.push({
        originalShift: shift,
        newShift,
        conflicts: shiftConflicts
      });
    } else {
      validShifts.push(newShift);
    }
  });

  return { conflicts, validShifts };
};

/**
 * Formatea tiempo para mostrar
 */
const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formatea una fecha para inputs tipo date (YYYY-MM-DD)
 */
export const formatDateForInput = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formatea una fecha/hora para inputs tipo time (HH:MM)
 */
export const formatTimeForInput = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Combina una fecha (YYYY-MM-DD ó Date) y una hora (HH:MM) en un objeto Date
 */
export const combineDateAndTime = (dateInput, timeInput) => {
  // dateInput puede venir como string 'YYYY-MM-DD' o Date
  const datePart = typeof dateInput === 'string' ? dateInput : formatDateForInput(dateInput);
  // timeInput esperado en 'HH:MM' (24h)
  const [hours = '00', minutes = '00'] = (timeInput || '').split(':');
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, Number(hours), Number(minutes));
};

/**
 * Calcula duración del turno en horas
 */
export const calculateShiftDuration = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate - startDate;
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // Redondeado a 1 decimal
};

/**
 * Valida que los datos del turno sean completos
 */
export const validateShiftData = (shiftData) => {
  const errors = [];

  if (!shiftData.employeeId) {
    errors.push('Debe seleccionar un empleado');
  }

  if (!shiftData.shiftTypeId) {
    errors.push('Debe seleccionar un tipo de turno');
  }

  if (!shiftData.start || !shiftData.end) {
    errors.push('Debe especificar fecha y hora de inicio y fin');
  }

  if (shiftData.start && shiftData.end) {
    const start = new Date(shiftData.start);
    const end = new Date(shiftData.end);
    if (end <= start) {
      errors.push('La hora de fin debe ser posterior a la hora de inicio');
    }
  }

  if (!shiftData.role || shiftData.role.trim() === '') {
    errors.push('Debe especificar el rol en el turno');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const timeStringToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTimeString = (minutes) => {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export default {
  checkShiftOverlap,
  checkEmployeeAvailability,
  detectShiftConflicts,
  validateShiftTypeRange,
  validateShiftTypeName,
  detectDuplicationConflicts,
  calculateShiftDuration,
  validateShiftData
};