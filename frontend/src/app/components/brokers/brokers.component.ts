import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface Broker {
  id: string;
  name: string;
  phone?: string;
  nationalId?: string;
  address?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface BrokerFormData {
  name: string;
  phone: string;
  nationalId: string;
  address: string;
  status: string;
  notes: string;
}

interface SearchQuery {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

@Component({
  selector: 'app-brokers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">إدارة الوسطاء</h1>
        <p class="text-gray-600">إدارة معلومات الوسطاء وعقودهم</p>
      </div>

      <!-- Search and Filters -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">البحث</label>
            <input
              type="text"
              [(ngModel)]="searchQuery.search"
              (input)="onSearch()"
              placeholder="اسم الوكيل أو الهاتف..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select
              [(ngModel)]="searchQuery.status"
              (change)="onSearch()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">جميع الحالات</option>
              <option value="نشط">نشط</option>
              <option value="غير نشط">غير نشط</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ترتيب حسب</label>
            <select
              [(ngModel)]="searchQuery.sortBy"
              (change)="onSearch()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="createdAt">تاريخ الإنشاء</option>
              <option value="name">الاسم</option>
              <option value="status">الحالة</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              (click)="onSearch()"
              class="w-full bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
            >
              بحث
            </button>
          </div>
        </div>
      </div>

      <!-- Add Broker Button -->
      <div class="mb-4">
        <button
          (click)="openAddModal()"
          class="bg-navy-600 text-white px-4 py-2 rounded-md hover:bg-navy-700 transition-colors"
        >
          إضافة وكيل جديد
        </button>
      </div>

      <!-- Brokers Table -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الاسم
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الهاتف
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الرقم القومي
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإنشاء
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let broker of brokers" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ broker.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ broker.phone || '-' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ broker.nationalId || '-' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    [class]="broker.status === 'نشط' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  >
                    {{ broker.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(broker.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2 space-x-reverse">
                    <button
                      (click)="viewBroker(broker)"
                      class="text-teal-600 hover:text-teal-900"
                    >
                      عرض
                    </button>
                    <button
                      (click)="editBroker(broker)"
                      class="text-blue-600 hover:text-blue-900"
                    >
                      تعديل
                    </button>
                    <button
                      (click)="deleteBroker(broker.id)"
                      class="text-red-600 hover:text-red-900"
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              (click)="previousPage()"
              [disabled]="currentPage === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              السابق
            </button>
            <button
              (click)="nextPage()"
              [disabled]="currentPage === totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              التالي
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                عرض
                <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
                إلى
                <span class="font-medium">{{ Math.min(currentPage * pageSize, totalItems) }}</span>
                من
                <span class="font-medium">{{ totalItems }}</span>
                نتيجة
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  (click)="previousPage()"
                  [disabled]="currentPage === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  السابق
                </button>
                <button
                  (click)="nextPage()"
                  [disabled]="currentPage === totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  التالي
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Spinner -->
      <div *ngIf="loading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>

      <!-- No Data Message -->
      <div *ngIf="!loading && brokers.length === 0" class="text-center py-8">
        <p class="text-gray-500">لا توجد وسطاء</p>
      </div>
    </div>

    <!-- Add/Edit Broker Modal -->
    <div
      *ngIf="showModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            {{ isEditMode ? 'تعديل الوكيل' : 'إضافة وكيل جديد' }}
          </h3>
          <form (ngSubmit)="saveBroker()" #brokerForm="ngForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
              <input
                type="text"
                [(ngModel)]="brokerFormData.name"
                name="name"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
              <input
                type="text"
                [(ngModel)]="brokerFormData.phone"
                name="phone"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">الرقم القومي</label>
              <input
                type="text"
                [(ngModel)]="brokerFormData.nationalId"
                name="nationalId"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
              <textarea
                [(ngModel)]="brokerFormData.address"
                name="address"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              ></textarea>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                [(ngModel)]="brokerFormData.status"
                name="status"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <textarea
                [(ngModel)]="brokerFormData.notes"
                name="notes"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              ></textarea>
            </div>
            <div class="flex justify-end space-x-2 space-x-reverse">
              <button
                type="button"
                (click)="closeModal()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                [disabled]="!brokerForm.form.valid || saving"
                class="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 disabled:opacity-50"
              >
                {{ saving ? 'جاري الحفظ...' : 'حفظ' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Broker Details Modal -->
    <div
      *ngIf="showDetailsModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">تفاصيل الوكيل</h3>
          <div *ngIf="selectedBroker" class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">الاسم</label>
              <p class="text-sm text-gray-900">{{ selectedBroker.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">الهاتف</label>
              <p class="text-sm text-gray-900">{{ selectedBroker.phone || '-' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">الرقم القومي</label>
              <p class="text-sm text-gray-900">{{ selectedBroker.nationalId || '-' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">العنوان</label>
              <p class="text-sm text-gray-900">{{ selectedBroker.address || '-' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">الحالة</label>
              <span
                [class]="selectedBroker.status === 'نشط' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
              >
                {{ selectedBroker.status }}
              </span>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">ملاحظات</label>
              <p class="text-sm text-gray-900">{{ selectedBroker.notes || '-' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">تاريخ الإنشاء</label>
              <p class="text-sm text-gray-900">{{ formatDate(selectedBroker.createdAt) }}</p>
            </div>
          </div>
          <div class="flex justify-end mt-6">
            <button
              (click)="closeDetailsModal()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .space-x-reverse > :not([hidden]) ~ :not([hidden]) {
      --tw-space-x-reverse: 1;
    }
  `]
})
export class BrokersComponent implements OnInit {
  brokers: Broker[] = [];
  loading = false;
  saving = false;
  showModal = false;
  showDetailsModal = false;
  isEditMode = false;
  selectedBroker: Broker | null = null;
  editingBrokerId: string | null = null;

  searchQuery: SearchQuery = {
    page: 1,
    limit: 10,
    search: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };

  brokerFormData: BrokerFormData = {
    name: '',
    phone: '',
    nationalId: '',
    address: '',
    status: 'نشط',
    notes: ''
  };

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadBrokers();
  }

  loadBrokers() {
    this.loading = true;
    const params = new URLSearchParams();
    
    if (this.searchQuery.search) params.append('search', this.searchQuery.search);
    if (this.searchQuery.status) params.append('status', this.searchQuery.status);
    if (this.searchQuery.sortBy) params.append('sortBy', this.searchQuery.sortBy);
    if (this.searchQuery.sortOrder) params.append('sortOrder', this.searchQuery.sortOrder);
    params.append('page', this.currentPage.toString());
    params.append('limit', this.pageSize.toString());

    this.http.get<any>(`${environment.apiUrl}/brokers?${params.toString()}`)
      .subscribe({
        next: (response) => {
          this.brokers = response.brokers;
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.totalPages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading brokers:', error);
          this.loading = false;
        }
      });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadBrokers();
  }

  openAddModal() {
    this.isEditMode = false;
    this.editingBrokerId = null;
    this.brokerFormData = {
      name: '',
      phone: '',
      nationalId: '',
      address: '',
      status: 'نشط',
      notes: ''
    };
    this.showModal = true;
  }

  editBroker(broker: Broker) {
    this.isEditMode = true;
    this.editingBrokerId = broker.id;
    this.brokerFormData = {
      name: broker.name,
      phone: broker.phone || '',
      nationalId: broker.nationalId || '',
      address: broker.address || '',
      status: broker.status,
      notes: broker.notes || ''
    };
    this.showModal = true;
  }

  viewBroker(broker: Broker) {
    this.selectedBroker = broker;
    this.showDetailsModal = true;
  }

  saveBroker() {
    if (this.isEditMode && this.editingBrokerId) {
      this.updateBroker();
    } else {
      this.createBroker();
    }
  }

  createBroker() {
    this.saving = true;
    this.http.post<any>(`${environment.apiUrl}/brokers`, this.brokerFormData)
      .subscribe({
        next: (response) => {
          this.saving = false;
          this.closeModal();
          this.loadBrokers();
        },
        error: (error) => {
          console.error('Error creating broker:', error);
          this.saving = false;
        }
      });
  }

  updateBroker() {
    if (!this.editingBrokerId) return;
    
    this.saving = true;
    this.http.put<any>(`${environment.apiUrl}/brokers/${this.editingBrokerId}`, this.brokerFormData)
      .subscribe({
        next: (response) => {
          this.saving = false;
          this.closeModal();
          this.loadBrokers();
        },
        error: (error) => {
          console.error('Error updating broker:', error);
          this.saving = false;
        }
      });
  }

  deleteBroker(id: string) {
    if (confirm('هل أنت متأكد من حذف هذا الوكيل؟')) {
      this.http.delete(`${environment.apiUrl}/brokers/${id}`)
        .subscribe({
          next: () => {
            this.loadBrokers();
          },
          error: (error) => {
            console.error('Error deleting broker:', error);
          }
        });
    }
  }

  closeModal() {
    this.showModal = false;
    this.isEditMode = false;
    this.editingBrokerId = null;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedBroker = null;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadBrokers();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadBrokers();
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}