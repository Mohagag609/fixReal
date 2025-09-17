import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-transactions',
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">إدارة المعاملات</h1>
        <button class="btn-primary" (click)="openAddModal()">
          <i class="fas fa-plus ml-2"></i>
          إضافة معاملة جديدة
        </button>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">نوع المعاملة</label>
            <select [(ngModel)]="typeFilter" (change)="filterTransactions()" class="input-field">
              <option value="">جميع الأنواع</option>
              <option value="income">دخل</option>
              <option value="expense">مصروف</option>
              <option value="transfer">تحويل</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
            <input
              type="date"
              [(ngModel)]="fromDate"
              (change)="filterTransactions()"
              class="input-field"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
            <input
              type="date"
              [(ngModel)]="toDate"
              (change)="filterTransactions()"
              class="input-field"
            />
          </div>
          <div class="flex items-end">
            <button class="btn-outline w-full" (click)="resetFilters()">
              <i class="fas fa-refresh ml-2"></i>
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="card">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header">التاريخ</th>
                <th class="table-header">النوع</th>
                <th class="table-header">المبلغ</th>
                <th class="table-header">الوصف</th>
                <th class="table-header">العميل</th>
                <th class="table-header">الإجراءات</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let transaction of transactions">
                <td class="table-cell">{{ transaction.date | date:'short' }}</td>
                <td class="table-cell">
                  <span class="px-2 py-1 text-xs font-medium rounded-full"
                        [class]="getTypeClass(transaction.type)">
                    {{ getTypeLabel(transaction.type) }}
                  </span>
                </td>
                <td class="table-cell font-medium" [class]="getAmountClass(transaction.type)">
                  {{ transaction.amount | currency:'SAR' }}
                </td>
                <td class="table-cell">{{ transaction.description || '-' }}</td>
                <td class="table-cell">{{ transaction.customer?.name || '-' }}</td>
                <td class="table-cell">
                  <div class="flex space-x-2">
                    <button class="text-blue-600 hover:text-blue-900" (click)="editTransaction(transaction)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900" (click)="deleteTransaction(transaction)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between mt-4" *ngIf="totalPages > 1">
          <div class="text-sm text-gray-700">
            عرض {{ (currentPage - 1) * pageSize + 1 }} إلى {{ Math.min(currentPage * pageSize, totalItems) }} من {{ totalItems }} معاملة
          </div>
          <div class="flex space-x-2">
            <button
              class="btn-outline"
              [disabled]="currentPage === 1"
              (click)="goToPage(currentPage - 1)"
            >
              السابق
            </button>
            <button
              class="btn-outline"
              [disabled]="currentPage === totalPages"
              (click)="goToPage(currentPage + 1)"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TransactionsComponent implements OnInit {
  transactions: any[] = [];
  typeFilter = '';
  fromDate = '';
  toDate = '';
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.apiService.getTransactions(this.currentPage, this.pageSize).subscribe({
      next: (data) => {
        this.transactions = data.data || [];
        this.totalItems = data.total || 0;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
      }
    });
  }

  filterTransactions(): void {
    // يمكن إضافة منطق التصفية هنا
    this.loadTransactions();
  }

  resetFilters(): void {
    this.typeFilter = '';
    this.fromDate = '';
    this.toDate = '';
    this.currentPage = 1;
    this.loadTransactions();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadTransactions();
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'income':
        return 'bg-green-100 text-green-800';
      case 'expense':
        return 'bg-red-100 text-red-800';
      case 'transfer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'income':
        return 'دخل';
      case 'expense':
        return 'مصروف';
      case 'transfer':
        return 'تحويل';
      default:
        return type;
    }
  }

  getAmountClass(type: string): string {
    switch (type) {
      case 'income':
        return 'text-green-600';
      case 'expense':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  openAddModal(): void {
    // يمكن إضافة منطق فتح نافذة إضافة معاملة
    console.log('Add transaction modal');
  }

  editTransaction(transaction: any): void {
    // يمكن إضافة منطق تعديل المعاملة
    console.log('Edit transaction:', transaction);
  }

  deleteTransaction(transaction: any): void {
    if (confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
      this.apiService.deleteTransaction(transaction.id).subscribe({
        next: () => {
          this.loadTransactions();
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
        }
      });
    }
  }
}