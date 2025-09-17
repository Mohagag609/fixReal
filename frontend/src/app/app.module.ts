import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutComponent } from './components/layout/layout.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
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
import { LoadingSpinnerComponent } from './components/shared/loading-spinner/loading-spinner.component';
import { NotificationComponent } from './components/shared/notification/notification.component';

import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';
import { AuthGuard } from './guards/auth.guard';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    SidebarComponent,
    HeaderComponent,
    DashboardComponent,
    LoginComponent,
    CustomersComponent,
    UnitsComponent,
    ContractsComponent,
    TransactionsComponent,
    ReportsComponent,
    InstallmentsComponent,
    SafesComponent,
    PartnersComponent,
    BrokersComponent,
    SettingsComponent,
    NotificationsComponent,
    ExportImportComponent,
    AdvancedSearchComponent,
    LoadingSpinnerComponent,
    NotificationComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [
    AuthService,
    ApiService,
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }