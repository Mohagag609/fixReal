import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DataTableComponent, Column, Action } from '../../components/data-table/data-table.component';
import { ExportMenuComponent, ExportOption } from '../../components/export-menu/export-menu.component';
import { PrintButtonComponent } from '../../components/print-button/print-button.component';
import { ReportBuilderComponent, ReportConfig, ReportField } from '../../components/report-builder/report-builder.component';
import { ReportPreviewComponent, ReportData } from '../../components/report-preview/report-preview.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DataTableComponent, ExportMenuComponent, PrintButtonComponent, ReportBuilderComponent, ReportPreviewComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">التقارير</h1>
          <p class="text-gray-600">تقارير مالية وإحصائية</p>
        </div>
        <div class="flex gap-2">
          <button 
            class="btn btn-primary"
            (click)="openReportBuilder()">
            <i class="fas fa-plus mr-2"></i>
            إنشاء تقرير جديد
          </button>
          <app-export-menu 
            (export)="onExport($event)"
            (customExport)="onCustomExport()"
            (settings)="onExportSettings()">
          </app-export-menu>
          <app-print-button 
            [printData]="reportData"
            [title]="'تقرير العقارات'">
          </app-print-button>
          <button 
            class="btn btn-secondary"
            (click)="refreshData()">
            <i class="fas fa-refresh mr-2"></i>
            تحديث البيانات
          </button>
        </div>
      </div>

      <!-- Date Range Filter -->
      <div class="card">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
            <input 
              type="date" 
              class="input"
              [(ngModel)]="dateRange.start"
              (change)="onDateRangeChange()">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
            <input 
              type="date" 
              class="input"
              [(ngModel)]="dateRange.end"
              (change)="onDateRangeChange()">
          </div>
          <div class="flex items-end">
            <button 
              class="btn btn-secondary w-full"
              (click)="resetDateRange()">
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">إجمالي المبيعات</p>
              <p class="text-lg font-bold text-green-600">{{ formatCurrency(summary.totalSales) }}</p>
            </div>
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">💰</span>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">إجمالي الأقساط</p>
              <p class="text-lg font-bold text-blue-600">{{ formatCurrency(summary.totalInstallments) }}</p>
            </div>
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">📊</span>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">المدفوع</p>
              <p class="text-lg font-bold text-green-600">{{ formatCurrency(summary.paidAmount) }}</p>
            </div>
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">✅</span>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">المتبقي</p>
              <p class="text-lg font-bold text-orange-600">{{ formatCurrency(summary.remainingAmount) }}</p>
            </div>
            <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">⏳</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Sales Chart -->
        <div class="card">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">مبيعات العقود</h3>
            <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div class="text-center">
                <div class="text-4xl mb-2">📈</div>
                <p class="text-gray-600">رسم بياني للمبيعات</p>
                <p class="text-sm text-gray-500">سيتم إضافة الرسوم البيانية قريباً</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Installments Chart -->
        <div class="card">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">الأقساط المدفوعة</h3>
            <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div class="text-center">
                <div class="text-4xl mb-2">📊</div>
                <p class="text-gray-600">رسم بياني للأقساط</p>
                <p class="text-sm text-gray-500">سيتم إضافة الرسوم البيانية قريباً</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Reports -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Contracts Report -->
        <div class="card">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">تقرير العقود</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-sm text-gray-600">إجمالي العقود</span>
                <span class="font-semibold">{{ contractsReport.totalContracts }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-sm text-gray-600">العقود النشطة</span>
                <span class="font-semibold text-green-600">{{ contractsReport.activeContracts }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-sm text-gray-600">إجمالي القيمة</span>
                <span class="font-semibold">{{ formatCurrency(contractsReport.totalValue) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-gray-600">متوسط قيمة العقد</span>
                <span class="font-semibold">{{ formatCurrency(contractsReport.averageValue) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Installments Report -->
        <div class="card">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">تقرير الأقساط</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-sm text-gray-600">إجمالي الأقساط</span>
                <span class="font-semibold">{{ installmentsReport.totalInstallments }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-sm text-gray-600">المدفوعة</span>
                <span class="font-semibold text-green-600">{{ installmentsReport.paidInstallments }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-sm text-gray-600">المعلقة</span>
                <span class="font-semibold text-orange-600">{{ installmentsReport.pendingInstallments }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-gray-600">المتأخرة</span>
                <span class="font-semibold text-red-600">{{ installmentsReport.overdueInstallments }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Financial Summary -->
      <div class="card">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">الملخص المالي</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 mb-1">{{ formatCurrency(financialSummary.totalReceipts) }}</div>
              <div class="text-sm text-gray-600">إجمالي القبض</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-red-600 mb-1">{{ formatCurrency(financialSummary.totalPayments) }}</div>
              <div class="text-sm text-gray-600">إجمالي الدفع</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold mb-1" [ngClass]="financialSummary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(financialSummary.netBalance) }}
              </div>
              <div class="text-sm text-gray-600">الرصيد الصافي</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Customers -->
      <div class="card">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">أفضل العملاء</h3>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>اسم العميل</th>
                  <th>عدد العقود</th>
                  <th>إجمالي القيمة</th>
                  <th>آخر عقد</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let customer of topCustomers" class="animate-fade-in">
                  <td class="font-medium">{{ customer.name }}</td>
                  <td>{{ customer.contractsCount }}</td>
                  <td>{{ formatCurrency(customer.totalValue) }}</td>
                  <td>{{ formatDate(customer.lastContract) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p class="text-gray-600">جاري تحميل التقارير...</p>
        </div>
      </div>

      <!-- Report Builder Modal -->
      <div *ngIf="showReportBuilder" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-4/5 max-w-6xl shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900">منشئ التقارير</h3>
              <button (click)="closeReportBuilder()" 
                      class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            <app-report-builder 
              [availableFields]="availableFields"
              [initialConfig]="reportConfig"
              (reportGenerated)="onReportGenerated($event)"
              (reportSaved)="onReportSaved($event)">
            </app-report-builder>
          </div>
        </div>
      </div>

      <!-- Report Preview Modal -->
      <div *ngIf="showReportPreview" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-4/5 max-w-6xl shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <app-report-preview 
              [reportData]="previewData"
              (export)="onPreviewExport($event)"
              (print)="onPreviewPrint($event)"
              (close)="closeReportPreview()">
            </app-report-preview>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ReportsComponent implements OnInit {
  loading = false;
  dateRange = {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  };

  summary = {
    totalSales: 0,
    totalInstallments: 0,
    paidAmount: 0,
    remainingAmount: 0
  };

  contractsReport = {
    totalContracts: 0,
    activeContracts: 0,
    totalValue: 0,
    averageValue: 0
  };

  installmentsReport = {
    totalInstallments: 0,
    paidInstallments: 0,
    pendingInstallments: 0,
    overdueInstallments: 0
  };

  financialSummary = {
    totalReceipts: 0,
    totalPayments: 0,
    netBalance: 0
  };

  topCustomers: any[] = [];

  // Advanced Report Features
  showReportBuilder = false;
  showReportPreview = false;
  reportConfig: ReportConfig | null = null;
  previewData: ReportData | null = null;
  reportData: any = null;
  
  // Available fields for report builder
  availableFields: ReportField[] = [
    { key: 'id', label: 'المعرف', type: 'text' },
    { key: 'name', label: 'الاسم', type: 'text' },
    { key: 'amount', label: 'المبلغ', type: 'currency' },
    { key: 'date', label: 'التاريخ', type: 'date' },
    { key: 'status', label: 'الحالة', type: 'status' },
    { key: 'created_at', label: 'تاريخ الإنشاء', type: 'date' }
  ];
  
  // Table columns for data display
  columns: Column[] = [
    { key: 'id', label: 'المعرف', type: 'text', sortable: true },
    { key: 'name', label: 'الاسم', type: 'text', sortable: true },
    { key: 'amount', label: 'المبلغ', type: 'currency', sortable: true },
    { key: 'date', label: 'التاريخ', type: 'date', sortable: true },
    { key: 'status', label: 'الحالة', type: 'status', sortable: true }
  ];
  
  // Table actions
  actions: Action[] = [
    {
      label: 'عرض',
      icon: 'fas fa-eye',
      color: 'info',
      onClick: (item) => this.viewItem(item)
    },
    {
      label: 'تعديل',
      icon: 'fas fa-edit',
      color: 'primary',
      onClick: (item) => this.editItem(item)
    },
    {
      label: 'حذف',
      icon: 'fas fa-trash',
      color: 'danger',
      onClick: (item) => this.deleteItem(item)
    }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.loading = true;
    
    // Load all reports data
    Promise.all([
      this.loadSummary(),
      this.loadContractsReport(),
      this.loadInstallmentsReport(),
      this.loadFinancialSummary(),
      this.loadTopCustomers()
    ]).finally(() => {
      this.loading = false;
    });
  }

  loadSummary() {
    // TODO: Implement summary API
    this.summary = {
      totalSales: 1500000,
      totalInstallments: 800000,
      paidAmount: 600000,
      remainingAmount: 200000
    };
  }

  loadContractsReport() {
    // TODO: Implement contracts report API
    this.contractsReport = {
      totalContracts: 25,
      activeContracts: 20,
      totalValue: 1500000,
      averageValue: 60000
    };
  }

  loadInstallmentsReport() {
    // TODO: Implement installments report API
    this.installmentsReport = {
      totalInstallments: 120,
      paidInstallments: 80,
      pendingInstallments: 35,
      overdueInstallments: 5
    };
  }

  loadFinancialSummary() {
    // TODO: Implement financial summary API
    this.financialSummary = {
      totalReceipts: 800000,
      totalPayments: 200000,
      netBalance: 600000
    };
  }

  loadTopCustomers() {
    // TODO: Implement top customers API
    this.topCustomers = [
      { name: 'أحمد محمد', contractsCount: 3, totalValue: 300000, lastContract: '2024-01-15' },
      { name: 'فاطمة علي', contractsCount: 2, totalValue: 250000, lastContract: '2024-01-10' },
      { name: 'محمد حسن', contractsCount: 2, totalValue: 200000, lastContract: '2024-01-08' },
      { name: 'نور الدين', contractsCount: 1, totalValue: 150000, lastContract: '2024-01-05' },
      { name: 'سارة أحمد', contractsCount: 1, totalValue: 120000, lastContract: '2024-01-03' }
    ];
  }

  onDateRangeChange() {
    this.loadReports();
  }

  resetDateRange() {
    this.dateRange = {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    };
    this.loadReports();
  }

  generateReport() {
    // TODO: Implement report generation
    alert('سيتم إضافة ميزة تصدير التقارير قريباً');
  }

  refreshData() {
    this.loadReports();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA');
  }

  // Advanced Report Methods
  openReportBuilder() {
    this.showReportBuilder = true;
  }

  closeReportBuilder() {
    this.showReportBuilder = false;
  }

  onReportGenerated(config: ReportConfig) {
    this.reportConfig = config;
    this.generateReportFromConfig(config);
    this.closeReportBuilder();
  }

  onReportSaved(config: ReportConfig) {
    // Save report configuration
    console.log('Report saved:', config);
    this.closeReportBuilder();
  }

  generateReportFromConfig(config: ReportConfig) {
    // Generate report data based on configuration
    this.previewData = {
      title: config.title,
      subtitle: config.subtitle,
      dateRange: config.dateRange,
      fields: config.fields,
      data: this.getReportData(config),
      columns: config.fields.map(field => ({
        key: field.key,
        label: field.label,
        type: field.type
      }))
    };
    this.showReportPreview = true;
  }

  getReportData(config: ReportConfig): any[] {
    // Mock data - replace with actual API call
    return [
      { id: '1', name: 'عقد 1', amount: 100000, date: '2024-01-01', status: 'active' },
      { id: '2', name: 'عقد 2', amount: 150000, date: '2024-01-02', status: 'pending' },
      { id: '3', name: 'عقد 3', amount: 200000, date: '2024-01-03', status: 'completed' }
    ];
  }

  closeReportPreview() {
    this.showReportPreview = false;
    this.previewData = null;
  }

  onPreviewExport(data: ReportData) {
    // Implement export functionality
    console.log('Exporting report:', data);
  }

  onPreviewPrint(data: ReportData) {
    // Implement print functionality
    console.log('Printing report:', data);
  }

  onExport(option: ExportOption) {
    // Implement export based on format
    console.log('Exporting as:', option.format);
  }

  onCustomExport() {
    // Implement custom export
    console.log('Custom export');
  }

  onExportSettings() {
    // Implement export settings
    console.log('Export settings');
  }

  viewItem(item: any) {
    console.log('Viewing item:', item);
  }

  editItem(item: any) {
    console.log('Editing item:', item);
  }

  deleteItem(item: any) {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      console.log('Deleting item:', item);
    }
  }
}