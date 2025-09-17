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
    path: '**',
    redirectTo: ''
  }
];