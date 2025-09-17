import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { PartnerDebt, PartnerDebtStats } from '../../models/partner-debt.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-partner-debts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <h1 class="text-3xl font-bold text-navy-800 mb-6">Partner Debts</h1>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-md p-5 flex items-center justify-between animate-fade-in">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Debts</p>
            <p class="text-2xl font-bold text-navy-800 mt-1">{{ stats?.total || 0 }}</p>
          </div>
          <i class="fas fa-file-invoice-dollar text-teal-500 text-3xl"></i>
        </div>
        <div class="bg-white rounded-lg shadow-md p-5 flex items-center justify-between animate-fade-in delay-100">
          <div>
            <p class="text-sm font-medium text-gray-500">Pending Amount</p>
            <p class="text-2xl font-bold text-navy-800 mt-1">{{ stats?.pending_amount | currency:'USD':'symbol':'1.2-2' }}</p>
          </div>
          <i class="fas fa-clock text-yellow-500 text-3xl"></i>
        </div>
        <div class="bg-white rounded-lg shadow-md p-5 flex items-center justify-between animate-fade-in delay-200">
          <div>
            <p class="text-sm font-medium text-gray-500">Paid Amount</p>
            <p class="text-2xl font-bold text-navy-800 mt-1">{{ stats?.paid_amount | currency:'USD':'symbol':'1.2-2' }}</p>
          </div>
          <i class="fas fa-check-circle text-green-500 text-3xl"></i>
        </div>
        <div class="bg-white rounded-lg shadow-md p-5 flex items-center justify-between animate-fade-in delay-300">
          <div>
            <p class="text-sm font-medium text-gray-500">Overdue Amount</p>
            <p class="text-2xl font-bold text-navy-800 mt-1">{{ stats?.overdue_amount | currency:'USD':'symbol':'1.2-2' }}</p>
          </div>
          <i class="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
        </div>
      </div>

      <!-- Filters and Actions -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex flex-col md:flex-row gap-4">
            <div class="relative">
              <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()" 
                     placeholder="Search debts..." 
                     class="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
              <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
            <select [(ngModel)]="statusFilter" (change)="onFilter()" 
                    class="px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <input type="date" [(ngModel)]="dueDateFrom" (change)="onFilter()" 
                   placeholder="Due Date From" 
                   class="px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
            <input type="date" [(ngModel)]="dueDateTo" (change)="onFilter()" 
                   placeholder="Due Date To" 
                   class="px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
          </div>
          <button (click)="openAddModal()" 
                  class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-transform hover:scale-105">
            <i class="fas fa-plus mr-2"></i>Add Debt
          </button>
        </div>
      </div>

      <!-- Debts Table -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let debt of debts; trackBy: trackByDebtId" 
                  class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ debt.partner?.name || 'N/A' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ debt.unit?.name || 'N/A' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ debt.amount | currency:'USD':'symbol':'1.2-2' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ debt.due_date | date:'shortDate' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [ngClass]="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800': debt.status === 'paid',
                    'bg-red-100 text-red-800': debt.status === 'overdue',
                    'bg-yellow-100 text-yellow-800': debt.status === 'pending'
                  }">
                    {{ debt.status | titlecase }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button (click)="openEditModal(debt)" 
                          class="text-teal-600 hover:text-teal-900 mr-3 transition-colors">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button (click)="markAsPaid(debt)" *ngIf="debt.status !== 'paid'" 
                          class="text-green-600 hover:text-green-900 mr-3 transition-colors">
                    <i class="fas fa-check"></i>
                  </button>
                  <button (click)="deleteDebt(debt.id)" 
                          class="text-red-600 hover:text-red-900 transition-colors">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="debts.length === 0">
                <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
                  No debts found
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

      <!-- Add/Edit Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {{ editingDebt ? 'Edit Debt' : 'Add New Debt' }}
            </h3>
            <form (ngSubmit)="saveDebt()" #debtForm="ngForm">
              <div class="mb-4">
                <label for="partner_id" class="block text-sm font-medium text-gray-700">Partner *</label>
                <select id="partner_id" name="partner_id" [(ngModel)]="debtForm.partner_id" required 
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
                  <option value="">Select Partner</option>
                  <option *ngFor="let partner of partners" [value]="partner.id">{{ partner.name }}</option>
                </select>
              </div>
              <div class="mb-4">
                <label for="unit_id" class="block text-sm font-medium text-gray-700">Unit *</label>
                <select id="unit_id" name="unit_id" [(ngModel)]="debtForm.unit_id" required 
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
                  <option value="">Select Unit</option>
                  <option *ngFor="let unit of units" [value]="unit.id">{{ unit.name }}</option>
                </select>
              </div>
              <div class="mb-4">
                <label for="amount" class="block text-sm font-medium text-gray-700">Amount *</label>
                <input type="number" id="amount" name="amount" [(ngModel)]="debtForm.amount" 
                       required min="0" step="0.01" 
                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              </div>
              <div class="mb-4">
                <label for="due_date" class="block text-sm font-medium text-gray-700">Due Date *</label>
                <input type="date" id="due_date" name="due_date" [(ngModel)]="debtForm.due_date" 
                       required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              </div>
              <div class="mb-4">
                <label for="status" class="block text-sm font-medium text-gray-700">Status *</label>
                <select id="status" name="status" [(ngModel)]="debtForm.status" required 
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div class="mb-4">
                <label for="notes" class="block text-sm font-medium text-gray-700">Notes</label>
                <textarea id="notes" name="notes" [(ngModel)]="debtForm.notes" rows="3" 
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"></textarea>
              </div>
              <div class="flex justify-end space-x-3">
                <button type="button" (click)="closeModal()" 
                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                  Cancel
                </button>
                <button type="submit" [disabled]="debtForm.invalid" 
                        class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ editingDebt ? 'Update' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Mark as Paid Modal -->
      <div *ngIf="showPaymentModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Mark as Paid</h3>
            <form (ngSubmit)="confirmPayment()" #paymentForm="ngForm">
              <div class="mb-4">
                <label for="payment_date" class="block text-sm font-medium text-gray-700">Payment Date *</label>
                <input type="date" id="payment_date" name="payment_date" [(ngModel)]="paymentForm.payment_date" 
                       required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              </div>
              <div class="mb-4">
                <label for="payment_notes" class="block text-sm font-medium text-gray-700">Notes</label>
                <textarea id="payment_notes" name="payment_notes" [(ngModel)]="paymentForm.payment_notes" rows="3" 
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"></textarea>
              </div>
              <div class="flex justify-end space-x-3">
                <button type="button" (click)="closePaymentModal()" 
                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                  Cancel
                </button>
                <button type="submit" [disabled]="paymentForm.invalid" 
                        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  Mark as Paid
                </button>
              </div>
            </form>
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
export class PartnerDebtsComponent implements OnInit {
  debts: PartnerDebt[] = [];
  partners: any[] = [];
  units: any[] = [];
  stats: PartnerDebtStats | null = null;
  pagination: any = null;
  searchTerm = '';
  statusFilter = '';
  dueDateFrom = '';
  dueDateTo = '';
  showModal = false;
  showPaymentModal = false;
  editingDebt: PartnerDebt | null = null;
  payingDebt: PartnerDebt | null = null;
  debtForm: any = {};
  paymentForm: any = {};

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadDebts();
    this.loadStats();
    this.loadPartners();
    this.loadUnits();
  }

  loadDebts() {
    const filters: any = {};
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.statusFilter) filters.status = this.statusFilter;
    if (this.dueDateFrom) filters.due_date_from = this.dueDateFrom;
    if (this.dueDateTo) filters.due_date_to = this.dueDateTo;

    this.apiService.getPartnerDebts(filters).subscribe({
      next: (response) => {
        this.debts = response.data;
        this.pagination = response.pagination;
      },
      error: (error) => {
        console.error('Error loading debts:', error);
      }
    });
  }

  loadStats() {
    this.apiService.getPartnerDebtStats().subscribe({
      next: (response) => {
        this.stats = response.data;
      },
      error: (error) => {
        console.error('Error loading debt stats:', error);
      }
    });
  }

  loadPartners() {
    this.apiService.getPartners().subscribe({
      next: (response) => {
        this.partners = response.data;
      },
      error: (error) => {
        console.error('Error loading partners:', error);
      }
    });
  }

  loadUnits() {
    this.apiService.getUnits().subscribe({
      next: (response) => {
        this.units = response.data;
      },
      error: (error) => {
        console.error('Error loading units:', error);
      }
    });
  }

  onSearch() {
    this.loadDebts();
  }

  onFilter() {
    this.loadDebts();
  }

  openAddModal() {
    this.editingDebt = null;
    this.debtForm = {
      partner_id: '',
      unit_id: '',
      amount: 0,
      due_date: '',
      status: 'pending',
      notes: ''
    };
    this.showModal = true;
  }

  openEditModal(debt: PartnerDebt) {
    this.editingDebt = debt;
    this.debtForm = { ...debt };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingDebt = null;
    this.debtForm = {};
  }

  markAsPaid(debt: PartnerDebt) {
    this.payingDebt = debt;
    this.paymentForm = {
      payment_date: new Date().toISOString().split('T')[0],
      payment_notes: ''
    };
    this.showPaymentModal = true;
  }

  closePaymentModal() {
    this.showPaymentModal = false;
    this.payingDebt = null;
    this.paymentForm = {};
  }

  confirmPayment() {
    if (this.payingDebt) {
      this.apiService.markPartnerDebtAsPaid(this.payingDebt.id, this.paymentForm).subscribe({
        next: (response) => {
          this.loadDebts();
          this.closePaymentModal();
        },
        error: (error) => {
          console.error('Error marking debt as paid:', error);
        }
      });
    }
  }

  saveDebt() {
    if (this.editingDebt) {
      this.apiService.updatePartnerDebt(this.editingDebt.id, this.debtForm).subscribe({
        next: (response) => {
          this.loadDebts();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating debt:', error);
        }
      });
    } else {
      this.apiService.createPartnerDebt(this.debtForm).subscribe({
        next: (response) => {
          this.loadDebts();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating debt:', error);
        }
      });
    }
  }

  deleteDebt(id: string) {
    if (confirm('Are you sure you want to delete this debt?')) {
      this.apiService.deletePartnerDebt(id).subscribe({
        next: (response) => {
          this.loadDebts();
        },
        error: (error) => {
          console.error('Error deleting debt:', error);
        }
      });
    }
  }

  trackByDebtId(index: number, debt: PartnerDebt): string {
    return debt.id;
  }

  previousPage() {
    if (this.pagination && this.pagination.current_page > 1) {
      this.pagination.current_page--;
      this.loadDebts();
    }
  }

  nextPage() {
    if (this.pagination && this.pagination.current_page < this.pagination.last_page) {
      this.pagination.current_page++;
      this.loadDebts();
    }
  }

  goToPage(page: number) {
    if (this.pagination && page >= 1 && page <= this.pagination.last_page) {
      this.pagination.current_page = page;
      this.loadDebts();
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