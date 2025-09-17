import { Component, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-print-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <!-- Print Button -->
      <button (click)="print()" 
              [disabled]="isPrinting"
              [class]="getButtonClasses()"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <i [class]="getIconClasses()" class="mr-2"></i>
        {{ isPrinting ? 'جاري الطباعة...' : 'طباعة' }}
      </button>

      <!-- Print Options Dropdown -->
      <div *ngIf="showOptions" 
           class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
        <div class="py-1">
          <button (click)="print('all')" 
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <i class="fas fa-print mr-3 text-gray-400"></i>
            طباعة الكل
          </button>
          <button (click)="print('current')" 
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <i class="fas fa-file-alt mr-3 text-gray-400"></i>
            طباعة الصفحة الحالية
          </button>
          <button (click)="print('selection')" 
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <i class="fas fa-mouse-pointer mr-3 text-gray-400"></i>
            طباعة المحدد
          </button>
          <div class="border-t border-gray-200 my-1"></div>
          <button (click)="printPreview()" 
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <i class="fas fa-eye mr-3 text-gray-400"></i>
            معاينة الطباعة
          </button>
          <button (click)="printSettings()" 
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <i class="fas fa-cog mr-3 text-gray-400"></i>
            إعدادات الطباعة
          </button>
        </div>
      </div>

      <!-- Print Content -->
      <div #printContent class="hidden">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    @media print {
      .no-print {
        display: none !important;
      }
      
      .print-only {
        display: block !important;
      }
      
      body {
        font-size: 12px;
        line-height: 1.4;
      }
      
      .print-header {
        border-bottom: 2px solid #000;
        margin-bottom: 20px;
        padding-bottom: 10px;
      }
      
      .print-footer {
        border-top: 1px solid #000;
        margin-top: 20px;
        padding-top: 10px;
        font-size: 10px;
        color: #666;
      }
      
      .print-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      
      .print-date {
        font-size: 10px;
        color: #666;
        margin-bottom: 20px;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      
      th, td {
        border: 1px solid #000;
        padding: 8px;
        text-align: right;
      }
      
      th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      
      .print-summary {
        background-color: #f9f9f9;
        padding: 15px;
        border: 1px solid #ddd;
        margin-bottom: 20px;
      }
      
      .print-total {
        font-weight: bold;
        font-size: 14px;
        text-align: left;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 2px solid #000;
      }
    }
  `]
})
export class PrintButtonComponent {
  @Input() title: string = 'طباعة';
  @Input() showOptions: boolean = false;
  @Input() printData: any = null;
  @Input() printTemplate: string = 'default';
  @Input() buttonClass: string = '';
  @Input() iconClass: string = 'fas fa-print';

  @Output() beforePrint = new EventEmitter<void>();
  @Output() afterPrint = new EventEmitter<void>();
  @Output() printError = new EventEmitter<Error>();

  @ViewChild('printContent') printContent!: ElementRef;

  isPrinting = false;

  print(type: string = 'all') {
    if (this.isPrinting) return;

    this.isPrinting = true;
    this.beforePrint.emit();

    try {
      // Create print window
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        throw new Error('لا يمكن فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.');
      }

      // Get print content
      const content = this.getPrintContent(type);
      
      // Write content to print window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${this.title}</title>
          <style>
            ${this.getPrintStyles()}
          </style>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `);

      printWindow.document.close();

      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          this.isPrinting = false;
          this.afterPrint.emit();
        }, 500);
      };

    } catch (error) {
      this.isPrinting = false;
      this.printError.emit(error as Error);
      console.error('Print error:', error);
    }
  }

  printPreview() {
    // Open print preview in new window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      this.printError.emit(new Error('لا يمكن فتح نافذة المعاينة. يرجى السماح بالنوافذ المنبثقة.'));
      return;
    }

    const content = this.getPrintContent('all');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>معاينة الطباعة - ${this.title}</title>
        <style>
          ${this.getPrintStyles()}
          @media screen {
            body { margin: 20px; }
            .print-only { display: block !important; }
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `);

    printWindow.document.close();
  }

  printSettings() {
    // Emit event for print settings
    this.beforePrint.emit();
  }

  private getPrintContent(type: string): string {
    const now = new Date().toLocaleString('ar-SA');
    
    let content = `
      <div class="print-header">
        <div class="print-title">${this.title}</div>
        <div class="print-date">تاريخ الطباعة: ${now}</div>
      </div>
    `;

    if (this.printData) {
      content += this.formatPrintData(this.printData);
    } else if (this.printContent) {
      content += this.printContent.nativeElement.innerHTML;
    } else {
      content += '<p>لا توجد بيانات للطباعة</p>';
    }

    content += `
      <div class="print-footer">
        <p>تم طباعة هذا التقرير في: ${now}</p>
        <p>نظام إدارة العقارات - جميع الحقوق محفوظة</p>
      </div>
    `;

    return content;
  }

  private formatPrintData(data: any): string {
    if (Array.isArray(data)) {
      return this.formatTableData(data);
    } else if (typeof data === 'object') {
      return this.formatObjectData(data);
    } else {
      return `<p>${data}</p>`;
    }
  }

  private formatTableData(data: any[]): string {
    if (data.length === 0) return '<p>لا توجد بيانات</p>';

    const keys = Object.keys(data[0]);
    let table = '<table><thead><tr>';
    
    keys.forEach(key => {
      table += `<th>${key}</th>`;
    });
    
    table += '</tr></thead><tbody>';
    
    data.forEach(row => {
      table += '<tr>';
      keys.forEach(key => {
        table += `<td>${row[key] || ''}</td>`;
      });
      table += '</tr>';
    });
    
    table += '</tbody></table>';
    return table;
  }

  private formatObjectData(data: any): string {
    let content = '<div class="print-summary">';
    
    Object.keys(data).forEach(key => {
      content += `<p><strong>${key}:</strong> ${data[key]}</p>`;
    });
    
    content += '</div>';
    return content;
  }

  private getPrintStyles(): string {
    return `
      @media print {
        .no-print { display: none !important; }
        .print-only { display: block !important; }
        body { font-size: 12px; line-height: 1.4; }
        .print-header { border-bottom: 2px solid #000; margin-bottom: 20px; padding-bottom: 10px; }
        .print-footer { border-top: 1px solid #000; margin-top: 20px; padding-top: 10px; font-size: 10px; color: #666; }
        .print-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .print-date { font-size: 10px; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: right; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .print-summary { background-color: #f9f9f9; padding: 15px; border: 1px solid #ddd; margin-bottom: 20px; }
        .print-total { font-weight: bold; font-size: 14px; text-align: left; margin-top: 10px; padding-top: 10px; border-top: 2px solid #000; }
      }
      
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; }
      .print-header { border-bottom: 2px solid #000; margin-bottom: 20px; padding-bottom: 10px; }
      .print-footer { border-top: 1px solid #000; margin-top: 20px; padding-top: 10px; font-size: 10px; color: #666; }
      .print-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
      .print-date { font-size: 10px; color: #666; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { border: 1px solid #000; padding: 8px; text-align: right; }
      th { background-color: #f5f5f5; font-weight: bold; }
      .print-summary { background-color: #f9f9f9; padding: 15px; border: 1px solid #ddd; margin-bottom: 20px; }
      .print-total { font-weight: bold; font-size: 14px; text-align: left; margin-top: 10px; padding-top: 10px; border-top: 2px solid #000; }
    `;
  }

  getButtonClasses(): string {
    const baseClasses = 'inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    return this.buttonClass ? `${baseClasses} ${this.buttonClass}` : baseClasses;
  }

  getIconClasses(): string {
    return this.isPrinting ? 'fas fa-spinner fa-spin' : this.iconClass;
  }
}