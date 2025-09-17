import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Contract, ContractFormData, ContractFilters } from '../../models/contract.model';
import { Customer } from '../../models/customer.model';
import { Unit } from '../../models/unit.model';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">إدارة العقود</h1>
          <p class="text-gray-600">إدارة العقود والمبيعات</p>
        </div>
        <button 
          class="btn btn-primary"
          (click)="openAddModal()">
          + عقد جديد
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
              placeholder="البحث بالعميل أو الوحدة..."
              [(ngModel)]="filters.search"
              (input)="onSearch()">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
            <input 
              type="date" 
              class="input"
              [(ngModel)]="filters.start_date"
              (change)="onFilterChange()">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
            <input 
              type="date" 
              class="input"
              [(ngModel)]="filters.end_date"
              (change)="onFilterChange()">
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
          <button class="btn btn-danger text-sm" (click)="loadContracts()">
            إعادة المحاولة
          </button>
        </div>
      </div>

      <!-- Contracts Table -->
      <div *ngIf="!loading && !error" class="card p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>العميل</th>
                <th>الوحدة</th>
                <th>تاريخ العقد</th>
                <th>السعر الإجمالي</th>
                <th>الخصم</th>
                <th>المقدم</th>
                <th>نوع الدفع</th>
                <th>السمسار</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let contract of contracts" class="animate-fade-in">
                <td class="font-medium">{{ contract.customer?.name || '-' }}</td>
                <td>{{ contract.unit?.code || '-' }}</td>
                <td>{{ formatDate(contract.start) }}</td>
                <td class="font-medium">{{ formatCurrency(contract.total_price) }}</td>
                <td>{{ formatCurrency(contract.discount_amount) }}</td>
                <td>{{ formatCurrency(contract.down_payment) }}</td>
                <td>
                  <span 
                    class="px-2 py-1 text-xs rounded-full"
                    [ngClass]="contract.payment_type === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'">
                    {{ contract.payment_type === 'cash' ? 'نقدي' : 'أقساط' }}
                  </span>
                </td>
                <td>{{ contract.broker_name || '-' }}</td>
                <td>
                  <div class="flex gap-2">
                    <button 
                      class="btn btn-secondary text-xs"
                      (click)="editContract(contract)">
                      تعديل
                    </button>
                    <button 
                      class="btn btn-danger text-xs"
                      (click)="deleteContract(contract)">
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
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl animate-scale-in max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ editingContract ? 'تعديل العقد' : 'عقد جديد' }}
            </h3>
          </div>
          
          <form [formGroup]="contractForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">العميل *</label>
                <select 
                  class="input"
                  formControlName="customer_id"
                  (change)="onCustomerChange()">
                  <option value="">اختر العميل</option>
                  <option *ngFor="let customer of customers" [value]="customer.id">
                    {{ customer.name }} - {{ customer.phone || customer.national_id }}
                  </option>
                </select>
                <div *ngIf="contractForm.get('customer_id')?.invalid && contractForm.get('customer_id')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  العميل مطلوب
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">الوحدة *</label>
                <select 
                  class="input"
                  formControlName="unit_id"
                  (change)="onUnitChange()">
                  <option value="">اختر الوحدة</option>
                  <option *ngFor="let unit of availableUnits" [value]="unit.id">
                    {{ unit.code }} - {{ unit.name || unit.unit_type }} - {{ formatCurrency(unit.total_price) }}
                  </option>
                </select>
                <div *ngIf="contractForm.get('unit_id')?.invalid && contractForm.get('unit_id')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  الوحدة مطلوبة
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">تاريخ العقد *</label>
                <input 
                  type="date" 
                  class="input"
                  formControlName="start">
                <div *ngIf="contractForm.get('start')?.invalid && contractForm.get('start')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  تاريخ العقد مطلوب
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">السعر الإجمالي *</label>
                <input 
                  type="number" 
                  class="input"
                  formControlName="total_price"
                  placeholder="السعر الإجمالي"
                  min="0"
                  step="0.01">
                <div *ngIf="contractForm.get('total_price')?.invalid && contractForm.get('total_price')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  السعر الإجمالي مطلوب
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">مبلغ الخصم</label>
                <input 
                  type="number" 
                  class="input"
                  formControlName="discount_amount"
                  placeholder="مبلغ الخصم"
                  min="0"
                  step="0.01">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">المقدم</label>
                <input 
                  type="number" 
                  class="input"
                  formControlName="down_payment"
                  placeholder="المقدم"
                  min="0"
                  step="0.01">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">نوع الدفع</label>
                <select class="input" formControlName="payment_type">
                  <option value="installment">أقساط</option>
                  <option value="cash">نقدي</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">اسم السمسار</label>
                <input 
                  type="text" 
                  class="input"
                  formControlName="broker_name"
                  placeholder="اسم السمسار">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">نسبة السمسار (%)</label>
                <input 
                  type="number" 
                  class="input"
                  formControlName="broker_percent"
                  placeholder="نسبة السمسار"
                  min="0"
                  max="100"
                  step="0.01">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">مبلغ السمسار</label>
                <input 
                  type="number" 
                  class="input"
                  formControlName="broker_amount"
                  placeholder="مبلغ السمسار"
                  min="0"
                  step="0.01">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">نوع الأقساط</label>
                <select class="input" formControlName="installment_type">
                  <option value="شهري">شهري</option>
                  <option value="ربع سنوي">ربع سنوي</option>
                  <option value="نصف سنوي">نصف سنوي</option>
                  <option value="سنوي">سنوي</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">عدد الأقساط</label>
                <input 
                  type="number" 
                  class="input"
                  formControlName="installment_count"
                  placeholder="عدد الأقساط"
                  min="0">
              </div>
            </div>

            <div class="flex gap-3 pt-4">
              <button 
                type="submit" 
                class="btn btn-primary flex-1"
                [disabled]="contractForm.invalid || submitting">
                {{ submitting ? 'جاري الحفظ...' : (editingContract ? 'تحديث' : 'إضافة') }}
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
export class ContractsComponent implements OnInit {
  contracts: Contract[] = [];
  customers: Customer[] = [];
  availableUnits: Unit[] = [];
  loading = false;
  error: string | null = null;
  showModal = false;
  editingContract: Contract | null = null;
  submitting = false;
  
  filters: ContractFilters = {
    search: '',
    page: 1,
    per_page: 15
  };

  pagination: any = null;
  contractForm: FormGroup;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.contractForm = this.fb.group({
      unit_id: ['', Validators.required],
      customer_id: ['', Validators.required],
      start: ['', Validators.required],
      total_price: [0, [Validators.required, Validators.min(0.01)]],
      discount_amount: [0],
      broker_name: [''],
      broker_percent: [0],
      broker_amount: [0],
      commission_safe_id: [''],
      down_payment_safe_id: [''],
      maintenance_deposit: [0],
      installment_type: ['شهري'],
      installment_count: [0],
      extra_annual: [0],
      annual_payment_value: [0],
      down_payment: [0],
      payment_type: ['installment']
    });
  }

  ngOnInit() {
    this.loadContracts();
    this.loadCustomers();
    this.loadAvailableUnits();
  }

  loadContracts() {
    this.loading = true;
    this.error = null;

    this.apiService.getContracts(this.filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.contracts = response.data;
          this.pagination = response.pagination;
        } else {
          this.error = 'فشل في تحميل العقود';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.loading = false;
        console.error('Contracts error:', error);
      }
    });
  }

  loadCustomers() {
    this.apiService.getCustomers().subscribe({
      next: (response) => {
        if (response.success) {
          this.customers = response.data;
        }
      },
      error: (error) => {
        console.error('Customers error:', error);
      }
    });
  }

  loadAvailableUnits() {
    this.apiService.getUnits({ status: 'متاحة' }).subscribe({
      next: (response) => {
        if (response.success) {
          this.availableUnits = response.data;
        }
      },
      error: (error) => {
        console.error('Units error:', error);
      }
    });
  }

  onSearch() {
    this.filters.page = 1;
    this.loadContracts();
  }

  onFilterChange() {
    this.filters.page = 1;
    this.loadContracts();
  }

  resetFilters() {
    this.filters = {
      search: '',
      page: 1,
      per_page: 15
    };
    this.loadContracts();
  }

  goToPage(page: number) {
    this.filters.page = page;
    this.loadContracts();
  }

  openAddModal() {
    this.editingContract = null;
    this.contractForm.reset({
      payment_type: 'installment',
      installment_type: 'شهري',
      total_price: 0,
      discount_amount: 0,
      broker_percent: 0,
      broker_amount: 0,
      maintenance_deposit: 0,
      installment_count: 0,
      extra_annual: 0,
      annual_payment_value: 0,
      down_payment: 0
    });
    this.showModal = true;
  }

  editContract(contract: Contract) {
    this.editingContract = contract;
    this.contractForm.patchValue(contract);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingContract = null;
    this.contractForm.reset();
  }

  onCustomerChange() {
    // يمكن إضافة منطق إضافي هنا
  }

  onUnitChange() {
    // يمكن إضافة منطق إضافي هنا
  }

  onSubmit() {
    if (this.contractForm.invalid) return;

    this.submitting = true;
    const formData: ContractFormData = this.contractForm.value;

    const operation = this.editingContract 
      ? this.apiService.updateContract(this.editingContract.id, formData)
      : this.apiService.createContract(formData);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
          this.closeModal();
          this.loadContracts();
          this.loadAvailableUnits(); // تحديث قائمة الوحدات المتاحة
        } else {
          this.error = 'فشل في حفظ العقد';
        }
        this.submitting = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.submitting = false;
        console.error('Save contract error:', error);
      }
    });
  }

  deleteContract(contract: Contract) {
    if (confirm(`هل أنت متأكد من حذف العقد للعميل "${contract.customer?.name}"؟`)) {
      this.apiService.deleteContract(contract.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadContracts();
            this.loadAvailableUnits(); // تحديث قائمة الوحدات المتاحة
          } else {
            this.error = 'فشل في حذف العقد';
          }
        },
        error: (error) => {
          this.error = 'خطأ في الاتصال بالخادم';
          console.error('Delete contract error:', error);
        }
      });
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

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA');
  }
}