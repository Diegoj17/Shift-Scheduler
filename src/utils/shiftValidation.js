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

  // Guardar defensivamente los parámetros esperados
  if (!newShift || !newShift.employeeId || !newShift.start || !newShift.end) return conflicts;

  // Asegurarnos de que existingShifts es un arreglo antes de usar .filter
  const shiftsArray = Array.isArray(existingShifts) ? existingShifts : [];

  // Verificar solapamiento con otros turnos del mismo empleado
  const employeeShifts = shiftsArray.filter(
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
  let end = new Date(`2000-01-01 ${endTime}`);

  // Si end es menor o igual que start, considerar que cruza a la siguiente jornada
  let crossesMidnight = false;
  if (end <= start) {
    const endNextDay = new Date(`2000-01-02 ${endTime}`);
    if (endNextDay > start) {
      end = endNextDay;
      crossesMidnight = true;
    } else {
      return { valid: false, message: 'La hora de fin debe ser mayor a la hora de inicio' };
    }
  }

  const diffMs = end - start;
  const durationHours = diffMs / (1000 * 60 * 60);

  // Exigir exactamente 8 horas (permitir pequeña tolerancia por coma flotante)
  if (Math.abs(durationHours - 8) > 0.01) {
    return { valid: false, message: 'La duración del tipo de turno debe ser exactamente 8 horas' };
  }

  return { valid: true, crossesMidnight };
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