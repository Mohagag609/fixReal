import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-admin-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <h1 class="text-3xl font-bold text-navy-800 mb-6">مراقبة الأداء</h1>

      <!-- Performance Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-tachometer-alt text-blue-600 text-xl"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900">{{ performanceMetrics?.responseTime || '0' }}ms</div>
              <div class="text-sm text-gray-600">وقت الاستجابة</div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-memory text-green-600 text-xl"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900">{{ performanceMetrics?.memoryUsage || '0' }}%</div>
              <div class="text-sm text-gray-600">استخدام الذاكرة</div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-hdd text-yellow-600 text-xl"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900">{{ performanceMetrics?.diskUsage || '0' }}%</div>
              <div class="text-sm text-gray-600">استخدام القرص</div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-users text-purple-600 text-xl"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900">{{ performanceMetrics?.activeUsers || '0' }}</div>
              <div class="text-sm text-gray-600">المستخدمين النشطين</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Response Time Chart -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">وقت الاستجابة</h3>
          <div class="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div class="text-center">
              <i class="fas fa-chart-line text-4xl text-gray-400 mb-2"></i>
              <p class="text-gray-500">رسم بياني لوقت الاستجابة</p>
            </div>
          </div>
        </div>

        <!-- Memory Usage Chart -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">استخدام الذاكرة</h3>
          <div class="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div class="text-center">
              <i class="fas fa-chart-pie text-4xl text-gray-400 mb-2"></i>
              <p class="text-gray-500">رسم بياني لاستخدام الذاكرة</p>
            </div>
          </div>
        </div>
      </div>

      <!-- System Information -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Server Information -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">معلومات الخادم</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">نظام التشغيل</span>
              <span class="text-sm font-medium text-gray-900">{{ serverInfo?.os || 'Linux' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">إصدار PHP</span>
              <span class="text-sm font-medium text-gray-900">{{ serverInfo?.phpVersion || '8.1.0' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">إصدار Laravel</span>
              <span class="text-sm font-medium text-gray-900">{{ serverInfo?.laravelVersion || '10.0.0' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">إصدار MySQL</span>
              <span class="text-sm font-medium text-gray-900">{{ serverInfo?.mysqlVersion || '8.0.0' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">وقت التشغيل</span>
              <span class="text-sm font-medium text-gray-900">{{ serverInfo?.uptime || '15 يوم' }}</span>
            </div>
          </div>
        </div>

        <!-- Database Information -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">معلومات قاعدة البيانات</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">حجم قاعدة البيانات</span>
              <span class="text-sm font-medium text-gray-900">{{ dbInfo?.size || '2.5 GB' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">عدد الجداول</span>
              <span class="text-sm font-medium text-gray-900">{{ dbInfo?.tables || '25' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">عدد السجلات</span>
              <span class="text-sm font-medium text-gray-900">{{ dbInfo?.records || '125,000' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">آخر نسخة احتياطية</span>
              <span class="text-sm font-medium text-gray-900">{{ dbInfo?.lastBackup || 'اليوم' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">حالة الاتصال</span>
              <span class="text-sm font-medium text-green-600">{{ dbInfo?.status || 'متصل' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Actions -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">إجراءات الأداء</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button (click)="optimizeDatabase()" 
                  class="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
            <i class="fas fa-database mr-2"></i>
            تحسين قاعدة البيانات
          </button>
          <button (click)="clearCache()" 
                  class="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors">
            <i class="fas fa-broom mr-2"></i>
            مسح الذاكرة المؤقتة
          </button>
          <button (click)="optimizeImages()" 
                  class="flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors">
            <i class="fas fa-image mr-2"></i>
            تحسين الصور
          </button>
          <button (click)="generateReport()" 
                  class="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors">
            <i class="fas fa-file-alt mr-2"></i>
            إنشاء تقرير الأداء
          </button>
        </div>
      </div>

      <!-- Recent Performance Logs -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">سجل الأداء الأخير</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوقت</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النشاط</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وقت الاستجابة</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let log of performanceLogs" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ log.timestamp | date:'short' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ log.activity }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ log.responseTime }}ms
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [ngClass]="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800': log.status === 'success',
                    'bg-yellow-100 text-yellow-800': log.status === 'warning',
                    'bg-red-100 text-red-800': log.status === 'error'
                  }">
                    {{ log.status === 'success' ? 'نجح' : log.status === 'warning' ? 'تحذير' : 'خطأ' }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="performanceLogs.length === 0">
                <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
                  لا توجد سجلات أداء
                </td>
              </tr>
            </tbody>
          </table>
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
export class AdminPerformanceComponent implements OnInit {
  performanceMetrics: any = null;
  serverInfo: any = null;
  dbInfo: any = null;
  performanceLogs: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadPerformanceMetrics();
    this.loadServerInfo();
    this.loadDatabaseInfo();
    this.loadPerformanceLogs();
  }

  loadPerformanceMetrics() {
    // Mock data - replace with actual API call
    this.performanceMetrics = {
      responseTime: 150,
      memoryUsage: 65,
      diskUsage: 45,
      activeUsers: 12
    };
  }

  loadServerInfo() {
    // Mock data - replace with actual API call
    this.serverInfo = {
      os: 'Linux Ubuntu 20.04',
      phpVersion: '8.1.0',
      laravelVersion: '10.0.0',
      mysqlVersion: '8.0.0',
      uptime: '15 يوم'
    };
  }

  loadDatabaseInfo() {
    // Mock data - replace with actual API call
    this.dbInfo = {
      size: '2.5 GB',
      tables: 25,
      records: '125,000',
      lastBackup: 'اليوم',
      status: 'متصل'
    };
  }

  loadPerformanceLogs() {
    // Mock data - replace with actual API call
    this.performanceLogs = [
      {
        timestamp: new Date(),
        activity: 'تحميل الصفحة الرئيسية',
        responseTime: 120,
        status: 'success'
      },
      {
        timestamp: new Date(Date.now() - 300000),
        activity: 'استعلام قاعدة البيانات',
        responseTime: 85,
        status: 'success'
      },
      {
        timestamp: new Date(Date.now() - 600000),
        activity: 'تحميل الصور',
        responseTime: 250,
        status: 'warning'
      },
      {
        timestamp: new Date(Date.now() - 900000),
        activity: 'معالجة البيانات',
        responseTime: 500,
        status: 'error'
      }
    ];
  }

  optimizeDatabase() {
    // Implement database optimization
    console.log('تحسين قاعدة البيانات...');
    // Add actual optimization logic here
  }

  clearCache() {
    // Implement cache clearing
    console.log('مسح الذاكرة المؤقتة...');
    // Add actual cache clearing logic here
  }

  optimizeImages() {
    // Implement image optimization
    console.log('تحسين الصور...');
    // Add actual image optimization logic here
  }

  generateReport() {
    // Implement performance report generation
    console.log('إنشاء تقرير الأداء...');
    // Add actual report generation logic here
  }
}