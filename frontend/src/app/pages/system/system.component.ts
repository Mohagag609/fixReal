import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-system',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">مراقبة النظام</h1>
              <p class="text-gray-600 mt-1">مراقبة أداء النظام والصحة العامة</p>
            </div>
            <div class="flex items-center space-x-3 space-x-reverse">
              <button
                (click)="refreshSystemStatus()"
                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105">
                تحديث
              </button>
            </div>
          </div>
        </div>

        <!-- System Status Overview -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">حالة النظام</p>
                <p class="text-2xl font-bold text-green-600">مستقر</p>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span class="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">وقت التشغيل</p>
                <p class="text-2xl font-bold text-blue-600">{{ uptime }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span class="text-2xl">⏱️</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">المستخدمون النشطون</p>
                <p class="text-2xl font-bold text-purple-600">{{ activeUsers }}</p>
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span class="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">الطلبات/الدقيقة</p>
                <p class="text-2xl font-bold text-orange-600">{{ requestsPerMinute }}</p>
              </div>
              <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span class="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Resource Usage -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- CPU Usage -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">استخدام المعالج</h2>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm font-medium text-gray-700">المعالج الرئيسي</span>
                  <span class="text-sm font-bold text-gray-900">{{ cpuUsage }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                       [style.width.%]="cpuUsage"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm font-medium text-gray-700">الذاكرة</span>
                  <span class="text-sm font-bold text-gray-900">{{ memoryUsage }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-green-600 h-2 rounded-full transition-all duration-300" 
                       [style.width.%]="memoryUsage"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm font-medium text-gray-700">القرص الصلب</span>
                  <span class="text-sm font-bold text-gray-900">{{ diskUsage }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                       [style.width.%]="diskUsage"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Network Activity -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">نشاط الشبكة</h2>
            <div class="space-y-4">
              <div class="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span class="text-sm font-medium text-gray-700">البيانات المرسلة</span>
                <span class="text-sm font-bold text-gray-900">{{ networkSent }}</span>
              </div>
              <div class="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span class="text-sm font-medium text-gray-700">البيانات المستلمة</span>
                <span class="text-sm font-bold text-gray-900">{{ networkReceived }}</span>
              </div>
              <div class="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span class="text-sm font-medium text-gray-700">سرعة التحميل</span>
                <span class="text-sm font-bold text-gray-900">{{ downloadSpeed }}</span>
              </div>
              <div class="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span class="text-sm font-medium text-gray-700">سرعة الرفع</span>
                <span class="text-sm font-bold text-gray-900">{{ uploadSpeed }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- System Logs -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">سجلات النظام</h2>
          
          <div class="space-y-3">
            <div *ngFor="let log of systemLogs" 
                 class="flex items-center space-x-4 space-x-reverse p-4 rounded-xl"
                 [class]="getLogClass(log.level)">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                   [class]="getLogIconClass(log.level)">
                <span class="text-sm">{{ getLogIcon(log.level) }}</span>
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-gray-900">{{ log.message }}</span>
                  <span class="text-xs text-gray-500">{{ log.timestamp | date:'short' }}</span>
                </div>
                <p class="text-sm text-gray-600">{{ log.details }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Database Status -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">حالة قاعدة البيانات</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="p-4 bg-green-50 rounded-xl border border-green-200">
              <div class="flex items-center space-x-3 space-x-reverse">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span class="text-green-600">✓</span>
                </div>
                <div>
                  <h3 class="font-medium text-green-900">الاتصال</h3>
                  <p class="text-sm text-green-700">متصل</p>
                </div>
              </div>
            </div>

            <div class="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div class="flex items-center space-x-3 space-x-reverse">
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span class="text-blue-600">📊</span>
                </div>
                <div>
                  <h3 class="font-medium text-blue-900">الجداول</h3>
                  <p class="text-sm text-blue-700">{{ dbTables }} جدول</p>
                </div>
              </div>
            </div>

            <div class="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div class="flex items-center space-x-3 space-x-reverse">
                <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span class="text-purple-600">💾</span>
                </div>
                <div>
                  <h3 class="font-medium text-purple-900">الحجم</h3>
                  <p class="text-sm text-purple-700">{{ dbSize }}</p>
                </div>
              </div>
            </div>

            <div class="p-4 bg-orange-50 rounded-xl border border-orange-200">
              <div class="flex items-center space-x-3 space-x-reverse">
                <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span class="text-orange-600">⚡</span>
                </div>
                <div>
                  <h3 class="font-medium text-orange-900">الاستعلامات</h3>
                  <p class="text-sm text-orange-700">{{ dbQueries }}/ثانية</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .log-info { @apply bg-blue-50 border-blue-200; }
    .log-warning { @apply bg-yellow-50 border-yellow-200; }
    .log-error { @apply bg-red-50 border-red-200; }
    .log-success { @apply bg-green-50 border-green-200; }
  `]
})
export class SystemComponent implements OnInit {
  uptime = '7 أيام, 12 ساعة';
  activeUsers = 23;
  requestsPerMinute = 156;
  cpuUsage = 45;
  memoryUsage = 68;
  diskUsage = 32;
  networkSent = '2.4 GB';
  networkReceived = '1.8 GB';
  downloadSpeed = '45.2 Mbps';
  uploadSpeed = '12.8 Mbps';
  dbTables = 15;
  dbSize = '245.6 MB';
  dbQueries = 23;

  systemLogs = [
    {
      level: 'info',
      message: 'تم تحديث النظام بنجاح',
      details: 'تم تطبيق التحديثات الأمنية الجديدة',
      timestamp: new Date()
    },
    {
      level: 'warning',
      message: 'استخدام الذاكرة مرتفع',
      details: 'استخدام الذاكرة وصل إلى 85% من السعة المتاحة',
      timestamp: new Date(Date.now() - 300000)
    },
    {
      level: 'success',
      message: 'تم إنشاء نسخة احتياطية',
      details: 'تم إنشاء النسخة الاحتياطية اليومية بنجاح',
      timestamp: new Date(Date.now() - 600000)
    },
    {
      level: 'error',
      message: 'فشل في الاتصال بقاعدة البيانات',
      details: 'تم استعادة الاتصال خلال 30 ثانية',
      timestamp: new Date(Date.now() - 900000)
    }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadSystemStatus();
    this.startRealTimeUpdates();
  }

  loadSystemStatus() {
    // Mock data - replace with actual API call
    this.cpuUsage = Math.floor(Math.random() * 50) + 20;
    this.memoryUsage = Math.floor(Math.random() * 40) + 40;
    this.diskUsage = Math.floor(Math.random() * 30) + 20;
    this.activeUsers = Math.floor(Math.random() * 50) + 10;
    this.requestsPerMinute = Math.floor(Math.random() * 100) + 100;
  }

  startRealTimeUpdates() {
    // Update metrics every 30 seconds
    setInterval(() => {
      this.loadSystemStatus();
    }, 30000);
  }

  refreshSystemStatus() {
    this.loadSystemStatus();
  }

  getLogClass(level: string): string {
    switch (level) {
      case 'info': return 'log-info';
      case 'warning': return 'log-warning';
      case 'error': return 'log-error';
      case 'success': return 'log-success';
      default: return 'log-info';
    }
  }

  getLogIconClass(level: string): string {
    switch (level) {
      case 'info': return 'bg-blue-100 text-blue-600';
      case 'warning': return 'bg-yellow-100 text-yellow-600';
      case 'error': return 'bg-red-100 text-red-600';
      case 'success': return 'bg-green-100 text-green-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  }

  getLogIcon(level: string): string {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  }
}