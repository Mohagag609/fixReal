import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ExportOption {
  label: string;
  icon: string;
  format: 'csv' | 'excel' | 'pdf' | 'json' | 'print';
  description?: string;
}

@Component({
  selector: 'app-export-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block text-left">
      <!-- Export Button -->
      <button (click)="toggleMenu()" 
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors">
        <i class="fas fa-download mr-2"></i>
        تصدير
        <i class="fas fa-chevron-down mr-2 text-xs"></i>
      </button>

      <!-- Dropdown Menu -->
      <div *ngIf="isOpen" 
           class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
           (click)="$event.stopPropagation()">
        <div class="py-1">
          <!-- Header -->
          <div class="px-4 py-2 border-b border-gray-200">
            <h3 class="text-sm font-medium text-gray-900">خيارات التصدير</h3>
            <p class="text-xs text-gray-500 mt-1">اختر تنسيق التصدير المناسب</p>
          </div>

          <!-- Export Options -->
          <div *ngFor="let option of exportOptions" 
               (click)="selectOption(option)"
               class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors">
            <div class="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <i [class]="option.icon" class="text-gray-600"></i>
            </div>
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ option.label }}</div>
              <div *ngIf="option.description" class="text-xs text-gray-500 mt-1">
                {{ option.description }}
              </div>
            </div>
            <i class="fas fa-chevron-left text-gray-400 text-xs"></i>
          </div>

          <!-- Divider -->
          <div class="border-t border-gray-200 my-1"></div>

          <!-- Custom Export -->
          <div (click)="openCustomExport()"
               class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors">
            <div class="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
              <i class="fas fa-cog text-teal-600"></i>
            </div>
            <div class="flex-1">
              <div class="font-medium text-gray-900">تصدير مخصص</div>
              <div class="text-xs text-gray-500 mt-1">تخصيص خيارات التصدير</div>
            </div>
            <i class="fas fa-chevron-left text-gray-400 text-xs"></i>
          </div>

          <!-- Divider -->
          <div class="border-t border-gray-200 my-1"></div>

          <!-- Export Settings -->
          <div (click)="openSettings()"
               class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors">
            <div class="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <i class="fas fa-cog text-gray-600"></i>
            </div>
            <div class="flex-1">
              <div class="font-medium text-gray-900">إعدادات التصدير</div>
              <div class="text-xs text-gray-500 mt-1">تخصيص إعدادات التصدير الافتراضية</div>
            </div>
            <i class="fas fa-chevron-left text-gray-400 text-xs"></i>
          </div>
        </div>
      </div>

      <!-- Overlay -->
      <div *ngIf="isOpen" 
           class="fixed inset-0 z-40" 
           (click)="closeMenu()"></div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ExportMenuComponent {
  @Input() exportOptions: ExportOption[] = [
    {
      label: 'CSV',
      icon: 'fas fa-file-csv',
      format: 'csv',
      description: 'ملف CSV للتحليل'
    },
    {
      label: 'Excel',
      icon: 'fas fa-file-excel',
      format: 'excel',
      description: 'ملف Excel للتحرير'
    },
    {
      label: 'PDF',
      icon: 'fas fa-file-pdf',
      format: 'pdf',
      description: 'ملف PDF للطباعة'
    },
    {
      label: 'JSON',
      icon: 'fas fa-file-code',
      format: 'json',
      description: 'ملف JSON للبرمجة'
    },
    {
      label: 'طباعة',
      icon: 'fas fa-print',
      format: 'print',
      description: 'طباعة مباشرة'
    }
  ];

  @Output() export = new EventEmitter<ExportOption>();
  @Output() customExport = new EventEmitter<void>();
  @Output() settings = new EventEmitter<void>();

  isOpen = false;

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  closeMenu() {
    this.isOpen = false;
  }

  selectOption(option: ExportOption) {
    this.export.emit(option);
    this.closeMenu();
  }

  openCustomExport() {
    this.customExport.emit();
    this.closeMenu();
  }

  openSettings() {
    this.settings.emit();
    this.closeMenu();
  }
}