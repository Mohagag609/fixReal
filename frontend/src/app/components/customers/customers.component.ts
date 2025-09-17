import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Customer, CustomerCreateRequest, CustomerUpdateRequest, ApiResponse } from '../../models';

@Component({
  selector: 'app-customers',
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">إدارة العملاء</h1>
          <p class="mt-2 text-gray-600">إدارة بيانات العملاء والمعلومات الشخصية</p>
        </div>
        <button 
          (click)="openCreateModal()"
          class="btn btn-primary">
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          إضافة عميل جديد
        </button>
      </div>

      <!-- Filters and Search -->
      <div class="card">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-64">
            <input 
              type="text" 
              placeholder="البحث في العملاء..."
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
            (click)="loadCustomers()"
            class="btn btn-outline">
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            تحديث
          </button>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="card">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الهاتف</th>
                <th>الرقم القومي</th>
                <th>العنوان</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let customer of customers; let i = index" class="fade-in" [style.animation-delay]="(i * 0.1) + 's'">
                <td class="font-medium">{{ customer.name }}</td>
                <td>{{ customer.phone || '-' }}</td>
                <td>{{ customer.nationalId || '-' }}</td>
                <td>{{ customer.address || '-' }}</td>
                <td>
                  <span class="badge" [ngClass]="customer.status === 'نشط' ? 'badge-success' : 'badge-warning'">
                    {{ customer.status }}
                  </span>
                </td>
                <td>{{ customer.createdAt | date:'short' }}</td>
                <td>
                  <div class="flex items-center space-x-2 space-x-reverse">
                    <button 
                      (click)="viewCustomer(customer)"
                      class="text-blue-600 hover:text-blue-800"
                      title="عرض التفاصيل">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    </button>
                    <button 
                      (click)="editCustomer(customer)"
                      class="text-green-600 hover:text-green-800"
                      title="تعديل">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button 
                      (click)="deleteCustomer(customer)"
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

        <!-- Pagination -->
        <div *ngIf="pagination && pagination.totalPages > 1" class="mt-6 flex items-center justify-between">
          <div class="text-sm text-gray-700">
            عرض {{ (pagination.page - 1) * pagination.limit + 1 }} إلى {{ Math.min(pagination.page * pagination.limit, pagination.total) }} من {{ pagination.total }} عميل
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
        <div *ngIf="customers.length === 0 && !isLoading" class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">لا توجد عملاء</h3>
          <p class="text-gray-600 mb-4">ابدأ بإضافة عميل جديد لإدارة بياناته</p>
          <button 
            (click)="openCreateModal()"
            class="btn btn-primary">
            إضافة عميل جديد
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="text-center py-12">
          <div class="loading-spinner mx-auto mb-4"></div>
          <p class="text-gray-600">جاري تحميل العملاء...</p>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? 'تعديل العميل' : 'إضافة عميل جديد' }}
          </h3>
          <button 
            (click)="closeModal()"
            class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form [formGroup]="customerForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <!-- Name -->
            <div>
              <label class="form-label">الاسم *</label>
              <input 
                type="text" 
                formControlName="name"
                class="form-input"
                [class.border-red-500]="customerForm.get('name')?.invalid && customerForm.get('name')?.touched">
              <div *ngIf="customerForm.get('name')?.invalid && customerForm.get('name')?.touched" class="form-error">
                <span *ngIf="customerForm.get('name')?.errors?.['required']">الاسم مطلوب</span>
                <span *ngIf="customerForm.get('name')?.errors?.['minlength']">الاسم يجب أن يكون حرفين على الأقل</span>
              </div>
            </div>

            <!-- Phone -->
            <div>
              <label class="form-label">الهاتف</label>
              <input 
                type="tel" 
                formControlName="phone"
                class="form-input"
                placeholder="01234567890">
            </div>

            <!-- National ID -->
            <div>
              <label class="form-label">الرقم القومي</label>
              <input 
                type="text" 
                formControlName="nationalId"
                class="form-input"
                placeholder="12345678901234">
            </div>

            <!-- Address -->
            <div>
              <label class="form-label">العنوان</label>
              <textarea 
                formControlName="address"
                class="form-input"
                rows="3"
                placeholder="العنوان الكامل"></textarea>
            </div>

            <!-- Status -->
            <div>
              <label class="form-label">الحالة</label>
              <select formControlName="status" class="form-input">
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
              </select>
            </div>

            <!-- Notes -->
            <div>
              <label class="form-label">ملاحظات</label>
              <textarea 
                formControlName="notes"
                class="form-input"
                rows="3"
                placeholder="ملاحظات إضافية"></textarea>
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
              [disabled]="customerForm.invalid || isSubmitting"
              class="btn btn-primary"
              [class.opacity-50]="customerForm.invalid || isSubmitting">
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

    <!-- Customer Details Modal -->
    <div *ngIf="showDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">تفاصيل العميل</h3>
          <button 
            (click)="closeDetailsModal()"
            class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div *ngIf="selectedCustomer" class="space-y-6">
          <!-- Customer Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-gray-900 mb-2">المعلومات الشخصية</h4>
              <div class="space-y-2">
                <p><span class="font-medium">الاسم:</span> {{ selectedCustomer.name }}</p>
                <p><span class="font-medium">الهاتف:</span> {{ selectedCustomer.phone || '-' }}</p>
                <p><span class="font-medium">الرقم القومي:</span> {{ selectedCustomer.nationalId || '-' }}</p>
                <p><span class="font-medium">العنوان:</span> {{ selectedCustomer.address || '-' }}</p>
                <p><span class="font-medium">الحالة:</span> 
                  <span class="badge" [ngClass]="selectedCustomer.status === 'نشط' ? 'badge-success' : 'badge-warning'">
                    {{ selectedCustomer.status }}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <h4 class="font-medium text-gray-900 mb-2">الإحصائيات</h4>
              <div *ngIf="customerStats" class="space-y-2">
                <p><span class="font-medium">إجمالي العقود:</span> {{ customerStats.totalContracts }}</p>
                <p><span class="font-medium">إجمالي القيمة:</span> {{ customerStats.totalValue | number:'1.0-0' }} ج.م</p>
                <p><span class="font-medium">المبلغ المدفوع:</span> {{ customerStats.paidAmount | number:'1.0-0' }} ج.م</p>
                <p><span class="font-medium">المبلغ المعلق:</span> {{ customerStats.pendingAmount | number:'1.0-0' }} ج.م</p>
              </div>
            </div>
          </div>

          <!-- Customer Contracts -->
          <div>
            <h4 class="font-medium text-gray-900 mb-2">عقود العميل</h4>
            <div *ngIf="customerContracts.length > 0" class="space-y-2">
              <div *ngFor="let contract of customerContracts" class="p-3 border border-gray-200 rounded-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium">{{ contract.unit?.name || 'وحدة غير محددة' }}</p>
                    <p class="text-sm text-gray-600">{{ contract.totalPrice | number:'1.0-0' }} ج.م</p>
                  </div>
                  <span class="text-sm text-gray-500">{{ contract.start | date:'short' }}</span>
                </div>
              </div>
            </div>
            <div *ngIf="customerContracts.length === 0" class="text-center py-4 text-gray-500">
              لا توجد عقود لهذا العميل
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  customerStats: any = null;
  customerContracts: any[] = [];
  
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
  currentPage = 1;
  pageSize = 10;

  // Pagination
  pagination: any = null;

  // Form
  customerForm: FormGroup;

  // Math for template
  Math = Math;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService
  ) {
    this.customerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: [''],
      nationalId: [''],
      address: [''],
      status: ['نشط'],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      ...(this.searchTerm && { search: this.searchTerm }),
      ...(this.statusFilter && { status: this.statusFilter })
    };

    this.apiService.get<ApiResponse<Customer[]>>('/customers', params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customers = response.data;
          this.pagination = response.pagination;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadCustomers();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadCustomers();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadCustomers();
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.customerForm.reset();
    this.customerForm.patchValue({ status: 'نشط' });
    this.showModal = true;
    this.errorMessage = '';
  }

  editCustomer(customer: Customer): void {
    this.isEditing = true;
    this.customerForm.patchValue(customer);
    this.showModal = true;
    this.errorMessage = '';
  }

  viewCustomer(customer: Customer): void {
    this.selectedCustomer = customer;
    this.loadCustomerDetails(customer.id);
    this.showDetailsModal = true;
  }

  loadCustomerDetails(customerId: string): void {
    // Load customer stats
    this.apiService.get<ApiResponse>(`/customers/${customerId}/stats`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customerStats = response.data;
        }
      }
    });

    // Load customer contracts
    this.apiService.get<ApiResponse>(`/customers/${customerId}/contracts`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customerContracts = response.data;
        }
      }
    });
  }

  deleteCustomer(customer: Customer): void {
    if (confirm(`هل أنت متأكد من حذف العميل "${customer.name}"؟`)) {
      this.apiService.delete<ApiResponse>(`/customers/${customer.id}`).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadCustomers();
          }
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const customerData = this.customerForm.value;

      if (this.isEditing && this.selectedCustomer) {
        // Update customer
        this.apiService.put<ApiResponse<Customer>>(`/customers/${this.selectedCustomer.id}`, customerData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeModal();
              this.loadCustomers();
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.errorMessage = error.message || 'حدث خطأ أثناء تحديث العميل';
            this.isSubmitting = false;
          }
        });
      } else {
        // Create customer
        this.apiService.post<ApiResponse<Customer>>('/customers', customerData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeModal();
              this.loadCustomers();
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.errorMessage = error.message || 'حدث خطأ أثناء إضافة العميل';
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.selectedCustomer = null;
    this.customerForm.reset();
    this.errorMessage = '';
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedCustomer = null;
    this.customerStats = null;
    this.customerContracts = [];
  }
}