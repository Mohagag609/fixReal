import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-invoices',
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">إدارة الفواتير</h1>
        <button class="btn-primary" (click)="openAddModal()">
          <i class="fas fa-plus ml-2"></i>
          إضافة فاتورة جديدة
        </button>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">حالة الفاتورة</label>
            <select [(ngModel)]="statusFilter" (change)="filterInvoices()" class="input-field">
              <option value="">جميع الحالات</option>
              <option value="pending">معلقة</option>
              <option value="paid">مدفوعة</option>
              <option value="overdue">متأخرة</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
            <input
              type="date"
              [(ngModel)]="fromDate"
              (change)="filterInvoices()"
              class="input-field"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
            <input
              type="date"
              [(ngModel)]="toDate"
              (change)="filterInvoices()"
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

      <!-- Invoices Table -->
      <div class="card">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header">رقم الفاتورة</th>
                <th class="table-header">العميل</th>
                <th class="table-header">المبلغ</th>
                <th class="table-header">الضريبة</th>
                <th class="table-header">الإجمالي</th>
                <th class="table-header">الحالة</th>
                <th class="table-header">تاريخ الاستحقاق</th>
                <th class="table-header">الإجراءات</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let invoice of invoices">
                <td class="table-cell font-medium">{{ invoice.invoiceNumber }}</td>
                <td class="table-cell">{{ invoice.customer?.name || '-' }}</td>
                <td class="table-cell">{{ invoice.amount | currency:'SAR' }}</td>
                <td class="table-cell">{{ invoice.tax | currency:'SAR' }}</td>
                <td class="table-cell font-medium">{{ invoice.total | currency:'SAR' }}</td>
                <td class="table-cell">
                  <span class="px-2 py-1 text-xs font-medium rounded-full"
                        [class]="getStatusClass(invoice.status)">
                    {{ getStatusLabel(invoice.status) }}
                  </span>
                </td>
                <td class="table-cell">{{ invoice.dueDate | date:'short' }}</td>
                <td class="table-cell">
                  <div class="flex space-x-2">
                    <button class="text-blue-600 hover:text-blue-900" (click)="viewInvoice(invoice)">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-green-600 hover:text-green-900" (click)="markAsPaid(invoice)" *ngIf="invoice.status === 'pending'">
                      <i class="fas fa-check"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-900" (click)="editInvoice(invoice)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900" (click)="deleteInvoice(invoice)">
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
            عرض {{ (currentPage - 1) * pageSize + 1 }} إلى {{ Math.min(currentPage * pageSize, totalItems) }} من {{ totalItems }} فاتورة
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
export class InvoicesComponent implements OnInit {
  invoices: any[] = [];
  statusFilter = '';
  fromDate = '';
  toDate = '';
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.apiService.getInvoices(this.currentPage, this.pageSize).subscribe({
      next: (data) => {
        this.invoices = data.data || [];
        this.totalItems = data.total || 0;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      },
      error: (error) => {
        console.error('Error loading invoices:', error);
      }
    });
  }

  filterInvoices(): void {
    // يمكن إضافة منطق التصفية هنا
    this.loadInvoices();
  }

  resetFilters(): void {
    this.statusFilter = '';
    this.fromDate = '';
    this.toDate = '';
    this.currentPage = 1;
    this.loadInvoices();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadInvoices();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'paid':
        return 'مدفوعة';
      case 'pending':
        return 'معلقة';
      case 'overdue':
        return 'متأخرة';
      default:
        return status;
    }
  }

  openAddModal(): void {
    // يمكن إضافة منطق فتح نافذة إضافة فاتورة
    console.log('Add invoice modal');
  }

  viewInvoice(invoice: any): void {
    // يمكن إضافة منطق عرض الفاتورة
    console.log('View invoice:', invoice);
  }

  markAsPaid(invoice: any): void {
    if (confirm('هل أنت متأكد من تسجيل هذه الفاتورة كمدفوعة؟')) {
      // يمكن إضافة منطق تسجيل الدفع
      console.log('Mark as paid:', invoice);
    }
  }

  editInvoice(invoice: any): void {
    // يمكن إضافة منطق تعديل الفاتورة
    console.log('Edit invoice:', invoice);
  }

  deleteInvoice(invoice: any): void {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      this.apiService.deleteInvoice(invoice.id).subscribe({
        next: () => {
          this.loadInvoices();
        },
        error: (error) => {
          console.error('Error deleting invoice:', error);
        }
      });
    }
  }
}