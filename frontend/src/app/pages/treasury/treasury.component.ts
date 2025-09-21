import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-treasury',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">إدارة الخزينة</h1>
          <p class="text-gray-600">إدارة الخزائن والمعاملات المالية</p>
        </div>
        <div class="flex gap-2">
          <button 
            class="btn btn-primary"
            (click)="openAddModal()">
            + خزينة جديدة
          </button>
          <button 
            class="btn btn-secondary"
            (click)="openTransferModal()">
            تحويل بين الخزائن
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">إجمالي الخزائن</p>
              <p class="text-lg font-bold text-blue-600">{{ stats.total_safes || 0 }}</p>
            </div>
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">🏦</span>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">إجمالي الرصيد</p>
              <p class="text-lg font-bold text-green-600">{{ formatCurrency(stats.total_balance || 0) }}</p>
            </div>
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">💰</span>
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
              <span class="text-sm">📈</span>
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
              <span class="text-sm">📉</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Safes Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let safe of safes" class="card hover:shadow-lg transition-shadow duration-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">{{ safe.name }}</h3>
            <div class="flex gap-2">
              <button 
                class="btn btn-secondary text-xs"
                (click)="editSafe(safe)">
                تعديل
              </button>
              <button 
                class="btn btn-danger text-xs"
                (click)="deleteSafe(safe)">
                حذف
              </button>
            </div>
          </div>
          
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">الرصيد الحالي:</span>
              <span class="text-lg font-bold" [ngClass]="safe.balance >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(safe.balance) }}
              </span>
            </div>
            
            <div *ngIf="safe.description" class="text-sm text-gray-500">
              {{ safe.description }}
            </div>
            
            <div class="pt-2">
              <button 
                class="btn btn-primary text-xs w-full"
                (click)="viewTransactions(safe)">
                عرض المعاملات
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Safe Modal -->
      <div *ngIf="showSafeModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ editingSafe ? 'تعديل الخزينة' : 'خزينة جديدة' }}
            </h3>
          </div>
          
          <form [formGroup]="safeForm" (ngSubmit)="onSafeSubmit()" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">اسم الخزينة *</label>
              <input 
                type="text" 
                class="input"
                formControlName="name"
                placeholder="اسم الخزينة">
              <div *ngIf="safeForm.get('name')?.invalid && safeForm.get('name')?.touched" 
                   class="text-red-500 text-xs mt-1">
                اسم الخزينة مطلوب
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
              <textarea 
                class="input"
                formControlName="description"
                placeholder="وصف الخزينة"
                rows="3"></textarea>
            </div>

            <div *ngIf="!editingSafe">
              <label class="block text-sm font-medium text-gray-700 mb-2">الرصيد الابتدائي</label>
              <input 
                type="number" 
                class="input"
                formControlName="initial_balance"
                placeholder="الرصيد الابتدائي"
                min="0"
                step="0.01">
            </div>

            <div class="flex gap-3 pt-4">
              <button 
                type="submit" 
                class="btn btn-primary flex-1"
                [disabled]="safeForm.invalid || submitting">
                {{ submitting ? 'جاري الحفظ...' : (editingSafe ? 'تحديث' : 'إضافة') }}
              </button>
              <button 
                type="button" 
                class="btn btn-secondary"
                (click)="closeSafeModal()">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Transfer Modal -->
      <div *ngIf="showTransferModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">تحويل بين الخزائن</h3>
          </div>
          
          <form [formGroup]="transferForm" (ngSubmit)="onTransferSubmit()" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">من الخزينة *</label>
              <select 
                class="input"
                formControlName="from_safe_id"
                (change)="onFromSafeChange()">
                <option value="">اختر الخزينة المصدر</option>
                <option *ngFor="let safe of safes" [value]="safe.id">
                  {{ safe.name }} - {{ formatCurrency(safe.balance) }}
                </option>
              </select>
              <div *ngIf="transferForm.get('from_safe_id')?.invalid && transferForm.get('from_safe_id')?.touched" 
                   class="text-red-500 text-xs mt-1">
                الخزينة المصدر مطلوبة
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">إلى الخزينة *</label>
              <select 
                class="input"
                formControlName="to_safe_id">
                <option value="">اختر الخزينة الهدف</option>
                <option *ngFor="let safe of safes" [value]="safe.id">
                  {{ safe.name }} - {{ formatCurrency(safe.balance) }}
                </option>
              </select>
              <div *ngIf="transferForm.get('to_safe_id')?.invalid && transferForm.get('to_safe_id')?.touched" 
                   class="text-red-500 text-xs mt-1">
                الخزينة الهدف مطلوبة
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">المبلغ *</label>
              <input 
                type="number" 
                class="input"
                formControlName="amount"
                placeholder="مبلغ التحويل"
                min="0.01"
                step="0.01">
              <div *ngIf="transferForm.get('amount')?.invalid && transferForm.get('amount')?.touched" 
                   class="text-red-500 text-xs mt-1">
                المبلغ مطلوب
              </div>
              <div *ngIf="selectedFromSafe && transferForm.get('amount')?.value > selectedFromSafe.balance" 
                   class="text-red-500 text-xs mt-1">
                المبلغ أكبر من الرصيد المتاح ({{ formatCurrency(selectedFromSafe.balance) }})
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
              <textarea 
                class="input"
                formControlName="description"
                placeholder="وصف التحويل"
                rows="3"></textarea>
            </div>

            <div class="flex gap-3 pt-4">
              <button 
                type="submit" 
                class="btn btn-primary flex-1"
                [disabled]="transferForm.invalid || submitting || (selectedFromSafe && transferForm.get('amount')?.value > selectedFromSafe.balance)">
                {{ submitting ? 'جاري التحويل...' : 'تحويل' }}
              </button>
              <button 
                type="button" 
                class="btn btn-secondary"
                (click)="closeTransferModal()">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Transactions Modal -->
      <div *ngIf="showTransactionsModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl animate-scale-in max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">
              معاملات خزينة {{ selectedSafe?.name }}
            </h3>
          </div>
          
          <div class="p-6">
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>المبلغ</th>
                    <th>الوصف</th>
                    <th>المدفوع من</th>
                    <th>المستفيد</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let transaction of transactions" class="animate-fade-in">
                    <td>{{ formatDate(transaction.date) }}</td>
                    <td>
                      <span 
                        class="px-2 py-1 text-xs rounded-full"
                        [ngClass]="transaction.type === 'receipt' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                        {{ transaction.type === 'receipt' ? 'قبض' : 'دفع' }}
                      </span>
                    </td>
                    <td class="font-medium">{{ formatCurrency(transaction.amount) }}</td>
                    <td class="max-w-xs truncate">{{ transaction.description }}</td>
                    <td>{{ transaction.payer || '-' }}</td>
                    <td>{{ transaction.beneficiary || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="flex justify-end pt-4">
              <button 
                class="btn btn-secondary"
                (click)="closeTransactionsModal()">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TreasuryComponent implements OnInit {
  safes: any[] = [];
  transactions: any[] = [];
  loading = false;
  error: string | null = null;
  showSafeModal = false;
  showTransferModal = false;
  showTransactionsModal = false;
  editingSafe: any = null;
  selectedSafe: any = null;
  selectedFromSafe: any = null;
  submitting = false;
  
  stats: any = {};
  
  safeForm: FormGroup;
  transferForm: FormGroup;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.safeForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      initial_balance: [0]
    });

    this.transferForm = this.fb.group({
      from_safe_id: ['', Validators.required],
      to_safe_id: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadSafes();
    this.loadStats();
  }

  loadSafes() {
    this.loading = true;
    this.error = null;

    this.apiService.getSafes().subscribe({
      next: (response) => {
        if (response.success) {
          this.safes = response.data;
        } else {
          this.error = 'فشل في تحميل الخزائن';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.loading = false;
        console.error('Safes error:', error);
      }
    });
  }

  loadStats() {
    this.apiService.getSafeStats().subscribe({
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

  loadTransactions(safe: any) {
    this.apiService.getSafeTransactions(safe.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.transactions = response.data;
        }
      },
      error: (error) => {
        console.error('Transactions error:', error);
      }
    });
  }

  openAddModal() {
    this.editingSafe = null;
    this.safeForm.reset({
      initial_balance: 0
    });
    this.showSafeModal = true;
  }

  editSafe(safe: any) {
    this.editingSafe = safe;
    this.safeForm.patchValue(safe);
    this.showSafeModal = true;
  }

  closeSafeModal() {
    this.showSafeModal = false;
    this.editingSafe = null;
    this.safeForm.reset();
  }

  openTransferModal() {
    this.transferForm.reset();
    this.selectedFromSafe = null;
    this.showTransferModal = true;
  }

  closeTransferModal() {
    this.showTransferModal = false;
    this.transferForm.reset();
    this.selectedFromSafe = null;
  }

  onFromSafeChange() {
    const fromSafeId = this.transferForm.get('from_safe_id')?.value;
    this.selectedFromSafe = this.safes.find(s => s.id == fromSafeId);
  }

  viewTransactions(safe: any) {
    this.selectedSafe = safe;
    this.loadTransactions(safe);
    this.showTransactionsModal = true;
  }

  closeTransactionsModal() {
    this.showTransactionsModal = false;
    this.selectedSafe = null;
    this.transactions = [];
  }

  onSafeSubmit() {
    if (this.safeForm.invalid) return;

    this.submitting = true;
    const formData = this.safeForm.value;

    const operation = this.editingSafe 
      ? this.apiService.updateSafe(this.editingSafe.id, formData)
      : this.apiService.createSafe(formData);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
          this.closeSafeModal();
          this.loadSafes();
          this.loadStats();
        } else {
          this.error = 'فشل في حفظ الخزينة';
        }
        this.submitting = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.submitting = false;
        console.error('Save safe error:', error);
      }
    });
  }

  onTransferSubmit() {
    if (this.transferForm.invalid) return;

    this.submitting = true;
    const formData = this.transferForm.value;

    this.apiService.transferBetweenSafes(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.closeTransferModal();
          this.loadSafes();
          this.loadStats();
        } else {
          this.error = 'فشل في التحويل';
        }
        this.submitting = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.submitting = false;
        console.error('Transfer error:', error);
      }
    });
  }

  deleteSafe(safe: any) {
    if (confirm(`هل أنت متأكد من حذف الخزينة "${safe.name}"؟`)) {
      this.apiService.deleteSafe(safe.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadSafes();
            this.loadStats();
          } else {
            this.error = 'فشل في حذف الخزينة';
          }
        },
        error: (error) => {
          this.error = 'خطأ في الاتصال بالخادم';
          console.error('Delete safe error:', error);
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