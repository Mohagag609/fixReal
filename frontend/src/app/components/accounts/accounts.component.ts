import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-accounts',
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">إدارة الحسابات</h1>
        <button class="btn-primary" (click)="openAddModal()">
          <i class="fas fa-plus ml-2"></i>
          إضافة عميل جديد
        </button>
      </div>

      <!-- Search and Filters -->
      <div class="card">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">البحث</label>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (input)="searchCustomers()"
              placeholder="البحث بالاسم أو البريد الإلكتروني"
              class="input-field"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
            <select [(ngModel)]="statusFilter" (change)="filterCustomers()" class="input-field">
              <option value="">جميع العملاء</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>
          <div class="flex items-end">
            <button class="btn-outline w-full" (click)="resetFilters()">
              <i class="fas fa-refresh ml-2"></i>
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="card">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header">الاسم</th>
                <th class="table-header">البريد الإلكتروني</th>
                <th class="table-header">الهاتف</th>
                <th class="table-header">العنوان</th>
                <th class="table-header">الحالة</th>
                <th class="table-header">الإجراءات</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let customer of customers">
                <td class="table-cell font-medium">{{ customer.name }}</td>
                <td class="table-cell">{{ customer.email || '-' }}</td>
                <td class="table-cell">{{ customer.phone || '-' }}</td>
                <td class="table-cell">{{ customer.address || '-' }}</td>
                <td class="table-cell">
                  <span class="px-2 py-1 text-xs font-medium rounded-full"
                        [class]="customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ customer.isActive ? 'نشط' : 'غير نشط' }}
                  </span>
                </td>
                <td class="table-cell">
                  <div class="flex space-x-2">
                    <button class="text-blue-600 hover:text-blue-900" (click)="editCustomer(customer)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900" (click)="deleteCustomer(customer)">
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
            عرض {{ (currentPage - 1) * pageSize + 1 }} إلى {{ Math.min(currentPage * pageSize, totalItems) }} من {{ totalItems }} عميل
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
export class AccountsComponent implements OnInit {
  customers: any[] = [];
  searchTerm = '';
  statusFilter = '';
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.apiService.getCustomers(this.currentPage, this.pageSize).subscribe({
      next: (data) => {
        this.customers = data.data || [];
        this.totalItems = data.total || 0;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      },
      error: (error) => {
        console.error('Error loading customers:', error);
      }
    });
  }

  searchCustomers(): void {
    // يمكن إضافة منطق البحث هنا
    this.loadCustomers();
  }

  filterCustomers(): void {
    // يمكن إضافة منطق التصفية هنا
    this.loadCustomers();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.currentPage = 1;
    this.loadCustomers();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadCustomers();
  }

  openAddModal(): void {
    // يمكن إضافة منطق فتح نافذة إضافة عميل
    console.log('Add customer modal');
  }

  editCustomer(customer: any): void {
    // يمكن إضافة منطق تعديل العميل
    console.log('Edit customer:', customer);
  }

  deleteCustomer(customer: any): void {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      this.apiService.deleteCustomer(customer.id).subscribe({
        next: () => {
          this.loadCustomers();
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
        }
      });
    }
  }
}