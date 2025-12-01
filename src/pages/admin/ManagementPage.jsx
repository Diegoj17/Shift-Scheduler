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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('equipo');

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await userService.getUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (err) {
      console.error('Error loading users from API:', err);
      setError('No se pudieron cargar usuarios desde el servidor. Pulsa Reintentar para volver a intentar.');
      setUsers([]);
      setFilteredUsers([]);
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
                            (user.position || '').toLowerCase().includes(searchTerm.toLowerCase());
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
  }, [users, searchTerm, filterStatus, filterDepartment, sortConfig]);

  // Handlers
  const handleSort = (field) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setModalAction('create');
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setModalAction('edit');
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setModalAction('delete');
    setIsConfirmationModalOpen(true);
  };

  const handleToggleStatus = (user) => {
    setSelectedUser(user);
    setModalAction(user.status === 'active' ? 'block' : 'unblock');
    setIsConfirmationModalOpen(true);
  };

  const confirmAction = async () => {
    try {
      if (modalAction === 'delete') {
        await userService.deleteUser(selectedUser.id);
        setUsers(users.filter(u => u.id !== selectedUser.id));
      } else if (modalAction === 'block' || modalAction === 'unblock') {
        const targetStatus = modalAction === 'block' ? 'blocked' : 'active';
        await userService.toggleUserStatus(selectedUser.id, targetStatus);
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
    { id: 'dashboard', label: 'Inicio', icon: 'dashboard' },
    { id: 'calendario', label: 'Calendario', icon: 'calendar' },
    { id: 'disponibilidad', label: 'Disponibilidad', icon: 'availability' },
    { id: 'solicitudes', label: 'Solicitudes', icon: 'requests' },
    { id: 'equipo', label: 'Equipo', icon: 'team' },
    { id: 'informes', label: 'Informes', icon: 'reports' }
  ];

  // Usar filteredUsers directamente (sin paginación)
  const currentUsers = filteredUsers;

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
              <div className="management-error-actions">
                <button className="management-retry-btn" onClick={() => { setError(null); loadUsers(); }}>Reintentar</button>
                <button className="management-dismiss-btn" onClick={() => setError(null)}>Cerrar</button>
              </div>
            </div>
          )}

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