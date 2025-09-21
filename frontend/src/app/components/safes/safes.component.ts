import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Safe, SafeCreateRequest, SafeUpdateRequest, ApiResponse } from '../../models';

@Component({
  selector: 'app-safes',
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">إدارة الخزائن</h1>
          <p class="mt-2 text-gray-600">إدارة الخزائن والأرصدة المالية</p>
        </div>
        <div class="flex items-center space-x-3 space-x-reverse">
          <button 
            (click)="openTransferModal()"
            class="btn btn-outline">
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
            </svg>
            تحويل أموال
          </button>
          <button 
            (click)="openCreateModal()"
            class="btn btn-primary">
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            إضافة خزينة جديدة
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card scale-in">
          <div class="flex items-center">
            <div class="p-3 bg-blue-100 rounded-lg">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-600">إجمالي الخزائن</p>
              <p class="text-2xl font-bold text-blue-600">{{ safes.length }}</p>
            </div>
          </div>
        </div>

        <div class="card scale-in" style="animation-delay: 0.1s">
          <div class="flex items-center">
            <div class="p-3 bg-green-100 rounded-lg">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-600">إجمالي الأرصدة</p>
              <p class="text-2xl font-bold text-green-600">{{ getTotalBalance() | number:'1.0-0' }} ج.م</p>
            </div>
          </div>
        </div>

        <div class="card scale-in" style="animation-delay: 0.2s">
          <div class="flex items-center">
            <div class="p-3 bg-purple-100 rounded-lg">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-600">الخزائن النشطة</p>
              <p class="text-2xl font-bold text-purple-600">{{ getActiveSafesCount() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="card">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-64">
            <input 
              type="text" 
              placeholder="البحث في الخزائن..."
              [(ngModel)]="searchTerm"
              (input)="onSearch()"
              class="form-input">
          </div>
          <select 
            [(ngModel)]="statusFilter"
            (change)="onFilterChange()"
            class="form-input w-48">
            <option value="">جميع الحالات</option>
            <option value="نشط">نشط</option>
            <option value="غير نشط">غير نشط</option>
          </select>
          <button 
            (click)="loadSafes()"
            class="btn btn-outline">
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            تحديث
          </button>
        </div>
      </div>

      <!-- Safes Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          *ngFor="let safe of safes; let i = index" 
          class="card scale-in hover:shadow-lg transition-shadow duration-200"
          [style.animation-delay]="(i * 0.1) + 's'">
          
          <!-- Safe Header -->
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ safe.name }}</h3>
              <p class="text-sm text-gray-600">{{ safe.description || 'لا يوجد وصف' }}</p>
            </div>
            <span class="badge" [ngClass]="safe.status === 'نشط' ? 'badge-success' : 'badge-warning'">
              {{ safe.status }}
            </span>
          </div>

          <!-- Safe Balance -->
          <div class="mb-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">الرصيد الحالي</span>
              <span class="text-2xl font-bold text-primary-950">{{ safe.balance | number:'1.0-0' }} ج.م</span>
            </div>
          </div>

          <!-- Safe Actions -->
          <div class="flex items-center justify-between pt-4 border-t border-gray-200">
            <div class="flex items-center space-x-2 space-x-reverse">
              <button 
                (click)="viewSafe(safe)"
                class="text-blue-600 hover:text-blue-800"
                title="عرض التفاصيل">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </button>
              <button 
                (click)="editSafe(safe)"
                class="text-green-600 hover:text-green-800"
                title="تعديل">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
              <button 
                (click)="deleteSafe(safe)"
                class="text-red-600 hover:text-red-800"
                title="حذف">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
            <span class="text-xs text-gray-500">{{ safe.createdAt | date:'short' }}</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="safes.length === 0 && !isLoading" class="text-center py-12">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">لا توجد خزائن</h3>
        <p class="text-gray-600 mb-4">ابدأ بإضافة خزينة جديدة لإدارة الأموال</p>
        <button 
          (click)="openCreateModal()"
          class="btn btn-primary">
          إضافة خزينة جديدة
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-12">
        <div class="loading-spinner mx-auto mb-4"></div>
        <p class="text-gray-600">جاري تحميل الخزائن...</p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? 'تعديل الخزينة' : 'إضافة خزينة جديدة' }}
          </h3>
          <button 
            (click)="closeModal()"
            class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form [formGroup]="safeForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <!-- Name -->
            <div>
              <label class="form-label">اسم الخزينة *</label>
              <input 
                type="text" 
                formControlName="name"
                class="form-input"
                [class.border-red-500]="safeForm.get('name')?.invalid && safeForm.get('name')?.touched">
              <div *ngIf="safeForm.get('name')?.invalid && safeForm.get('name')?.touched" class="form-error">
                <span *ngIf="safeForm.get('name')?.errors?.['required']">اسم الخزينة مطلوب</span>
                <span *ngIf="safeForm.get('name')?.errors?.['minlength']">اسم الخزينة يجب أن يكون حرفين على الأقل</span>
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="form-label">الوصف</label>
              <textarea 
                formControlName="description"
                class="form-input"
                rows="3"
                placeholder="وصف الخزينة"></textarea>
            </div>

            <!-- Balance -->
            <div>
              <label class="form-label">الرصيد الابتدائي</label>
              <input 
                type="number" 
                formControlName="balance"
                class="form-input"
                placeholder="0">
            </div>

            <!-- Status -->
            <div>
              <label class="form-label">الحالة</label>
              <select formControlName="status" class="form-input">
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
              </select>
            </div>
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
              [disabled]="safeForm.invalid || isSubmitting"
              class="btn btn-primary"
              [class.opacity-50]="safeForm.invalid || isSubmitting">
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

    <!-- Transfer Modal -->
    <div *ngIf="showTransferModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">تحويل أموال</h3>
          <button 
            (click)="closeTransferModal()"
            class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form [formGroup]="transferForm" (ngSubmit)="onTransferSubmit()">
          <div class="space-y-4">
            <!-- From Safe -->
            <div>
              <label class="form-label">من الخزينة *</label>
              <select 
                formControlName="fromSafeId"
                class="form-input"
                [class.border-red-500]="transferForm.get('fromSafeId')?.invalid && transferForm.get('fromSafeId')?.touched">
                <option value="">اختر الخزينة المصدر</option>
                <option *ngFor="let safe of safes" [value]="safe.id">
                  {{ safe.name }} - {{ safe.balance | number:'1.0-0' }} ج.م
                </option>
              </select>
              <div *ngIf="transferForm.get('fromSafeId')?.invalid && transferForm.get('fromSafeId')?.touched" class="form-error">
                <span *ngIf="transferForm.get('fromSafeId')?.errors?.['required']">الخزينة المصدر مطلوبة</span>
              </div>
            </div>

            <!-- To Safe -->
            <div>
              <label class="form-label">إلى الخزينة *</label>
              <select 
                formControlName="toSafeId"
                class="form-input"
                [class.border-red-500]="transferForm.get('toSafeId')?.invalid && transferForm.get('toSafeId')?.touched">
                <option value="">اختر الخزينة الوجهة</option>
                <option *ngFor="let safe of safes" [value]="safe.id">
                  {{ safe.name }} - {{ safe.balance | number:'1.0-0' }} ج.م
                </option>
              </select>
              <div *ngIf="transferForm.get('toSafeId')?.invalid && transferForm.get('toSafeId')?.touched" class="form-error">
                <span *ngIf="transferForm.get('toSafeId')?.errors?.['required']">الخزينة الوجهة مطلوبة</span>
              </div>
            </div>

            <!-- Amount -->
            <div>
              <label class="form-label">المبلغ *</label>
              <input 
                type="number" 
                formControlName="amount"
                class="form-input"
                [class.border-red-500]="transferForm.get('amount')?.invalid && transferForm.get('amount')?.touched">
              <div *ngIf="transferForm.get('amount')?.invalid && transferForm.get('amount')?.touched" class="form-error">
                <span *ngIf="transferForm.get('amount')?.errors?.['required']">المبلغ مطلوب</span>
                <span *ngIf="transferForm.get('amount')?.errors?.['min']">المبلغ يجب أن يكون أكبر من 0</span>
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="form-label">وصف التحويل</label>
              <textarea 
                formControlName="description"
                class="form-input"
                rows="3"
                placeholder="وصف عملية التحويل"></textarea>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="transferErrorMessage" class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
              <svg class="w-5 h-5 text-red-400 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-sm text-red-600">{{ transferErrorMessage }}</p>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex items-center justify-end space-x-3 space-x-reverse mt-6">
            <button 
              type="button"
              (click)="closeTransferModal()"
              class="btn btn-outline">
              إلغاء
            </button>
            <button 
              type="submit"
              [disabled]="transferForm.invalid || isSubmitting"
              class="btn btn-primary"
              [class.opacity-50]="transferForm.invalid || isSubmitting">
              <svg *ngIf="isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSubmitting ? 'جاري التحويل...' : 'تحويل' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class SafesComponent implements OnInit {
  safes: Safe[] = [];
  selectedSafe: Safe | null = null;
  
  // Modal states
  showModal = false;
  showTransferModal = false;
  isEditing = false;
  isSubmitting = false;
  isLoading = false;
  errorMessage = '';
  transferErrorMessage = '';

  // Filters
  searchTerm = '';
  statusFilter = '';
  currentPage = 1;
  pageSize = 10;

  // Pagination
  pagination: any = null;

  // Forms
  safeForm: FormGroup;
  transferForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService
  ) {
    this.safeForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      balance: [0],
      status: ['نشط']
    });

    this.transferForm = this.formBuilder.group({
      fromSafeId: ['', [Validators.required]],
      toSafeId: ['', [Validators.required]],
      amount: [0, [Validators.required, Validators.min(1)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadSafes();
  }

  loadSafes(): void {
    this.isLoading = true;
    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      ...(this.searchTerm && { search: this.searchTerm }),
      ...(this.statusFilter && { status: this.statusFilter })
    };

    this.apiService.get<ApiResponse<Safe[]>>('/safes', params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.safes = response.data;
          this.pagination = response.pagination;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading safes:', error);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadSafes();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadSafes();
  }

  getTotalBalance(): number {
    return this.safes.reduce((sum, safe) => sum + safe.balance, 0);
  }

  getActiveSafesCount(): number {
    return this.safes.filter(safe => safe.status === 'نشط').length;
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.safeForm.reset();
    this.safeForm.patchValue({ 
      status: 'نشط',
      balance: 0
    });
    this.showModal = true;
    this.errorMessage = '';
  }

  editSafe(safe: Safe): void {
    this.isEditing = true;
    this.safeForm.patchValue(safe);
    this.showModal = true;
    this.errorMessage = '';
  }

  openTransferModal(): void {
    this.transferForm.reset();
    this.showTransferModal = true;
    this.transferErrorMessage = '';
  }

  viewSafe(safe: Safe): void {
    // Implementation for viewing safe details
    console.log('View safe:', safe);
  }

  deleteSafe(safe: Safe): void {
    if (confirm(`هل أنت متأكد من حذف الخزينة "${safe.name}"؟`)) {
      this.apiService.delete<ApiResponse>(`/safes/${safe.id}`).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadSafes();
          }
        },
        error: (error) => {
          console.error('Error deleting safe:', error);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.safeForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const safeData = this.safeForm.value;

      if (this.isEditing && this.selectedSafe) {
        // Update safe
        this.apiService.put<ApiResponse<Safe>>(`/safes/${this.selectedSafe.id}`, safeData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeModal();
              this.loadSafes();
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.errorMessage = error.message || 'حدث خطأ أثناء تحديث الخزينة';
            this.isSubmitting = false;
          }
        });
      } else {
        // Create safe
        this.apiService.post<ApiResponse<Safe>>('/safes', safeData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeModal();
              this.loadSafes();
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.errorMessage = error.message || 'حدث خطأ أثناء إضافة الخزينة';
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  onTransferSubmit(): void {
    if (this.transferForm.valid) {
      this.isSubmitting = true;
      this.transferErrorMessage = '';

      const transferData = this.transferForm.value;

      this.apiService.post<ApiResponse>('/safes/transfer', transferData).subscribe({
        next: (response) => {
          if (response.success) {
            this.closeTransferModal();
            this.loadSafes();
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          this.transferErrorMessage = error.message || 'حدث خطأ أثناء تحويل الأموال';
          this.isSubmitting = false;
        }
      });
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.selectedSafe = null;
    this.safeForm.reset();
    this.errorMessage = '';
  }

  closeTransferModal(): void {
    this.showTransferModal = false;
    this.transferForm.reset();
    this.transferErrorMessage = '';
  }
}