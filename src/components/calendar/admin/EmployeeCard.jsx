import { FaUser } from "react-icons/fa";
import '../../../styles/components/calendar/admin/EmployeeCard.css';

const EmployeeCard = ({ employee, onDragStart }) => {
  const handleDragStart = (e) => {
    onDragStart(e, employee);
  };

  return (
    <div
      className="calendar-employee-card"
      draggable
      onDragStart={handleDragStart}
      data-employee={JSON.stringify(employee)}
    >
      <div 
        className="calendar-employee-color" 
        style={{ backgroundColor: employee.color }}
      ></div>
      <div className="calendar-employee-info">
        <h4>{employee.name}</h4>
        <p>{employee.position} • {employee.department}</p>
      </div>
      <div className="calendar-employee-actions">
        <FaUser className="calendar-employee-icon" />
      </div>
    </div>
  );
};

export default EmployeeCard;