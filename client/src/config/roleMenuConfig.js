/**
 * roleMenuConfig.js
 *
 * Central source of truth for sidebar navigation items per role.
 * Sidebar.jsx reads from this config — do NOT hardcode permissions there.
 *
 * Each menu item shape:
 * {
 *   name:    string   — display label
 *   icon:    Component — react-icons/fi icon
 *   path:    string   — React Router path
 *   badge?:  string   — optional badge text (e.g. "New")
 *   locked?: boolean  — renders as non-navigable locked item
 * }
 */

import {
  FiGrid,
  FiLayers,
  FiUsers,
  FiBox,
  FiTag,
  FiCpu,
  FiRepeat,
  FiBarChart2,
  FiSettings,
  FiTool,
  FiCheckCircle,
  FiPackage,
  FiClipboard,
  FiPlusCircle,
  FiUser,
  FiFileText,
  FiBell,
} from 'react-icons/fi';

/**
 * ROLE_MENU_CONFIG
 * Keys must exactly match the `role` field returned by /api/auth/me
 */
export const ROLE_MENU_CONFIG = {
  Admin: [
    { name: 'Dashboard',     icon: FiGrid,       path: '/dashboard'     },
    { name: 'Departments',   icon: FiLayers,     path: '/departments'   },
    { name: 'Employees',     icon: FiUsers,      path: '/employees'     },
    { name: 'Assets',        icon: FiBox,        path: '/assets'        },
    { name: 'Categories',    icon: FiTag,        path: '/categories'    },
    { name: 'Asset Models',  icon: FiCpu,        path: '/asset-models'  },
    { name: 'Allocations',   icon: FiRepeat,     path: '/allocations'   },
    { name: 'Reports',       icon: FiBarChart2,  path: '/reports'       },
    { name: 'Notifications', icon: FiBell,       path: '/notifications' },
    { name: 'Settings',      icon: FiSettings,   path: '/settings'      },
    { name: 'Profile',       icon: FiUser,       path: '/profile'       },
  ],

  'Asset Manager': [
    { name: 'Dashboard',        icon: FiGrid,       path: '/dashboard'     },
    { name: 'Assets',           icon: FiBox,        path: '/assets'        },
    { name: 'Categories',       icon: FiTag,        path: '/categories'    },
    { name: 'Asset Allocation', icon: FiRepeat,     path: '/allocations'   },
    { name: 'Maintenance',      icon: FiTool,       path: '/maintenance'   },
    { name: 'Notifications',    icon: FiBell,       path: '/notifications' },
    { name: 'Profile',          icon: FiUser,       path: '/profile'       },
  ],

  'Department Head': [
    { name: 'Dashboard',          icon: FiGrid,        path: '/dashboard'           },
    { name: 'Department Assets',  icon: FiPackage,     path: '/department-assets'   },
    { name: 'Employees',          icon: FiUsers,       path: '/employees'           },
    { name: 'Allocation History', icon: FiFileText,    path: '/allocations/history' },
    { name: 'Approvals',          icon: FiCheckCircle, path: '/approvals'           },
    { name: 'Reports',            icon: FiBarChart2,   path: '/reports'             },
    { name: 'Notifications',      icon: FiBell,        path: '/notifications'       },
    { name: 'Profile',            icon: FiUser,        path: '/profile'             },
  ],

  Employee: [
    { name: 'Dashboard',      icon: FiGrid,       path: '/dashboard'           },
    { name: 'My Assets',      icon: FiPackage,    path: '/my-assets'           },
    { name: 'My Allocations', icon: FiClipboard,  path: '/allocations/history' },
    { name: 'Request Asset',  icon: FiPlusCircle, path: '/request-asset'       },
    { name: 'Notifications',  icon: FiBell,       path: '/notifications'       },
    { name: 'Profile',        icon: FiUser,       path: '/profile'             },
  ],
  'Maintenance Team': [
    { name: 'Dashboard',      icon: FiGrid,       path: '/dashboard'   },
    { name: 'Maintenance',    icon: FiTool,       path: '/maintenance' },
    { name: 'Notifications',  icon: FiBell,       path: '/notifications' },
    { name: 'Profile',        icon: FiUser,       path: '/profile'     },
  ],
};

/**
 * Fallback for unknown / undefined roles — returns just Dashboard so app never crashes.
 */
export const getFallbackMenu = () => [
  { name: 'Dashboard', icon: FiGrid, path: '/dashboard' },
];
