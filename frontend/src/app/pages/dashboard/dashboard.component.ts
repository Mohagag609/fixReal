import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DashboardKPIs } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Last Update -->
      <div class="text-xs text-gray-500">
        آخر تحديث: {{ lastUpdate }}
      </div>

      <!-- Error Message -->
      <div *ngIf="error" class="card bg-red-50 border-red-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <span class="text-red-500 mr-2 text-lg">⚠️</span>
            <div>
              <h3 class="text-red-800 font-semibold text-sm">خطأ في تحميل البيانات</h3>
              <p class="text-red-600 text-xs">{{ error }}</p>
            </div>
          </div>
          <button class="btn btn-danger text-sm" (click)="loadDashboardData()">
            إعادة المحاولة
          </button>
        </div>
      </div>

      <!-- KPIs Section -->
      <div *ngIf="kpis && !loading" class="space-y-6">
        <!-- Main KPIs -->
        <div>
          <h2 class="text-lg font-bold text-gray-900 mb-4">المؤشرات الرئيسية</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              *ngFor="let kpi of mainKpis" 
              class="kpi-card"
              [routerLink]="kpi.route"
              (click)="onKpiClick(kpi.route)">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="text-xs font-medium text-gray-600 mb-1">{{ kpi.title }}</p>
                  <p class="text-lg font-bold" [ngClass]="kpi.color">{{ kpi.value }}</p>
                  <p *ngIf="kpi.trend" class="text-xs text-gray-500 mt-1">{{ kpi.trend }}</p>
                </div>
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" [ngClass]="kpi.bgColor">
                  <span class="text-sm">{{ kpi.icon }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Additional KPIs -->
        <div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              *ngFor="let kpi of additionalKpis" 
              class="kpi-card"
              [routerLink]="kpi.route"
              (click)="onKpiClick(kpi.route)">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="text-xs font-medium text-gray-600 mb-1">{{ kpi.title }}</p>
                  <p class="text-lg font-bold" [ngClass]="kpi.color">{{ kpi.value }}</p>
                  <p *ngIf="kpi.trend" class="text-xs text-gray-500 mt-1">{{ kpi.trend }}</p>
                </div>
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" [ngClass]="kpi.bgColor">
                  <span class="text-sm">{{ kpi.icon }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div>
          <h2 class="text-lg font-bold text-gray-900 mb-4">الإجراءات السريعة</h2>
          <div class="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div 
              *ngFor="let action of quickActions" 
              class="quick-action-card"
              [routerLink]="action.route"
              (click)="onActionClick(action.route)">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2" [ngClass]="action.bgColor">
                <span class="text-lg">{{ action.icon }}</span>
              </div>
              <h3 class="text-sm font-semibold text-gray-900">{{ action.title }}</h3>
            </div>
          </div>
        </div>

        <!-- Navigation Cards -->
        <div>
          <h2 class="text-lg font-bold text-gray-900 mb-4">جميع الوحدات</h2>
          <div class="grid grid-cols-5 md:grid-cols-10 gap-3">
            <div 
              *ngFor="let item of navigationItems" 
              class="quick-action-card"
              [routerLink]="item.route"
              (click)="onActionClick(item.route)">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" [ngClass]="item.bgColor">
                <span class="text-sm">{{ item.icon }}</span>
              </div>
              <h3 class="text-xs font-semibold text-gray-900">{{ item.title }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <h2 class="text-lg font-semibold text-gray-700">جاري التحميل...</h2>
          <p class="text-sm text-gray-500 mt-2">جاري تحميل البيانات...</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit {
  kpis: DashboardKPIs | null = null;
  loading = true;
  error: string | null = null;
  lastUpdate = new Date().toLocaleString('ar-SA');

  mainKpis: any[] = [];
  additionalKpis: any[] = [];
  quickActions: any[] = [];
  navigationItems: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadDashboardData();
    this.setupQuickActions();
    this.setupNavigationItems();
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;

    this.apiService.getDashboardData().subscribe({
      next: (response) => {
        if (response.success) {
          this.kpis = response.data;
          this.setupKpis();
          this.lastUpdate = new Date().toLocaleString('ar-SA');
        } else {
          this.error = 'فشل في تحميل البيانات';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.loading = false;
        console.error('Dashboard error:', error);
      }
    });
  }

  setupKpis() {
    if (!this.kpis) return;

    this.mainKpis = [
      {
        title: 'إجمالي العقود',
        value: this.formatCurrency(this.kpis.total_contract_value),
        icon: '💰',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        trend: `${this.kpis.total_contracts} عقد`,
        route: '/contracts'
      },
      {
        title: 'إجمالي الإيصالات',
        value: this.formatCurrency(this.kpis.total_voucher_amount),
        icon: '📈',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        trend: `${this.kpis.total_vouchers} إيصال`,
        route: '/vouchers'
      },
      {
        title: 'الأقساط المدفوعة',
        value: this.kpis.paid_installments.toString(),
        icon: '✅',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        trend: 'مدفوعة',
        route: '/installments'
      },
      {
        title: 'الأقساط المعلقة',
        value: this.kpis.pending_installments.toString(),
        icon: '⏳',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        trend: 'معلقة',
        route: '/installments'
      }
    ];

    const collectionRate = this.kpis.paid_installments + this.kpis.pending_installments > 0 
      ? Math.round((this.kpis.paid_installments / (this.kpis.paid_installments + this.kpis.pending_installments)) * 100)
      : 0;

    this.additionalKpis = [
      {
        title: 'نسبة التحصيل',
        value: `${collectionRate}%`,
        icon: '📊',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        trend: 'ممتاز',
        route: '/installments'
      },
      {
        title: 'إجمالي الديون',
        value: this.formatCurrency(this.kpis.pending_installments * 1000),
        icon: '⚠️',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        trend: 'يحتاج متابعة',
        route: '/installments'
      },
      {
        title: 'عدد الوحدات',
        value: this.kpis.total_units.toString(),
        icon: '🏠',
        color: 'text-teal-600',
        bgColor: 'bg-teal-100',
        trend: `نشطة: ${this.kpis.active_units}`,
        route: '/units'
      },
      {
        title: 'عدد المستثمرين',
        value: this.kpis.total_customers.toString(),
        icon: '👥',
        color: 'text-pink-600',
        bgColor: 'bg-pink-100',
        trend: 'نشط',
        route: '/customers'
      }
    ];
  }

  setupQuickActions() {
    this.quickActions = [
      { title: 'عميل جديد', icon: '👤', bgColor: 'bg-gradient-to-r from-blue-100 to-blue-200', route: '/customers' },
      { title: 'وحدة جديدة', icon: '🏠', bgColor: 'bg-gradient-to-r from-green-100 to-green-200', route: '/units' },
      { title: 'عقد جديد', icon: '📋', bgColor: 'bg-gradient-to-r from-purple-100 to-purple-200', route: '/contracts' },
      { title: 'سمسار', icon: '🤝', bgColor: 'bg-gradient-to-r from-yellow-100 to-yellow-200', route: '/brokers' },
      { title: 'شركاء', icon: '👥', bgColor: 'bg-gradient-to-r from-indigo-100 to-indigo-200', route: '/partners' },
      { title: 'خزينة', icon: '💰', bgColor: 'bg-gradient-to-r from-pink-100 to-pink-200', route: '/treasury' }
    ];
  }

  setupNavigationItems() {
    this.navigationItems = [
      { title: 'العملاء', icon: '👤', bgColor: 'bg-gradient-to-r from-blue-100 to-blue-200', route: '/customers' },
      { title: 'الوحدات', icon: '🏠', bgColor: 'bg-gradient-to-r from-green-100 to-green-200', route: '/units' },
      { title: 'العقود', icon: '📋', bgColor: 'bg-gradient-to-r from-purple-100 to-purple-200', route: '/contracts' },
      { title: 'السماسرة', icon: '🤝', bgColor: 'bg-gradient-to-r from-yellow-100 to-yellow-200', route: '/brokers' },
      { title: 'الأقساط', icon: '📅', bgColor: 'bg-gradient-to-r from-indigo-100 to-indigo-200', route: '/installments' },
      { title: 'السندات', icon: '📄', bgColor: 'bg-gradient-to-r from-pink-100 to-pink-200', route: '/vouchers' },
      { title: 'الشركاء', icon: '👥', bgColor: 'bg-gradient-to-r from-teal-100 to-teal-200', route: '/partners' },
      { title: 'الخزينة', icon: '💰', bgColor: 'bg-gradient-to-r from-orange-100 to-orange-200', route: '/treasury' },
      { title: 'التقارير', icon: '📊', bgColor: 'bg-gradient-to-r from-red-100 to-red-200', route: '/reports' },
      { title: 'النسخ', icon: '💾', bgColor: 'bg-gradient-to-r from-gray-100 to-gray-200', route: '/backup' }
    ];
  }

  onKpiClick(route: string) {
    // Navigation will be handled by routerLink
  }

  onActionClick(route: string) {
    // Navigation will be handled by routerLink
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}