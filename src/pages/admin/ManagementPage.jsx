// components/management/ManagementPage.jsx
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/common/Sidebar';
import Header from '../../components/common/Header';
import UserModal from '../../components/management/UserModal';
import ConfirmationModal from '../../components/management/ConfirmationModal';
import StatsCards from '../../components/management/StatsCards';
import UsersTable from '../../components/management/UsersTable';
import TableControls from '../../components/management/TableControls';
import { userService } from '../../services/userService';
import '../../styles/pages/admin/ManagementPage.css';

// Mock de usuarios para modo preview
const mockUsers = [
  { id: 1, name: 'Ana García', email: 'ana.garcia@ejemplo.com', employeeId: 'EMP001', department: 'Operaciones', position: 'Supervisor', status: 'active', hireDate: '2022-01-10', avatar: '' },
  { id: 2, name: 'Carlos Ruiz', email: 'carlos.ruiz@ejemplo.com', employeeId: 'EMP002', department: 'Mantenimiento', position: 'Técnico', status: 'inactive', hireDate: '2021-06-15', avatar: '' },
  { id: 3, name: 'María López', email: 'maria.lopez@ejemplo.com', employeeId: 'EMP003', department: 'Atención', position: 'Operador', status: 'active', hireDate: '2023-03-20', avatar: '' },
  { id: 3, name: 'María López', email: 'maria.lopez@ejemplo.com', employeeId: 'EMP003', department: 'Atención', position: 'Operador', status: 'active', hireDate: '2023-03-20', avatar: '' },
  { id: 3, name: 'María López', email: 'maria.lopez@ejemplo.com', employeeId: 'EMP003', department: 'Atención', position: 'Operador', status: 'active', hireDate: '2023-03-20', avatar: '' },
  { id: 3, name: 'María López', email: 'maria.lopez@ejemplo.com', employeeId: 'EMP003', department: 'Atención', position: 'Operador', status: 'active', hireDate: '2023-03-20', avatar: '' },
  { id: 3, name: 'María López', email: 'maria.lopez@ejemplo.com', employeeId: 'EMP003', department: 'Atención', position: 'Operador', status: 'active', hireDate: '2023-03-20', avatar: '' },
];

const ManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc' });
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalAction, setModalAction] = useState('create');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("equipo");

  // Nota: eliminadas las comprobaciones de permisos para permitir edición y pruebas locales.

  // Datos estáticos para preview cuando no hay permisos o backend no está disponible

  // Cargar usuarios desde la API
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await userService.getUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (err) {
      // Si falla la carga desde el servicio, usar datos mock como fallback
      console.error('Error loading users from API, falling back to mock:', err);
      setError('No se pudieron cargar usuarios desde el servidor. Mostrando datos de ejemplo.');
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filtrar y ordenar usuarios localmente
  useEffect(() => {
    if (users.length === 0) return;

    let result = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.position.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
      const matchesDepartment = filterDepartment === 'all' || user.department === filterDepartment;
      
      return matchesSearch && matchesStatus && matchesDepartment;
    });

    // Ordenar
    result.sort((a, b) => {
      let aValue = a[sortConfig.field];
      let bValue = b[sortConfig.field];
      
      if (sortConfig.field === 'hireDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(result);
    setCurrentPage(1);
  }, [users, searchTerm, filterStatus, filterDepartment, sortConfig]);

  // Handlers
  const handleSort = (field) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleCreateUser = () => {
    // Crear usuario (sin validación de permisos para facilitar edición local)
    setSelectedUser(null);
    setModalAction('create');
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user) => {
    // Editar usuario (sin validación de permisos)
    setSelectedUser(user);
    setModalAction('edit');
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (user) => {
    // Eliminar usuario (sin validación de permisos)
    setSelectedUser(user);
    setModalAction('delete');
    setIsConfirmationModalOpen(true);
  };

  const handleToggleStatus = (user) => {
    // Cambiar estado (sin validación de permisos)
    setSelectedUser(user);
    setModalAction(user.status === 'active' ? 'block' : 'unblock');
    setIsConfirmationModalOpen(true);
  };

  const confirmAction = async () => {
    try {
      if (modalAction === 'delete') {
        await userService.deleteUser(selectedUser.id);
        setUsers(users.filter(user => user.id !== selectedUser.id));
      } else if (modalAction === 'block' || modalAction === 'unblock') {
        await userService.toggleUserStatus(selectedUser.id, selectedUser.status);
        await loadUsers();
      }
      setIsConfirmationModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err.message || 'Error al realizar la acción');
      console.error('Error performing action:', err);
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      if (modalAction === 'create') {
        await userService.createUser(userData);
      } else if (modalAction === 'edit') {
        await userService.updateUser(selectedUser.id, userData);
      }
      
      await loadUsers();
      setIsUserModalOpen(false);
    } catch (err) {
      console.error('Error saving user:', err);
      throw err;
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleItemClick = (itemId) => {
    setActiveItem(itemId);
  };

  const menuItems = [
    { id: "dashboard", label: "Inicio", icon: "dashboard" },
    { id: "calendario", label: "Calendario", icon: "calendar" },
    { id: "solicitudes", label: "Solicitudes", icon: "requests" },
    { id: "presencia", label: "Presencia", icon: "presence" },
    { id: "documentos", label: "Documentos", icon: "documents" },
    { id: "equipo", label: "Equipo", icon: "team" },
    { id: "informes", label: "Informes", icon: "reports" },
  ];


  // Paginación
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // En lugar de bloquear el acceso, mostramos la página en modo preview si no tiene permisos.
  // Esto facilita el diseño y las pruebas visuales con datos estáticos.

  if (loading) {
    return (
      <div className="management-container">
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
        <div className={`management-main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
          <Header onToggleSidebar={toggleSidebar} pageTitle="Gestión de Usuarios" />
          <div className="management-content-area">
            <div className="management-loading-container">
              <div className="management-loading-spinner"></div>
              <p>Cargando usuarios...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar} 
        activeItem={activeItem} 
        onItemClick={handleItemClick} 
        menuItems={menuItems}
      />
      
      <div className={`management-main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Header onToggleSidebar={toggleSidebar} pageTitle="Gestión de Usuarios" />
        
        <div className="management-content-area">
          {/* Mostrar error si existe */}
          {error && (
            <div className="management-error-banner">
              <span>{error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* (Permisos desactivados temporalmente para edición) */}

          {/* Header con estadísticas */}
          <div className="management-header">
            <StatsCards users={users} />
            <button className="management-create-user-btn" onClick={handleCreateUser}>
              <span>Nuevo Usuario</span>
            </button>
          </div>

          {/* Controles y tabla */}
          <div className="management-users-table-container">
            <TableControls
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterStatus={filterStatus}
              onStatusChange={setFilterStatus}
              filterDepartment={filterDepartment}
              onDepartmentChange={setFilterDepartment}
              resultsCount={filteredUsers.length}
            />

            <UsersTable
              users={currentUsers}
              sortConfig={sortConfig}
              onSort={handleSort}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onToggleStatus={handleToggleStatus}
            />

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="management-pagination">
                <button 
                  className="management-pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Anterior
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`management-pagination-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                
                <button 
                  className="management-pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales */}
      {isUserModalOpen && (
        <UserModal
          user={selectedUser}
          action={modalAction}
          onSave={handleSaveUser}
          onClose={() => setIsUserModalOpen(false)}
        />
      )}

      {isConfirmationModalOpen && (
        <ConfirmationModal
          user={selectedUser}
          action={modalAction}
          onConfirm={confirmAction}
          onClose={() => setIsConfirmationModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ManagementPage;