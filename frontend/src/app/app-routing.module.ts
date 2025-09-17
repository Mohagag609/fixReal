import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

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