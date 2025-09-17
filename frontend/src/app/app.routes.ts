import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'customers',
    loadComponent: () => import('./pages/customers/customers.component').then(m => m.CustomersComponent)
  },
  {
    path: 'units',
    loadComponent: () => import('./pages/units/units.component').then(m => m.UnitsComponent)
  },
  {
    path: 'contracts',
    loadComponent: () => import('./pages/contracts/contracts.component').then(m => m.ContractsComponent)
  },
  {
    path: 'installments',
    loadComponent: () => import('./pages/installments/installments.component').then(m => m.InstallmentsComponent)
  },
  {
    path: 'vouchers',
    loadComponent: () => import('./pages/vouchers/vouchers.component').then(m => m.VouchersComponent)
  },
  {
    path: 'partners',
    loadComponent: () => import('./pages/partners/partners.component').then(m => m.PartnersComponent)
  },
  {
    path: 'treasury',
    loadComponent: () => import('./pages/treasury/treasury.component').then(m => m.TreasuryComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent)
  },
  {
    path: 'brokers',
    loadComponent: () => import('./pages/brokers/brokers.component').then(m => m.BrokersComponent)
  },
  {
    path: 'partner-debts',
    loadComponent: () => import('./pages/partner-debts/partner-debts.component').then(m => m.PartnerDebtsComponent)
  },
  {
    path: 'audit',
    loadComponent: () => import('./pages/audit/audit.component').then(m => m.AuditComponent)
  },
    {
      path: 'settings',
      loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
    },
    {
      path: 'backup-system',
      loadComponent: () => import('./pages/backup-system/backup-system.component').then(m => m.BackupSystemComponent)
    },
    {
      path: 'optimize',
      loadComponent: () => import('./pages/optimize/optimize.component').then(m => m.OptimizeComponent)
    },
    {
      path: 'system',
      loadComponent: () => import('./pages/system/system.component').then(m => m.SystemComponent)
    },
    {
      path: 'test-connection',
      loadComponent: () => import('./pages/test-connection/test-connection.component').then(m => m.TestConnectionComponent)
    },
    {
      path: 'debug-treasury',
      loadComponent: () => import('./pages/debug-treasury/debug-treasury.component').then(m => m.DebugTreasuryComponent)
    },
    {
      path: 'login',
      loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
    },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./pages/admin/users/users.component').then(m => m.AdminUsersComponent)
  },
  {
    path: 'admin/performance',
    loadComponent: () => import('./pages/admin/performance/performance.component').then(m => m.AdminPerformanceComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];