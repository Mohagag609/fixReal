import { Component, OnInit } from '@angular/core';

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
        <button class="btn btn-primary">
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          إضافة عميل جديد
        </button>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-64">
            <input 
              type="text" 
              placeholder="البحث في العملاء..."
              class="form-input">
          </div>
          <select class="form-input w-48">
            <option value="">جميع الحالات</option>
            <option value="نشط">نشط</option>
            <option value="غير نشط">غير نشط</option>
          </select>
          <button class="btn btn-outline">تصفية</button>
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
                    <button class="text-blue-600 hover:text-blue-800">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    </button>
                    <button class="text-green-600 hover:text-green-800">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button class="text-red-600 hover:text-red-800">
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

        <!-- Empty State -->
        <div *ngIf="customers.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">لا توجد عملاء</h3>
          <p class="text-gray-600 mb-4">ابدأ بإضافة عميل جديد لإدارة بياناته</p>
          <button class="btn btn-primary">إضافة عميل جديد</button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CustomersComponent implements OnInit {
  customers: any[] = [
    {
      id: '1',
      name: 'أحمد محمد علي',
      phone: '01234567890',
      nationalId: '12345678901234',
      address: 'القاهرة، مصر',
      status: 'نشط',
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'فاطمة أحمد حسن',
      phone: '01234567891',
      nationalId: '12345678901235',
      address: 'الإسكندرية، مصر',
      status: 'نشط',
      createdAt: new Date()
    }
  ];

  ngOnInit(): void {
    // Load customers data
  }
}