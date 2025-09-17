import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  template: `
    <div class="sidebar" [class.open]="isOpen" [class.closed]="!isOpen">
      <!-- Logo -->
      <div class="p-6 border-b border-primary-800">
        <h1 class="text-xl font-bold text-white text-center">
          نظام إدارة العقارات
        </h1>
      </div>

      <!-- Navigation Menu -->
      <nav class="mt-6">
        <ul class="space-y-2 px-4">
          <li>
            <a 
              (click)="navigate('/dashboard')"
              class="flex items-center px-4 py-3 text-white rounded-lg hover:bg-primary-800 transition-colors duration-200 cursor-pointer">
              <svg class="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"></path>
              </svg>
              لوحة التحكم
            </a>
          </li>

          <li>
            <a 
              (click)="navigate('/customers')"
              class="flex items-center px-4 py-3 text-white rounded-lg hover:bg-primary-800 transition-colors duration-200 cursor-pointer">
              <svg class="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
              العملاء
            </a>
          </li>

          <li>
            <a 
              (click)="navigate('/units')"
              class="flex items-center px-4 py-3 text-white rounded-lg hover:bg-primary-800 transition-colors duration-200 cursor-pointer">
              <svg class="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              الوحدات
            </a>
          </li>

          <li>
            <a 
              (click)="navigate('/contracts')"
              class="flex items-center px-4 py-3 text-white rounded-lg hover:bg-primary-800 transition-colors duration-200 cursor-pointer">
              <svg class="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              العقود
            </a>
          </li>

          <li>
            <a 
              (click)="navigate('/transactions')"
              class="flex items-center px-4 py-3 text-white rounded-lg hover:bg-primary-800 transition-colors duration-200 cursor-pointer">
              <svg class="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              المعاملات
            </a>
          </li>

          <li>
            <a 
              (click)="navigate('/reports')"
              class="flex items-center px-4 py-3 text-white rounded-lg hover:bg-primary-800 transition-colors duration-200 cursor-pointer">
              <svg class="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              التقارير
            </a>
          </li>

          <li>
            <a 
              (click)="navigate('/installments')"
              class="flex items-center px-4 py-3 text-white rounded-lg hover:bg-primary-800 transition-colors duration-200 cursor-pointer">
              <svg class="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
              الأقساط
            </a>
          </li>

          <li>
            <a 
              (click)="navigate('/safes')"
              class="flex items-center px-4 py-3 text-white rounded-lg hover:bg-primary-800 transition-colors duration-200 cursor-pointer">
              <svg class="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              الخزائن
            </a>
          </li>

          <li>
            <a 
              (click)="navigate('/partners')"
              class="flex items-center px-4 py-3 text-white rounded-lg hover:bg-primary-800 transition-colors duration-200 cursor-pointer">
              <svg class="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              الشركاء
            </a>
          </li>

          <li>
            <a 
              (click)="navigate('/brokers')"
              class="flex items-center px-4 py-3 text-white rounded-lg hover:bg-primary-800 transition-colors duration-200 cursor-pointer">
              <svg class="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              الوسطاء
            </a>
          </li>

          <!-- Divider -->
          <li class="border-t border-primary-700 my-2"></li>

          <li>
            <a 
              (click)="navigate('/settings')"
              class="flex items-center px-4 py-3 text-white rounded-lg hover:bg-primary-800 transition-colors duration-200 cursor-pointer">
              <svg class="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              الإعدادات
            </a>
          </li>

          <li>
            <a 
              (click)="navigate('/notifications')"
              class="flex items-center px-4 py-3 text-white rounded-lg hover:bg-primary-800 transition-colors duration-200 cursor-pointer">
              <svg class="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12 7H4.828zM4.828 17l2.586-2.586a2 2 0 012.828 0L12 17H4.828z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.73 21a2 2 0 01-3.46 0"></path>
              </svg>
              الإشعارات
            </a>
          </li>

          <li>
            <a 
              (click)="navigate('/export-import')"
              class="flex items-center px-4 py-3 text-white rounded-lg hover:bg-primary-800 transition-colors duration-200 cursor-pointer">
              <svg class="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
              </svg>
              تصدير واستيراد
            </a>
          </li>

          <li>
            <a 
              (click)="navigate('/search')"
              class="flex items-center px-4 py-3 text-white rounded-lg hover:bg-primary-800 transition-colors duration-200 cursor-pointer">
              <svg class="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              البحث المتقدم
            </a>
          </li>
        </ul>
      </nav>

      <!-- Footer -->
      <div class="absolute bottom-0 w-full p-4 border-t border-primary-800">
        <p class="text-xs text-primary-300 text-center">
          الإصدار 1.0.0
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class SidebarComponent {
  @Input() isOpen = true;
  @Output() toggle = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<string>();

  navigate(route: string): void {
    this.navigate.emit(route);
  }
}