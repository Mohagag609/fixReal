import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ApiResponse } from '../../models';

@Component({
  selector: 'app-reports',
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">التقارير والإحصائيات</h1>
          <p class="mt-2 text-gray-600">تقارير شاملة وتحليلات مالية</p>
        </div>
        <div class="flex items-center space-x-3 space-x-reverse">
          <button 
            (click)="exportReport('pdf')"
            class="btn btn-outline">
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            تصدير PDF
          </button>
          <button 
            (click)="exportReport('excel')"
            class="btn btn-outline">
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            تصدير Excel
          </button>
        </div>
      </div>

      <!-- Date Range Filter -->
      <div class="card">
        <div class="flex flex-wrap items-center gap-4">
          <div>
            <label class="form-label">من تاريخ</label>
            <input 
              type="date" 
              [(ngModel)]="startDate"
              (change)="onDateChange()"
              class="form-input">
          </div>
          <div>
            <label class="form-label">إلى تاريخ</label>
            <input 
              type="date" 
              [(ngModel)]="endDate"
              (change)="onDateChange()"
              class="form-input">
          </div>
          <div>
            <label class="form-label">نوع التقرير</label>
            <select 
              [(ngModel)]="selectedReportType"
              (change)="onReportTypeChange()"
              class="form-input">
              <option value="dashboard">لوحة التحكم</option>
              <option value="financial">التقرير المالي</option>
              <option value="sales">تقرير المبيعات</option>
              <option value="customer">تقرير العملاء</option>
              <option value="unit">تقرير الوحدات</option>
              <option value="installment">تقرير الأقساط</option>
              <option value="safe">تقرير الخزائن</option>
            </select>
          </div>
          <button 
            (click)="loadReport()"
            class="btn btn-primary">
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            تحديث التقرير
          </button>
        </div>
      </div>

      <!-- Dashboard Stats -->
      <div *ngIf="selectedReportType === 'dashboard'" class="space-y-6">
        <!-- Key Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="card scale-in">
            <div class="flex items-center">
              <div class="p-3 bg-blue-100 rounded-lg">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
              </div>
              <div class="mr-4">
                <p class="text-sm font-medium text-gray-600">إجمالي العملاء</p>
                <p class="text-2xl font-bold text-blue-600">{{ dashboardStats?.totalCustomers || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="card scale-in" style="animation-delay: 0.1s">
            <div class="flex items-center">
              <div class="p-3 bg-green-100 rounded-lg">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <div class="mr-4">
                <p class="text-sm font-medium text-gray-600">إجمالي الوحدات</p>
                <p class="text-2xl font-bold text-green-600">{{ dashboardStats?.totalUnits || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="card scale-in" style="animation-delay: 0.2s">
            <div class="flex items-center">
              <div class="p-3 bg-purple-100 rounded-lg">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div class="mr-4">
                <p class="text-sm font-medium text-gray-600">إجمالي العقود</p>
                <p class="text-2xl font-bold text-purple-600">{{ dashboardStats?.totalContracts || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="card scale-in" style="animation-delay: 0.3s">
            <div class="flex items-center">
              <div class="p-3 bg-yellow-100 rounded-lg">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div class="mr-4">
                <p class="text-sm font-medium text-gray-600">صافي الربح</p>
                <p class="text-2xl font-bold text-yellow-600">{{ dashboardStats?.netProfit | number:'1.0-0' }} ج.م</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Unit Status Chart -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">حالة الوحدات</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">متاحة</span>
                <div class="flex items-center">
                  <div class="w-32 bg-gray-200 rounded-full h-2 ml-3">
                    <div class="bg-green-500 h-2 rounded-full" [style.width.%]="getUnitPercentage('available')"></div>
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{ dashboardStats?.availableUnits || 0 }}</span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">محجوزة</span>
                <div class="flex items-center">
                  <div class="w-32 bg-gray-200 rounded-full h-2 ml-3">
                    <div class="bg-yellow-500 h-2 rounded-full" [style.width.%]="getUnitPercentage('reserved')"></div>
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{ dashboardStats?.reservedUnits || 0 }}</span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">مباعة</span>
                <div class="flex items-center">
                  <div class="w-32 bg-gray-200 rounded-full h-2 ml-3">
                    <div class="bg-blue-500 h-2 rounded-full" [style.width.%]="getUnitPercentage('sold')"></div>
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{ dashboardStats?.soldUnits || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">الأقساط</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">معلقة</span>
                <span class="text-sm font-medium text-gray-900">{{ dashboardStats?.pendingInstallments || 0 }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">متأخرة</span>
                <span class="text-sm font-medium text-red-600">{{ dashboardStats?.overdueInstallments || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Financial Report -->
      <div *ngIf="selectedReportType === 'financial'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">الإيرادات</h3>
            <p class="text-3xl font-bold text-green-600">{{ financialStats?.totalRevenue | number:'1.0-0' }} ج.م</p>
          </div>
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">المصروفات</h3>
            <p class="text-3xl font-bold text-red-600">{{ financialStats?.totalExpenses | number:'1.0-0' }} ج.م</p>
          </div>
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">صافي الربح</h3>
            <p class="text-3xl font-bold text-blue-600">{{ financialStats?.netProfit | number:'1.0-0' }} ج.م</p>
          </div>
        </div>
      </div>

      <!-- Sales Report -->
      <div *ngIf="selectedReportType === 'sales'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">إجمالي المبيعات</h3>
            <p class="text-3xl font-bold text-green-600">{{ salesStats?.totalSales | number:'1.0-0' }} ج.م</p>
          </div>
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">عدد العقود</h3>
            <p class="text-3xl font-bold text-blue-600">{{ salesStats?.totalContracts || 0 }}</p>
          </div>
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">متوسط قيمة العقد</h3>
            <p class="text-3xl font-bold text-purple-600">{{ salesStats?.averageContractValue | number:'1.0-0' }} ج.م</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-12">
        <div class="loading-spinner mx-auto mb-4"></div>
        <p class="text-gray-600">جاري تحميل التقرير...</p>
      </div>
    </div>
  `,
  styles: []
})
export class ReportsComponent implements OnInit {
  // Report data
  dashboardStats: any = null;
  financialStats: any = null;
  salesStats: any = null;
  customerStats: any = null;
  unitStats: any = null;
  installmentStats: any = null;
  safeStats: any = null;

  // Filters
  startDate = '';
  endDate = '';
  selectedReportType = 'dashboard';

  // State
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService
  ) {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading = true;
    
    const params = {
      ...(this.startDate && { startDate: this.startDate }),
      ...(this.endDate && { endDate: this.endDate })
    };

    switch (this.selectedReportType) {
      case 'dashboard':
        this.loadDashboardStats(params);
        break;
      case 'financial':
        this.loadFinancialStats(params);
        break;
      case 'sales':
        this.loadSalesStats(params);
        break;
      case 'customer':
        this.loadCustomerStats(params);
        break;
      case 'unit':
        this.loadUnitStats(params);
        break;
      case 'installment':
        this.loadInstallmentStats(params);
        break;
      case 'safe':
        this.loadSafeStats(params);
        break;
    }
  }

  loadDashboardStats(params: any): void {
    this.apiService.get<ApiResponse>('/reports/dashboard', params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dashboardStats = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.isLoading = false;
      }
    });
  }

  loadFinancialStats(params: any): void {
    this.apiService.get<ApiResponse>('/reports/financial', params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.financialStats = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading financial stats:', error);
        this.isLoading = false;
      }
    });
  }

  loadSalesStats(params: any): void {
    this.apiService.get<ApiResponse>('/reports/sales', params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.salesStats = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sales stats:', error);
        this.isLoading = false;
      }
    });
  }

  loadCustomerStats(params: any): void {
    this.apiService.get<ApiResponse>('/reports/customer', params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customerStats = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customer stats:', error);
        this.isLoading = false;
      }
    });
  }

  loadUnitStats(params: any): void {
    this.apiService.get<ApiResponse>('/reports/unit', params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.unitStats = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading unit stats:', error);
        this.isLoading = false;
      }
    });
  }

  loadInstallmentStats(params: any): void {
    this.apiService.get<ApiResponse>('/reports/installment', params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.installmentStats = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading installment stats:', error);
        this.isLoading = false;
      }
    });
  }

  loadSafeStats(params: any): void {
    this.apiService.get<ApiResponse>('/reports/safe', params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.safeStats = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading safe stats:', error);
        this.isLoading = false;
      }
    });
  }

  onDateChange(): void {
    this.loadReport();
  }

  onReportTypeChange(): void {
    this.loadReport();
  }

  getUnitPercentage(type: string): number {
    if (!this.dashboardStats) return 0;
    
    const total = (this.dashboardStats.availableUnits || 0) + 
                  (this.dashboardStats.reservedUnits || 0) + 
                  (this.dashboardStats.soldUnits || 0);
    
    if (total === 0) return 0;
    
    switch (type) {
      case 'available':
        return ((this.dashboardStats.availableUnits || 0) / total) * 100;
      case 'reserved':
        return ((this.dashboardStats.reservedUnits || 0) / total) * 100;
      case 'sold':
        return ((this.dashboardStats.soldUnits || 0) / total) * 100;
      default:
        return 0;
    }
  }

  exportReport(format: 'pdf' | 'excel'): void {
    const params = {
      reportType: this.selectedReportType,
      ...(this.startDate && { startDate: this.startDate }),
      ...(this.endDate && { endDate: this.endDate })
    };

    const endpoint = format === 'pdf' ? '/reports/export/pdf' : '/reports/export/excel';
    const fileExtension = format === 'pdf' ? 'pdf' : 'xlsx';

    this.apiService.downloadFile(endpoint, params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.selectedReportType}-report.${fileExtension}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error(`Error exporting ${format} report:`, error);
      }
    });
  }
}