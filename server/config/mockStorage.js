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

const mockCategories = [
  {
    _id: 'mock_cat_workstations',
    name: 'Workstations',
    description: 'Corporate laptop models and desktop PCs.',
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_cat_mobile',
    name: 'Mobile Devices',
    description: 'Corporate smartphones and tablets.',
    createdAt: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_cat_monitors',
    name: 'Monitors',
    description: 'External visual display panels.',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockModels = [
  {
    _id: 'mock_model_mbp16',
    name: 'MacBook Pro 16"',
    category: 'mock_cat_workstations',
    manufacturer: 'Apple',
    description: 'M3 Pro, 32GB RAM, 1TB SSD corporate build.',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_model_t14',
    name: 'ThinkPad T14',
    category: 'mock_cat_workstations',
    manufacturer: 'Lenovo',
    description: 'Ryzen 7, 16GB RAM, 512GB SSD engineering build.',
    createdAt: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_model_iphone15',
    name: 'iPhone 15 Pro',
    category: 'mock_cat_mobile',
    manufacturer: 'Apple',
    description: 'A17 Pro, 256GB storage, test bed device.',
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockAssets = [
  {
    _id: 'mock_asset_001',
    assetTag: 'AST-0001',
    serialNumber: 'SN-APL-MBP9988',
    model: 'mock_model_mbp16',
    status: 'Allocated',
    purchaseDate: '2025-01-10T00:00:00.000Z',
    warrantyDate: '2028-01-10T00:00:00.000Z',
    vendor: 'Apple Business',
    cost: 2499.00,
    image: '',
    qrCode: '',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_asset_002',
    assetTag: 'AST-0002',
    serialNumber: 'SN-LEN-T148877',
    model: 'mock_model_t14',
    status: 'Available',
    purchaseDate: '2025-02-15T00:00:00.000Z',
    warrantyDate: '2027-02-15T00:00:00.000Z',
    vendor: 'CDW Logistics',
    cost: 1299.00,
    image: '',
    qrCode: '',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock_asset_003',
    assetTag: 'AST-0003',
    serialNumber: 'SN-APL-IPH7766',
    model: 'mock_model_iphone15',
    status: 'Maintenance',
    purchaseDate: '2025-03-01T00:00:00.000Z',
    warrantyDate: '2026-03-01T00:00:00.000Z',
    vendor: 'Verizon Wireless',
    cost: 999.00,
    image: '',
    qrCode: '',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

module.exports = {
  mockDepartments,
  mockUsers,
  mockCategories,
  mockModels,
  mockAssets
};
