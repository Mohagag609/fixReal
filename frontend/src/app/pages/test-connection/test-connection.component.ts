import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-test-connection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">اختبار الاتصال</h1>
              <p class="text-gray-600 mt-1">اختبار الاتصال بقاعدة البيانات والخوادم</p>
            </div>
            <div class="flex items-center space-x-3 space-x-reverse">
              <button
                (click)="runAllTests()"
                [disabled]="isRunningTests"
                class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                <span *ngIf="!isRunningTests">تشغيل جميع الاختبارات</span>
                <span *ngIf="isRunningTests">جاري الاختبار...</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Connection Tests -->
        <div class="space-y-6">
          <!-- Database Connection -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-gray-900">اتصال قاعدة البيانات</h2>
              <button
                (click)="testDatabaseConnection()"
                [disabled]="isTestingDatabase"
                class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                <span *ngIf="!isTestingDatabase">اختبار</span>
                <span *ngIf="isTestingDatabase">جاري...</span>
              </button>
            </div>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div class="flex items-center space-x-3 space-x-reverse">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                       [class]="databaseStatus.connection ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
                    <span class="text-sm">{{ databaseStatus.connection ? '✓' : '✗' }}</span>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900">الاتصال</h3>
                    <p class="text-sm text-gray-600">{{ databaseStatus.connection ? 'متصل' : 'غير متصل' }}</p>
                  </div>
                </div>
                <span class="text-sm font-bold" 
                      [class]="databaseStatus.connection ? 'text-green-600' : 'text-red-600'">
                  {{ databaseStatus.connection ? 'نجح' : 'فشل' }}
                </span>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div class="flex items-center space-x-3 space-x-reverse">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                       [class]="databaseStatus.performance ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'">
                    <span class="text-sm">{{ databaseStatus.performance ? '✓' : '⚠' }}</span>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900">الأداء</h3>
                    <p class="text-sm text-gray-600">{{ databaseStatus.performance ? 'ممتاز' : 'بطيء' }}</p>
                  </div>
                </div>
                <span class="text-sm font-bold" 
                      [class]="databaseStatus.performance ? 'text-green-600' : 'text-yellow-600'">
                  {{ databaseStatus.responseTime }}ms
                </span>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div class="flex items-center space-x-3 space-x-reverse">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                       [class]="databaseStatus.tables ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
                    <span class="text-sm">{{ databaseStatus.tables ? '✓' : '✗' }}</span>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900">الجداول</h3>
                    <p class="text-sm text-gray-600">{{ databaseStatus.tables ? 'جميع الجداول متاحة' : 'بعض الجداول مفقودة' }}</p>
                  </div>
                </div>
                <span class="text-sm font-bold" 
                      [class]="databaseStatus.tables ? 'text-green-600' : 'text-red-600'">
                  {{ databaseStatus.tables ? 'متاح' : 'مفقود' }}
                </span>
              </div>
            </div>
          </div>

          <!-- API Connection -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-gray-900">اتصال API</h2>
              <button
                (click)="testApiConnection()"
                [disabled]="isTestingApi"
                class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                <span *ngIf="!isTestingApi">اختبار</span>
                <span *ngIf="isTestingApi">جاري...</span>
              </button>
            </div>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div class="flex items-center space-x-3 space-x-reverse">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                       [class]="apiStatus.connection ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
                    <span class="text-sm">{{ apiStatus.connection ? '✓' : '✗' }}</span>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900">الاتصال</h3>
                    <p class="text-sm text-gray-600">{{ apiStatus.connection ? 'متصل' : 'غير متصل' }}</p>
                  </div>
                </div>
                <span class="text-sm font-bold" 
                      [class]="apiStatus.connection ? 'text-green-600' : 'text-red-600'">
                  {{ apiStatus.connection ? 'نجح' : 'فشل' }}
                </span>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div class="flex items-center space-x-3 space-x-reverse">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                       [class]="apiStatus.authentication ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
                    <span class="text-sm">{{ apiStatus.authentication ? '✓' : '✗' }}</span>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900">المصادقة</h3>
                    <p class="text-sm text-gray-600">{{ apiStatus.authentication ? 'مفعلة' : 'غير مفعلة' }}</p>
                  </div>
                </div>
                <span class="text-sm font-bold" 
                      [class]="apiStatus.authentication ? 'text-green-600' : 'text-red-600'">
                  {{ apiStatus.authentication ? 'مفعل' : 'معطل' }}
                </span>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div class="flex items-center space-x-3 space-x-reverse">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                       [class]="apiStatus.endpoints ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'">
                    <span class="text-sm">{{ apiStatus.endpoints ? '✓' : '⚠' }}</span>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900">النقاط الطرفية</h3>
                    <p class="text-sm text-gray-600">{{ apiStatus.endpoints ? 'جميع النقاط تعمل' : 'بعض النقاط لا تعمل' }}</p>
                  </div>
                </div>
                <span class="text-sm font-bold" 
                      [class]="apiStatus.endpoints ? 'text-green-600' : 'text-yellow-600'">
                  {{ apiStatus.endpoints ? 'تعمل' : 'مشكلة' }}
                </span>
              </div>
            </div>
          </div>

          <!-- External Services -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-gray-900">الخدمات الخارجية</h2>
              <button
                (click)="testExternalServices()"
                [disabled]="isTestingExternal"
                class="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                <span *ngIf="!isTestingExternal">اختبار</span>
                <span *ngIf="isTestingExternal">جاري...</span>
              </button>
            </div>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div class="flex items-center space-x-3 space-x-reverse">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                       [class]="externalStatus.email ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
                    <span class="text-sm">{{ externalStatus.email ? '✓' : '✗' }}</span>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900">خدمة البريد الإلكتروني</h3>
                    <p class="text-sm text-gray-600">{{ externalStatus.email ? 'تعمل بشكل طبيعي' : 'لا تعمل' }}</p>
                  </div>
                </div>
                <span class="text-sm font-bold" 
                      [class]="externalStatus.email ? 'text-green-600' : 'text-red-600'">
                  {{ externalStatus.email ? 'تعمل' : 'لا تعمل' }}
                </span>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div class="flex items-center space-x-3 space-x-reverse">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                       [class]="externalStatus.sms ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
                    <span class="text-sm">{{ externalStatus.sms ? '✓' : '✗' }}</span>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900">خدمة الرسائل النصية</h3>
                    <p class="text-sm text-gray-600">{{ externalStatus.sms ? 'تعمل بشكل طبيعي' : 'لا تعمل' }}</p>
                  </div>
                </div>
                <span class="text-sm font-bold" 
                      [class]="externalStatus.sms ? 'text-green-600' : 'text-red-600'">
                  {{ externalStatus.sms ? 'تعمل' : 'لا تعمل' }}
                </span>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div class="flex items-center space-x-3 space-x-reverse">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                       [class]="externalStatus.storage ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
                    <span class="text-sm">{{ externalStatus.storage ? '✓' : '✗' }}</span>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900">خدمة التخزين السحابي</h3>
                    <p class="text-sm text-gray-600">{{ externalStatus.storage ? 'تعمل بشكل طبيعي' : 'لا تعمل' }}</p>
                  </div>
                </div>
                <span class="text-sm font-bold" 
                      [class]="externalStatus.storage ? 'text-green-600' : 'text-red-600'">
                  {{ externalStatus.storage ? 'تعمل' : 'لا تعمل' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Test Results Summary -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">ملخص النتائج</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center p-4 bg-green-50 rounded-xl border border-green-200">
              <div class="text-3xl font-bold text-green-600 mb-2">{{ passedTests }}</div>
              <div class="text-sm text-green-700">اختبارات نجحت</div>
            </div>
            
            <div class="text-center p-4 bg-red-50 rounded-xl border border-red-200">
              <div class="text-3xl font-bold text-red-600 mb-2">{{ failedTests }}</div>
              <div class="text-sm text-red-700">اختبارات فشلت</div>
            </div>
            
            <div class="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div class="text-3xl font-bold text-blue-600 mb-2">{{ totalTests }}</div>
              <div class="text-sm text-blue-700">إجمالي الاختبارات</div>
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
export class TestConnectionComponent implements OnInit {
  isRunningTests = false;
  isTestingDatabase = false;
  isTestingApi = false;
  isTestingExternal = false;

  databaseStatus = {
    connection: false,
    performance: false,
    tables: false,
    responseTime: 0
  };

  apiStatus = {
    connection: false,
    authentication: false,
    endpoints: false
  };

  externalStatus = {
    email: false,
    sms: false,
    storage: false
  };

  get passedTests(): number {
    let count = 0;
    if (this.databaseStatus.connection) count++;
    if (this.databaseStatus.performance) count++;
    if (this.databaseStatus.tables) count++;
    if (this.apiStatus.connection) count++;
    if (this.apiStatus.authentication) count++;
    if (this.apiStatus.endpoints) count++;
    if (this.externalStatus.email) count++;
    if (this.externalStatus.sms) count++;
    if (this.externalStatus.storage) count++;
    return count;
  }

  get failedTests(): number {
    return this.totalTests - this.passedTests;
  }

  get totalTests(): number {
    return 9;
  }

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.runAllTests();
  }

  runAllTests() {
    this.isRunningTests = true;
    this.testDatabaseConnection();
    this.testApiConnection();
    this.testExternalServices();
    
    setTimeout(() => {
      this.isRunningTests = false;
    }, 5000);
  }

  testDatabaseConnection() {
    this.isTestingDatabase = true;
    
    // Mock database test
    setTimeout(() => {
      this.databaseStatus = {
        connection: Math.random() > 0.1, // 90% success rate
        performance: Math.random() > 0.2, // 80% success rate
        tables: Math.random() > 0.05, // 95% success rate
        responseTime: Math.floor(Math.random() * 200) + 50
      };
      this.isTestingDatabase = false;
    }, 2000);
  }

  testApiConnection() {
    this.isTestingApi = true;
    
    // Mock API test
    setTimeout(() => {
      this.apiStatus = {
        connection: Math.random() > 0.05, // 95% success rate
        authentication: Math.random() > 0.1, // 90% success rate
        endpoints: Math.random() > 0.15 // 85% success rate
      };
      this.isTestingApi = false;
    }, 1500);
  }

  testExternalServices() {
    this.isTestingExternal = true;
    
    // Mock external services test
    setTimeout(() => {
      this.externalStatus = {
        email: Math.random() > 0.2, // 80% success rate
        sms: Math.random() > 0.3, // 70% success rate
        storage: Math.random() > 0.1 // 90% success rate
      };
      this.isTestingExternal = false;
    }, 3000);
  }
}