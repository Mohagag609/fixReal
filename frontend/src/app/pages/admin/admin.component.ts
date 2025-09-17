import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <h1 class="text-3xl font-bold text-navy-800 mb-6">لوحة الإدارة</h1>

      <!-- Admin Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <!-- Users Management -->
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" 
             (click)="navigateTo('/admin/users')">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-users text-blue-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">إدارة المستخدمين</h3>
              <p class="text-sm text-gray-600">إضافة وتعديل وحذف المستخدمين</p>
            </div>
          </div>
        </div>

        <!-- System Performance -->
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" 
             (click)="navigateTo('/admin/performance')">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-chart-line text-green-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">أداء النظام</h3>
              <p class="text-sm text-gray-600">مراقبة أداء النظام والتحسين</p>
            </div>
          </div>
        </div>

        <!-- Database Management -->
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" 
             (click)="navigateTo('/admin/database')">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-database text-purple-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">إدارة قاعدة البيانات</h3>
              <p class="text-sm text-gray-600">نسخ احتياطي واستعادة البيانات</p>
            </div>
          </div>
        </div>

        <!-- System Settings -->
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" 
             (click)="navigateTo('/settings')">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-cog text-yellow-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">إعدادات النظام</h3>
              <p class="text-sm text-gray-600">تخصيص إعدادات النظام</p>
            </div>
          </div>
        </div>

        <!-- Audit Logs -->
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" 
             (click)="navigateTo('/audit')">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-clipboard-list text-red-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">سجل المراجعة</h3>
              <p class="text-sm text-gray-600">مراجعة أنشطة المستخدمين</p>
            </div>
          </div>
        </div>

        <!-- System Health -->
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" 
             (click)="navigateTo('/admin/health')">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-heartbeat text-teal-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">صحة النظام</h3>
              <p class="text-sm text-gray-600">فحص حالة النظام</p>
            </div>
          </div>
        </div>
      </div>

      <!-- System Statistics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Quick Stats -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">إحصائيات سريعة</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ stats?.totalUsers || 0 }}</div>
              <div class="text-sm text-gray-600">المستخدمين</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ stats?.totalRecords || 0 }}</div>
              <div class="text-sm text-gray-600">السجلات</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">{{ stats?.totalStorage || '0 MB' }}</div>
              <div class="text-sm text-gray-600">التخزين</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-600">{{ stats?.uptime || '0' }}</div>
              <div class="text-sm text-gray-600">وقت التشغيل</div>
            </div>
          </div>
        </div>

        <!-- System Status -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">حالة النظام</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">قاعدة البيانات</span>
              <span [ngClass]="getStatusClass(systemStatus?.database)">
                <i class="fas fa-circle mr-1"></i>
                {{ systemStatus?.database || 'غير معروف' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">الخادم</span>
              <span [ngClass]="getStatusClass(systemStatus?.server)">
                <i class="fas fa-circle mr-1"></i>
                {{ systemStatus?.server || 'غير معروف' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">الذاكرة</span>
              <span [ngClass]="getStatusClass(systemStatus?.memory)">
                <i class="fas fa-circle mr-1"></i>
                {{ systemStatus?.memory || 'غير معروف' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">التخزين</span>
              <span [ngClass]="getStatusClass(systemStatus?.storage)">
                <i class="fas fa-circle mr-1"></i>
                {{ systemStatus?.storage || 'غير معروف' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activities -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">الأنشطة الأخيرة</h3>
        <div class="space-y-3">
          <div *ngFor="let activity of recentActivities" 
               class="flex items-center p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <i [class]="activity.icon" class="text-blue-600 text-sm"></i>
            </div>
            <div class="flex-1">
              <div class="text-sm font-medium text-gray-900">{{ activity.title }}</div>
              <div class="text-xs text-gray-500">{{ activity.description }}</div>
            </div>
            <div class="text-xs text-gray-400">{{ activity.time }}</div>
          </div>
          <div *ngIf="recentActivities.length === 0" class="text-center text-gray-500 py-4">
            لا توجد أنشطة حديثة
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.5s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AdminComponent implements OnInit {
  stats: any = null;
  systemStatus: any = null;
  recentActivities: any[] = [];

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadSystemStatus();
    this.loadRecentActivities();
  }

  loadStats() {
    // Mock data - replace with actual API call
    this.stats = {
      totalUsers: 15,
      totalRecords: 1250,
      totalStorage: '2.5 GB',
      uptime: '15 يوم'
    };
  }

  loadSystemStatus() {
    // Mock data - replace with actual API call
    this.systemStatus = {
      database: 'متصل',
      server: 'يعمل',
      memory: 'طبيعي',
      storage: 'متاح'
    };
  }

  loadRecentActivities() {
    // Mock data - replace with actual API call
    this.recentActivities = [
      {
        icon: 'fas fa-user-plus',
        title: 'تم إضافة مستخدم جديد',
        description: 'أحمد محمد - مدير',
        time: 'منذ 5 دقائق'
      },
      {
        icon: 'fas fa-database',
        title: 'تم إنشاء نسخة احتياطية',
        description: 'نسخة احتياطية يومية',
        time: 'منذ ساعة'
      },
      {
        icon: 'fas fa-cog',
        title: 'تم تحديث الإعدادات',
        description: 'إعدادات النظام',
        time: 'منذ ساعتين'
      },
      {
        icon: 'fas fa-chart-line',
        title: 'تم تحسين الأداء',
        description: 'تحسين قاعدة البيانات',
        time: 'منذ 3 ساعات'
      }
    ];
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'متصل': 'text-green-600',
      'يعمل': 'text-green-600',
      'طبيعي': 'text-green-600',
      'متاح': 'text-green-600',
      'غير متصل': 'text-red-600',
      'متوقف': 'text-red-600',
      'منخفض': 'text-yellow-600',
      'ممتلئ': 'text-red-600'
    };
    return statusClasses[status] || 'text-gray-600';
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}