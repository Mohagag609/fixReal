import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  template: `
    <div class="w-64 bg-primary text-white min-h-screen">
      <div class="p-6">
        <h1 class="text-xl font-bold">نظام المحاسبة</h1>
      </div>
      
      <nav class="mt-6">
        <div class="px-3 space-y-1">
          <a
            *ngFor="let item of menuItems"
            [routerLink]="item.route"
            routerLinkActive="bg-secondary"
            class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200"
            [class.bg-secondary]="isActiveRoute(item.route)"
          >
            <i [class]="item.icon" class="ml-3 text-lg"></i>
            {{ item.name }}
          </a>
        </div>
      </nav>
    </div>
  `,
  styles: []
})
export class SidebarComponent {
  menuItems = [
    { name: 'لوحة التحكم', route: '/dashboard', icon: 'fas fa-tachometer-alt' },
    { name: 'الحسابات', route: '/accounts', icon: 'fas fa-users' },
    { name: 'المعاملات', route: '/transactions', icon: 'fas fa-exchange-alt' },
    { name: 'الفواتير', route: '/invoices', icon: 'fas fa-file-invoice' },
    { name: 'التقارير', route: '/reports', icon: 'fas fa-chart-bar' }
  ];

  constructor(private router: Router) {}

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }
}