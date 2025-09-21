import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Customer, CustomerFormData, CustomerFilters } from '../../models/customer.model';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">إدارة العملاء</h1>
          <p class="text-gray-600">إضافة وتعديل وإدارة بيانات العملاء</p>
        </div>
        <button 
          class="btn btn-primary"
          (click)="openAddModal()">
          + عميل جديد
        </button>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">البحث</label>
            <input 
              type="text" 
              class="input"
              placeholder="البحث بالاسم أو الهاتف..."
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
              <option value="نشط">نشط</option>
              <option value="غير نشط">غير نشط</option>
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
          <button class="btn btn-danger text-sm" (click)="loadCustomers()">
            إعادة المحاولة
          </button>
        </div>
      </div>

      <!-- Customers Table -->
      <div *ngIf="!loading && !error" class="card p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الهاتف</th>
                <th>رقم الهوية</th>
                <th>العنوان</th>
                <th>الحالة</th>
                <th>عدد العقود</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let customer of customers" class="animate-fade-in">
                <td class="font-medium">{{ customer.name }}</td>
                <td>{{ customer.phone || '-' }}</td>
                <td>{{ customer.national_id || '-' }}</td>
                <td class="max-w-xs truncate">{{ customer.address || '-' }}</td>
                <td>
                  <span 
                    class="px-2 py-1 text-xs rounded-full"
                    [ngClass]="customer.status === 'نشط' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ customer.status }}
                  </span>
                </td>
                <td>{{ customer.contracts_count || 0 }}</td>
                <td>
                  <div class="flex gap-2">
                    <button 
                      class="btn btn-secondary text-xs"
                      (click)="editCustomer(customer)">
                      تعديل
                    </button>
                    <button 
                      class="btn btn-danger text-xs"
                      (click)="deleteCustomer(customer)">
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
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ editingCustomer ? 'تعديل العميل' : 'عميل جديد' }}
            </h3>
          </div>
          
          <form [formGroup]="customerForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">الاسم *</label>
              <input 
                type="text" 
                class="input"
                formControlName="name"
                placeholder="اسم العميل">
              <div *ngIf="customerForm.get('name')?.invalid && customerForm.get('name')?.touched" 
                   class="text-red-500 text-xs mt-1">
                الاسم مطلوب
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">الهاتف</label>
              <input 
                type="tel" 
                class="input"
                formControlName="phone"
                placeholder="رقم الهاتف">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">رقم الهوية</label>
              <input 
                type="text" 
                class="input"
                formControlName="national_id"
                placeholder="رقم الهوية الوطنية">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
              <textarea 
                class="input"
                formControlName="address"
                placeholder="عنوان العميل"
                rows="3"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
              <select class="input" formControlName="status">
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
              </select>
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
                [disabled]="customerForm.invalid || submitting">
                {{ submitting ? 'جاري الحفظ...' : (editingCustomer ? 'تحديث' : 'إضافة') }}
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
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  loading = false;
  error: string | null = null;
  showModal = false;
  editingCustomer: Customer | null = null;
  submitting = false;
  
  filters: CustomerFilters = {
    search: '',
    status: '',
    page: 1,
    per_page: 15
  };

  pagination: any = null;
  customerForm: FormGroup;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      phone: [''],
      national_id: [''],
      address: [''],
      status: ['نشط'],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading = true;
    this.error = null;

    this.apiService.getCustomers(this.filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.customers = response.data;
          this.pagination = response.pagination;
        } else {
          this.error = 'فشل في تحميل العملاء';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.loading = false;
        console.error('Customers error:', error);
      }
    });
  }

  onSearch() {
    this.filters.page = 1;
    this.loadCustomers();
  }

  onFilterChange() {
    this.filters.page = 1;
    this.loadCustomers();
  }

  resetFilters() {
    this.filters = {
      search: '',
      status: '',
      page: 1,
      per_page: 15
    };
    this.loadCustomers();
  }

  goToPage(page: number) {
    this.filters.page = page;
    this.loadCustomers();
  }

  openAddModal() {
    this.editingCustomer = null;
    this.customerForm.reset({
      status: 'نشط'
    });
    this.showModal = true;
  }

  editCustomer(customer: Customer) {
    this.editingCustomer = customer;
    this.customerForm.patchValue(customer);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingCustomer = null;
    this.customerForm.reset();
  }

  onSubmit() {
    if (this.customerForm.invalid) return;

    this.submitting = true;
    const formData: CustomerFormData = this.customerForm.value;

    const operation = this.editingCustomer 
      ? this.apiService.updateCustomer(this.editingCustomer.id, formData)
      : this.apiService.createCustomer(formData);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
          this.closeModal();
          this.loadCustomers();
        } else {
          this.error = 'فشل في حفظ العميل';
        }
        this.submitting = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.submitting = false;
        console.error('Save customer error:', error);
      }
    });
  }

  deleteCustomer(customer: Customer) {
    if (confirm(`هل أنت متأكد من حذف العميل "${customer.name}"؟`)) {
      this.apiService.deleteCustomer(customer.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadCustomers();
          } else {
            this.error = 'فشل في حذف العميل';
          }
        },
        error: (error) => {
          this.error = 'خطأ في الاتصال بالخادم';
          console.error('Delete customer error:', error);
        }
      });
    }
  }
}