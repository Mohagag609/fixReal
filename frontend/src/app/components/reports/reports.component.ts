import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-reports',
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">التقارير</h1>
        <button class="btn-primary" (click)="generateReport()">
          <i class="fas fa-file-export ml-2"></i>
          تصدير التقرير
        </button>
      </div>

      <!-- Report Types -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="card cursor-pointer hover:shadow-md transition-shadow duration-200" (click)="selectReport('financial')">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i class="fas fa-chart-line text-white text-xl"></i>
            </div>
            <div class="mr-4">
              <h3 class="text-lg font-medium text-gray-900">التقرير المالي</h3>
              <p class="text-sm text-gray-500">ملخص الأرباح والخسائر</p>
            </div>
          </div>
        </div>

        <div class="card cursor-pointer hover:shadow-md transition-shadow duration-200" (click)="selectReport('customers')">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <i class="fas fa-users text-white text-xl"></i>
            </div>
            <div class="mr-4">
              <h3 class="text-lg font-medium text-gray-900">تقرير العملاء</h3>
              <p class="text-sm text-gray-500">إحصائيات العملاء والمعاملات</p>
            </div>
          </div>
        </div>

        <div class="card cursor-pointer hover:shadow-md transition-shadow duration-200" (click)="selectReport('transactions')">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <i class="fas fa-exchange-alt text-white text-xl"></i>
            </div>
            <div class="mr-4">
              <h3 class="text-lg font-medium text-gray-900">تقرير المعاملات</h3>
              <p class="text-sm text-gray-500">تفاصيل المعاملات اليومية</p>
            </div>
          </div>
        </div>

        <div class="card cursor-pointer hover:shadow-md transition-shadow duration-200" (click)="selectReport('invoices')">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <i class="fas fa-file-invoice text-white text-xl"></i>
            </div>
            <div class="mr-4">
              <h3 class="text-lg font-medium text-gray-900">تقرير الفواتير</h3>
              <p class="text-sm text-gray-500">حالة الفواتير والمدفوعات</p>
            </div>
          </div>
        </div>

        <div class="card cursor-pointer hover:shadow-md transition-shadow duration-200" (click)="selectReport('units')">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <i class="fas fa-building text-white text-xl"></i>
            </div>
            <div class="mr-4">
              <h3 class="text-lg font-medium text-gray-900">تقرير الوحدات</h3>
              <p class="text-sm text-gray-500">إحصائيات الوحدات والعقود</p>
            </div>
          </div>
        </div>

        <div class="card cursor-pointer hover:shadow-md transition-shadow duration-200" (click)="selectReport('custom')">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
              <i class="fas fa-cog text-white text-xl"></i>
            </div>
            <div class="mr-4">
              <h3 class="text-lg font-medium text-gray-900">تقرير مخصص</h3>
              <p class="text-sm text-gray-500">إنشاء تقرير حسب احتياجاتك</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Report Filters -->
      <div class="card" *ngIf="selectedReport">
        <h3 class="text-lg font-medium text-gray-900 mb-4">إعدادات التقرير</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
            <input
              type="date"
              [(ngModel)]="reportFilters.fromDate"
              class="input-field"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
            <input
              type="date"
              [(ngModel)]="reportFilters.toDate"
              class="input-field"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">تنسيق التصدير</label>
            <select [(ngModel)]="reportFilters.format" class="input-field">
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>
        <div class="mt-4 flex space-x-2">
          <button class="btn-primary" (click)="generateSelectedReport()">
            <i class="fas fa-play ml-2"></i>
            توليد التقرير
          </button>
          <button class="btn-outline" (click)="clearFilters()">
            <i class="fas fa-refresh ml-2"></i>
            مسح الفلاتر
          </button>
        </div>
      </div>

      <!-- Report Results -->
      <div class="card" *ngIf="reportData">
        <h3 class="text-lg font-medium text-gray-900 mb-4">نتائج التقرير</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header" *ngFor="let header of reportHeaders">{{ header }}</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let row of reportData">
                <td class="table-cell" *ngFor="let cell of row">{{ cell }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ReportsComponent implements OnInit {
  selectedReport: string | null = null;
  reportFilters = {
    fromDate: '',
    toDate: '',
    format: 'pdf'
  };
  reportData: any[] = [];
  reportHeaders: string[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.apiService.getReports().subscribe({
      next: (data) => {
        // يمكن معالجة بيانات التقارير هنا
        console.log('Reports loaded:', data);
      },
      error: (error) => {
        console.error('Error loading reports:', error);
      }
    });
  }

  selectReport(reportType: string): void {
    this.selectedReport = reportType;
    this.clearFilters();
  }

  generateReport(): void {
    // يمكن إضافة منطق توليد التقرير العام هنا
    console.log('Generate general report');
  }

  generateSelectedReport(): void {
    if (!this.selectedReport) return;

    const reportData = {
      type: this.selectedReport,
      filters: this.reportFilters
    };

    this.apiService.generateReport(reportData).subscribe({
      next: (data) => {
        this.reportData = data.data || [];
        this.reportHeaders = data.headers || [];
      },
      error: (error) => {
        console.error('Error generating report:', error);
      }
    });
  }

  clearFilters(): void {
    this.reportFilters = {
      fromDate: '',
      toDate: '',
      format: 'pdf'
    };
    this.reportData = [];
    this.reportHeaders = [];
  }
}