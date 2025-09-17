import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuditLog, AuditLogStats } from '../../models/audit-log.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <h1 class="text-3xl font-bold text-navy-800 mb-6">Audit Logs</h1>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-md p-5 flex items-center justify-between animate-fade-in">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Logs</p>
            <p class="text-2xl font-bold text-navy-800 mt-1">{{ stats?.total || 0 }}</p>
          </div>
          <i class="fas fa-list-alt text-teal-500 text-3xl"></i>
        </div>
        <div class="bg-white rounded-lg shadow-md p-5 flex items-center justify-between animate-fade-in delay-100">
          <div>
            <p class="text-sm font-medium text-gray-500">Today</p>
            <p class="text-2xl font-bold text-navy-800 mt-1">{{ stats?.today || 0 }}</p>
          </div>
          <i class="fas fa-calendar-day text-blue-500 text-3xl"></i>
        </div>
        <div class="bg-white rounded-lg shadow-md p-5 flex items-center justify-between animate-fade-in delay-200">
          <div>
            <p class="text-sm font-medium text-gray-500">This Week</p>
            <p class="text-2xl font-bold text-navy-800 mt-1">{{ stats?.this_week || 0 }}</p>
          </div>
          <i class="fas fa-calendar-week text-green-500 text-3xl"></i>
        </div>
        <div class="bg-white rounded-lg shadow-md p-5 flex items-center justify-between animate-fade-in delay-300">
          <div>
            <p class="text-sm font-medium text-gray-500">This Month</p>
            <p class="text-2xl font-bold text-navy-800 mt-1">{{ stats?.this_month || 0 }}</p>
          </div>
          <i class="fas fa-calendar text-purple-500 text-3xl"></i>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center gap-4">
          <div class="relative">
            <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()" 
                   placeholder="Search logs..." 
                   class="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
            <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
          </div>
          <select [(ngModel)]="actionFilter" (change)="onFilter()" 
                  class="px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
            <option value="">All Actions</option>
            <option *ngFor="let action of stats?.actions" [value]="action.action">
              {{ action.action }} ({{ action.count }})
            </option>
          </select>
          <select [(ngModel)]="tableFilter" (change)="onFilter()" 
                  class="px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
            <option value="">All Tables</option>
            <option *ngFor="let table of stats?.tables" [value]="table.table_name">
              {{ table.table_name }} ({{ table.count }})
            </option>
          </select>
          <input type="date" [(ngModel)]="dateFrom" (change)="onFilter()" 
                 placeholder="Date From" 
                 class="px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
          <input type="date" [(ngModel)]="dateTo" (change)="onFilter()" 
                 placeholder="Date To" 
                 class="px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
        </div>
      </div>

      <!-- Audit Logs Table -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record ID</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changes</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let log of auditLogs; trackBy: trackByLogId" 
                  class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ log.user?.name || 'System' }}</div>
                  <div class="text-sm text-gray-500">{{ log.user?.email || '' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [ngClass]="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800': log.action === 'created',
                    'bg-blue-100 text-blue-800': log.action === 'updated',
                    'bg-red-100 text-red-800': log.action === 'deleted',
                    'bg-yellow-100 text-yellow-800': log.action === 'viewed'
                  }">
                    {{ log.action | titlecase }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ log.table_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ log.record_id }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button (click)="viewChanges(log)" 
                          class="text-teal-600 hover:text-teal-900 transition-colors">
                    <i class="fas fa-eye"></i> View
                  </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ log.created_at | date:'short' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button (click)="viewDetails(log)" 
                          class="text-teal-600 hover:text-teal-900 transition-colors">
                    <i class="fas fa-info-circle"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="auditLogs.length === 0">
                <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
                  No audit logs found
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
              Previous
            </button>
            <button (click)="nextPage()" [disabled]="pagination.current_page === pagination.last_page" 
                    class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing <span class="font-medium">{{ (pagination.current_page - 1) * pagination.per_page + 1 }}</span>
                to <span class="font-medium">{{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }}</span>
                of <span class="font-medium">{{ pagination.total }}</span> results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button (click)="previousPage()" [disabled]="pagination.current_page === 1" 
                        class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <i class="fas fa-chevron-left"></i>
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
                  <i class="fas fa-chevron-right"></i>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Changes Modal -->
      <div *ngIf="showChangesModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Changes Details</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div *ngIf="selectedLog?.old_values">
                <h4 class="text-md font-medium text-gray-700 mb-2">Old Values</h4>
                <div class="bg-gray-100 p-4 rounded-md">
                  <pre class="text-sm text-gray-600">{{ selectedLog.old_values | json }}</pre>
                </div>
              </div>
              <div *ngIf="selectedLog?.new_values">
                <h4 class="text-md font-medium text-gray-700 mb-2">New Values</h4>
                <div class="bg-gray-100 p-4 rounded-md">
                  <pre class="text-sm text-gray-600">{{ selectedLog.new_values | json }}</pre>
                </div>
              </div>
            </div>
            <div class="flex justify-end mt-6">
              <button (click)="closeChangesModal()" 
                      class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Details Modal -->
      <div *ngIf="showDetailsModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-3/4 max-w-2xl shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Audit Log Details</h3>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-700">User:</label>
                <p class="text-sm text-gray-900">{{ selectedLog?.user?.name || 'System' }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700">Action:</label>
                <p class="text-sm text-gray-900">{{ selectedLog?.action | titlecase }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700">Table:</label>
                <p class="text-sm text-gray-900">{{ selectedLog?.table_name }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700">Record ID:</label>
                <p class="text-sm text-gray-900">{{ selectedLog?.record_id }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700">IP Address:</label>
                <p class="text-sm text-gray-900">{{ selectedLog?.ip_address || 'N/A' }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700">User Agent:</label>
                <p class="text-sm text-gray-900">{{ selectedLog?.user_agent || 'N/A' }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700">Date:</label>
                <p class="text-sm text-gray-900">{{ selectedLog?.created_at | date:'full' }}</p>
              </div>
            </div>
            <div class="flex justify-end mt-6">
              <button (click)="closeDetailsModal()" 
                      class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.5s ease-in-out;
    }
    .animate-fade-in.delay-100 {
      animation-delay: 0.1s;
    }
    .animate-fade-in.delay-200 {
      animation-delay: 0.2s;
    }
    .animate-fade-in.delay-300 {
      animation-delay: 0.3s;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AuditComponent implements OnInit {
  auditLogs: AuditLog[] = [];
  stats: AuditLogStats | null = null;
  pagination: any = null;
  searchTerm = '';
  actionFilter = '';
  tableFilter = '';
  dateFrom = '';
  dateTo = '';
  showChangesModal = false;
  showDetailsModal = false;
  selectedLog: AuditLog | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadAuditLogs();
    this.loadStats();
  }

  loadAuditLogs() {
    const filters: any = {};
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.actionFilter) filters.action = this.actionFilter;
    if (this.tableFilter) filters.table_name = this.tableFilter;
    if (this.dateFrom) filters.date_from = this.dateFrom;
    if (this.dateTo) filters.date_to = this.dateTo;

    this.apiService.getAuditLogs(filters).subscribe({
      next: (response) => {
        this.auditLogs = response.data;
        this.pagination = response.pagination;
      },
      error: (error) => {
        console.error('Error loading audit logs:', error);
      }
    });
  }

  loadStats() {
    this.apiService.getAuditLogStats().subscribe({
      next: (response) => {
        this.stats = response.data;
      },
      error: (error) => {
        console.error('Error loading audit log stats:', error);
      }
    });
  }

  onSearch() {
    this.loadAuditLogs();
  }

  onFilter() {
    this.loadAuditLogs();
  }

  viewChanges(log: AuditLog) {
    this.selectedLog = log;
    this.showChangesModal = true;
  }

  closeChangesModal() {
    this.showChangesModal = false;
    this.selectedLog = null;
  }

  viewDetails(log: AuditLog) {
    this.selectedLog = log;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedLog = null;
  }

  trackByLogId(index: number, log: AuditLog): string {
    return log.id;
  }

  previousPage() {
    if (this.pagination && this.pagination.current_page > 1) {
      this.pagination.current_page--;
      this.loadAuditLogs();
    }
  }

  nextPage() {
    if (this.pagination && this.pagination.current_page < this.pagination.last_page) {
      this.pagination.current_page++;
      this.loadAuditLogs();
    }
  }

  goToPage(page: number) {
    if (this.pagination && page >= 1 && page <= this.pagination.last_page) {
      this.pagination.current_page = page;
      this.loadAuditLogs();
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