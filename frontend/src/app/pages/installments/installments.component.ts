import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Installment, InstallmentFormData, InstallmentFilters, PaymentData } from '../../models/installment.model';
import { Unit } from '../../models/unit.model';

@Component({
  selector: 'app-installments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">إدارة الأقساط</h1>
          <p class="text-gray-600">إدارة الأقساط والتحصيل</p>
        </div>
        <button 
          class="btn btn-primary"
          (click)="openAddModal()">
          + قسط جديد
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">إجمالي الأقساط</p>
              <p class="text-lg font-bold text-blue-600">{{ totalInstallments }}</p>
            </div>
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">📊</span>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">المدفوعة</p>
              <p class="text-lg font-bold text-green-600">{{ paidInstallments }}</p>
            </div>
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">✅</span>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">المعلقة</p>
              <p class="text-lg font-bold text-orange-600">{{ pendingInstallments }}</p>
            </div>
            <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">⏳</span>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">المتأخرة</p>
              <p class="text-lg font-bold text-red-600">{{ overdueInstallments }}</p>
            </div>
            <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">⚠️</span>
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
              placeholder="البحث بالوحدة..."
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
              <option value="معلق">معلق</option>
              <option value="مدفوع">مدفوع</option>
              <option value="متأخر">متأخر</option>
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
          <button class="btn btn-danger text-sm" (click)="loadInstallments()">
            إعادة المحاولة
          </button>
        </div>
      </div>

      <!-- Installments Table -->
      <div *ngIf="!loading && !error" class="card p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>الوحدة</th>
                <th>المبلغ</th>
                <th>تاريخ الاستحقاق</th>
                <th>الحالة</th>
                <th>التأخير</th>
                <th>ملاحظات</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let installment of installments" class="animate-fade-in">
                <td class="font-medium">{{ installment.unit?.code || '-' }}</td>
                <td class="font-medium">{{ formatCurrency(installment.amount) }}</td>
                <td>{{ formatDate(installment.due_date) }}</td>
                <td>
                  <span 
                    class="px-2 py-1 text-xs rounded-full"
                    [ngClass]="getStatusClass(installment.status, installment.is_overdue)">
                    {{ installment.status }}
                  </span>
                </td>
                <td>
                  <span *ngIf="installment.is_overdue" class="text-red-600 text-sm">
                    {{ installment.days_overdue }} يوم
                  </span>
                  <span *ngIf="!installment.is_overdue" class="text-gray-400 text-sm">
                    -
                  </span>
                </td>
                <td class="max-w-xs truncate">{{ installment.notes || '-' }}</td>
                <td>
                  <div class="flex gap-2">
                    <button 
                      *ngIf="installment.status === 'معلق'"
                      class="btn btn-success text-xs"
                      (click)="markAsPaid(installment)">
                      دفع
                    </button>
                    <button 
                      class="btn btn-secondary text-xs"
                      (click)="editInstallment(installment)">
                      تعديل
                    </button>
                    <button 
                      class="btn btn-danger text-xs"
                      (click)="deleteInstallment(installment)">
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
              {{ editingInstallment ? 'تعديل القسط' : 'قسط جديد' }}
            </h3>
          </div>
          
          <form [formGroup]="installmentForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">الوحدة *</label>
                <select 
                  class="input"
                  formControlName="unit_id">
                  <option value="">اختر الوحدة</option>
                  <option *ngFor="let unit of units" [value]="unit.id">
                    {{ unit.code }} - {{ unit.name || unit.unit_type }}
                  </option>
                </select>
                <div *ngIf="installmentForm.get('unit_id')?.invalid && installmentForm.get('unit_id')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  الوحدة مطلوبة
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">المبلغ *</label>
                <input 
                  type="number" 
                  class="input"
                  formControlName="amount"
                  placeholder="مبلغ القسط"
                  min="0"
                  step="0.01">
                <div *ngIf="installmentForm.get('amount')?.invalid && installmentForm.get('amount')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  المبلغ مطلوب
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">تاريخ الاستحقاق *</label>
                <input 
                  type="date" 
                  class="input"
                  formControlName="due_date">
                <div *ngIf="installmentForm.get('due_date')?.invalid && installmentForm.get('due_date')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  تاريخ الاستحقاق مطلوب
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                <select class="input" formControlName="status">
                  <option value="معلق">معلق</option>
                  <option value="مدفوع">مدفوع</option>
                  <option value="متأخر">متأخر</option>
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
                [disabled]="installmentForm.invalid || submitting">
                {{ submitting ? 'جاري الحفظ...' : (editingInstallment ? 'تحديث' : 'إضافة') }}
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

      <!-- Payment Modal -->
      <div *ngIf="showPaymentModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">تسجيل الدفع</h3>
          </div>
          
          <form [formGroup]="paymentForm" (ngSubmit)="onPaymentSubmit()" class="p-6 space-y-4">
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
              <div *ngIf="paymentForm.get('safe_id')?.invalid && paymentForm.get('safe_id')?.touched" 
                   class="text-red-500 text-xs mt-1">
                الخزينة مطلوبة
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
                class="btn btn-success flex-1"
                [disabled]="paymentForm.invalid || submitting">
                {{ submitting ? 'جاري التسجيل...' : 'تسجيل الدفع' }}
              </button>
              <button 
                type="button" 
                class="btn btn-secondary"
                (click)="closePaymentModal()">
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
export class InstallmentsComponent implements OnInit {
  installments: Installment[] = [];
  units: Unit[] = [];
  safes: any[] = [];
  loading = false;
  error: string | null = null;
  showModal = false;
  showPaymentModal = false;
  editingInstallment: Installment | null = null;
  selectedInstallment: Installment | null = null;
  submitting = false;
  
  // Stats
  totalInstallments = 0;
  paidInstallments = 0;
  pendingInstallments = 0;
  overdueInstallments = 0;
  
  filters: InstallmentFilters = {
    search: '',
    page: 1,
    per_page: 15
  };

  pagination: any = null;
  installmentForm: FormGroup;
  paymentForm: FormGroup;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.installmentForm = this.fb.group({
      unit_id: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      due_date: ['', Validators.required],
      status: ['معلق'],
      notes: ['']
    });

    this.paymentForm = this.fb.group({
      safe_id: ['', Validators.required],
      payer: [''],
      beneficiary: [''],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadInstallments();
    this.loadUnits();
    this.loadSafes();
    this.loadStats();
  }

  loadInstallments() {
    this.loading = true;
    this.error = null;

    this.apiService.getInstallments(this.filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.installments = response.data;
          this.pagination = response.pagination;
        } else {
          this.error = 'فشل في تحميل الأقساط';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.loading = false;
        console.error('Installments error:', error);
      }
    });
  }

  loadUnits() {
    this.apiService.getUnits().subscribe({
      next: (response) => {
        if (response.success) {
          this.units = response.data;
        }
      },
      error: (error) => {
        console.error('Units error:', error);
      }
    });
  }

  loadSafes() {
    // TODO: Implement safes API
    this.safes = [
      { id: 1, name: 'الخزينة الرئيسية', balance: 100000 },
      { id: 2, name: 'خزينة الأقساط', balance: 50000 }
    ];
  }

  loadStats() {
    // TODO: Implement stats API
    this.totalInstallments = this.installments.length;
    this.paidInstallments = this.installments.filter(i => i.status === 'مدفوع').length;
    this.pendingInstallments = this.installments.filter(i => i.status === 'معلق').length;
    this.overdueInstallments = this.installments.filter(i => i.is_overdue).length;
  }

  onSearch() {
    this.filters.page = 1;
    this.loadInstallments();
  }

  onFilterChange() {
    this.filters.page = 1;
    this.loadInstallments();
  }

  resetFilters() {
    this.filters = {
      search: '',
      page: 1,
      per_page: 15
    };
    this.loadInstallments();
  }

  goToPage(page: number) {
    this.filters.page = page;
    this.loadInstallments();
  }

  openAddModal() {
    this.editingInstallment = null;
    this.installmentForm.reset({
      status: 'معلق',
      amount: 0
    });
    this.showModal = true;
  }

  editInstallment(installment: Installment) {
    this.editingInstallment = installment;
    this.installmentForm.patchValue(installment);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingInstallment = null;
    this.installmentForm.reset();
  }

  markAsPaid(installment: Installment) {
    this.selectedInstallment = installment;
    this.paymentForm.reset();
    this.showPaymentModal = true;
  }

  closePaymentModal() {
    this.showPaymentModal = false;
    this.selectedInstallment = null;
    this.paymentForm.reset();
  }

  onSubmit() {
    if (this.installmentForm.invalid) return;

    this.submitting = true;
    const formData: InstallmentFormData = this.installmentForm.value;

    const operation = this.editingInstallment 
      ? this.apiService.updateInstallment(this.editingInstallment.id, formData)
      : this.apiService.createInstallment(formData);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
          this.closeModal();
          this.loadInstallments();
          this.loadStats();
        } else {
          this.error = 'فشل في حفظ القسط';
        }
        this.submitting = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.submitting = false;
        console.error('Save installment error:', error);
      }
    });
  }

  onPaymentSubmit() {
    if (this.paymentForm.invalid || !this.selectedInstallment) return;

    this.submitting = true;
    const paymentData: PaymentData = this.paymentForm.value;

    this.apiService.markInstallmentAsPaid(this.selectedInstallment.id, paymentData).subscribe({
      next: (response) => {
        if (response.success) {
          this.closePaymentModal();
          this.loadInstallments();
          this.loadStats();
        } else {
          this.error = 'فشل في تسجيل الدفع';
        }
        this.submitting = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.submitting = false;
        console.error('Payment error:', error);
      }
    });
  }

  deleteInstallment(installment: Installment) {
    if (confirm(`هل أنت متأكد من حذف القسط للوحدة "${installment.unit?.code}"؟`)) {
      this.apiService.deleteInstallment(installment.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadInstallments();
            this.loadStats();
          } else {
            this.error = 'فشل في حذف القسط';
          }
        },
        error: (error) => {
          this.error = 'خطأ في الاتصال بالخادم';
          console.error('Delete installment error:', error);
        }
      });
    }
  }

  getStatusClass(status: string, isOverdue: boolean = false): string {
    if (isOverdue) {
      return 'bg-red-100 text-red-800';
    }
    
    switch (status) {
      case 'مدفوع':
        return 'bg-green-100 text-green-800';
      case 'معلق':
        return 'bg-yellow-100 text-yellow-800';
      case 'متأخر':
        return 'bg-red-100 text-red-800';
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

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA');
  }
}