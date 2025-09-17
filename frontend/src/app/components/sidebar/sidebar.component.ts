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