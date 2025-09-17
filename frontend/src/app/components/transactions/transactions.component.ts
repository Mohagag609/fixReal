import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Transaction, TransactionCreateRequest, TransactionUpdateRequest, ApiResponse, Safe } from '../../models';

@Component({
  selector: 'app-transactions',
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">إدارة المعاملات</h1>
          <p class="mt-2 text-gray-600">إدارة المعاملات المالية والإيصالات</p>
        </div>
        <button 
          (click)="openCreateModal()"
          class="btn btn-primary">
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          إضافة معاملة جديدة
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="card scale-in">
          <div class="flex items-center">
            <div class="p-3 bg-green-100 rounded-lg">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
              <p class="text-2xl font-bold text-green-600">{{ transactionStats?.totalReceipts | number:'1.0-0' }} ج.م</p>
            </div>
          </div>
        </div>

        <div class="card scale-in" style="animation-delay: 0.1s">
          <div class="flex items-center">
            <div class="p-3 bg-red-100 rounded-lg">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-600">إجمالي المصروفات</p>
              <p class="text-2xl font-bold text-red-600">{{ transactionStats?.totalPayments | number:'1.0-0' }} ج.م</p>
            </div>
          </div>
        </div>

        <div class="card scale-in" style="animation-delay: 0.2s">
          <div class="flex items-center">
            <div class="p-3 bg-blue-100 rounded-lg">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-600">صافي المبلغ</p>
              <p class="text-2xl font-bold text-blue-600">{{ transactionStats?.netAmount | number:'1.0-0' }} ج.م</p>
            </div>
          </div>
        </div>

        <div class="card scale-in" style="animation-delay: 0.3s">
          <div class="flex items-center">
            <div class="p-3 bg-purple-100 rounded-lg">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-600">إجمالي المعاملات</p>
              <p class="text-2xl font-bold text-purple-600">{{ transactionStats?.totalTransactions || 0 }}</p>
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
              placeholder="البحث في المعاملات..."
              [(ngModel)]="searchTerm"
              (input)="onSearch()"
              class="form-input">
          </div>
          <select 
            [(ngModel)]="typeFilter"
            (change)="onFilterChange()"
            class="form-input w-48">
            <option value="">جميع الأنواع</option>
            <option value="receipt">إيرادات</option>
            <option value="payment">مصروفات</option>
          </select>
          <select 
            [(ngModel)]="safeFilter"
            (change)="onFilterChange()"
            class="form-input w-48">
            <option value="">جميع الخزائن</option>
            <option *ngFor="let safe of safes" [value]="safe.id">
              {{ safe.name }}
            </option>
          </select>
          <button 
            (click)="loadTransactions()"
            class="btn btn-outline">
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            تحديث
          </button>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="card">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>النوع</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>الخزينة</th>
                <th>الوصف</th>
                <th>المدفوع</th>
                <th>المستفيد</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let transaction of transactions; let i = index" class="fade-in" [style.animation-delay]="(i * 0.1) + 's'">
                <td>
                  <span class="badge" [ngClass]="getTypeBadgeClass(transaction.type)">
                    {{ getTypeText(transaction.type) }}
                  </span>
                </td>
                <td>{{ transaction.date | date:'short' }}</td>
                <td class="font-bold" [ngClass]="transaction.type === 'receipt' ? 'text-green-600' : 'text-red-600'">
                  {{ transaction.amount | number:'1.0-0' }} ج.م
                </td>
                <td>{{ transaction.safe?.name || '-' }}</td>
                <td>{{ transaction.description }}</td>
                <td>{{ transaction.payer || '-' }}</td>
                <td>{{ transaction.beneficiary || '-' }}</td>
                <td>
                  <div class="flex items-center space-x-2 space-x-reverse">
                    <button 
                      (click)="viewTransaction(transaction)"
                      class="text-blue-600 hover:text-blue-800"
                      title="عرض التفاصيل">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    </button>
                    <button 
                      (click)="editTransaction(transaction)"
                      class="text-green-600 hover:text-green-800"
                      title="تعديل">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button 
                      (click)="deleteTransaction(transaction)"
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
        <div *ngIf="transactions.length === 0 && !isLoading" class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">لا توجد معاملات</h3>
          <p class="text-gray-600 mb-4">ابدأ بإضافة معاملة جديدة لإدارة المعاملات المالية</p>
          <button 
            (click)="openCreateModal()"
            class="btn btn-primary">
            إضافة معاملة جديدة
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="text-center py-12">
          <div class="loading-spinner mx-auto mb-4"></div>
          <p class="text-gray-600">جاري تحميل المعاملات...</p>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? 'تعديل المعاملة' : 'إضافة معاملة جديدة' }}
          </h3>
          <button 
            (click)="closeModal()"
            class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form [formGroup]="transactionForm" (ngSubmit)="onSubmit()">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Type -->
            <div>
              <label class="form-label">نوع المعاملة *</label>
              <select 
                formControlName="type"
                class="form-input"
                [class.border-red-500]="transactionForm.get('type')?.invalid && transactionForm.get('type')?.touched">
                <option value="receipt">إيراد</option>
                <option value="payment">مصروف</option>
              </select>
              <div *ngIf="transactionForm.get('type')?.invalid && transactionForm.get('type')?.touched" class="form-error">
                <span *ngIf="transactionForm.get('type')?.errors?.['required']">نوع المعاملة مطلوب</span>
              </div>
            </div>

            <!-- Date -->
            <div>
              <label class="form-label">التاريخ *</label>
              <input 
                type="date" 
                formControlName="date"
                class="form-input"
                [class.border-red-500]="transactionForm.get('date')?.invalid && transactionForm.get('date')?.touched">
              <div *ngIf="transactionForm.get('date')?.invalid && transactionForm.get('date')?.touched" class="form-error">
                <span *ngIf="transactionForm.get('date')?.errors?.['required']">التاريخ مطلوب</span>
              </div>
            </div>

            <!-- Amount -->
            <div>
              <label class="form-label">المبلغ *</label>
              <input 
                type="number" 
                formControlName="amount"
                class="form-input"
                [class.border-red-500]="transactionForm.get('amount')?.invalid && transactionForm.get('amount')?.touched">
              <div *ngIf="transactionForm.get('amount')?.invalid && transactionForm.get('amount')?.touched" class="form-error">
                <span *ngIf="transactionForm.get('amount')?.errors?.['required']">المبلغ مطلوب</span>
                <span *ngIf="transactionForm.get('amount')?.errors?.['min']">المبلغ يجب أن يكون أكبر من 0</span>
              </div>
            </div>

            <!-- Safe -->
            <div>
              <label class="form-label">الخزينة *</label>
              <select 
                formControlName="safeId"
                class="form-input"
                [class.border-red-500]="transactionForm.get('safeId')?.invalid && transactionForm.get('safeId')?.touched">
                <option value="">اختر الخزينة</option>
                <option *ngFor="let safe of safes" [value]="safe.id">
                  {{ safe.name }} - {{ safe.balance | number:'1.0-0' }} ج.م
                </option>
              </select>
              <div *ngIf="transactionForm.get('safeId')?.invalid && transactionForm.get('safeId')?.touched" class="form-error">
                <span *ngIf="transactionForm.get('safeId')?.errors?.['required']">الخزينة مطلوبة</span>
              </div>
            </div>

            <!-- Description -->
            <div class="md:col-span-2">
              <label class="form-label">الوصف *</label>
              <textarea 
                formControlName="description"
                class="form-input"
                rows="3"
                [class.border-red-500]="transactionForm.get('description')?.invalid && transactionForm.get('description')?.touched">
              </textarea>
              <div *ngIf="transactionForm.get('description')?.invalid && transactionForm.get('description')?.touched" class="form-error">
                <span *ngIf="transactionForm.get('description')?.errors?.['required']">الوصف مطلوب</span>
              </div>
            </div>

            <!-- Payer -->
            <div>
              <label class="form-label">المدفوع</label>
              <input 
                type="text" 
                formControlName="payer"
                class="form-input"
                placeholder="اسم المدفوع">
            </div>

            <!-- Beneficiary -->
            <div>
              <label class="form-label">المستفيد</label>
              <input 
                type="text" 
                formControlName="beneficiary"
                class="form-input"
                placeholder="اسم المستفيد">
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
              [disabled]="transactionForm.invalid || isSubmitting"
              class="btn btn-primary"
              [class.opacity-50]="transactionForm.invalid || isSubmitting">
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
  `,
  styles: []
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  safes: Safe[] = [];
  transactionStats: any = null;
  
  // Modal states
  showModal = false;
  isEditing = false;
  isSubmitting = false;
  isLoading = false;
  errorMessage = '';

  // Filters
  searchTerm = '';
  typeFilter = '';
  safeFilter = '';
  currentPage = 1;
  pageSize = 10;

  // Pagination
  pagination: any = null;

  // Form
  transactionForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService
  ) {
    this.transactionForm = this.formBuilder.group({
      type: ['receipt', [Validators.required]],
      date: ['', [Validators.required]],
      amount: [0, [Validators.required, Validators.min(1)]],
      safeId: ['', [Validators.required]],
      description: ['', [Validators.required]],
      payer: [''],
      beneficiary: [''],
      linkedRef: ['']
    });
  }

  ngOnInit(): void {
    this.loadTransactions();
    this.loadSafes();
    this.loadTransactionStats();
  }

  loadTransactions(): void {
    this.isLoading = true;
    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      ...(this.searchTerm && { search: this.searchTerm }),
      ...(this.typeFilter && { status: this.typeFilter }),
      ...(this.safeFilter && { safeId: this.safeFilter })
    };

    this.apiService.get<ApiResponse<Transaction[]>>('/transactions', params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.transactions = response.data;
          this.pagination = response.pagination;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
      }
    });
  }

  loadSafes(): void {
    this.apiService.get<ApiResponse<Safe[]>>('/safes').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.safes = response.data;
        }
      }
    });
  }

  loadTransactionStats(): void {
    this.apiService.get<ApiResponse>('/transactions/stats').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.transactionStats = response.data;
        }
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  getTypeText(type: string): string {
    return type === 'receipt' ? 'إيراد' : 'مصروف';
  }

  getTypeBadgeClass(type: string): string {
    return type === 'receipt' ? 'badge-success' : 'badge-danger';
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.transactionForm.reset();
    this.transactionForm.patchValue({ 
      type: 'receipt',
      date: new Date().toISOString().split('T')[0]
    });
    this.showModal = true;
    this.errorMessage = '';
  }

  editTransaction(transaction: Transaction): void {
    this.isEditing = true;
    this.transactionForm.patchValue({
      ...transaction,
      date: transaction.date.split('T')[0] // Convert to date input format
    });
    this.showModal = true;
    this.errorMessage = '';
  }

  viewTransaction(transaction: Transaction): void {
    // Implementation for viewing transaction details
    console.log('View transaction:', transaction);
  }

  deleteTransaction(transaction: Transaction): void {
    if (confirm(`هل أنت متأكد من حذف المعاملة؟`)) {
      this.apiService.delete<ApiResponse>(`/transactions/${transaction.id}`).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadTransactions();
            this.loadTransactionStats();
          }
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const transactionData = this.transactionForm.value;

      if (this.isEditing) {
        // Update transaction
        this.apiService.put<ApiResponse<Transaction>>(`/transactions/${this.selectedTransaction?.id}`, transactionData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeModal();
              this.loadTransactions();
              this.loadTransactionStats();
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.errorMessage = error.message || 'حدث خطأ أثناء تحديث المعاملة';
            this.isSubmitting = false;
          }
        });
      } else {
        // Create transaction
        this.apiService.post<ApiResponse<Transaction>>('/transactions', transactionData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeModal();
              this.loadTransactions();
              this.loadTransactionStats();
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.errorMessage = error.message || 'حدث خطأ أثناء إضافة المعاملة';
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.transactionForm.reset();
    this.errorMessage = '';
  }
}