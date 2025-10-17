import { userAPI } from '../api/Axios'; 

export const userService = {
  // Obtener usuarios desde la API
  getUsers: async () => {
    try {
      const data = await userAPI.getUsers();
      // Manejar diferentes formatos de respuesta
      let usersArray = data;
      
      if (data && data.users) {
        usersArray = data.users;
      } else if (data && Array.isArray(data)) {
        usersArray = data;
      } else {
        usersArray = [];
      }
      
      return usersArray.map(user => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.telefono || '',
        department: userService.mapRoleToDepartment(user.role),
        position: userService.mapRoleToPosition(user.role),
        employeeId: `EMP${String(user.id).padStart(3, '0')}`,
        hireDate: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: userService.mapStatus(user.status),
        role: user.role,
        avatar: `/img/avatars/default.jpg`
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Crear usuario
  createUser: async (userData) => {
    try {
      const apiData = {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        telefono: userData.phone,
        password: userData.password,
        password_confirm: userData.passwordConfirm,
        role: userService.mapDepartmentToRole(userData.department),
        status: userService.mapStatusToAPI(userData.status)
      };

      const response = await userAPI.createUser(apiData);
      return response;
    } catch (error) {
      console.error('Error creating user:', error);
      // Mejorar el manejo de errores
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  },

  // Actualizar usuario
  updateUser: async (userId, userData) => {
    try {
      const apiData = {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        telefono: userData.phone,
        role: userService.mapDepartmentToRole(userData.department),
        status: userService.mapStatusToAPI(userData.status)
      };

      const response = await userAPI.updateUser(userId, apiData);
      return response;
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  },

  // Eliminar usuario
  deleteUser: async (userId) => {
    try {
      const response = await userAPI.deleteUser(userId);
      return response;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Cambiar estado (bloquear/desbloquear)
  toggleUserStatus: async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'INACTIVE' : 'ACTIVE';
      const response = await userAPI.updateUserStatus(userId, newStatus);
      return response;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },

  // Mapeos entre frontend y backend
  mapRoleToDepartment: (role) => {
    const roleMap = {
      'ADMIN': 'Administración',
      'GERENTE': 'Administración',
      'EMPLEADO': 'TI',
      'SUPERVISOR': 'Recursos Humanos'
    };
    return roleMap[role] || 'TI';
  },

  mapRoleToPosition: (role) => {
    const positionMap = {
      'ADMIN': 'Administrador',
      'GERENTE': 'Gerente',
      'EMPLEADO': 'Desarrollador',
      'SUPERVISOR': 'Supervisor'
    };
    return positionMap[role] || 'Empleado';
  },

  mapDepartmentToRole: (department) => {
    const departmentMap = {
      'Administración': 'GERENTE',
      'TI': 'EMPLEADO',
      'Recursos Humanos': 'SUPERVISOR',
      'Finanzas': 'EMPLEADO',
      'Marketing': 'EMPLEADO',
      'Ventas': 'EMPLEADO',
      'Diseño': 'EMPLEADO'
    };
    return departmentMap[department] || 'EMPLEADO';
  },

  mapStatus: (apiStatus) => {
    const statusMap = {
      'ACTIVE': 'active',
      'INACTIVE': 'inactive',
      'BLOCKED': 'blocked'
    };
    return statusMap[apiStatus] || 'active';
  },

  mapStatusToAPI: (frontendStatus) => {
    const statusMap = {
      'active': 'ACTIVE',
      'inactive': 'INACTIVE',
      'blocked': 'INACTIVE'
    };
    return statusMap[frontendStatus] || 'ACTIVE';
  },

  // Datos estáticos para selects
  getDepartments: () => [
    'TI', 'Diseño', 'Administración', 'Recursos Humanos', 'Finanzas', 'Marketing', 'Ventas'
  ],

  getPositions: () => [
    'Desarrollador', 'Diseñador', 'Gerente', 'Analista', 'Coordinador', 
    'Especialista', 'Asistente', 'Director'
  ],

  getRoles: () => [
    'ADMIN', 'GERENTE', 'SUPERVISOR', 'EMPLEADO'
  ]
};