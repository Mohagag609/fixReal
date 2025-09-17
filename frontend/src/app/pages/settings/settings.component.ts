import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Settings } from '../../models/settings.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <h1 class="text-3xl font-bold text-navy-800 mb-6">Settings</h1>

      <!-- Settings Categories -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-md p-6 animate-fade-in">
          <div class="flex items-center mb-4">
            <i class="fas fa-cog text-teal-500 text-2xl mr-3"></i>
            <h3 class="text-lg font-medium text-gray-900">General Settings</h3>
          </div>
          <p class="text-sm text-gray-500 mb-4">Basic application configuration</p>
          <button (click)="openCategoryModal('general')" 
                  class="w-full px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-transform hover:scale-105">
            Manage
          </button>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 animate-fade-in delay-100">
          <div class="flex items-center mb-4">
            <i class="fas fa-database text-blue-500 text-2xl mr-3"></i>
            <h3 class="text-lg font-medium text-gray-900">Database Settings</h3>
          </div>
          <p class="text-sm text-gray-500 mb-4">Database connection and performance</p>
          <button (click)="openCategoryModal('database')" 
                  class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform hover:scale-105">
            Manage
          </button>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 animate-fade-in delay-200">
          <div class="flex items-center mb-4">
            <i class="fas fa-bell text-yellow-500 text-2xl mr-3"></i>
            <h3 class="text-lg font-medium text-gray-900">Notification Settings</h3>
          </div>
          <p class="text-sm text-gray-500 mb-4">Email and system notifications</p>
          <button (click)="openCategoryModal('notifications')" 
                  class="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-transform hover:scale-105">
            Manage
          </button>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 animate-fade-in delay-300">
          <div class="flex items-center mb-4">
            <i class="fas fa-shield-alt text-green-500 text-2xl mr-3"></i>
            <h3 class="text-lg font-medium text-gray-900">Security Settings</h3>
          </div>
          <p class="text-sm text-gray-500 mb-4">Authentication and security policies</p>
          <button (click)="openCategoryModal('security')" 
                  class="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-transform hover:scale-105">
            Manage
          </button>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 animate-fade-in delay-400">
          <div class="flex items-center mb-4">
            <i class="fas fa-chart-line text-purple-500 text-2xl mr-3"></i>
            <h3 class="text-lg font-medium text-gray-900">Performance Settings</h3>
          </div>
          <p class="text-sm text-gray-500 mb-4">System performance and optimization</p>
          <button (click)="openCategoryModal('performance')" 
                  class="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-transform hover:scale-105">
            Manage
          </button>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 animate-fade-in delay-500">
          <div class="flex items-center mb-4">
            <i class="fas fa-palette text-pink-500 text-2xl mr-3"></i>
            <h3 class="text-lg font-medium text-gray-900">Appearance Settings</h3>
          </div>
          <p class="text-sm text-gray-500 mb-4">Theme and display preferences</p>
          <button (click)="openCategoryModal('appearance')" 
                  class="w-full px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-transform hover:scale-105">
            Manage
          </button>
        </div>
      </div>

      <!-- All Settings Table -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 class="text-lg font-medium text-gray-900">All Settings</h2>
            <div class="flex gap-4 mt-4 md:mt-0">
              <div class="relative">
                <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()" 
                       placeholder="Search settings..." 
                       class="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              </div>
              <button (click)="openAddModal()" 
                      class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-transform hover:scale-105">
                <i class="fas fa-plus mr-2"></i>Add Setting
              </button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Public</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let setting of settings; trackBy: trackBySettingId" 
                  class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ setting.key }}</div>
                  <div class="text-sm text-gray-500" *ngIf="setting.description">{{ setting.description }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 max-w-xs truncate">{{ setting.value }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [ngClass]="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-blue-100 text-blue-800': setting.type === 'string',
                    'bg-green-100 text-green-800': setting.type === 'number',
                    'bg-yellow-100 text-yellow-800': setting.type === 'boolean',
                    'bg-purple-100 text-purple-800': setting.type === 'json'
                  }">
                    {{ setting.type | titlecase }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [ngClass]="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800': setting.is_public,
                    'bg-gray-100 text-gray-800': !setting.is_public
                  }">
                    {{ setting.is_public ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button (click)="openEditModal(setting)" 
                          class="text-teal-600 hover:text-teal-900 mr-3 transition-colors">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button (click)="deleteSetting(setting.id)" 
                          class="text-red-600 hover:text-red-900 transition-colors">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="settings.length === 0">
                <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                  No settings found
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
              {{ editingSetting ? 'Edit Setting' : 'Add New Setting' }}
            </h3>
            <form (ngSubmit)="saveSetting()" #settingForm="ngForm">
              <div class="mb-4">
                <label for="key" class="block text-sm font-medium text-gray-700">Key *</label>
                <input type="text" id="key" name="key" [(ngModel)]="settingForm.key" 
                       required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
              </div>
              <div class="mb-4">
                <label for="value" class="block text-sm font-medium text-gray-700">Value *</label>
                <textarea id="value" name="value" [(ngModel)]="settingForm.value" 
                          required rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"></textarea>
              </div>
              <div class="mb-4">
                <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
                <textarea id="description" name="description" [(ngModel)]="settingForm.description" 
                          rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"></textarea>
              </div>
              <div class="mb-4">
                <label for="type" class="block text-sm font-medium text-gray-700">Type *</label>
                <select id="type" name="type" [(ngModel)]="settingForm.type" required 
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div class="mb-4">
                <label class="flex items-center">
                  <input type="checkbox" [(ngModel)]="settingForm.is_public" name="is_public" 
                         class="rounded border-gray-300 text-teal-600 shadow-sm focus:border-teal-300 focus:ring focus:ring-teal-200 focus:ring-opacity-50">
                  <span class="ml-2 text-sm text-gray-700">Public Setting</span>
                </label>
              </div>
              <div class="flex justify-end space-x-3">
                <button type="button" (click)="closeModal()" 
                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                  Cancel
                </button>
                <button type="submit" [disabled]="settingForm.invalid" 
                        class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ editingSetting ? 'Update' : 'Create' }}
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
    .animate-fade-in.delay-400 {
      animation-delay: 0.4s;
    }
    .animate-fade-in.delay-500 {
      animation-delay: 0.5s;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SettingsComponent implements OnInit {
  settings: Settings[] = [];
  pagination: any = null;
  searchTerm = '';
  showModal = false;
  editingSetting: Settings | null = null;
  settingForm: any = {};

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    const filters: any = {};
    if (this.searchTerm) filters.search = this.searchTerm;

    this.apiService.getSettings(filters).subscribe({
      next: (response) => {
        this.settings = response.data;
        this.pagination = response.pagination;
      },
      error: (error) => {
        console.error('Error loading settings:', error);
      }
    });
  }

  onSearch() {
    this.loadSettings();
  }

  openCategoryModal(category: string) {
    // This would open a category-specific modal
    console.log('Opening category modal for:', category);
  }

  openAddModal() {
    this.editingSetting = null;
    this.settingForm = {
      key: '',
      value: '',
      description: '',
      type: 'string',
      is_public: false
    };
    this.showModal = true;
  }

  openEditModal(setting: Settings) {
    this.editingSetting = setting;
    this.settingForm = { ...setting };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingSetting = null;
    this.settingForm = {};
  }

  saveSetting() {
    if (this.editingSetting) {
      this.apiService.updateSetting(this.editingSetting.id, this.settingForm).subscribe({
        next: (response) => {
          this.loadSettings();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating setting:', error);
        }
      });
    } else {
      this.apiService.createSetting(this.settingForm).subscribe({
        next: (response) => {
          this.loadSettings();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating setting:', error);
        }
      });
    }
  }

  deleteSetting(id: string) {
    if (confirm('Are you sure you want to delete this setting?')) {
      this.apiService.deleteSetting(id).subscribe({
        next: (response) => {
          this.loadSettings();
        },
        error: (error) => {
          console.error('Error deleting setting:', error);
        }
      });
    }
  }

  trackBySettingId(index: number, setting: Settings): string {
    return setting.id;
  }

  previousPage() {
    if (this.pagination && this.pagination.current_page > 1) {
      this.pagination.current_page--;
      this.loadSettings();
    }
  }

  nextPage() {
    if (this.pagination && this.pagination.current_page < this.pagination.last_page) {
      this.pagination.current_page++;
      this.loadSettings();
    }
  }

  goToPage(page: number) {
    if (this.pagination && page >= 1 && page <= this.pagination.last_page) {
      this.pagination.current_page = page;
      this.loadSettings();
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