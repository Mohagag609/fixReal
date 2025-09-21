import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-debug-treasury',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">تشخيص الخزينة</h1>
              <p class="text-gray-600 mt-1">تشخيص وإصلاح مشاكل الخزينة والمعاملات المالية</p>
            </div>
            <div class="flex items-center space-x-3 space-x-reverse">
              <button
                (click)="runFullDiagnosis()"
                [disabled]="isRunningDiagnosis"
                class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                <span *ngIf="!isRunningDiagnosis">تشغيل التشخيص الكامل</span>
                <span *ngIf="isRunningDiagnosis">جاري التشخيص...</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Treasury Health Status -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">حالة الخزينة</p>
                <p class="text-2xl font-bold" 
                   [class]="treasuryHealth.overall ? 'text-green-600' : 'text-red-600'">
                  {{ treasuryHealth.overall ? 'سليمة' : 'مشكلة' }}
                </p>
              </div>
              <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                   [class]="treasuryHealth.overall ? 'bg-green-100' : 'bg-red-100'">
                <span class="text-2xl">{{ treasuryHealth.overall ? '✅' : '❌' }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">المعاملات المعلقة</p>
                <p class="text-2xl font-bold text-orange-600">{{ pendingTransactions }}</p>
              </div>
              <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span class="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">المعاملات الفاشلة</p>
                <p class="text-2xl font-bold text-red-600">{{ failedTransactions }}</p>
              </div>
              <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span class="text-2xl">❌</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">الرصيد الإجمالي</p>
                <p class="text-2xl font-bold text-blue-600">{{ totalBalance | currency:'SAR':'symbol':'1.2-2' }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span class="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Diagnosis Results -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Issues Found -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">المشاكل المكتشفة</h2>
            
            <div class="space-y-3">
              <div *ngFor="let issue of issues" 
                   class="flex items-center space-x-3 space-x-reverse p-4 rounded-xl"
                   [class]="getIssueClass(issue.severity)">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                     [class]="getIssueIconClass(issue.severity)">
                  <span class="text-sm">{{ getIssueIcon(issue.severity) }}</span>
                </div>
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900">{{ issue.title }}</h3>
                  <p class="text-sm text-gray-600">{{ issue.description }}</p>
                </div>
                <button
                  (click)="fixIssue(issue.id)"
                  [disabled]="isFixingIssue"
                  class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                  إصلاح
                </button>
              </div>
            </div>
          </div>

          <!-- Transaction Analysis -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">تحليل المعاملات</h2>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 class="font-medium text-gray-900">المعاملات المكتملة</h3>
                  <p class="text-sm text-gray-600">خلال آخر 24 ساعة</p>
                </div>
                <span class="text-2xl font-bold text-green-600">{{ completedTransactions }}</span>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 class="font-medium text-gray-900">المعاملات المعلقة</h3>
                  <p class="text-sm text-gray-600">تحتاج مراجعة</p>
                </div>
                <span class="text-2xl font-bold text-orange-600">{{ pendingTransactions }}</span>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 class="font-medium text-gray-900">المعاملات الفاشلة</h3>
                  <p class="text-sm text-gray-600">تحتاج إعادة معالجة</p>
                </div>
                <span class="text-2xl font-bold text-red-600">{{ failedTransactions }}</span>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 class="font-medium text-gray-900">متوسط وقت المعالجة</h3>
                  <p class="text-sm text-gray-600">بالثواني</p>
                </div>
                <span class="text-2xl font-bold text-blue-600">{{ averageProcessingTime }}s</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Safe Balances -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">أرصدة الخزائن</h2>
          
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-right py-3 px-4 font-medium text-gray-700">اسم الخزينة</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-700">الرصيد</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-700">آخر معاملة</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-700">الحالة</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let safe of safes" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-4 px-4 text-gray-900">{{ safe.name }}</td>
                  <td class="py-4 px-4 text-gray-900">{{ safe.balance | currency:'SAR':'symbol':'1.2-2' }}</td>
                  <td class="py-4 px-4 text-gray-900">{{ safe.lastTransaction | date:'short' }}</td>
                  <td class="py-4 px-4">
                    <span class="px-3 py-1 rounded-full text-xs font-medium"
                          [class]="safe.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                      {{ safe.status === 'active' ? 'نشطة' : 'معطلة' }}
                    </span>
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex items-center space-x-2 space-x-reverse">
                      <button
                        (click)="reconcileSafe(safe.id)"
                        class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        تسوية
                      </button>
                      <button
                        (click)="viewSafeDetails(safe.id)"
                        class="text-green-600 hover:text-green-700 text-sm font-medium">
                        تفاصيل
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Debug Tools -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">أدوات التشخيص</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="p-4 bg-gray-50 rounded-xl">
              <h3 class="font-medium text-gray-900 mb-2">إعادة حساب الأرصدة</h3>
              <p class="text-sm text-gray-600 mb-4">إعادة حساب جميع أرصدة الخزائن</p>
              <button
                (click)="recalculateBalances()"
                [disabled]="isRecalculating"
                class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                <span *ngIf="!isRecalculating">تشغيل</span>
                <span *ngIf="isRecalculating">جاري...</span>
              </button>
            </div>

            <div class="p-4 bg-gray-50 rounded-xl">
              <h3 class="font-medium text-gray-900 mb-2">تنظيف المعاملات المعلقة</h3>
              <p class="text-sm text-gray-600 mb-4">حذف المعاملات المعلقة القديمة</p>
              <button
                (click)="cleanPendingTransactions()"
                [disabled]="isCleaning"
                class="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                <span *ngIf="!isCleaning">تشغيل</span>
                <span *ngIf="isCleaning">جاري...</span>
              </button>
            </div>

            <div class="p-4 bg-gray-50 rounded-xl">
              <h3 class="font-medium text-gray-900 mb-2">إعادة معالجة المعاملات</h3>
              <p class="text-sm text-gray-600 mb-4">إعادة معالجة المعاملات الفاشلة</p>
              <button
                (click)="reprocessFailedTransactions()"
                [disabled]="isReprocessing"
                class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                <span *ngIf="!isReprocessing">تشغيل</span>
                <span *ngIf="isReprocessing">جاري...</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .issue-critical { @apply bg-red-50 border-red-200; }
    .issue-warning { @apply bg-yellow-50 border-yellow-200; }
    .issue-info { @apply bg-blue-50 border-blue-200; }
  `]
})
export class DebugTreasuryComponent implements OnInit {
  treasuryHealth = {
    overall: true,
    balances: true,
    transactions: true,
    safes: true
  };

  pendingTransactions = 5;
  failedTransactions = 2;
  completedTransactions = 1247;
  totalBalance = 1250000;
  averageProcessingTime = 2.3;

  issues = [
    {
      id: 1,
      severity: 'warning',
      title: 'معاملة معلقة منذ أكثر من 24 ساعة',
      description: 'معاملة رقم #12345 معلقة منذ 26 ساعة'
    },
    {
      id: 2,
      severity: 'critical',
      title: 'عدم تطابق في رصيد الخزينة الرئيسية',
      description: 'الرصيد المحسوب يختلف عن الرصيد المسجل'
    },
    {
      id: 3,
      severity: 'info',
      title: 'معاملة فاشلة تحتاج إعادة معالجة',
      description: 'معاملة رقم #12346 فشلت بسبب خطأ في الشبكة'
    }
  ];

  safes = [
    {
      id: 1,
      name: 'الخزينة الرئيسية',
      balance: 750000,
      lastTransaction: new Date(),
      status: 'active'
    },
    {
      id: 2,
      name: 'خزينة المبيعات',
      balance: 250000,
      lastTransaction: new Date(Date.now() - 3600000),
      status: 'active'
    },
    {
      id: 3,
      name: 'خزينة الطوارئ',
      balance: 100000,
      lastTransaction: new Date(Date.now() - 86400000),
      status: 'active'
    }
  ];

  isRunningDiagnosis = false;
  isFixingIssue = false;
  isRecalculating = false;
  isCleaning = false;
  isReprocessing = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.runFullDiagnosis();
  }

  runFullDiagnosis() {
    this.isRunningDiagnosis = true;
    
    // Mock diagnosis process
    setTimeout(() => {
      this.isRunningDiagnosis = false;
      this.loadDiagnosisResults();
    }, 3000);
  }

  loadDiagnosisResults() {
    // Mock data - replace with actual API call
    this.treasuryHealth = {
      overall: Math.random() > 0.3,
      balances: Math.random() > 0.2,
      transactions: Math.random() > 0.4,
      safes: Math.random() > 0.1
    };

    this.pendingTransactions = Math.floor(Math.random() * 10);
    this.failedTransactions = Math.floor(Math.random() * 5);
    this.completedTransactions = Math.floor(Math.random() * 500) + 1000;
    this.averageProcessingTime = Math.random() * 5 + 1;
  }

  getIssueClass(severity: string): string {
    switch (severity) {
      case 'critical': return 'issue-critical';
      case 'warning': return 'issue-warning';
      case 'info': return 'issue-info';
      default: return 'issue-info';
    }
  }

  getIssueIconClass(severity: string): string {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-600';
      case 'warning': return 'bg-yellow-100 text-yellow-600';
      case 'info': return 'bg-blue-100 text-blue-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  }

  getIssueIcon(severity: string): string {
    switch (severity) {
      case 'critical': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }

  fixIssue(issueId: number) {
    this.isFixingIssue = true;
    
    setTimeout(() => {
      this.isFixingIssue = false;
      this.issues = this.issues.filter(issue => issue.id !== issueId);
    }, 2000);
  }

  recalculateBalances() {
    this.isRecalculating = true;
    
    setTimeout(() => {
      this.isRecalculating = false;
      this.loadDiagnosisResults();
    }, 3000);
  }

  cleanPendingTransactions() {
    this.isCleaning = true;
    
    setTimeout(() => {
      this.isCleaning = false;
      this.pendingTransactions = 0;
    }, 2000);
  }

  reprocessFailedTransactions() {
    this.isReprocessing = true;
    
    setTimeout(() => {
      this.isReprocessing = false;
      this.failedTransactions = 0;
    }, 2500);
  }

  reconcileSafe(safeId: number) {
    // Mock reconciliation
    console.log('Reconciling safe:', safeId);
  }

  viewSafeDetails(safeId: number) {
    // Mock view details
    console.log('Viewing safe details:', safeId);
  }
}