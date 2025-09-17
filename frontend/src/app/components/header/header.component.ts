import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40 w-full">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4 space-x-reverse">
            <button
              (click)="onMenuToggle()"
              class="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200 lg:hidden">
              <span class="text-gray-600">☰</span>
            </button>
            <div class="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span class="text-white text-xl">{{ icon }}</span>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ title }}</h1>
              <p class="text-gray-600">{{ subtitle }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-secondary text-sm" (click)="onRefresh()">
              🔄 تحديث
            </button>
            <button class="btn btn-warning text-sm" (click)="onOptimize()">
              ⚡ تحسين الأداء
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class HeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '🏢';
  @Output() menuToggle = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() optimize = new EventEmitter<void>();

  onMenuToggle() {
    this.menuToggle.emit();
  }

  onRefresh() {
    this.refresh.emit();
  }

  onOptimize() {
    this.optimize.emit();
  }
}