import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../../models';

@Component({
  selector: 'app-header',
  template: `
    <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <!-- Left side -->
        <div class="flex items-center space-x-4 space-x-reverse">
          <!-- Sidebar toggle button -->
          <button 
            (click)="toggleSidebar()"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>

          <!-- Page title -->
          <h1 class="text-2xl font-semibold text-gray-900">
            {{ pageTitle }}
          </h1>
        </div>

        <!-- Right side -->
        <div class="flex items-center space-x-4 space-x-reverse">
          <!-- Notifications -->
          <button class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4 19h6v-6a4 4 0 00-8 0v6z"></path>
            </svg>
            <span class="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          <!-- User menu -->
          <div class="relative" #userMenu>
            <button 
              (click)="toggleUserMenu()"
              class="flex items-center space-x-3 space-x-reverse p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div class="w-8 h-8 bg-primary-950 text-white rounded-full flex items-center justify-center">
                {{ user?.name?.charAt(0) || user?.username?.charAt(0) || 'U' }}
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900">
                  {{ user?.name || user?.username || 'مستخدم' }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ user?.role === 'admin' ? 'مدير' : 'مستخدم' }}
                </p>
              </div>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <!-- Dropdown menu -->
            <div 
              *ngIf="showUserMenu"
              class="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <a 
                (click)="navigateToProfile()"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                <svg class="w-4 h-4 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                الملف الشخصي
              </a>
              <a 
                (click)="navigateToSettings()"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                <svg class="w-4 h-4 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                الإعدادات
              </a>
              <hr class="my-2">
              <a 
                (click)="logout()"
                class="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
                <svg class="w-4 h-4 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                تسجيل الخروج
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: []
})
export class HeaderComponent {
  @Input() user: User | null = null;
  @Input() pageTitle = 'لوحة التحكم';
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  showUserMenu = false;

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  navigateToProfile(): void {
    this.showUserMenu = false;
    // Navigate to profile page
  }

  navigateToSettings(): void {
    this.showUserMenu = false;
    // Navigate to settings page
  }

  logout(): void {
    this.showUserMenu = false;
    this.logout.emit();
  }
}