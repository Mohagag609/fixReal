import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ReportData {
  title: string;
  subtitle?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  summary?: {
    label: string;
    value: any;
    type?: 'text' | 'number' | 'currency' | 'percentage';
  }[];
  data: any[];
  columns: {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'currency' | 'status';
    width?: string;
  }[];
  totals?: {
    label: string;
    value: any;
    type?: 'text' | 'number' | 'currency' | 'percentage';
  }[];
}

@Component({
  selector: 'app-report-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Report Header -->
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">{{ reportData?.title }}</h2>
            <p *ngIf="reportData?.subtitle" class="text-sm text-gray-600 mt-1">
              {{ reportData.subtitle }}
            </p>
            <p *ngIf="reportData?.dateRange" class="text-sm text-gray-500 mt-1">
              من {{ reportData.dateRange.from | date:'shortDate' }} إلى {{ reportData.dateRange.to | date:'shortDate' }}
            </p>
          </div>
          <div class="flex gap-2 mt-4 md:mt-0">
            <button (click)="exportReport()" 
                    class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors">
              <i class="fas fa-download mr-2"></i>
              تصدير
            </button>
            <button (click)="printReport()" 
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
              <i class="fas fa-print mr-2"></i>
              طباعة
            </button>
            <button (click)="closePreview()" 
                    class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
              <i class="fas fa-times mr-2"></i>
              إغلاق
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div *ngIf="reportData?.summary && reportData.summary.length > 0" 
           class="px-6 py-4 border-b border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div *ngFor="let item of reportData.summary" 
               class="bg-gray-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-gray-900">
              {{ formatValue(item.value, item.type) }}
            </div>
            <div class="text-sm text-gray-600 mt-1">
              {{ item.label }}
            </div>
          </div>
        </div>
      </div>

      <!-- Report Data Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th *ngFor="let column of reportData?.columns" 
                  [style.width]="column.width"
                  class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let row of reportData?.data; trackBy: trackByRow" 
                class="hover:bg-gray-50 transition-colors">
              <td *ngFor="let column of reportData?.columns" 
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span [ngClass]="getCellClasses(column)">
                  {{ formatCellValue(row, column) }}
                </span>
              </td>
            </tr>
            <tr *ngIf="!reportData?.data || reportData.data.length === 0">
              <td [attr.colspan]="reportData?.columns?.length" 
                  class="px-6 py-4 text-center text-sm text-gray-500">
                لا توجد بيانات
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals Section -->
      <div *ngIf="reportData?.totals && reportData.totals.length > 0" 
           class="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <h3 class="text-lg font-medium text-gray-900 mb-4 md:mb-0">المجموع</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div *ngFor="let total of reportData.totals" 
                 class="text-center">
              <div class="text-lg font-bold text-gray-900">
                {{ formatValue(total.value, total.type) }}
              </div>
              <div class="text-sm text-gray-600">
                {{ total.label }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Report Footer -->
      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between text-sm text-gray-500">
          <div>
            <p>تم إنشاء التقرير في: {{ currentDate | date:'full' }}</p>
            <p>إجمالي السجلات: {{ reportData?.data?.length || 0 }}</p>
          </div>
          <div class="mt-2 md:mt-0">
            <p>نظام إدارة العقارات</p>
            <p>جميع الحقوق محفوظة © 2024</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ReportPreviewComponent implements OnInit {
  @Input() reportData: ReportData | null = null;
  @Input() showExport: boolean = true;
  @Input() showPrint: boolean = true;
  @Input() showClose: boolean = true;

  @Output() export = new EventEmitter<ReportData>();
  @Output() print = new EventEmitter<ReportData>();
  @Output() close = new EventEmitter<void>();

  currentDate = new Date();

  ngOnInit() {
    this.currentDate = new Date();
  }

  formatValue(value: any, type?: string): string {
    if (value === null || value === undefined) return 'N/A';

    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('ar-SA', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'number':
        return new Intl.NumberFormat('ar-SA').format(value);
      case 'percentage':
        return `${value}%`;
      case 'date':
        return new Date(value).toLocaleDateString('ar-SA');
      default:
        return value.toString();
    }
  }

  formatCellValue(row: any, column: any): string {
    const value = this.getValue(row, column.key);
    return this.formatValue(value, column.type);
  }

  getValue(item: any, key: string): any {
    return key.split('.').reduce((obj, k) => obj?.[k], item);
  }

  getCellClasses(column: any): string {
    const baseClasses = 'text-gray-900';
    const typeClasses = {
      'text': 'text-gray-900',
      'number': 'text-gray-900 font-mono',
      'date': 'text-gray-500',
      'currency': 'text-gray-900 font-mono',
      'status': 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
    };
    return `${baseClasses} ${typeClasses[column.type || 'text']}`;
  }

  getStatusClasses(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    return statusClasses[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  }

  trackByRow(index: number, row: any): any {
    return row.id || index;
  }

  exportReport() {
    if (this.reportData) {
      this.export.emit(this.reportData);
    }
  }

  printReport() {
    if (this.reportData) {
      this.print.emit(this.reportData);
    }
  }

  closePreview() {
    this.close.emit();
  }
}