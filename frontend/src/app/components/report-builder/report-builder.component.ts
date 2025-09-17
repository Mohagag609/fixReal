import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ReportField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'status' | 'boolean';
  required?: boolean;
  options?: { value: any; label: string }[];
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn';
  value: any;
  value2?: any; // For 'between' operator
}

export interface ReportConfig {
  title: string;
  subtitle?: string;
  fields: ReportField[];
  filters: ReportFilter[];
  groupBy?: string;
  sortBy?: string;
  sortDirection: 'asc' | 'desc';
  limit?: number;
  dateRange?: {
    from: string;
    to: string;
  };
}

@Component({
  selector: 'app-report-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">منشئ التقارير</h2>
          <div class="flex gap-2">
            <button (click)="saveReport()" 
                    class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors">
              <i class="fas fa-save mr-2"></i>
              حفظ التقرير
            </button>
            <button (click)="generateReport()" 
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
              <i class="fas fa-play mr-2"></i>
              إنشاء التقرير
            </button>
          </div>
        </div>
      </div>

      <!-- Report Configuration -->
      <div class="p-6 space-y-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="reportTitle" class="block text-sm font-medium text-gray-700 mb-2">
              عنوان التقرير *
            </label>
            <input type="text" id="reportTitle" [(ngModel)]="reportConfig.title" 
                   required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
          </div>
          <div>
            <label for="reportSubtitle" class="block text-sm font-medium text-gray-700 mb-2">
              العنوان الفرعي
            </label>
            <input type="text" id="reportSubtitle" [(ngModel)]="reportConfig.subtitle" 
                   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
          </div>
        </div>

        <!-- Date Range -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="dateFrom" class="block text-sm font-medium text-gray-700 mb-2">
              من تاريخ
            </label>
            <input type="date" id="dateFrom" [(ngModel)]="reportConfig.dateRange.from" 
                   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
          </div>
          <div>
            <label for="dateTo" class="block text-sm font-medium text-gray-700 mb-2">
              إلى تاريخ
            </label>
            <input type="date" id="dateTo" [(ngModel)]="reportConfig.dateRange.to" 
                   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
          </div>
        </div>

        <!-- Fields Selection -->
        <div>
          <h3 class="text-lg font-medium text-gray-900 mb-4">اختيار الحقول</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div *ngFor="let field of availableFields" 
                 class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <input type="checkbox" 
                     [id]="'field-' + field.key"
                     [checked]="isFieldSelected(field.key)"
                     (change)="toggleField(field.key)"
                     class="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded">
              <label [for]="'field-' + field.key" class="mr-3 text-sm text-gray-700 cursor-pointer">
                {{ field.label }}
              </label>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">الفلاتر</h3>
            <button (click)="addFilter()" 
                    class="px-3 py-1 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors text-sm">
              <i class="fas fa-plus mr-1"></i>
              إضافة فلتر
            </button>
          </div>
          
          <div class="space-y-4">
            <div *ngFor="let filter of reportConfig.filters; let i = index" 
                 class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div class="flex-1">
                <select [(ngModel)]="filter.field" 
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
                  <option value="">اختر الحقل</option>
                  <option *ngFor="let field of availableFields" [value]="field.key">
                    {{ field.label }}
                  </option>
                </select>
              </div>
              <div class="flex-1">
                <select [(ngModel)]="filter.operator" 
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
                  <option value="equals">يساوي</option>
                  <option value="contains">يحتوي على</option>
                  <option value="startsWith">يبدأ بـ</option>
                  <option value="endsWith">ينتهي بـ</option>
                  <option value="greaterThan">أكبر من</option>
                  <option value="lessThan">أصغر من</option>
                  <option value="between">بين</option>
                  <option value="in">في</option>
                  <option value="notIn">ليس في</option>
                </select>
              </div>
              <div class="flex-1">
                <input type="text" [(ngModel)]="filter.value" 
                       placeholder="القيمة"
                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              </div>
              <div *ngIf="filter.operator === 'between'" class="flex-1">
                <input type="text" [(ngModel)]="filter.value2" 
                       placeholder="القيمة الثانية"
                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              </div>
              <button (click)="removeFilter(i)" 
                      class="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-sm">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Sorting and Grouping -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label for="groupBy" class="block text-sm font-medium text-gray-700 mb-2">
              تجميع حسب
            </label>
            <select id="groupBy" [(ngModel)]="reportConfig.groupBy" 
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              <option value="">بدون تجميع</option>
              <option *ngFor="let field of availableFields" [value]="field.key">
                {{ field.label }}
              </option>
            </select>
          </div>
          <div>
            <label for="sortBy" class="block text-sm font-medium text-gray-700 mb-2">
              ترتيب حسب
            </label>
            <select id="sortBy" [(ngModel)]="reportConfig.sortBy" 
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              <option value="">بدون ترتيب</option>
              <option *ngFor="let field of availableFields" [value]="field.key">
                {{ field.label }}
              </option>
            </select>
          </div>
          <div>
            <label for="sortDirection" class="block text-sm font-medium text-gray-700 mb-2">
              اتجاه الترتيب
            </label>
            <select id="sortDirection" [(ngModel)]="reportConfig.sortDirection" 
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              <option value="asc">تصاعدي</option>
              <option value="desc">تنازلي</option>
            </select>
          </div>
        </div>

        <!-- Limit -->
        <div>
          <label for="limit" class="block text-sm font-medium text-gray-700 mb-2">
            حد السجلات
          </label>
          <input type="number" id="limit" [(ngModel)]="reportConfig.limit" 
                 min="1" max="10000" 
                 class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
          <p class="mt-1 text-sm text-gray-500">اترك فارغاً لعرض جميع السجلات</p>
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
export class ReportBuilderComponent implements OnInit {
  @Input() availableFields: ReportField[] = [];
  @Input() initialConfig: ReportConfig | null = null;

  @Output() reportGenerated = new EventEmitter<ReportConfig>();
  @Output() reportSaved = new EventEmitter<ReportConfig>();

  reportConfig: ReportConfig = {
    title: '',
    subtitle: '',
    fields: [],
    filters: [],
    sortDirection: 'asc'
  };

  ngOnInit() {
    if (this.initialConfig) {
      this.reportConfig = { ...this.initialConfig };
    }
  }

  isFieldSelected(fieldKey: string): boolean {
    return this.reportConfig.fields.some(field => field.key === fieldKey);
  }

  toggleField(fieldKey: string) {
    const field = this.availableFields.find(f => f.key === fieldKey);
    if (!field) return;

    const index = this.reportConfig.fields.findIndex(f => f.key === fieldKey);
    if (index >= 0) {
      this.reportConfig.fields.splice(index, 1);
    } else {
      this.reportConfig.fields.push(field);
    }
  }

  addFilter() {
    this.reportConfig.filters.push({
      field: '',
      operator: 'equals',
      value: ''
    });
  }

  removeFilter(index: number) {
    this.reportConfig.filters.splice(index, 1);
  }

  generateReport() {
    if (!this.reportConfig.title) {
      alert('يرجى إدخال عنوان التقرير');
      return;
    }

    if (this.reportConfig.fields.length === 0) {
      alert('يرجى اختيار حقل واحد على الأقل');
      return;
    }

    this.reportGenerated.emit(this.reportConfig);
  }

  saveReport() {
    if (!this.reportConfig.title) {
      alert('يرجى إدخال عنوان التقرير');
      return;
    }

    this.reportSaved.emit(this.reportConfig);
  }
}