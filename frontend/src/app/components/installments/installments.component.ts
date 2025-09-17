import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Installment, InstallmentCreateRequest, InstallmentUpdateRequest, ApiResponse, Unit } from '../../models';

@Component({
  selector: 'app-installments',
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">إدارة الأقساط</h1>
          <p class="mt-2 text-gray-600">إدارة أقساط العقود والمدفوعات</p>
        </div>
        <button 
          (click)="openCreateModal()"
          class="btn btn-primary">
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          إضافة قسط جديد
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="card scale-in">
          <div class="flex items-center">
            <div class="p-3 bg-blue-100 rounded-lg">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-600">إجمالي الأقساط</p>
              <p class="text-2xl font-bold text-blue-600">{{ installmentStats?.totalInstallments || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="card scale-in" style="animation-delay: 0.1s">
          <div class="flex items-center">
            <div class="p-3 bg-green-100 rounded-lg">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-600">مدفوعة</p>
              <p class="text-2xl font-bold text-green-600">{{ installmentStats?.paidInstallments || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="card scale-in" style="animation-delay: 0.2s">
          <div class="flex items-center">
            <div class="p-3 bg-yellow-100 rounded-lg">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-600">معلقة</p>
              <p class="text-2xl font-bold text-yellow-600">{{ installmentStats?.pendingInstallments || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="card scale-in" style="animation-delay: 0.3s">
          <div class="flex items-center">
            <div class="p-3 bg-red-100 rounded-lg">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-600">متأخرة</p>
              <p class="text-2xl font-bold text-red-600">{{ installmentStats?.overdueInstallments || 0 }}</p>
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
              placeholder="البحث في الأقساط..."
              [(ngModel)]="searchTerm"
              (input)="onSearch()"
              class="form-input">
          </div>
          <select 
            [(ngModel)]="statusFilter"
            (change)="onFilterChange()"
            class="form-input w-48">
            <option value="">جميع الحالات</option>
            <option value="مدفوع">مدفوع</option>
            <option value="معلق">معلق</option>
          </select>
          <button 
            (click)="loadOverdueInstallments()"
            class="btn btn-outline">
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            الأقساط المتأخرة
          </button>
          <button 
            (click)="loadInstallments()"
            class="btn btn-outline">
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            تحديث
          </button>
        </div>
      </div>

      <!-- Installments Table -->
      <div class="card">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>الوحدة</th>
                <th>العميل</th>
                <th>المبلغ</th>
                <th>تاريخ الاستحقاق</th>
                <th>الحالة</th>
                <th>ملاحظات</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let installment of installments; let i = index" class="fade-in" [style.animation-delay]="(i * 0.1) + 's'">
                <td class="font-medium">{{ installment.unit?.name || installment.unit?.code || '-' }}</td>
                <td>{{ getCustomerName(installment) }}</td>
                <td class="font-bold text-primary-950">{{ installment.amount | number:'1.0-0' }} ج.م</td>
                <td>{{ installment.dueDate | date:'short' }}</td>
                <td>
                  <span class="badge" [ngClass]="getStatusBadgeClass(installment.status)">
                    {{ installment.status }}
                  </span>
                </td>
                <td>{{ installment.notes || '-' }}</td>
                <td>
                  <div class="flex items-center space-x-2 space-x-reverse">
                    <button 
                      *ngIf="installment.status === 'معلق'"
                      (click)="markAsPaid(installment)"
                      class="text-green-600 hover:text-green-800"
                      title="تسجيل الدفع">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </button>
                    <button 
                      (click)="editInstallment(installment)"
                      class="text-blue-600 hover:text-blue-800"
                      title="تعديل">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button 
                      (click)="deleteInstallment(installment)"
                      class="text-red-600 hover:text-red-800"
                      title="حذف">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div *ngIf="installments.length === 0 && !isLoading" class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">لا توجد أقساط</h3>
          <p class="text-gray-600 mb-4">ابدأ بإضافة قسط جديد لإدارة الأقساط</p>
          <button 
            (click)="openCreateModal()"
            class="btn btn-primary">
            إضافة قسط جديد
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="text-center py-12">
          <div class="loading-spinner mx-auto mb-4"></div>
          <p class="text-gray-600">جاري تحميل الأقساط...</p>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? 'تعديل القسط' : 'إضافة قسط جديد' }}
          </h3>
          <button 
            (click)="closeModal()"
            class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form [formGroup]="installmentForm" (ngSubmit)="onSubmit()">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Unit Selection -->
            <div>
              <label class="form-label">الوحدة *</label>
              <select 
                formControlName="unitId"
                class="form-input"
                [class.border-red-500]="installmentForm.get('unitId')?.invalid && installmentForm.get('unitId')?.touched">
                <option value="">اختر الوحدة</option>
                <option *ngFor="let unit of units" [value]="unit.id">
                  {{ unit.name || unit.code }} - {{ unit.totalPrice | number:'1.0-0' }} ج.م
                </option>
              </select>
              <div *ngIf="installmentForm.get('unitId')?.invalid && installmentForm.get('unitId')?.touched" class="form-error">
                <span *ngIf="installmentForm.get('unitId')?.errors?.['required']">الوحدة مطلوبة</span>
              </div>
            </div>

            <!-- Amount -->
            <div>
              <label class="form-label">المبلغ *</label>
              <input 
                type="number" 
                formControlName="amount"
                class="form-input"
                [class.border-red-500]="installmentForm.get('amount')?.invalid && installmentForm.get('amount')?.touched">
              <div *ngIf="installmentForm.get('amount')?.invalid && installmentForm.get('amount')?.touched" class="form-error">
                <span *ngIf="installmentForm.get('amount')?.errors?.['required']">المبلغ مطلوب</span>
                <span *ngIf="installmentForm.get('amount')?.errors?.['min']">المبلغ يجب أن يكون أكبر من 0</span>
              </div>
            </div>

            <!-- Due Date -->
            <div>
              <label class="form-label">تاريخ الاستحقاق *</label>
              <input 
                type="date" 
                formControlName="dueDate"
                class="form-input"
                [class.border-red-500]="installmentForm.get('dueDate')?.invalid && installmentForm.get('dueDate')?.touched">
              <div *ngIf="installmentForm.get('dueDate')?.invalid && installmentForm.get('dueDate')?.touched" class="form-error">
                <span *ngIf="installmentForm.get('dueDate')?.errors?.['required']">تاريخ الاستحقاق مطلوب</span>
              </div>
            </div>

            <!-- Status -->
            <div>
              <label class="form-label">الحالة</label>
              <select formControlName="status" class="form-input">
                <option value="معلق">معلق</option>
                <option value="مدفوع">مدفوع</option>
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
              [disabled]="installmentForm.invalid || isSubmitting"
              class="btn btn-primary"
              [class.opacity-50]="installmentForm.invalid || isSubmitting">
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

    <!-- Mark as Paid Modal -->
    <div *ngIf="showPaidModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">تسجيل الدفع</h3>
          <button 
            (click)="closePaidModal()"
            class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form [formGroup]="paidForm" (ngSubmit)="onPaidSubmit()">
          <div class="space-y-4">
            <div>
              <label class="form-label">تاريخ الدفع</label>
              <input 
                type="date" 
                formControlName="paymentDate"
                class="form-input">
            </div>
            <div>
              <label class="form-label">ملاحظات</label>
              <textarea 
                formControlName="notes"
                class="form-input"
                rows="3"
                placeholder="ملاحظات الدفع"></textarea>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 space-x-reverse mt-6">
            <button 
              type="button"
              (click)="closePaidModal()"
              class="btn btn-outline">
              إلغاء
            </button>
            <button 
              type="submit"
              [disabled]="isSubmitting"
              class="btn btn-primary"
              [class.opacity-50]="isSubmitting">
              <svg *ngIf="isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSubmitting ? 'جاري التسجيل...' : 'تسجيل الدفع' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class InstallmentsComponent implements OnInit {
  installments: Installment[] = [];
  units: Unit[] = [];
  installmentStats: any = null;
  selectedInstallment: Installment | null = null;
  
  // Modal states
  showModal = false;
  showPaidModal = false;
  isEditing = false;
  isSubmitting = false;
  isLoading = false;
  errorMessage = '';

  // Filters
  searchTerm = '';
  statusFilter = '';
  currentPage = 1;
  pageSize = 10;

  // Pagination
  pagination: any = null;

  // Forms
  installmentForm: FormGroup;
  paidForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService
  ) {
    this.installmentForm = this.formBuilder.group({
      unitId: ['', [Validators.required]],
      amount: [0, [Validators.required, Validators.min(1)]],
      dueDate: ['', [Validators.required]],
      status: ['معلق'],
      notes: ['']
    });

    this.paidForm = this.formBuilder.group({
      paymentDate: [new Date().toISOString().split('T')[0]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadInstallments();
    this.loadUnits();
    this.loadInstallmentStats();
  }

  loadInstallments(): void {
    this.isLoading = true;
    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      ...(this.searchTerm && { search: this.searchTerm }),
      ...(this.statusFilter && { status: this.statusFilter })
    };

    this.apiService.get<ApiResponse<Installment[]>>('/installments', params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.installments = response.data;
          this.pagination = response.pagination;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading installments:', error);
        this.isLoading = false;
      }
    });
  }

  loadUnits(): void {
    this.apiService.get<ApiResponse<Unit[]>>('/units').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.units = response.data;
        }
      }
    });
  }

  loadInstallmentStats(): void {
    this.apiService.get<ApiResponse>('/installments/stats').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.installmentStats = response.data;
        }
      }
    });
  }

  loadOverdueInstallments(): void {
    this.isLoading = true;
    this.apiService.get<ApiResponse<Installment[]>>('/installments/overdue').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.installments = response.data;
          this.pagination = null;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading overdue installments:', error);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadInstallments();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadInstallments();
  }

  getCustomerName(installment: Installment): string {
    const contract = installment.unit?.contracts?.[0];
    return contract?.customer?.name || '-';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'مدفوع': return 'badge-success';
      case 'معلق': return 'badge-warning';
      default: return 'badge-info';
    }
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.installmentForm.reset();
    this.installmentForm.patchValue({ 
      status: 'معلق',
      dueDate: new Date().toISOString().split('T')[0]
    });
    this.showModal = true;
    this.errorMessage = '';
  }

  editInstallment(installment: Installment): void {
    this.isEditing = true;
    this.installmentForm.patchValue({
      ...installment,
      dueDate: installment.dueDate.split('T')[0] // Convert to date input format
    });
    this.showModal = true;
    this.errorMessage = '';
  }

  markAsPaid(installment: Installment): void {
    this.selectedInstallment = installment;
    this.paidForm.reset();
    this.paidForm.patchValue({
      paymentDate: new Date().toISOString().split('T')[0]
    });
    this.showPaidModal = true;
  }

  deleteInstallment(installment: Installment): void {
    if (confirm(`هل أنت متأكد من حذف القسط؟`)) {
      this.apiService.delete<ApiResponse>(`/installments/${installment.id}`).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadInstallments();
            this.loadInstallmentStats();
          }
        },
        error: (error) => {
          console.error('Error deleting installment:', error);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.installmentForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const installmentData = this.installmentForm.value;

      if (this.isEditing && this.selectedInstallment) {
        // Update installment
        this.apiService.put<ApiResponse<Installment>>(`/installments/${this.selectedInstallment.id}`, installmentData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeModal();
              this.loadInstallments();
              this.loadInstallmentStats();
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.errorMessage = error.message || 'حدث خطأ أثناء تحديث القسط';
            this.isSubmitting = false;
          }
        });
      } else {
        // Create installment
        this.apiService.post<ApiResponse<Installment>>('/installments', installmentData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeModal();
              this.loadInstallments();
              this.loadInstallmentStats();
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.errorMessage = error.message || 'حدث خطأ أثناء إضافة القسط';
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  onPaidSubmit(): void {
    if (this.paidForm.valid && this.selectedInstallment) {
      this.isSubmitting = true;

      const paidData = this.paidForm.value;

      this.apiService.put<ApiResponse<Installment>>(`/installments/${this.selectedInstallment.id}/paid`, paidData).subscribe({
        next: (response) => {
          if (response.success) {
            this.closePaidModal();
            this.loadInstallments();
            this.loadInstallmentStats();
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error marking installment as paid:', error);
          this.isSubmitting = false;
        }
      });
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.selectedInstallment = null;
    this.installmentForm.reset();
    this.errorMessage = '';
  }

  closePaidModal(): void {
    this.showPaidModal = false;
    this.selectedInstallment = null;
    this.paidForm.reset();
  }
}