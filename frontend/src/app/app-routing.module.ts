import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CustomersComponent } from './components/customers/customers.component';
import { UnitsComponent } from './components/units/units.component';
import { ContractsComponent } from './components/contracts/contracts.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { ReportsComponent } from './components/reports/reports.component';
import { InstallmentsComponent } from './components/installments/installments.component';
import { SafesComponent } from './components/safes/safes.component';
import { PartnersComponent } from './components/partners/partners.component';
import { BrokersComponent } from './components/brokers/brokers.component';
import { SettingsComponent } from './components/settings/settings.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { ExportImportComponent } from './components/export-import/export-import.component';
import { AdvancedSearchComponent } from './components/advanced-search/advanced-search.component';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: { title: 'لوحة التحكم' }
      },
      {
        path: 'customers',
        component: CustomersComponent,
        data: { title: 'العملاء' }
      },
      {
        path: 'units',
        component: UnitsComponent,
        data: { title: 'الوحدات' }
      },
      {
        path: 'contracts',
        component: ContractsComponent,
        data: { title: 'العقود' }
      },
      {
        path: 'transactions',
        component: TransactionsComponent,
        data: { title: 'المعاملات' }
      },
      {
        path: 'reports',
        component: ReportsComponent,
        data: { title: 'التقارير' }
      },
      {
        path: 'installments',
        component: InstallmentsComponent,
        data: { title: 'الأقساط' }
      },
      {
        path: 'safes',
        component: SafesComponent,
        data: { title: 'الخزائن' }
      },
      {
        path: 'partners',
        component: PartnersComponent,
        data: { title: 'الشركاء' }
      },
      {
        path: 'brokers',
        component: BrokersComponent,
        data: { title: 'الوسطاء' }
      },
      {
        path: 'settings',
        component: SettingsComponent,
        data: { title: 'الإعدادات' }
      },
      {
        path: 'notifications',
        component: NotificationsComponent,
        data: { title: 'الإشعارات' }
      },
      {
        path: 'export-import',
        component: ExportImportComponent,
        data: { title: 'تصدير واستيراد' }
      },
      {
        path: 'search',
        component: AdvancedSearchComponent,
        data: { title: 'البحث المتقدم' }
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }