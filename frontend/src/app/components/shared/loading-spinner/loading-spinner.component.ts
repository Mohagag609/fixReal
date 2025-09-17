import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div *ngIf="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 flex items-center space-x-4 space-x-reverse">
        <div class="loading-spinner"></div>
        <span class="text-gray-700">{{ message || 'جاري التحميل...' }}</span>
      </div>
    </div>
  `,
  styles: []
})
export class LoadingSpinnerComponent {
  isLoading = false;
  message = '';
}