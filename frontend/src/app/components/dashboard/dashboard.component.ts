import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { DashboardStats, FinancialSummary, SafeBalance, InstallmentStatusSummary } from '../../models';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <p class="mt-2 text-gray-600">نظرة عامة على النظام والإحصائيات</p>
        </div>
        <div class="text-sm text-gray-500">
          آخر تحديث: {{ lastUpdate | date:'short' }}
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Customers -->
        <div class="card scale-in">
          <div class="flex items-center">
            <div class="p-3 bg-blue-100 rounded-lg">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-600">إجمالي العملاء</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats?.totalCustomers || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Total Units -->
        <div class="card scale-in" style="animation-delay: 0.1s">
          <div class="flex items-center">
            <div class="p-3 bg-green-100 rounded-lg">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-600">إجمالي الوحدات</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats?.totalUnits || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Total Contracts -->
        <div class="card scale-in" style="animation-delay: 0.2s">
          <div class="flex items-center">
            <div class="p-3 bg-purple-100 rounded-lg">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-600">إجمالي العقود</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats?.totalContracts || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Net Profit -->
        <div class="card scale-in" style="animation-delay: 0.3s">
          <div class="flex items-center">
            <div class="p-3 bg-yellow-100 rounded-lg">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-600">صافي الربح</p>
              <p class="text-2xl font-bold text-gray-900">{{ (stats?.netProfit || 0) | number:'1.0-0' }} ج.م</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Financial Summary -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Revenue vs Expenses -->
        <div class="card fade-in">
          <div class="card-header">
            <h3 class="card-title">الإيرادات والمصروفات</h3>
            <p class="card-subtitle">مقارنة الإيرادات والمصروفات</p>
          </div>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-600">إجمالي الإيرادات</span>
              <span class="text-lg font-bold text-green-600">{{ (stats?.totalRevenue || 0) | number:'1.0-0' }} ج.م</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-600">إجمالي المصروفات</span>
              <span class="text-lg font-bold text-red-600">{{ (stats?.totalExpenses || 0) | number:'1.0-0' }} ج.م</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-600">صافي الربح</span>
              <span class="text-lg font-bold text-primary-950">{{ (stats?.netProfit || 0) | number:'1.0-0' }} ج.م</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full transition-all duration-1000"
                [style.width.%]="getProfitMargin()">
              </div>
            </div>
          </div>
        </div>

        <!-- Installments Status -->
        <div class="card fade-in">
          <div class="card-header">
            <h3 class="card-title">حالة الأقساط</h3>
            <p class="card-subtitle">نظرة عامة على الأقساط</p>
          </div>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-4 bg-green-50 rounded-lg">
                <p class="text-2xl font-bold text-green-600">{{ installmentStatus?.paid || 0 }}</p>
                <p class="text-sm text-green-600">مدفوعة</p>
              </div>
              <div class="text-center p-4 bg-yellow-50 rounded-lg">
                <p class="text-2xl font-bold text-yellow-600">{{ installmentStatus?.pending || 0 }}</p>
                <p class="text-sm text-yellow-600">معلقة</p>
              </div>
            </div>
            <div class="text-center p-4 bg-red-50 rounded-lg">
              <p class="text-2xl font-bold text-red-600">{{ installmentStatus?.overdue || 0 }}</p>
              <p class="text-sm text-red-600">متأخرة</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Safe Balances -->
      <div class="card fade-in">
        <div class="card-header">
          <h3 class="card-title">أرصدة الخزائن</h3>
          <p class="card-subtitle">حالة الخزائن والأرصدة</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            *ngFor="let safe of safeBalances; let i = index"
            class="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
            [style.animation-delay]="(i * 0.1) + 's'"
            [class.scale-in]="true">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-gray-900">{{ safe.safeName }}</h4>
                <p class="text-sm text-gray-600">آخر معاملة: {{ safe.lastTransactionDate | date:'short' }}</p>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold text-primary-950">{{ safe.balance | number:'1.0-0' }} ج.م</p>
                <span class="badge badge-success">نشط</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card fade-in">
        <div class="card-header">
          <h3 class="card-title">إجراءات سريعة</h3>
          <p class="card-subtitle">الوصول السريع للوظائف الأساسية</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            (click)="navigateTo('/customers')"
            class="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <svg class="w-8 h-8 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
            <p class="text-sm font-medium text-gray-900">إدارة العملاء</p>
          </button>

          <button 
            (click)="navigateTo('/units')"
            class="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <svg class="w-8 h-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
            <p class="text-sm font-medium text-gray-900">إدارة الوحدات</p>
          </button>

          <button 
            (click)="navigateTo('/contracts')"
            class="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <svg class="w-8 h-8 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p class="text-sm font-medium text-gray-900">إدارة العقود</p>
          </button>

          <button 
            (click)="navigateTo('/transactions')"
            class="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <svg class="w-8 h-8 text-yellow-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <p class="text-sm font-medium text-gray-900">إدارة المعاملات</p>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  financialSummary: FinancialSummary | null = null;
  safeBalances: SafeBalance[] = [];
  installmentStatus: InstallmentStatusSummary | null = null;
  lastUpdate = new Date();

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Load dashboard stats
    this.apiService.get<DashboardStats>('/dashboard/stats').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
      }
    });

    // Load financial summary
    this.apiService.get<FinancialSummary>('/dashboard/financial-summary').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.financialSummary = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading financial summary:', error);
      }
    });

    // Load safe balances
    this.apiService.get<SafeBalance[]>('/dashboard/safe-balances').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.safeBalances = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading safe balances:', error);
      }
    });

    // Load installment status
    this.apiService.get<InstallmentStatusSummary>('/dashboard/installment-status').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.installmentStatus = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading installment status:', error);
      }
    });
  }

  getProfitMargin(): number {
    if (!this.stats || this.stats.totalRevenue === 0) return 0;
    return (this.stats.totalExpenses / this.stats.totalRevenue) * 100;
  }

  navigateTo(route: string): void {
    // This would be handled by the router
    console.log('Navigate to:', route);
  }
}