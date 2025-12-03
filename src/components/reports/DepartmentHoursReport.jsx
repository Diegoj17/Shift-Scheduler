import React, { useState, useEffect } from 'react';
import { FaDownload, FaSearch, FaCalendarAlt, FaBuilding, FaClock, FaUsers, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { MdInbox } from 'react-icons/md';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import shiftService from '../../services/shiftService';
import { departments } from '../../utils/departments';
import '../../styles/components/reports/DepartmentHoursReport.css';

const DepartmentHoursReport = () => {
  const [filters, setFilters] = useState({
    department: '',
    startDate: '',
    endDate: ''
  });
  // Usar el listado centralizado de departamentos importado desde utils
  // Convertimos a objetos con `id` y `name` para mantener compatibilidad con el select
  const [departmentsOptions] = useState(
    departments.map(d => ({ id: d.toLowerCase().replace(/[^a-z0-9]+/g, '_'), name: d }))
  );
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [employeeError, setEmployeeError] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoadingEmployees(true);
      setEmployeeError(null);
      try {
        const data = await shiftService.getEmployees();
        setEmployees(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error al cargar empleados para reporte de departamentos:', err);
        setEmployees([]);
        setEmployeeError('No se pudieron cargar todos los empleados. El filtrado por departamento puede ser incompleto.');
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const generateReport = async () => {
    if (!filters.department || !filters.startDate || !filters.endDate) {
      alert('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      // Obtener todos los turnos y filtrar por departamento + rango
      const shiftsRaw = await shiftService.getShifts();
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);

      // Encontrar el departamento seleccionado (objeto con id/name)
      const selectedDept = departmentsOptions.find(d => d.id === filters.department);
      if (!selectedDept) {
        alert('Departamento no encontrado');
        setIsLoading(false);
        return;
      }

      // Crear índices rápidos a partir de los empleados obtenidos desde shiftService
      const employeesByEmployeeId = new Map(); // employee_id numérico
      const employeesByUserId = new Map(); // user_id
      const employeesByName = new Map(); // nombre
      (employees || []).forEach(emp => {
        const employeeId = emp.employee_id ?? emp.employeeId ?? null;
        const userId = emp.id ?? emp.user_id ?? null;
        const nameKey = (emp.name || '').toString().trim().toLowerCase();
        if (employeeId != null) employeesByEmployeeId.set(String(employeeId), emp);
        if (userId != null) employeesByUserId.set(String(userId), emp);
        if (nameKey) employeesByName.set(nameKey, emp);
      });

      // Normalizar cadenas: quitar acentos y pasar a minúsculas
      const removeDiacritics = (str) => {
        const s = String(str || '');
        try {
          return s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
        } catch {
          return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }
      };
      const norm = (s) => removeDiacritics(s).toLowerCase();
      const selectedNameNorm = norm(selectedDept.name);

      const filtered = (shiftsRaw || []).filter(s => {
        const dateStr = s.date || s.shift_date || (s.start && s.start.split ? s.start.split('T')[0] : null) || s.start_date;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (d < start || d > end) return false;

        // Determinar departamento del turno (varias claves posibles)
        let deptRaw = s.department || s.employee_department || s.dept || s.department_name || s.departmentId || s.department_id || null;

        // Si no viene departamento en el turno, intentar mapear por empleado -> usuario -> departamento
        if (!deptRaw) {
          // buscar por employee id/user id
          const empIdCandidate = s.employee_id ?? s.employee ?? s.employeeUserId ?? s.employee_user_id ?? s.employeeId ?? s.employee_db_id;
          let employeeInfo = null;
          if (empIdCandidate != null) {
            employeeInfo = employeesByEmployeeId.get(String(empIdCandidate)) || employeesByUserId.get(String(empIdCandidate));
          }
          // Si no encontramos por id, intentar por nombre
          if (!employeeInfo) {
            const shiftName = (s.employee_name || s.employee || '').toString().toLowerCase().trim();
            if (shiftName) employeeInfo = employeesByName.get(shiftName);
          }
          if (employeeInfo) {
            deptRaw = employeeInfo.departamento || employeeInfo.department || null;
          }
        }

        if (!deptRaw) return false;

        const deptNorm = norm(deptRaw);
        // Comparar normalizado: igualdad exacta (más confiable que includes con acentos)
        return deptNorm === selectedNameNorm;
      });

      // Agrupar por empleado
      const grouped = {};
      for (const s of filtered) {
        const employeeName = s.employee_name || s.employee || s.employeeName || (s.employee_obj && s.employee_obj.name) || 'Sin nombre';
        // intentar resolver info del empleado desde los índices creados arriba
        const empIdCandidate = s.employee_id ?? s.employee ?? s.employeeUserId ?? s.employee_user_id ?? s.employeeId ?? s.employee_db_id;
        let employeeInfo = null;
        if (empIdCandidate != null) {
          employeeInfo = employeesByEmployeeId.get(String(empIdCandidate)) || employeesByUserId.get(String(empIdCandidate));
        }
        if (!employeeInfo) {
          const shiftName = (s.employee_name || s.employee || '').toString().toLowerCase().trim();
          if (shiftName) employeeInfo = employeesByName.get(shiftName);
        }
        const departmentName = employeeInfo?.departamento || employeeInfo?.department || s.department || s.employee_department || s.dept || s.department_name || 'Sin departamento';
        const position = s.position || s.role || s.employee_position || '';
        const startTime = (s.start_time || s.startTime || (s.start && s.start.split ? s.start.split('T')[1]?.slice(0,5) : null) || '').slice(0,5);
        const endTime = (s.end_time || s.endTime || (s.end && s.end.split ? s.end.split('T')[1]?.slice(0,5) : null) || '').slice(0,5);

        let hours = s.hours || s.total_hours || s.duration_hours;
        if (hours == null && startTime && endTime) {
          const [sh, sm] = startTime.split(':').map(Number);
          const [eh, em] = endTime.split(':').map(Number);
          let h = eh + em/60 - (sh + sm/60);
          if (h < 0) h += 24;
          hours = Math.round(h * 100) / 100;
        }

        if (!grouped[employeeName]) grouped[employeeName] = { employee: employeeName, department: departmentName, position, totalHours: 0, shifts: 0 };
        // conservar departamento si ya existe (no sobrescribir con undefined)
        if (!grouped[employeeName].department && departmentName) grouped[employeeName].department = departmentName;
        grouped[employeeName].totalHours += Number(hours) || 0;
        grouped[employeeName].shifts += 1;
      }

      const employeeHours = Object.values(grouped);
      const totalHours = employeeHours.reduce((s, e) => s + (Number(e.totalHours) || 0), 0);
      const totalEmployees = employeeHours.length;
      const averageHoursPerEmployee = totalEmployees > 0 ? Math.round((totalHours / totalEmployees) * 100) / 100 : 0;

      const final = {
        department: selectedDept || { id: filters.department, name: filters.department },
        startDate: filters.startDate,
        endDate: filters.endDate,
        employeeHours,
        totalHours,
        totalEmployees,
        averageHoursPerEmployee
      };

      setReportData(employeeHours.length > 0 ? final : null);
    } catch (error) {
      console.error('Error al generar reporte:', error);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Colores del tema
    const primaryColor = [79, 140, 255];
    const darkColor = [34, 43, 69];
    const lightGray = [248, 250, 252];
    const accentColor = [255, 107, 107];
    
    // Header con diseño moderno (altura restaurada)
    const headerHeight = 45;
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // Intentar cargar el logo desde public/img/calendario.png y dibujarlo
    const loadImage = (src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

    let titleX = 15;
    try {
      const img = await loadImage('/img/calendario.png');
      const imgWidth = 28;
      const aspect = img.height / img.width;
      const imgHeight = imgWidth * aspect;
      const imgX = 15;
      const imgY = (headerHeight - imgHeight) / 2;
      doc.addImage(img, 'PNG', imgX, imgY, imgWidth, imgHeight);
      titleX = imgX + imgWidth + 10;
    } catch (err) {
      console.warn('No se pudo cargar el logo para el PDF:', err);
    }

    // Título y subtítulo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Shift Scheduler', titleX, 20);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte de Horas por Área/Departamento', titleX, 32);
    
    // Información del departamento - diseño card
    doc.setFillColor(...lightGray);
    doc.roundedRect(15, 55, pageWidth - 30, 45, 3, 3, 'F');
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Departamento:', 20, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(reportData.department?.name || 'N/A', 52, 65);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Período:', 20, 73);
    doc.setFont('helvetica', 'normal');
    doc.text(`${reportData.startDate} - ${reportData.endDate}`, 40, 73);
    
    // Métricas en cards pequeños
    const metricY = 81;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Horas:', 20, metricY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(13);
    doc.text(`${reportData.totalHours} hrs`, 50, metricY);
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Empleados:', 105, metricY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...accentColor);
    doc.setFontSize(13);
    doc.text(`${reportData.totalEmployees}`, 133, metricY);
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Promedio:', 20, metricY + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${reportData.averageHoursPerEmployee} hrs/empleado`, 45, metricY + 8);
    
    // Tabla con estilo moderno - calcular anchos relativos para que quepa en la hoja
    const availableWidth = pageWidth - 30; // margen izquierdo+derecho = 30
    // Proporciones pensadas: Empleado (30%), Departamento (25%), Posición (25%), Total Horas (12%), Turnos (8%)
    const colWidths = [0.30, 0.25, 0.25, 0.12, 0.08].map(p => Math.floor(availableWidth * p));

    autoTable(doc, {
      startY: 110,
      head: [['Empleado', 'Departamento', 'Posición', 'Total Horas', 'Turnos']],
      body: reportData.employeeHours.map(emp => [
        emp.employee,
        emp.department || 'Sin departamento',
        emp.position,
        `${emp.totalHours} hrs`,
        emp.shifts
      ]),
      theme: 'striped',
      tableWidth: availableWidth,
      styles: {
        fontSize: 9,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        textColor: darkColor,
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: colWidths[0] }, // Empleado
        1: { halign: 'left', cellWidth: colWidths[1] }, // Departamento
        2: { halign: 'left', cellWidth: colWidths[2] }, // Posición
        3: { halign: 'center', cellWidth: colWidths[3] }, // Total Horas
        4: { halign: 'center', cellWidth: colWidths[4] } // Turnos
      },
      margin: { left: 15, right: 15 }
    });
    
    // Footer elegante
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(...primaryColor);
      doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      const date = new Date().toLocaleDateString('es-ES');
      doc.text(`Generado el ${date}`, 15, doc.internal.pageSize.getHeight() - 7);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 35, doc.internal.pageSize.getHeight() - 7);
    }
    
    doc.save(`reporte_departamento_${reportData.department?.name}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const worksheetData = [
      ['Reporte de Horas por Departamento'],
      [],
      ['Departamento:', reportData.department?.name || 'N/A'],
      ['Período:', `${reportData.startDate} - ${reportData.endDate}`],
      ['Total de Horas:', reportData.totalHours],
      ['Total de Empleados:', reportData.totalEmployees],
      ['Promedio Horas/Empleado:', reportData.averageHoursPerEmployee],
      [],
      ['Empleado', 'Departamento', 'Posición', 'Total Horas', 'Turnos'],
      ...reportData.employeeHours.map(emp => [
        emp.employee,
        emp.department || 'Sin departamento',
        emp.position,
        emp.totalHours,
        emp.shifts
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `reporte_departamento_${reportData.department?.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const headers = ['Empleado', 'Departamento', 'Posición', 'Total Horas', 'Turnos'];
    const rows = reportData.employeeHours.map(emp => [
      emp.employee,
      emp.department || 'Sin departamento',
      emp.position,
      emp.totalHours,
      emp.shifts
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_departamento_${reportData.department?.name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="reports-time-department-container">
      {/* Filtros */}
      <div className="reports-time-filters-card">
        <div className="reports-time-filters-header">
          <FaSearch className="reports-time-filters-icon" />
          <h3>Generar Reporte</h3>
        </div>

        {employeeError && (
          <div className="reports-time-error-alert">
            <span>{employeeError}</span>
          </div>
        )}
        
        <div className="reports-time-filters-grid">
          <div className="reports-time-filter-group">
            <label className="reports-time-filter-label">
              <FaBuilding className="reports-time-label-icon" />
              Área/Departamento
            </label>
                <select
                  name="department"
                  value={filters.department}
                  onChange={handleFilterChange}
                  className="reports-time-filter-input"
                >
                  <option value="">Seleccionar área</option>
                  {departmentsOptions.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
          </div>

          <div className="reports-time-filter-group">
            <label className="reports-time-filter-label">
              <FaCalendarAlt className="reports-time-label-icon" />
              Fecha Inicio
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="reports-time-filter-input"
            />
          </div>

          <div className="reports-time-filter-group">
            <label className="reports-time-filter-label">
              <FaCalendarAlt className="reports-time-label-icon" />
              Fecha Fin
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="reports-time-filter-input"
            />
          </div>
        </div>

        <button 
          className="reports-time-generate-btn"
          onClick={generateReport}
          disabled={isLoading || isLoadingEmployees}
        >
          <FaSearch />
          {isLoading ? 'Generando...' : 'Generar Reporte'}
        </button>
      </div>

      {/* Resultados */}
      {hasSearched && (
        <>
          {reportData ? (
            <>
              {/* Resumen con métricas */}
              <div className="reports-time-summary-card">
                <div className="reports-time-summary-item">
                  <FaBuilding className="reports-time-summary-icon" />
                  <div>
                    <p className="reports-time-summary-label">Departamento</p>
                    <p className="reports-time-summary-value">{reportData.department?.name}</p>
                  </div>
                </div>
                <div className="reports-time-summary-item">
                  <FaCalendarAlt className="reports-time-summary-icon" />
                  <div>
                    <p className="reports-time-summary-label">Período</p>
                    <p className="reports-time-summary-value">
                      {reportData.startDate} - {reportData.endDate}
                    </p>
                  </div>
                </div>
                <div className="reports-time-summary-item highlight">
                  <FaClock className="reports-time-summary-icon" />
                  <div>
                    <p className="reports-time-summary-label">Total de Horas</p>
                    <p className="reports-time-summary-value">{reportData.totalHours} hrs</p>
                  </div>
                </div>
                <div className="reports-time-summary-item accent">
                  <FaUsers className="reports-time-summary-icon" />
                  <div>
                    <p className="reports-time-summary-label">Empleados</p>
                    <p className="reports-time-summary-value">{reportData.totalEmployees}</p>
                  </div>
                </div>
              </div>

              {/* Estadística adicional */}
              <div className="reports-time-stats-card">
                <div className="reports-time-stat-item">
                  <p className="reports-time-stat-label">Promedio de Horas por Empleado</p>
                  <p className="reports-time-stat-value">{reportData.averageHoursPerEmployee} hrs</p>
                </div>
              </div>

              {/* Botones de exportación */}
              <div className="reports-time-export-section">
                <h4 className="reports-time-export-title">
                  <FaDownload />
                  Exportar Reporte
                </h4>
                  <div className="reports-time-export-buttons">
                    <button onClick={exportToPDF} className="reports-time-export-btn pdf">
                      <FaFilePdf />
                      PDF
                    </button>
                    <button onClick={exportToExcel} className="reports-time-export-btn excel">
                      <FaFileExcel />
                      Excel
                    </button>
                    <button onClick={exportToCSV} className="reports-time-export-btn csv">
                      CSV
                    </button>
                  </div>
              </div>

              {/* Tabla de detalles */}
              <div className="reports-time-table-card">
                <h4 className="reports-time-table-title">Detalle por Empleado</h4>
                <div className="reports-time-table-wrapper">
                  <table className="reports-time-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <colgroup>
                      <col style={{ width: '30%' }} />
                      <col style={{ width: '25%' }} />
                      <col style={{ width: '25%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '10%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                            <th>Empleado</th>
                            <th>Departamento</th>
                            <th>Posición</th>
                            <th>Total Horas</th>
                            <th>Turnos</th>
                      </tr>
                    </thead>
                    <tbody>
                          {reportData.employeeHours.map((emp, index) => (
                            <tr key={index}>
                              <td style={{ maxWidth: '28%' }}>{emp.employee}</td>
                              <td style={{ maxWidth: '24%' }}>{emp.department || 'Sin departamento'}</td>
                              <td style={{ maxWidth: '24%' }}>{emp.position}</td>
                              <td className="reports-time-hours-cell" style={{ maxWidth: '12%' }}>{emp.totalHours} hrs</td>
                              <td className="reports-time-shifts-cell" style={{ maxWidth: '12%' }}>{emp.shifts}</td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="reports-time-empty-state">
              <MdInbox className="reports-time-empty-icon" />
              <h3 className="reports-time-empty-title">No existen datos para el rango seleccionado</h3>
              <p className="reports-time-empty-description">
                Intenta ajustar los filtros o seleccionar otro período de tiempo.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DepartmentHoursReport;