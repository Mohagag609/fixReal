import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Overlay for mobile -->
    <div 
      *ngIf="isOpen" 
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
      (click)="onToggle()">
    </div>

    <!-- Sidebar -->
    <div 
      class="sidebar"
      [class.sidebar-open]="isOpen"
      [class.sidebar-closed]="!isOpen"
      [class.w-80]="isOpen"
      [class.lg:w-72]="isOpen">
      
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200/50">
        <div class="flex items-center space-x-3 space-x-reverse">
          <div class="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span class="text-white text-lg">🏢</span>
          </div>
          <div>
            <h1 class="text-lg font-bold text-gray-900">نظام العقارات</h1>
            <p class="text-xs text-gray-600">إدارة متطورة</p>
          </div>
        </div>
        <button
          (click)="onToggle()"
          class="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200">
          <span class="text-gray-600">✕</span>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="p-4 space-y-2 overflow-y-auto h-[calc(100vh-120px)]">
        <a
          *ngFor="let item of menuItems"
          [routerLink]="item.path"
          routerLinkActive="active"
          (click)="onItemClick()"
          class="w-full flex items-center space-x-3 space-x-reverse p-4 rounded-xl transition-all duration-200 hover:bg-gray-50 text-gray-700 hover:text-gray-900 group">
          
          <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 bg-gray-100 group-hover:bg-gray-200">
            <span class="text-xl">{{ item.icon }}</span>
          </div>
          <div class="flex-1 text-right">
            <div class="font-medium">{{ item.title }}</div>
            <div class="text-xs text-gray-500">{{ item.description }}</div>
          </div>
        </a>
      </nav>

      <!-- Footer -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/50 bg-white/50">
        <div class="text-center">
          <div class="text-xs text-gray-500 mb-2">
            آخر تحديث: {{ currentTime }}
          </div>
          <div class="flex items-center justify-center space-x-2 space-x-reverse">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-xs text-green-600 font-medium">النظام يعمل بشكل طبيعي</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .active {
      @apply bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25;
    }
    
    .active .w-10 {
      @apply bg-white/20;
    }
    
    .active .text-xs {
      @apply text-white/80;
    }
  `]
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() toggle = new EventEmitter<void>();

  currentTime = new Date().toLocaleString('ar-SA');

  menuItems = [
    {
      title: 'لوحة التحكم',
      icon: '🏠',
      path: '/',
      description: 'نظرة عامة على النظام'
    },
    {
      title: 'العملاء',
      icon: '👤',
      path: '/customers',
      description: 'إدارة العملاء'
    },
    {
      title: 'الوحدات',
      icon: '🏢',
      path: '/units',
      description: 'إدارة الوحدات العقارية'
    },
    {
      title: 'العقود',
      icon: '📋',
      path: '/contracts',
      description: 'إدارة العقود والمبيعات'
    },
    {
      title: 'الأقساط',
      icon: '📅',
      path: '/installments',
      description: 'إدارة الأقساط والتحصيل'
    },
    {
      title: 'السندات',
      icon: '📄',
      path: '/vouchers',
      description: 'سندات القبض والدفع'
    },
    {
      title: 'الشركاء',
      icon: '👥',
      path: '/partners',
      description: 'إدارة الشركاء والمجموعات'
    },
    {
      title: 'الخزينة',
      icon: '🏦',
      path: '/treasury',
      description: 'إدارة الخزائن والمعاملات'
    },
    {
      title: 'التقارير',
      icon: '📊',
      path: '/reports',
      description: 'التقارير والإحصائيات'
    },
    {
      title: 'الوسطاء',
      icon: '🤝',
      path: '/brokers',
      description: 'إدارة الوسطاء والعمولات'
    },
    {
      title: 'ديون الشركاء',
      icon: '💳',
      path: '/partner-debts',
      description: 'إدارة ديون الشركاء'
    },
    {
      title: 'سجل المراجعة',
      icon: '🔍',
      path: '/audit',
      description: 'سجل العمليات والمراجعة'
    },
    {
      title: 'الإعدادات',
      icon: '⚙️',
      path: '/settings',
      description: 'إعدادات النظام'
    },
    {
      title: 'النسخ الاحتياطي',
      icon: '💾',
      path: '/backup-system',
      description: 'إدارة النسخ الاحتياطية'
    },
    {
      title: 'تحسين الأداء',
      icon: '⚡',
      path: '/optimize',
      description: 'تحسين أداء النظام'
    },
    {
      title: 'مراقبة النظام',
      icon: '📊',
      path: '/system',
      description: 'مراقبة صحة النظام'
    },
    {
      title: 'اختبار الاتصال',
      icon: '🔗',
      path: '/test-connection',
      description: 'اختبار الاتصالات'
    },
    {
      title: 'تشخيص الخزينة',
      icon: '🔧',
      path: '/debug-treasury',
      description: 'تشخيص مشاكل الخزينة'
    }
  ];

  ngOnInit() {
    // Update time every minute
    setInterval(() => {
      this.currentTime = new Date().toLocaleString('ar-SA');
    }, 60000);
  }

  onToggle() {
    this.toggle.emit();
  }

  onItemClick() {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      this.onToggle();
    }
  }
}