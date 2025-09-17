import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Unit, UnitCreateRequest, UnitUpdateRequest, ApiResponse } from '../../models';

@Component({
  selector: 'app-units',
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">إدارة الوحدات</h1>
          <p class="mt-2 text-gray-600">إدارة الوحدات العقارية والمعلومات</p>
        </div>
        <button 
          (click)="openCreateModal()"
          class="btn btn-primary">
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          إضافة وحدة جديدة
        </button>
      </div>

      <!-- Filters and Search -->
      <div class="card">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-64">
            <input 
              type="text" 
              placeholder="البحث في الوحدات..."
              [(ngModel)]="searchTerm"
              (input)="onSearch()"
              class="form-input">
          </div>
          <select 
            [(ngModel)]="statusFilter"
            (change)="onFilterChange()"
            class="form-input w-48">
            <option value="">جميع الحالات</option>
            <option value="متاحة">متاحة</option>
            <option value="محجوزة">محجوزة</option>
            <option value="مباعة">مباعة</option>
          </select>
          <select 
            [(ngModel)]="typeFilter"
            (change)="onFilterChange()"
            class="form-input w-48">
            <option value="">جميع الأنواع</option>
            <option value="سكني">سكني</option>
            <option value="تجاري">تجاري</option>
            <option value="إداري">إداري</option>
          </select>
          <button 
            (click)="loadUnits()"
            class="btn btn-outline">
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            تحديث
          </button>
        </div>
      </div>

      <!-- Units Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          *ngFor="let unit of units; let i = index" 
          class="card scale-in hover:shadow-lg transition-shadow duration-200"
          [style.animation-delay]="(i * 0.1) + 's'">
          
          <!-- Unit Header -->
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ unit.name || unit.code }}</h3>
              <p class="text-sm text-gray-600">كود: {{ unit.code }}</p>
            </div>
            <span class="badge" [ngClass]="getStatusBadgeClass(unit.status)">
              {{ unit.status }}
            </span>
          </div>

          <!-- Unit Details -->
          <div class="space-y-2 mb-4">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">النوع:</span>
              <span class="text-sm font-medium">{{ unit.unitType }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">المساحة:</span>
              <span class="text-sm font-medium">{{ unit.area || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">الطابق:</span>
              <span class="text-sm font-medium">{{ unit.floor || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">المبنى:</span>
              <span class="text-sm font-medium">{{ unit.building || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">السعر:</span>
              <span class="text-sm font-bold text-primary-950">{{ unit.totalPrice | number:'1.0-0' }} ج.م</span>
            </div>
          </div>

          <!-- Unit Actions -->
          <div class="flex items-center justify-between pt-4 border-t border-gray-200">
            <div class="flex items-center space-x-2 space-x-reverse">
              <button 
                (click)="viewUnit(unit)"
                class="text-blue-600 hover:text-blue-800"
                title="عرض التفاصيل">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </button>
              <button 
                (click)="editUnit(unit)"
                class="text-green-600 hover:text-green-800"
                title="تعديل">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
              <button 
                (click)="deleteUnit(unit)"
                class="text-red-600 hover:text-red-800"
                title="حذف">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
            <span class="text-xs text-gray-500">{{ unit.createdAt | date:'short' }}</span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="pagination && pagination.totalPages > 1" class="flex items-center justify-between">
        <div class="text-sm text-gray-700">
          عرض {{ (pagination.page - 1) * pagination.limit + 1 }} إلى {{ Math.min(pagination.page * pagination.limit, pagination.total) }} من {{ pagination.total }} وحدة
        </div>
        <div class="flex items-center space-x-2 space-x-reverse">
          <button 
            (click)="goToPage(pagination.page - 1)"
            [disabled]="pagination.page <= 1"
            class="btn btn-outline btn-sm"
            [class.opacity-50]="pagination.page <= 1">
            السابق
          </button>
          <span class="px-3 py-1 text-sm bg-gray-100 rounded">
            {{ pagination.page }} من {{ pagination.totalPages }}
          </span>
          <button 
            (click)="goToPage(pagination.page + 1)"
            [disabled]="pagination.page >= pagination.totalPages"
            class="btn btn-outline btn-sm"
            [class.opacity-50]="pagination.page >= pagination.totalPages">
            التالي
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="units.length === 0 && !isLoading" class="text-center py-12">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">لا توجد وحدات</h3>
        <p class="text-gray-600 mb-4">ابدأ بإضافة وحدة جديدة لإدارة معلوماتها</p>
        <button 
          (click)="openCreateModal()"
          class="btn btn-primary">
          إضافة وحدة جديدة
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-12">
        <div class="loading-spinner mx-auto mb-4"></div>
        <p class="text-gray-600">جاري تحميل الوحدات...</p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? 'تعديل الوحدة' : 'إضافة وحدة جديدة' }}
          </h3>
          <button 
            (click)="closeModal()"
            class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form [formGroup]="unitForm" (ngSubmit)="onSubmit()">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Code -->
            <div>
              <label class="form-label">كود الوحدة *</label>
              <input 
                type="text" 
                formControlName="code"
                class="form-input"
                [class.border-red-500]="unitForm.get('code')?.invalid && unitForm.get('code')?.touched">
              <div *ngIf="unitForm.get('code')?.invalid && unitForm.get('code')?.touched" class="form-error">
                <span *ngIf="unitForm.get('code')?.errors?.['required']">كود الوحدة مطلوب</span>
              </div>
            </div>

            <!-- Name -->
            <div>
              <label class="form-label">اسم الوحدة</label>
              <input 
                type="text" 
                formControlName="name"
                class="form-input"
                placeholder="اسم الوحدة">
            </div>

            <!-- Unit Type -->
            <div>
              <label class="form-label">نوع الوحدة</label>
              <select formControlName="unitType" class="form-input">
                <option value="سكني">سكني</option>
                <option value="تجاري">تجاري</option>
                <option value="إداري">إداري</option>
              </select>
            </div>

            <!-- Area -->
            <div>
              <label class="form-label">المساحة</label>
              <input 
                type="text" 
                formControlName="area"
                class="form-input"
                placeholder="120 متر">
            </div>

            <!-- Floor -->
            <div>
              <label class="form-label">الطابق</label>
              <input 
                type="text" 
                formControlName="floor"
                class="form-input"
                placeholder="الطابق الأول">
            </div>

            <!-- Building -->
            <div>
              <label class="form-label">المبنى</label>
              <input 
                type="text" 
                formControlName="building"
                class="form-input"
                placeholder="برج أ">
            </div>

            <!-- Total Price -->
            <div>
              <label class="form-label">السعر الإجمالي</label>
              <input 
                type="number" 
                formControlName="totalPrice"
                class="form-input"
                placeholder="500000">
            </div>

            <!-- Status -->
            <div>
              <label class="form-label">الحالة</label>
              <select formControlName="status" class="form-input">
                <option value="متاحة">متاحة</option>
                <option value="محجوزة">محجوزة</option>
                <option value="مباعة">مباعة</option>
              </select>
            </div>
          </div>

          <!-- Notes -->
          <div class="mt-4">
            <label class="form-label">ملاحظات</label>
            <textarea 
              formControlName="notes"
              class="form-input"
              rows="3"
              placeholder="ملاحظات إضافية"></textarea>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
              <svg class="w-5 h-5 text-red-400 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-sm text-red-600">{{ errorMessage }}</p>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex items-center justify-end space-x-3 space-x-reverse mt-6">
            <button 
              type="button"
              (click)="closeModal()"
              class="btn btn-outline">
              إلغاء
            </button>
            <button 
              type="submit"
              [disabled]="unitForm.invalid || isSubmitting"
              class="btn btn-primary"
              [class.opacity-50]="unitForm.invalid || isSubmitting">
              <svg *ngIf="isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSubmitting ? 'جاري الحفظ...' : (isEditing ? 'تحديث' : 'إضافة') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Unit Details Modal -->
    <div *ngIf="showDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">تفاصيل الوحدة</h3>
          <button 
            (click)="closeDetailsModal()"
            class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div *ngIf="selectedUnit" class="space-y-6">
          <!-- Unit Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-gray-900 mb-2">معلومات الوحدة</h4>
              <div class="space-y-2">
                <p><span class="font-medium">الكود:</span> {{ selectedUnit.code }}</p>
                <p><span class="font-medium">الاسم:</span> {{ selectedUnit.name || '-' }}</p>
                <p><span class="font-medium">النوع:</span> {{ selectedUnit.unitType }}</p>
                <p><span class="font-medium">المساحة:</span> {{ selectedUnit.area || '-' }}</p>
                <p><span class="font-medium">الطابق:</span> {{ selectedUnit.floor || '-' }}</p>
                <p><span class="font-medium">المبنى:</span> {{ selectedUnit.building || '-' }}</p>
                <p><span class="font-medium">السعر:</span> {{ selectedUnit.totalPrice | number:'1.0-0' }} ج.م</p>
                <p><span class="font-medium">الحالة:</span> 
                  <span class="badge" [ngClass]="getStatusBadgeClass(selectedUnit.status)">
                    {{ selectedUnit.status }}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <h4 class="font-medium text-gray-900 mb-2">الإحصائيات</h4>
              <div *ngIf="unitStats" class="space-y-2">
                <p><span class="font-medium">إجمالي العقود:</span> {{ unitStats.totalContracts }}</p>
                <p><span class="font-medium">إجمالي الإيرادات:</span> {{ unitStats.totalRevenue | number:'1.0-0' }} ج.م</p>
                <p><span class="font-medium">إجمالي الأقساط:</span> {{ unitStats.totalInstallments }}</p>
                <p><span class="font-medium">الأقساط المدفوعة:</span> {{ unitStats.paidInstallments }}</p>
                <p><span class="font-medium">الأقساط المعلقة:</span> {{ unitStats.pendingInstallments }}</p>
              </div>
            </div>
          </div>

          <!-- Unit Contracts -->
          <div>
            <h4 class="font-medium text-gray-900 mb-2">عقود الوحدة</h4>
            <div *ngIf="unitContracts.length > 0" class="space-y-2">
              <div *ngFor="let contract of unitContracts" class="p-3 border border-gray-200 rounded-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium">{{ contract.customer?.name || 'عميل غير محدد' }}</p>
                    <p class="text-sm text-gray-600">{{ contract.totalPrice | number:'1.0-0' }} ج.م</p>
                  </div>
                  <span class="text-sm text-gray-500">{{ contract.start | date:'short' }}</span>
                </div>
              </div>
            </div>
            <div *ngIf="unitContracts.length === 0" class="text-center py-4 text-gray-500">
              لا توجد عقود لهذه الوحدة
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UnitsComponent implements OnInit {
  units: Unit[] = [];
  selectedUnit: Unit | null = null;
  unitStats: any = null;
  unitContracts: any[] = [];
  
  // Modal states
  showModal = false;
  showDetailsModal = false;
  isEditing = false;
  isSubmitting = false;
  isLoading = false;
  errorMessage = '';

  // Filters
  searchTerm = '';
  statusFilter = '';
  typeFilter = '';
  currentPage = 1;
  pageSize = 12;

  // Pagination
  pagination: any = null;

  // Form
  unitForm: FormGroup;

  // Math for template
  Math = Math;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService
  ) {
    this.unitForm = this.formBuilder.group({
      code: ['', [Validators.required]],
      name: [''],
      unitType: ['سكني'],
      area: [''],
      floor: [''],
      building: [''],
      totalPrice: [0],
      status: ['متاحة'],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits(): void {
    this.isLoading = true;
    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      ...(this.searchTerm && { search: this.searchTerm }),
      ...(this.statusFilter && { status: this.statusFilter }),
      ...(this.typeFilter && { unitType: this.typeFilter })
    };

    this.apiService.get<ApiResponse<Unit[]>>('/units', params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.units = response.data;
          this.pagination = response.pagination;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading units:', error);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadUnits();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadUnits();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadUnits();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'متاحة':
        return 'badge-success';
      case 'محجوزة':
        return 'badge-warning';
      case 'مباعة':
        return 'badge-info';
      default:
        return 'badge-info';
    }
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.unitForm.reset();
    this.unitForm.patchValue({ 
      unitType: 'سكني',
      status: 'متاحة',
      totalPrice: 0
    });
    this.showModal = true;
    this.errorMessage = '';
  }

  editUnit(unit: Unit): void {
    this.isEditing = true;
    this.unitForm.patchValue(unit);
    this.showModal = true;
    this.errorMessage = '';
  }

  viewUnit(unit: Unit): void {
    this.selectedUnit = unit;
    this.loadUnitDetails(unit.id);
    this.showDetailsModal = true;
  }

  loadUnitDetails(unitId: string): void {
    // Load unit stats
    this.apiService.get<ApiResponse>(`/units/${unitId}/stats`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.unitStats = response.data;
        }
      }
    });

    // Load unit contracts
    this.apiService.get<ApiResponse>(`/units/${unitId}/contracts`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.unitContracts = response.data;
        }
      }
    });
  }

  deleteUnit(unit: Unit): void {
    if (confirm(`هل أنت متأكد من حذف الوحدة "${unit.name || unit.code}"؟`)) {
      this.apiService.delete<ApiResponse>(`/units/${unit.id}`).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadUnits();
          }
        },
        error: (error) => {
          console.error('Error deleting unit:', error);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.unitForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const unitData = this.unitForm.value;

      if (this.isEditing && this.selectedUnit) {
        // Update unit
        this.apiService.put<ApiResponse<Unit>>(`/units/${this.selectedUnit.id}`, unitData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeModal();
              this.loadUnits();
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.errorMessage = error.message || 'حدث خطأ أثناء تحديث الوحدة';
            this.isSubmitting = false;
          }
        });
      } else {
        // Create unit
        this.apiService.post<ApiResponse<Unit>>('/units', unitData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeModal();
              this.loadUnits();
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.errorMessage = error.message || 'حدث خطأ أثناء إضافة الوحدة';
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.selectedUnit = null;
    this.unitForm.reset();
    this.errorMessage = '';
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedUnit = null;
    this.unitStats = null;
    this.unitContracts = [];
  }
}