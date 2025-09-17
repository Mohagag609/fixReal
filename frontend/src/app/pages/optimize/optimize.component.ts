import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-optimize',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">تحسين الأداء</h1>
              <p class="text-gray-600 mt-1">تحسين أداء النظام وقاعدة البيانات</p>
            </div>
            <div class="flex items-center space-x-3 space-x-reverse">
              <button
                (click)="runFullOptimization()"
                [disabled]="isOptimizing"
                class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                <span *ngIf="!isOptimizing">تشغيل التحسين الكامل</span>
                <span *ngIf="isOptimizing">جاري التحسين...</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Performance Metrics -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">سرعة الاستجابة</p>
                <p class="text-2xl font-bold text-green-600">{{ responseTime }}ms</p>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span class="text-2xl">⚡</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">استخدام الذاكرة</p>
                <p class="text-2xl font-bold text-blue-600">{{ memoryUsage }}%</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span class="text-2xl">🧠</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">استخدام القرص</p>
                <p class="text-2xl font-bold text-purple-600">{{ diskUsage }}%</p>
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span class="text-2xl">💾</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">درجة الأداء</p>
                <p class="text-2xl font-bold text-orange-600">{{ performanceScore }}/100</p>
              </div>
              <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span class="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Optimization Tools -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Database Optimization -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">تحسين قاعدة البيانات</h2>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 class="font-medium text-gray-900">تحسين الجداول</h3>
                  <p class="text-sm text-gray-600">تحسين فهارس الجداول وإزالة البيانات المكررة</p>
                </div>
                <button
                  (click)="optimizeTables()"
                  [disabled]="isOptimizingTables"
                  class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                  <span *ngIf="!isOptimizingTables">تشغيل</span>
                  <span *ngIf="isOptimizingTables">جاري...</span>
                </button>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 class="font-medium text-gray-900">تنظيف السجلات القديمة</h3>
                  <p class="text-sm text-gray-600">حذف السجلات القديمة والغير مستخدمة</p>
                </div>
                <button
                  (click)="cleanOldRecords()"
                  [disabled]="isCleaningRecords"
                  class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                  <span *ngIf="!isCleaningRecords">تشغيل</span>
                  <span *ngIf="isCleaningRecords">جاري...</span>
                </button>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 class="font-medium text-gray-900">إعادة بناء الفهارس</h3>
                  <p class="text-sm text-gray-600">إعادة بناء فهارس قاعدة البيانات لتحسين الأداء</p>
                </div>
                <button
                  (click)="rebuildIndexes()"
                  [disabled]="isRebuildingIndexes"
                  class="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                  <span *ngIf="!isRebuildingIndexes">تشغيل</span>
                  <span *ngIf="isRebuildingIndexes">جاري...</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Cache Management -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">إدارة التخزين المؤقت</h2>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 class="font-medium text-gray-900">مسح التخزين المؤقت</h3>
                  <p class="text-sm text-gray-600">مسح جميع ملفات التخزين المؤقت</p>
                </div>
                <button
                  (click)="clearCache()"
                  [disabled]="isClearingCache"
                  class="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                  <span *ngIf="!isClearingCache">مسح</span>
                  <span *ngIf="isClearingCache">جاري...</span>
                </button>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 class="font-medium text-gray-900">تحسين التخزين المؤقت</h3>
                  <p class="text-sm text-gray-600">تحسين إعدادات التخزين المؤقت</p>
                </div>
                <button
                  (click)="optimizeCache()"
                  [disabled]="isOptimizingCache"
                  class="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                  <span *ngIf="!isOptimizingCache">تحسين</span>
                  <span *ngIf="isOptimizingCache">جاري...</span>
                </button>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 class="font-medium text-gray-900">إحصائيات التخزين المؤقت</h3>
                  <p class="text-sm text-gray-600">عرض إحصائيات التخزين المؤقت</p>
                </div>
                <button
                  (click)="showCacheStats()"
                  class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105">
                  عرض
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- System Health -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">صحة النظام</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="p-4 bg-green-50 rounded-xl border border-green-200">
              <div class="flex items-center space-x-3 space-x-reverse">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span class="text-green-600">✓</span>
                </div>
                <div>
                  <h3 class="font-medium text-green-900">قاعدة البيانات</h3>
                  <p class="text-sm text-green-700">تعمل بشكل طبيعي</p>
                </div>
              </div>
            </div>

            <div class="p-4 bg-green-50 rounded-xl border border-green-200">
              <div class="flex items-center space-x-3 space-x-reverse">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span class="text-green-600">✓</span>
                </div>
                <div>
                  <h3 class="font-medium text-green-900">الخادم</h3>
                  <p class="text-sm text-green-700">يعمل بشكل طبيعي</p>
                </div>
              </div>
            </div>

            <div class="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div class="flex items-center space-x-3 space-x-reverse">
                <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span class="text-yellow-600">⚠</span>
                </div>
                <div>
                  <h3 class="font-medium text-yellow-900">الذاكرة</h3>
                  <p class="text-sm text-yellow-700">استخدام عالي</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `]
})
export class OptimizeComponent implements OnInit {
  responseTime = 120;
  memoryUsage = 75;
  diskUsage = 45;
  performanceScore = 85;
  
  isOptimizing = false;
  isOptimizingTables = false;
  isCleaningRecords = false;
  isRebuildingIndexes = false;
  isClearingCache = false;
  isOptimizingCache = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadPerformanceMetrics();
  }

  loadPerformanceMetrics() {
    // Mock data - replace with actual API call
    this.responseTime = Math.floor(Math.random() * 200) + 50;
    this.memoryUsage = Math.floor(Math.random() * 40) + 60;
    this.diskUsage = Math.floor(Math.random() * 30) + 30;
    this.performanceScore = Math.floor(Math.random() * 20) + 80;
  }

  runFullOptimization() {
    this.isOptimizing = true;
    // Mock optimization process
    setTimeout(() => {
      this.isOptimizing = false;
      this.loadPerformanceMetrics();
    }, 5000);
  }

  optimizeTables() {
    this.isOptimizingTables = true;
    setTimeout(() => {
      this.isOptimizingTables = false;
    }, 3000);
  }

  cleanOldRecords() {
    this.isCleaningRecords = true;
    setTimeout(() => {
      this.isCleaningRecords = false;
    }, 2000);
  }

  rebuildIndexes() {
    this.isRebuildingIndexes = true;
    setTimeout(() => {
      this.isRebuildingIndexes = false;
    }, 4000);
  }

  clearCache() {
    this.isClearingCache = true;
    setTimeout(() => {
      this.isClearingCache = false;
    }, 1000);
  }

  optimizeCache() {
    this.isOptimizingCache = true;
    setTimeout(() => {
      this.isOptimizingCache = false;
    }, 2000);
  }

  showCacheStats() {
    // Mock cache stats
    alert('إحصائيات التخزين المؤقت:\n- حجم التخزين المؤقت: 45.2 MB\n- عدد الملفات: 1,234\n- معدل النجاح: 98.5%');
  }
}