import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Column {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'currency' | 'status' | 'actions';
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface Action {
  label: string;
  icon: string;
  color: string;
  onClick: (item: any) => void;
  condition?: (item: any) => boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Table Header -->
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50" *ngIf="showHeader">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <h3 class="text-lg font-medium text-gray-900 mb-4 md:mb-0">{{ title }}</h3>
          <div class="flex flex-col md:flex-row gap-4">
            <!-- Search -->
            <div class="relative" *ngIf="searchable">
              <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()" 
                     placeholder="البحث..." 
                     class="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm">
              <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
            <!-- Actions -->
            <div class="flex gap-2">
              <ng-content select="[slot=actions]"></ng-content>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th *ngFor="let column of columns" 
                  [class]="getColumnClasses(column)"
                  [style.width]="column.width">
                <div class="flex items-center" [class.justify-center]="column.align === 'center'" [class.justify-end]="column.align === 'right'">
                  <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ column.label }}
                  </span>
                  <button *ngIf="column.sortable" 
                          (click)="sort(column.key)"
                          class="mr-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <i class="fas fa-sort" 
                       [class.fa-sort-up]="sortColumn === column.key && sortDirection === 'asc'"
                       [class.fa-sort-down]="sortColumn === column.key && sortDirection === 'desc'"></i>
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let item of filteredData; trackBy: trackByFn; let i = index" 
                class="hover:bg-gray-50 transition-colors"
                [class.bg-gray-50]="i % 2 === 0">
              <td *ngFor="let column of columns" 
                  [class]="getCellClasses(column)"
                  [style.width]="column.width">
                <div [class]="getCellContentClasses(column)">
                  <!-- Text -->
                  <span *ngIf="column.type === 'text' || !column.type">
                    {{ getValue(item, column.key) }}
                  </span>
                  
                  <!-- Number -->
                  <span *ngIf="column.type === 'number'">
                    {{ getValue(item, column.key) | number }}
                  </span>
                  
                  <!-- Date -->
                  <span *ngIf="column.type === 'date'">
                    {{ getValue(item, column.key) | date:'short' }}
                  </span>
                  
                  <!-- Currency -->
                  <span *ngIf="column.type === 'currency'">
                    {{ getValue(item, column.key) | currency:'USD':'symbol':'1.2-2' }}
                  </span>
                  
                  <!-- Status -->
                  <span *ngIf="column.type === 'status'" 
                        [ngClass]="getStatusClasses(getValue(item, column.key))">
                    {{ getValue(item, column.key) | titlecase }}
                  </span>
                  
                  <!-- Actions -->
                  <div *ngIf="column.type === 'actions'" class="flex gap-2">
                    <button *ngFor="let action of actions" 
                            (click)="action.onClick(item)"
                            [class.hidden]="action.condition && !action.condition(item)"
                            [class]="getActionClasses(action)"
                            class="px-3 py-1 rounded-md text-sm font-medium transition-colors">
                      <i [class]="action.icon" class="mr-1"></i>
                      {{ action.label }}
                    </button>
                  </div>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredData.length === 0">
              <td [attr.colspan]="columns.length" class="px-6 py-4 text-center text-sm text-gray-500">
                {{ emptyMessage || 'لا توجد بيانات' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6" *ngIf="pagination">
        <div class="flex-1 flex justify-between sm:hidden">
          <button (click)="previousPage()" [disabled]="pagination.current_page === 1" 
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            السابق
          </button>
          <button (click)="nextPage()" [disabled]="pagination.current_page === pagination.last_page" 
                  class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            التالي
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              عرض <span class="font-medium">{{ (pagination.current_page - 1) * pagination.per_page + 1 }}</span>
              إلى <span class="font-medium">{{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }}</span>
              من <span class="font-medium">{{ pagination.total }}</span> نتيجة
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button (click)="previousPage()" [disabled]="pagination.current_page === 1" 
                      class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fas fa-chevron-right"></i>
              </button>
              <button *ngFor="let page of getPageNumbers()" (click)="goToPage(page)" 
                      [ngClass]="{
                        'relative inline-flex items-center px-4 py-2 border text-sm font-medium': true,
                        'z-10 bg-teal-50 border-teal-500 text-teal-600': page === pagination.current_page,
                        'bg-white border-gray-300 text-gray-500 hover:bg-gray-50': page !== pagination.current_page
                      }">
                {{ page }}
              </button>
              <button (click)="nextPage()" [disabled]="pagination.current_page === pagination.last_page" 
                      class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fas fa-chevron-left"></i>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DataTableComponent implements OnInit {
  @Input() data: any[] = [];
  @Input() columns: Column[] = [];
  @Input() actions: Action[] = [];
  @Input() pagination: any = null;
  @Input() title: string = '';
  @Input() showHeader: boolean = true;
  @Input() searchable: boolean = true;
  @Input() emptyMessage: string = '';
  @Input() trackByFn: (index: number, item: any) => any = (index, item) => item.id || index;

  @Output() pageChange = new EventEmitter<number>();
  @Output() search = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<{column: string, direction: string}>();

  filteredData: any[] = [];
  searchTerm = '';
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  ngOnInit() {
    this.filteredData = [...this.data];
  }

  ngOnChanges() {
    this.filteredData = [...this.data];
    this.applyFilters();
  }

  onSearch() {
    this.search.emit(this.searchTerm);
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.data];

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(item => {
        return this.columns.some(column => {
          const value = this.getValue(item, column.key);
          return value && value.toString().toLowerCase().includes(this.searchTerm.toLowerCase());
        });
      });
    }

    // Apply sorting
    if (this.sortColumn) {
      filtered.sort((a, b) => {
        const aValue = this.getValue(a, this.sortColumn);
        const bValue = this.getValue(b, this.sortColumn);
        
        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredData = filtered;
  }

  sort(columnKey: string) {
    if (this.sortColumn === columnKey) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columnKey;
      this.sortDirection = 'asc';
    }
    
    this.sortChange.emit({ column: this.sortColumn, direction: this.sortDirection });
    this.applyFilters();
  }

  getValue(item: any, key: string): any {
    return key.split('.').reduce((obj, k) => obj?.[k], item);
  }

  getColumnClasses(column: Column): string {
    const baseClasses = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
    const alignClasses = {
      'left': 'text-left',
      'center': 'text-center',
      'right': 'text-right'
    };
    return `${baseClasses} ${alignClasses[column.align || 'left']}`;
  }

  getCellClasses(column: Column): string {
    const baseClasses = 'px-6 py-4 whitespace-nowrap text-sm';
    const alignClasses = {
      'left': 'text-left',
      'center': 'text-center',
      'right': 'text-right'
    };
    return `${baseClasses} ${alignClasses[column.align || 'left']}`;
  }

  getCellContentClasses(column: Column): string {
    const baseClasses = 'text-gray-900';
    const typeClasses = {
      'text': 'text-gray-900',
      'number': 'text-gray-900 font-mono',
      'date': 'text-gray-500',
      'currency': 'text-gray-900 font-mono',
      'status': 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
      'actions': 'flex gap-2'
    };
    return `${baseClasses} ${typeClasses[column.type || 'text']}`;
  }

  getStatusClasses(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    return statusClasses[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  }

  getActionClasses(action: Action): string {
    const colorClasses: { [key: string]: string } = {
      'primary': 'bg-blue-600 text-white hover:bg-blue-700',
      'secondary': 'bg-gray-600 text-white hover:bg-gray-700',
      'success': 'bg-green-600 text-white hover:bg-green-700',
      'warning': 'bg-yellow-600 text-white hover:bg-yellow-700',
      'danger': 'bg-red-600 text-white hover:bg-red-700',
      'info': 'bg-cyan-600 text-white hover:bg-cyan-700'
    };
    return colorClasses[action.color] || 'bg-gray-600 text-white hover:bg-gray-700';
  }

  previousPage() {
    if (this.pagination && this.pagination.current_page > 1) {
      this.pageChange.emit(this.pagination.current_page - 1);
    }
  }

  nextPage() {
    if (this.pagination && this.pagination.current_page < this.pagination.last_page) {
      this.pageChange.emit(this.pagination.current_page + 1);
    }
  }

  goToPage(page: number) {
    if (this.pagination && page >= 1 && page <= this.pagination.last_page) {
      this.pageChange.emit(page);
    }
  }

  getPageNumbers(): number[] {
    if (!this.pagination) return [];
    
    const current = this.pagination.current_page;
    const last = this.pagination.last_page;
    const pages: number[] = [];
    
    const start = Math.max(1, current - 2);
    const end = Math.min(last, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}