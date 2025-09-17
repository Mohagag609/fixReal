import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  template: `
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <h2 class="text-xl font-semibold text-gray-900">{{ pageTitle }}</h2>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="relative">
              <button class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <span class="sr-only">فتح قائمة المستخدم</span>
                <div class="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                  <span class="text-white font-medium">{{ userInitials }}</span>
                </div>
              </button>
            </div>
            
            <button
              (click)="logout()"
              class="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <i class="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: []
})
export class HeaderComponent {
  pageTitle = 'لوحة التحكم';
  userInitials = 'م';

  constructor(private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userInitials = user.firstName.charAt(0) + user.lastName.charAt(0);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}