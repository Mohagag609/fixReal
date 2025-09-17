import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-vouchers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">إدارة السندات</h1>
          <p class="text-gray-600">سندات القبض والدفع</p>
        </div>
        <div class="flex gap-2">
          <button 
            class="btn btn-success"
            (click)="openAddModal('receipt')">
            + سند قبض
          </button>
          <button 
            class="btn btn-danger"
            (click)="openAddModal('payment')">
            + سند دفع
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">إجمالي السندات</p>
              <p class="text-lg font-bold text-blue-600">{{ stats.total_vouchers || 0 }}</p>
            </div>
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">📊</span>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">إجمالي القبض</p>
              <p class="text-lg font-bold text-green-600">{{ formatCurrency(stats.total_receipts || 0) }}</p>
            </div>
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">💰</span>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">إجمالي الدفع</p>
              <p class="text-lg font-bold text-red-600">{{ formatCurrency(stats.total_payments || 0) }}</p>
            </div>
            <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">💸</span>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">الرصيد الصافي</p>
              <p class="text-lg font-bold" [ngClass]="(stats.net_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(stats.net_balance || 0) }}
              </p>
            </div>
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" 
                 [ngClass]="(stats.net_balance || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'">
              <span class="text-sm">{{ (stats.net_balance || 0) >= 0 ? '📈' : '📉' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">البحث</label>
            <input 
              type="text" 
              class="input"
              placeholder="البحث في الوصف أو الأسماء..."
              [(ngModel)]="filters.search"
              (input)="onSearch()">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">النوع</label>
            <select 
              class="input"
              [(ngModel)]="filters.type"
              (change)="onFilterChange()">
              <option value="">جميع الأنواع</option>
              <option value="receipt">قبض</option>
              <option value="payment">دفع</option>
            </select>
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
          <button class="btn btn-danger text-sm" (click)="loadVouchers()">
            إعادة المحاولة
          </button>
        </div>
      </div>

      <!-- Vouchers Table -->
      <div *ngIf="!loading && !error" class="card p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>النوع</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>الوصف</th>
                <th>الخزينة</th>
                <th>المدفوع من</th>
                <th>المستفيد</th>
                <th>المرجع</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let voucher of vouchers" class="animate-fade-in">
                <td>
                  <span 
                    class="px-2 py-1 text-xs rounded-full"
                    [ngClass]="voucher.type === 'receipt' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ voucher.type_label }}
                  </span>
                </td>
                <td>{{ formatDate(voucher.date) }}</td>
                <td class="font-medium">{{ formatCurrency(voucher.amount) }}</td>
                <td class="max-w-xs truncate">{{ voucher.description }}</td>
                <td>{{ voucher.safe?.name || '-' }}</td>
                <td>{{ voucher.payer || '-' }}</td>
                <td>{{ voucher.beneficiary || '-' }}</td>
                <td>{{ voucher.linked_ref || '-' }}</td>
                <td>
                  <div class="flex gap-2">
                    <button 
                      class="btn btn-secondary text-xs"
                      (click)="editVoucher(voucher)">
                      تعديل
                    </button>
                    <button 
                      class="btn btn-danger text-xs"
                      (click)="deleteVoucher(voucher)">
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
              {{ editingVoucher ? 'تعديل السند' : (voucherType === 'receipt' ? 'سند قبض جديد' : 'سند دفع جديد') }}
            </h3>
          </div>
          
          <form [formGroup]="voucherForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">النوع *</label>
                <select 
                  class="input"
                  formControlName="type"
                  (change)="onTypeChange()">
                  <option value="receipt">قبض</option>
                  <option value="payment">دفع</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">التاريخ *</label>
                <input 
                  type="date" 
                  class="input"
                  formControlName="date">
                <div *ngIf="voucherForm.get('date')?.invalid && voucherForm.get('date')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  التاريخ مطلوب
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">المبلغ *</label>
                <input 
                  type="number" 
                  class="input"
                  formControlName="amount"
                  placeholder="مبلغ السند"
                  min="0"
                  step="0.01">
                <div *ngIf="voucherForm.get('amount')?.invalid && voucherForm.get('amount')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  المبلغ مطلوب
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">الخزينة *</label>
                <select 
                  class="input"
                  formControlName="safe_id">
                  <option value="">اختر الخزينة</option>
                  <option *ngFor="let safe of safes" [value]="safe.id">
                    {{ safe.name }} - {{ formatCurrency(safe.balance) }}
                  </option>
                </select>
                <div *ngIf="voucherForm.get('safe_id')?.invalid && voucherForm.get('safe_id')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  الخزينة مطلوبة
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">الوصف *</label>
                <input 
                  type="text" 
                  class="input"
                  formControlName="description"
                  placeholder="وصف السند">
                <div *ngIf="voucherForm.get('description')?.invalid && voucherForm.get('description')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  الوصف مطلوب
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">المدفوع من</label>
                <input 
                  type="text" 
                  class="input"
                  formControlName="payer"
                  placeholder="اسم المدفوع">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">المستفيد</label>
                <input 
                  type="text" 
                  class="input"
                  formControlName="beneficiary"
                  placeholder="اسم المستفيد">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">المرجع</label>
                <input 
                  type="text" 
                  class="input"
                  formControlName="linked_ref"
                  placeholder="مرجع مرتبط">
              </div>
            </div>

            <div class="flex gap-3 pt-4">
              <button 
                type="submit" 
                class="btn flex-1"
                [ngClass]="voucherType === 'receipt' ? 'btn-success' : 'btn-danger'"
                [disabled]="voucherForm.invalid || submitting">
                {{ submitting ? 'جاري الحفظ...' : (editingVoucher ? 'تحديث' : 'إضافة') }}
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
export class VouchersComponent implements OnInit {
  vouchers: any[] = [];
  safes: any[] = [];
  loading = false;
  error: string | null = null;
  showModal = false;
  editingVoucher: any = null;
  voucherType: string = 'receipt';
  submitting = false;
  
  stats: any = {};
  
  filters: any = {
    search: '',
    type: '',
    start_date: '',
    end_date: '',
    page: 1,
    per_page: 15
  };

  pagination: any = null;
  voucherForm: FormGroup;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.voucherForm = this.fb.group({
      type: ['receipt', Validators.required],
      date: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      safe_id: ['', Validators.required],
      description: ['', Validators.required],
      payer: [''],
      beneficiary: [''],
      linked_ref: ['']
    });
  }

  ngOnInit() {
    this.loadVouchers();
    this.loadSafes();
    this.loadStats();
  }

  loadVouchers() {
    this.loading = true;
    this.error = null;

    this.apiService.getVouchers(this.filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.vouchers = response.data;
          this.pagination = response.pagination;
        } else {
          this.error = 'فشل في تحميل السندات';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.loading = false;
        console.error('Vouchers error:', error);
      }
    });
  }

  loadSafes() {
    // TODO: Implement safes API
    this.safes = [
      { id: 1, name: 'الخزينة الرئيسية', balance: 100000 },
      { id: 2, name: 'خزينة الأقساط', balance: 50000 },
      { id: 3, name: 'خزينة المصروفات', balance: 25000 }
    ];
  }

  loadStats() {
    this.apiService.getVoucherStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data;
        }
      },
      error: (error) => {
        console.error('Stats error:', error);
      }
    });
  }

  onSearch() {
    this.filters.page = 1;
    this.loadVouchers();
  }

  onFilterChange() {
    this.filters.page = 1;
    this.loadVouchers();
  }

  resetFilters() {
    this.filters = {
      search: '',
      type: '',
      start_date: '',
      end_date: '',
      page: 1,
      per_page: 15
    };
    this.loadVouchers();
  }

  goToPage(page: number) {
    this.filters.page = page;
    this.loadVouchers();
  }

  openAddModal(type: string) {
    this.editingVoucher = null;
    this.voucherType = type;
    this.voucherForm.reset({
      type: type,
      date: new Date().toISOString().split('T')[0],
      amount: 0
    });
    this.showModal = true;
  }

  editVoucher(voucher: any) {
    this.editingVoucher = voucher;
    this.voucherType = voucher.type;
    this.voucherForm.patchValue(voucher);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingVoucher = null;
    this.voucherForm.reset();
  }

  onTypeChange() {
    this.voucherType = this.voucherForm.get('type')?.value;
  }

  onSubmit() {
    if (this.voucherForm.invalid) return;

    this.submitting = true;
    const formData = this.voucherForm.value;

    const operation = this.editingVoucher 
      ? this.apiService.updateVoucher(this.editingVoucher.id, formData)
      : this.apiService.createVoucher(formData);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
          this.closeModal();
          this.loadVouchers();
          this.loadStats();
        } else {
          this.error = 'فشل في حفظ السند';
        }
        this.submitting = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.submitting = false;
        console.error('Save voucher error:', error);
      }
    });
  }

  deleteVoucher(voucher: any) {
    if (confirm(`هل أنت متأكد من حذف السند "${voucher.description}"؟`)) {
      this.apiService.deleteVoucher(voucher.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadVouchers();
            this.loadStats();
          } else {
            this.error = 'فشل في حذف السند';
          }
        },
        error: (error) => {
          this.error = 'خطأ في الاتصال بالخادم';
          console.error('Delete voucher error:', error);
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