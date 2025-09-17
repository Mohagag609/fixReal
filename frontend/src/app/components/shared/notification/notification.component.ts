import { Component } from '@angular/core';

@Component({
  selector: 'app-notification',
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div 
        *ngFor="let notification of notifications; let i = index"
        class="max-w-sm bg-white rounded-lg shadow-lg border-l-4 p-4 transform transition-all duration-300 ease-in-out"
        [class.border-green-500]="notification.type === 'success'"
        [class.border-red-500]="notification.type === 'error'"
        [class.border-yellow-500]="notification.type === 'warning'"
        [class.border-blue-500]="notification.type === 'info'"
        [class.animate-slide-in]="true"
        [style.animation-delay]="(i * 0.1) + 's'">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg *ngIf="notification.type === 'success'" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <svg *ngIf="notification.type === 'error'" class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <svg *ngIf="notification.type === 'warning'" class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <svg *ngIf="notification.type === 'info'" class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="mr-3 flex-1">
            <h4 class="text-sm font-medium text-gray-900">{{ notification.title }}</h4>
            <p class="text-sm text-gray-600 mt-1">{{ notification.message }}</p>
          </div>
          <button 
            (click)="removeNotification(i)"
            class="flex-shrink-0 text-gray-400 hover:text-gray-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class NotificationComponent {
  notifications: any[] = [];

  removeNotification(index: number): void {
    this.notifications.splice(index, 1);
  }
}