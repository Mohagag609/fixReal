import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Contract, ContractCreateRequest, ContractUpdateRequest, ApiResponse, Customer, Unit } from '../../models';

@Component({
  selector: 'app-contracts',
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">إدارة العقود</h1>
          <p class="mt-2 text-gray-600">إدارة عقود البيع والإيجار</p>
        </div>
        <button 
          (click)="openCreateModal()"
          class="btn btn-primary">
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          إضافة عقد جديد
        </button>
      </div>

      <!-- Filters and Search -->
      <div class="card">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-64">
            <input 
              type="text" 
              placeholder="البحث في العقود..."
              [(ngModel)]="searchTerm"
              (input)="onSearch()"
              class="form-input">
          </div>
          <select 
            [(ngModel)]="paymentTypeFilter"
            (change)="onFilterChange()"
            class="form-input w-48">
            <option value="">جميع أنواع الدفع</option>
            <option value="installment">أقساط</option>
            <option value="cash">نقدي</option>
            <option value="mixed">مختلط</option>
          </select>
          <button 
            (click)="loadContracts()"
            class="btn btn-outline">
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            تحديث
          </button>
        </div>
      </div>

      <!-- Contracts Table -->
      <div class="card">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>العميل</th>
                <th>الوحدة</th>
                <th>السعر الإجمالي</th>
                <th>نوع الدفع</th>
                <th>عدد الأقساط</th>
                <th>تاريخ العقد</th>
                <th>الوسيط</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let contract of contracts; let i = index" class="fade-in" [style.animation-delay]="(i * 0.1) + 's'">
                <td class="font-medium">{{ contract.customer?.name || '-' }}</td>
                <td>{{ contract.unit?.name || contract.unit?.code || '-' }}</td>
                <td class="font-bold text-primary-950">{{ contract.totalPrice | number:'1.0-0' }} ج.م</td>
                <td>
                  <span class="badge" [ngClass]="getPaymentTypeBadgeClass(contract.paymentType)">
                    {{ getPaymentTypeText(contract.paymentType) }}
                  </span>
                </td>
                <td>{{ contract.installmentCount || '-' }}</td>
                <td>{{ contract.start | date:'short' }}</td>
                <td>{{ contract.brokerName || '-' }}</td>
                <td>
                  <div class="flex items-center space-x-2 space-x-reverse">
                    <button 
                      (click)="viewContract(contract)"
                      class="text-blue-600 hover:text-blue-800"
                      title="عرض التفاصيل">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    </button>
                    <button 
                      (click)="editContract(contract)"
                      class="text-green-600 hover:text-green-800"
                      title="تعديل">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button 
                      (click)="downloadContractPDF(contract)"
                      class="text-purple-600 hover:text-purple-800"
                      title="تحميل PDF">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </button>
                    <button 
                      (click)="deleteContract(contract)"
                      class="text-red-600 hover:text-red-800"
                      title="حذف">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div *ngIf="contracts.length === 0 && !isLoading" class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">لا توجد عقود</h3>
          <p class="text-gray-600 mb-4">ابدأ بإضافة عقد جديد لإدارة العقود</p>
          <button 
            (click)="openCreateModal()"
            class="btn btn-primary">
            إضافة عقد جديد
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="text-center py-12">
          <div class="loading-spinner mx-auto mb-4"></div>
          <p class="text-gray-600">جاري تحميل العقود...</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ContractsComponent implements OnInit {
  contracts: Contract[] = [];
  customers: Customer[] = [];
  availableUnits: Unit[] = [];
  
  // Modal states
  showModal = false;
  isEditing = false;
  isSubmitting = false;
  isLoading = false;
  errorMessage = '';

  // Filters
  searchTerm = '';
  paymentTypeFilter = '';
  currentPage = 1;
  pageSize = 10;

  // Pagination
  pagination: any = null;

  // Form
  contractForm: FormGroup;

  // Math for template
  Math = Math;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService
  ) {
    this.contractForm = this.formBuilder.group({
      customerId: ['', [Validators.required]],
      unitId: ['', [Validators.required]],
      start: ['', [Validators.required]],
      totalPrice: [0, [Validators.required, Validators.min(1)]],
      paymentType: ['installment'],
      downPayment: [0],
      installmentType: ['شهري'],
      installmentCount: [12],
      brokerName: [''],
      brokerPercent: [0],
      discountAmount: [0],
      maintenanceDeposit: [0]
    });
  }

  ngOnInit(): void {
    this.loadContracts();
    this.loadCustomers();
    this.loadAvailableUnits();
  }

  loadContracts(): void {
    this.isLoading = true;
    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      ...(this.searchTerm && { search: this.searchTerm }),
      ...(this.paymentTypeFilter && { paymentType: this.paymentTypeFilter })
    };

    this.apiService.get<ApiResponse<Contract[]>>('/contracts', params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.contracts = response.data;
          this.pagination = response.pagination;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading contracts:', error);
        this.isLoading = false;
      }
    });
  }

  loadCustomers(): void {
    this.apiService.get<ApiResponse<Customer[]>>('/customers').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customers = response.data;
        }
      }
    });
  }

  loadAvailableUnits(): void {
    this.apiService.get<ApiResponse<Unit[]>>('/units/available').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableUnits = response.data;
        }
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadContracts();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadContracts();
  }

  getPaymentTypeText(paymentType: string): string {
    switch (paymentType) {
      case 'installment': return 'أقساط';
      case 'cash': return 'نقدي';
      case 'mixed': return 'مختلط';
      default: return paymentType;
    }
  }

  getPaymentTypeBadgeClass(paymentType: string): string {
    switch (paymentType) {
      case 'installment': return 'badge-info';
      case 'cash': return 'badge-success';
      case 'mixed': return 'badge-warning';
      default: return 'badge-info';
    }
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.contractForm.reset();
    this.contractForm.patchValue({ 
      paymentType: 'installment',
      installmentType: 'شهري',
      installmentCount: 12
    });
    this.showModal = true;
    this.errorMessage = '';
  }

  editContract(contract: Contract): void {
    this.isEditing = true;
    this.contractForm.patchValue({
      ...contract,
      start: contract.start.split('T')[0] // Convert to date input format
    });
    this.showModal = true;
    this.errorMessage = '';
  }

  viewContract(contract: Contract): void {
    // Implementation for viewing contract details
    console.log('View contract:', contract);
  }

  downloadContractPDF(contract: Contract): void {
    this.apiService.downloadFile(`/contracts/${contract.id}/pdf`).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contract-${contract.id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading contract PDF:', error);
      }
    });
  }

  deleteContract(contract: Contract): void {
    if (confirm(`هل أنت متأكد من حذف العقد؟`)) {
      this.apiService.delete<ApiResponse>(`/contracts/${contract.id}`).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadContracts();
          }
        },
        error: (error) => {
          console.error('Error deleting contract:', error);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.contractForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const contractData = this.contractForm.value;

      if (this.isEditing) {
        // Update contract
        this.apiService.put<ApiResponse<Contract>>(`/contracts/${this.selectedContract?.id}`, contractData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeModal();
              this.loadContracts();
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.errorMessage = error.message || 'حدث خطأ أثناء تحديث العقد';
            this.isSubmitting = false;
          }
        });
      } else {
        // Create contract
        this.apiService.post<ApiResponse<Contract>>('/contracts', contractData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeModal();
              this.loadContracts();
              this.loadAvailableUnits(); // Refresh available units
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.errorMessage = error.message || 'حدث خطأ أثناء إضافة العقد';
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.contractForm.reset();
    this.errorMessage = '';
  }
}