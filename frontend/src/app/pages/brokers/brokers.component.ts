import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Broker, BrokerStats } from '../../models/broker.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-brokers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <h1 class="text-3xl font-bold text-navy-800 mb-6">Brokers</h1>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-md p-5 flex items-center justify-between animate-fade-in">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Brokers</p>
            <p class="text-2xl font-bold text-navy-800 mt-1">{{ stats?.total || 0 }}</p>
          </div>
          <i class="fas fa-users text-teal-500 text-3xl"></i>
        </div>
        <div class="bg-white rounded-lg shadow-md p-5 flex items-center justify-between animate-fade-in delay-100">
          <div>
            <p class="text-sm font-medium text-gray-500">Active Brokers</p>
            <p class="text-2xl font-bold text-navy-800 mt-1">{{ stats?.active || 0 }}</p>
          </div>
          <i class="fas fa-user-check text-green-500 text-3xl"></i>
        </div>
        <div class="bg-white rounded-lg shadow-md p-5 flex items-center justify-between animate-fade-in delay-200">
          <div>
            <p class="text-sm font-medium text-gray-500">Inactive Brokers</p>
            <p class="text-2xl font-bold text-navy-800 mt-1">{{ stats?.inactive || 0 }}</p>
          </div>
          <i class="fas fa-user-times text-red-500 text-3xl"></i>
        </div>
        <div class="bg-white rounded-lg shadow-md p-5 flex items-center justify-between animate-fade-in delay-300">
          <div>
            <p class="text-sm font-medium text-gray-500">Avg Commission</p>
            <p class="text-2xl font-bold text-navy-800 mt-1">{{ stats?.average_commission || 0 }}%</p>
          </div>
          <i class="fas fa-percentage text-teal-500 text-3xl"></i>
        </div>
      </div>

      <!-- Filters and Actions -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex flex-col md:flex-row gap-4">
            <div class="relative">
              <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()" 
                     placeholder="Search brokers..." 
                     class="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
              <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
            <select [(ngModel)]="statusFilter" (change)="onFilter()" 
                    class="px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button (click)="openAddModal()" 
                  class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-transform hover:scale-105">
            <i class="fas fa-plus mr-2"></i>Add Broker
          </button>
        </div>
      </div>

      <!-- Brokers Table -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission Rate</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let broker of brokers; trackBy: trackByBrokerId" 
                  class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ broker.name }}</div>
                  <div class="text-sm text-gray-500" *ngIf="broker.notes">{{ broker.notes }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900" *ngIf="broker.phone">{{ broker.phone }}</div>
                  <div class="text-sm text-gray-500" *ngIf="broker.email">{{ broker.email }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ broker.commission_rate }}%
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [ngClass]="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800': broker.status === 'active',
                    'bg-red-100 text-red-800': broker.status === 'inactive'
                  }">
                    {{ broker.status | titlecase }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button (click)="openEditModal(broker)" 
                          class="text-teal-600 hover:text-teal-900 mr-3 transition-colors">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button (click)="deleteBroker(broker.id)" 
                          class="text-red-600 hover:text-red-900 transition-colors">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="brokers.length === 0">
                <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                  No brokers found
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
              {{ editingBroker ? 'Edit Broker' : 'Add New Broker' }}
            </h3>
            <form (ngSubmit)="saveBroker()" #brokerForm="ngForm">
              <div class="mb-4">
                <label for="name" class="block text-sm font-medium text-gray-700">Name *</label>
                <input type="text" id="name" name="name" [(ngModel)]="brokerForm.name" 
                       required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              </div>
              <div class="mb-4">
                <label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
                <input type="text" id="phone" name="phone" [(ngModel)]="brokerForm.phone" 
                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              </div>
              <div class="mb-4">
                <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="email" name="email" [(ngModel)]="brokerForm.email" 
                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              </div>
              <div class="mb-4">
                <label for="address" class="block text-sm font-medium text-gray-700">Address</label>
                <textarea id="address" name="address" [(ngModel)]="brokerForm.address" rows="3" 
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"></textarea>
              </div>
              <div class="mb-4">
                <label for="commission_rate" class="block text-sm font-medium text-gray-700">Commission Rate (%) *</label>
                <input type="number" id="commission_rate" name="commission_rate" [(ngModel)]="brokerForm.commission_rate" 
                       required min="0" max="100" step="0.01" 
                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              </div>
              <div class="mb-4">
                <label for="status" class="block text-sm font-medium text-gray-700">Status *</label>
                <select id="status" name="status" [(ngModel)]="brokerForm.status" required 
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div class="mb-4">
                <label for="notes" class="block text-sm font-medium text-gray-700">Notes</label>
                <textarea id="notes" name="notes" [(ngModel)]="brokerForm.notes" rows="3" 
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"></textarea>
              </div>
              <div class="flex justify-end space-x-3">
                <button type="button" (click)="closeModal()" 
                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                  Cancel
                </button>
                <button type="submit" [disabled]="brokerForm.invalid" 
                        class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ editingBroker ? 'Update' : 'Create' }}
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
export class BrokersComponent implements OnInit {
  brokers: Broker[] = [];
  stats: BrokerStats | null = null;
  pagination: any = null;
  searchTerm = '';
  statusFilter = '';
  showModal = false;
  editingBroker: Broker | null = null;
  brokerForm: any = {};

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadBrokers();
    this.loadStats();
  }

  loadBrokers() {
    const filters: any = {};
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.statusFilter) filters.status = this.statusFilter;

    this.apiService.getBrokers(filters).subscribe({
      next: (response) => {
        this.brokers = response.data;
        this.pagination = response.pagination;
      },
      error: (error) => {
        console.error('Error loading brokers:', error);
      }
    });
  }

  loadStats() {
    this.apiService.getBrokerStats().subscribe({
      next: (response) => {
        this.stats = response.data;
      },
      error: (error) => {
        console.error('Error loading broker stats:', error);
      }
    });
  }

  onSearch() {
    this.loadBrokers();
  }

  onFilter() {
    this.loadBrokers();
  }

  openAddModal() {
    this.editingBroker = null;
    this.brokerForm = {
      name: '',
      phone: '',
      email: '',
      address: '',
      commission_rate: 0,
      status: 'active',
      notes: ''
    };
    this.showModal = true;
  }

  openEditModal(broker: Broker) {
    this.editingBroker = broker;
    this.brokerForm = { ...broker };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingBroker = null;
    this.brokerForm = {};
  }

  saveBroker() {
    if (this.editingBroker) {
      this.apiService.updateBroker(this.editingBroker.id, this.brokerForm).subscribe({
        next: (response) => {
          this.loadBrokers();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating broker:', error);
        }
      });
    } else {
      this.apiService.createBroker(this.brokerForm).subscribe({
        next: (response) => {
          this.loadBrokers();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating broker:', error);
        }
      });
    }
  }

  deleteBroker(id: string) {
    if (confirm('Are you sure you want to delete this broker?')) {
      this.apiService.deleteBroker(id).subscribe({
        next: (response) => {
          this.loadBrokers();
        },
        error: (error) => {
          console.error('Error deleting broker:', error);
        }
      });
    }
  }

  trackByBrokerId(index: number, broker: Broker): string {
    return broker.id;
  }

  previousPage() {
    if (this.pagination && this.pagination.current_page > 1) {
      this.pagination.current_page--;
      this.loadBrokers();
    }
  }

  nextPage() {
    if (this.pagination && this.pagination.current_page < this.pagination.last_page) {
      this.pagination.current_page++;
      this.loadBrokers();
    }
  }

  goToPage(page: number) {
    if (this.pagination && page >= 1 && page <= this.pagination.last_page) {
      this.pagination.current_page = page;
      this.loadBrokers();
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