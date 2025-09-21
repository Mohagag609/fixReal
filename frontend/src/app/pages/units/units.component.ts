import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Unit, UnitFormData, UnitFilters } from '../../models/unit.model';

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">إدارة الوحدات</h1>
          <p class="text-gray-600">إضافة وتعديل وإدارة الوحدات العقارية</p>
        </div>
        <button 
          class="btn btn-primary"
          (click)="openAddModal()">
          + وحدة جديدة
        </button>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">البحث</label>
            <input 
              type="text" 
              class="input"
              placeholder="البحث بالكود أو الاسم..."
              [(ngModel)]="filters.search"
              (input)="onSearch()">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
            <select 
              class="input"
              [(ngModel)]="filters.status"
              (change)="onFilterChange()">
              <option value="">جميع الحالات</option>
              <option value="متاحة">متاحة</option>
              <option value="مباعة">مباعة</option>
              <option value="محجوزة">محجوزة</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">نوع الوحدة</label>
            <select 
              class="input"
              [(ngModel)]="filters.unit_type"
              (change)="onFilterChange()">
              <option value="">جميع الأنواع</option>
              <option value="سكني">سكني</option>
              <option value="تجاري">تجاري</option>
              <option value="إداري">إداري</option>
            </select>
          </div>
          <div class="flex items-end">
            <button 
              class="btn btn-secondary w-full"
              (click)="resetFilters()">
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p class="text-gray-600">جاري التحميل...</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="card bg-red-50 border-red-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <span class="text-red-500 mr-2 text-lg">⚠️</span>
            <div>
              <h3 class="text-red-800 font-semibold text-sm">خطأ في تحميل البيانات</h3>
              <p class="text-red-600 text-xs">{{ error }}</p>
            </div>
          </div>
          <button class="btn btn-danger text-sm" (click)="loadUnits()">
            إعادة المحاولة
          </button>
        </div>
      </div>

      <!-- Units Table -->
      <div *ngIf="!loading && !error" class="card p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>الاسم</th>
                <th>النوع</th>
                <th>المساحة</th>
                <th>الطابق</th>
                <th>المبنى</th>
                <th>السعر</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let unit of units" class="animate-fade-in">
                <td class="font-medium">{{ unit.code }}</td>
                <td>{{ unit.name || '-' }}</td>
                <td>{{ unit.unit_type }}</td>
                <td>{{ unit.area || '-' }}</td>
                <td>{{ unit.floor || '-' }}</td>
                <td>{{ unit.building || '-' }}</td>
                <td class="font-medium">{{ formatCurrency(unit.total_price) }}</td>
                <td>
                  <span 
                    class="px-2 py-1 text-xs rounded-full"
                    [ngClass]="getStatusClass(unit.status)">
                    {{ unit.status }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button 
                      class="btn btn-secondary text-xs"
                      (click)="editUnit(unit)">
                      تعديل
                    </button>
                    <button 
                      class="btn btn-danger text-xs"
                      (click)="deleteUnit(unit)">
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="pagination" class="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              عرض {{ (pagination.current_page - 1) * pagination.per_page + 1 }} إلى 
              {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }} من 
              {{ pagination.total }} نتيجة
            </div>
            <div class="flex gap-2">
              <button 
                class="btn btn-secondary text-sm"
                [disabled]="pagination.current_page <= 1"
                (click)="goToPage(pagination.current_page - 1)">
                السابق
              </button>
              <button 
                class="btn btn-secondary text-sm"
                [disabled]="pagination.current_page >= pagination.last_page"
                (click)="goToPage(pagination.current_page + 1)">
                التالي
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl animate-scale-in">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ editingUnit ? 'تعديل الوحدة' : 'وحدة جديدة' }}
            </h3>
          </div>
          
          <form [formGroup]="unitForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">الكود *</label>
                <input 
                  type="text" 
                  class="input"
                  formControlName="code"
                  placeholder="كود الوحدة">
                <div *ngIf="unitForm.get('code')?.invalid && unitForm.get('code')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  الكود مطلوب
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
                <input 
                  type="text" 
                  class="input"
                  formControlName="name"
                  placeholder="اسم الوحدة">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">نوع الوحدة *</label>
                <select class="input" formControlName="unit_type">
                  <option value="سكني">سكني</option>
                  <option value="تجاري">تجاري</option>
                  <option value="إداري">إداري</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">المساحة</label>
                <input 
                  type="text" 
                  class="input"
                  formControlName="area"
                  placeholder="مساحة الوحدة">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">الطابق</label>
                <input 
                  type="text" 
                  class="input"
                  formControlName="floor"
                  placeholder="رقم الطابق">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">المبنى</label>
                <input 
                  type="text" 
                  class="input"
                  formControlName="building"
                  placeholder="اسم المبنى">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">السعر *</label>
                <input 
                  type="number" 
                  class="input"
                  formControlName="total_price"
                  placeholder="سعر الوحدة"
                  min="0"
                  step="0.01">
                <div *ngIf="unitForm.get('total_price')?.invalid && unitForm.get('total_price')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  السعر مطلوب ويجب أن يكون أكبر من 0
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                <select class="input" formControlName="status">
                  <option value="متاحة">متاحة</option>
                  <option value="مباعة">مباعة</option>
                  <option value="محجوزة">محجوزة</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
              <textarea 
                class="input"
                formControlName="notes"
                placeholder="ملاحظات إضافية"
                rows="3"></textarea>
            </div>

            <div class="flex gap-3 pt-4">
              <button 
                type="submit" 
                class="btn btn-primary flex-1"
                [disabled]="unitForm.invalid || submitting">
                {{ submitting ? 'جاري الحفظ...' : (editingUnit ? 'تحديث' : 'إضافة') }}
              </button>
              <button 
                type="button" 
                class="btn btn-secondary"
                (click)="closeModal()">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UnitsComponent implements OnInit {
  units: Unit[] = [];
  loading = false;
  error: string | null = null;
  showModal = false;
  editingUnit: Unit | null = null;
  submitting = false;
  
  filters: UnitFilters = {
    search: '',
    status: '',
    unit_type: '',
    page: 1,
    per_page: 15
  };

  pagination: any = null;
  unitForm: FormGroup;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.unitForm = this.fb.group({
      code: ['', Validators.required],
      name: [''],
      unit_type: ['سكني', Validators.required],
      area: [''],
      floor: [''],
      building: [''],
      total_price: [0, [Validators.required, Validators.min(0.01)]],
      status: ['متاحة'],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadUnits();
  }

  loadUnits() {
    this.loading = true;
    this.error = null;

    this.apiService.getUnits(this.filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.units = response.data;
          this.pagination = response.pagination;
        } else {
          this.error = 'فشل في تحميل الوحدات';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.loading = false;
        console.error('Units error:', error);
      }
    });
  }

  onSearch() {
    this.filters.page = 1;
    this.loadUnits();
  }

  onFilterChange() {
    this.filters.page = 1;
    this.loadUnits();
  }

  resetFilters() {
    this.filters = {
      search: '',
      status: '',
      unit_type: '',
      page: 1,
      per_page: 15
    };
    this.loadUnits();
  }

  goToPage(page: number) {
    this.filters.page = page;
    this.loadUnits();
  }

  openAddModal() {
    this.editingUnit = null;
    this.unitForm.reset({
      unit_type: 'سكني',
      status: 'متاحة',
      total_price: 0
    });
    this.showModal = true;
  }

  editUnit(unit: Unit) {
    this.editingUnit = unit;
    this.unitForm.patchValue(unit);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingUnit = null;
    this.unitForm.reset();
  }

  onSubmit() {
    if (this.unitForm.invalid) return;

    this.submitting = true;
    const formData: UnitFormData = this.unitForm.value;

    const operation = this.editingUnit 
      ? this.apiService.updateUnit(this.editingUnit.id, formData)
      : this.apiService.createUnit(formData);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
          this.closeModal();
          this.loadUnits();
        } else {
          this.error = 'فشل في حفظ الوحدة';
        }
        this.submitting = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.submitting = false;
        console.error('Save unit error:', error);
      }
    });
  }

  deleteUnit(unit: Unit) {
    if (confirm(`هل أنت متأكد من حذف الوحدة "${unit.code}"؟`)) {
      this.apiService.deleteUnit(unit.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadUnits();
          } else {
            this.error = 'فشل في حذف الوحدة';
          }
        },
        error: (error) => {
          this.error = 'خطأ في الاتصال بالخادم';
          console.error('Delete unit error:', error);
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'متاحة':
        return 'bg-green-100 text-green-800';
      case 'مباعة':
        return 'bg-blue-100 text-blue-800';
      case 'محجوزة':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}