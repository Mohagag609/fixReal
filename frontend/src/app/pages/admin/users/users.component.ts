import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold text-navy-800">إدارة المستخدمين</h1>
        <button (click)="openAddModal()" 
                class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-transform hover:scale-105">
          <i class="fas fa-plus mr-2"></i>إضافة مستخدم
        </button>
      </div>

      <!-- Users Table -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المستخدم</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">البريد الإلكتروني</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الدور</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">آخر نشاط</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let user of users; trackBy: trackByUserId" 
                  class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                      <i class="fas fa-user text-gray-600"></i>
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                      <div class="text-sm text-gray-500">ID: {{ user.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ user.email }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [ngClass]="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-purple-100 text-purple-800': user.role === 'admin',
                    'bg-blue-100 text-blue-800': user.role === 'user'
                  }">
                    {{ user.role === 'admin' ? 'مدير' : 'مستخدم' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [ngClass]="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800': user.status === 'active',
                    'bg-red-100 text-red-800': user.status === 'inactive'
                  }">
                    {{ user.status === 'active' ? 'نشط' : 'غير نشط' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ user.last_activity | date:'short' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button (click)="openEditModal(user)" 
                          class="text-teal-600 hover:text-teal-900 mr-3 transition-colors">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button (click)="toggleUserStatus(user)" 
                          [class]="user.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'"
                          class="mr-3 transition-colors">
                    <i [class]="user.status === 'active' ? 'fas fa-ban' : 'fas fa-check'"></i>
                  </button>
                  <button (click)="deleteUser(user.id)" 
                          class="text-red-600 hover:text-red-900 transition-colors">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="users.length === 0">
                <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
                  لا توجد مستخدمين
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit User Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {{ editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد' }}
            </h3>
            <form (ngSubmit)="saveUser()" #userForm="ngForm">
              <div class="mb-4">
                <label for="name" class="block text-sm font-medium text-gray-700">الاسم *</label>
                <input type="text" id="name" name="name" [(ngModel)]="userForm.name" 
                       required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              </div>
              <div class="mb-4">
                <label for="email" class="block text-sm font-medium text-gray-700">البريد الإلكتروني *</label>
                <input type="email" id="email" name="email" [(ngModel)]="userForm.email" 
                       required email class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              </div>
              <div class="mb-4">
                <label for="password" class="block text-sm font-medium text-gray-700">
                  كلمة المرور {{ editingUser ? '(اترك فارغاً للحفاظ على الكلمة الحالية)' : '*' }}
                </label>
                <input type="password" id="password" name="password" [(ngModel)]="userForm.password" 
                       [required]="!editingUser" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              </div>
              <div class="mb-4">
                <label for="role" class="block text-sm font-medium text-gray-700">الدور *</label>
                <select id="role" name="role" [(ngModel)]="userForm.role" required 
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
                  <option value="user">مستخدم</option>
                  <option value="admin">مدير</option>
                </select>
              </div>
              <div class="mb-4">
                <label for="status" class="block text-sm font-medium text-gray-700">الحالة *</label>
                <select id="status" name="status" [(ngModel)]="userForm.status" required 
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>
              <div class="flex justify-end space-x-3">
                <button type="button" (click)="closeModal()" 
                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                  إلغاء
                </button>
                <button type="submit" [disabled]="userForm.invalid" 
                        class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ editingUser ? 'تحديث' : 'إنشاء' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  showModal = false;
  editingUser: any = null;
  userForm: any = {};

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    // Mock data - replace with actual API call
    this.users = [
      {
        id: '1',
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        role: 'admin',
        status: 'active',
        last_activity: new Date()
      },
      {
        id: '2',
        name: 'فاطمة علي',
        email: 'fatima@example.com',
        role: 'user',
        status: 'active',
        last_activity: new Date(Date.now() - 3600000)
      },
      {
        id: '3',
        name: 'محمد حسن',
        email: 'mohamed@example.com',
        role: 'user',
        status: 'inactive',
        last_activity: new Date(Date.now() - 86400000)
      }
    ];
  }

  openAddModal() {
    this.editingUser = null;
    this.userForm = {
      name: '',
      email: '',
      password: '',
      role: 'user',
      status: 'active'
    };
    this.showModal = true;
  }

  openEditModal(user: any) {
    this.editingUser = user;
    this.userForm = { ...user };
    this.userForm.password = ''; // Don't show current password
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingUser = null;
    this.userForm = {};
  }

  saveUser() {
    if (this.editingUser) {
      // Update user
      const index = this.users.findIndex(u => u.id === this.editingUser.id);
      if (index >= 0) {
        this.users[index] = { ...this.users[index], ...this.userForm };
      }
    } else {
      // Add new user
      const newUser = {
        id: Date.now().toString(),
        ...this.userForm,
        last_activity: new Date()
      };
      this.users.unshift(newUser);
    }
    
    this.closeModal();
  }

  toggleUserStatus(user: any) {
    user.status = user.status === 'active' ? 'inactive' : 'active';
  }

  deleteUser(id: string) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      this.users = this.users.filter(u => u.id !== id);
    }
  }

  trackByUserId(index: number, user: any): string {
    return user.id;
  }
}