// Shared in-memory mock storage for offline / sandbox mode
// Seeds standard demo accounts and departments to ensure immediate operational interactivity

const mockDepartments = [
  {
    _id: 'mock_dept_it',
    name: 'Information Technology',
    code: 'IT',
    description: 'Manages core software deployment, hardware provisioning, network infrastructure, and helpdesk operations.',
    manager: 'mock_user_head_it', // Reference to IT Dept Head
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_dept_hr',
    name: 'Human Resources',
    code: 'HR',
    description: 'Oversees onboarding, recruitment, talent acquisition, payroll, training programs, and corporate welfare.',
    manager: 'mock_user_head_hr', // Reference to HR Dept Head
    isActive: true,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_dept_ops',
    name: 'Operations',
    code: 'OPS',
    description: 'Administers office logistics, procurement cycles, warehouse controls, and facility management.',
    manager: null,
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_dept_fin',
    name: 'Finance & Accounts',
    code: 'FIN',
    description: 'Manages enterprise budgets, asset audits, depreciation accounting, and financial reports.',
    manager: null,
    isActive: false, // Seeded inactive department to demonstrate filters
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockUsers = [
  {
    _id: 'mock_user_9999', // Matches the mock admin user ID generated during authController simulation
    fullName: 'System Administrator',
    email: 'admin@assetflow.com',
    role: 'Admin',
    isActive: true,
    department: null,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_user_manager',
    fullName: 'Asset Manager',
    email: 'manager@assetflow.com',
    role: 'Asset Manager',
    isActive: true,
    department: 'mock_dept_ops',
    createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_user_head_it',
    fullName: 'David Sterling',
    email: 'head.it@assetflow.com',
    role: 'Department Head',
    isActive: true,
    department: 'mock_dept_it',
    createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_user_head_hr',
    fullName: 'Sarah Jenkins',
    email: 'head.hr@assetflow.com',
    role: 'Department Head',
    isActive: true,
    department: 'mock_dept_hr',
    createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_user_emp1',
    fullName: 'Nolan Stark',
    email: 'nolan@assetflow.com',
    role: 'Employee',
    isActive: true,
    department: 'mock_dept_it',
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_user_emp2',
    fullName: 'Jane Doe',
    email: 'jane@assetflow.com',
    role: 'Employee',
    isActive: true,
    department: 'mock_dept_hr',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_user_emp3',
    fullName: 'Emily Watson',
    email: 'emily@assetflow.com',
    role: 'Employee',
    isActive: false, // Seeded deactivated employee
    department: 'mock_dept_ops',
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_user_emp4',
    fullName: 'Marcus Vance',
    email: 'marcus@assetflow.com',
    role: 'Employee',
    isActive: true,
    department: 'mock_dept_it',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

module.exports = {
  mockDepartments,
  mockUsers
};
