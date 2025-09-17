import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Partner, PartnerCreateRequest, PartnerUpdateRequest, ApiResponse } from '../../models';

@Component({
  selector: 'app-partners',
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">إدارة الشركاء</h1>
          <p class="mt-2 text-gray-600">إدارة بيانات الشركاء والمعلومات الشخصية</p>
        </div>
        <button 
          (click)="openCreateModal()"
          class="btn btn-primary">
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          إضافة شريك جديد
        </button>
      </div>

      <!-- Filters and Search -->
      <div class="card">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-64">
            <input 
              type="text" 
              placeholder="البحث في الشركاء..."
              [(ngModel)]="searchTerm"
              (input)="onSearch()"
              class="form-input">
          </div>
          <select 
            [(ngModel)]="statusFilter"
            (change)="onFilterChange()"
            class="form-input w-48">
            <option value="">جميع الحالات</option>
            <option value="نشط">نشط</option>
            <option value="غير نشط">غير نشط</option>
          </select>
          <button 
            (click)="loadPartners()"
            class="btn btn-outline">
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            تحديث
          </button>
        </div>
      </div>

      <!-- Partners Table -->
      <div class="card">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الهاتف</th>
                <th>الرقم القومي</th>
                <th>العنوان</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let partner of partners; let i = index" class="fade-in" [style.animation-delay]="(i * 0.1) + 's'">
                <td class="font-medium">{{ partner.name }}</td>
                <td>{{ partner.phone || '-' }}</td>
                <td>{{ partner.nationalId || '-' }}</td>
                <td>{{ partner.address || '-' }}</td>
                <td>
                  <span class="badge" [ngClass]="partner.status === 'نشط' ? 'badge-success' : 'badge-warning'">
                    {{ partner.status }}
                  </span>
                </td>
                <td>{{ partner.createdAt | date:'short' }}</td>
                <td>
                  <div class="flex items-center space-x-2 space-x-reverse">
                    <button 
                      (click)="viewPartner(partner)"
                      class="text-blue-600 hover:text-blue-800"
                      title="عرض التفاصيل">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    </button>
                    <button 
                      (click)="editPartner(partner)"
                      class="text-green-600 hover:text-green-800"
                      title="تعديل">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button 
                      (click)="deletePartner(partner)"
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

        <!-- Pagination -->
        <div *ngIf="pagination && pagination.totalPages > 1" class="mt-6 flex items-center justify-between">
          <div class="text-sm text-gray-700">
            عرض {{ (pagination.page - 1) * pagination.limit + 1 }} إلى {{ Math.min(pagination.page * pagination.limit, pagination.total) }} من {{ pagination.total }} شريك
          </div>
          <div class="flex items-center space-x-2 space-x-reverse">
            <button 
              (click)="goToPage(pagination.page - 1)"
              [disabled]="pagination.page <= 1"
              class="btn btn-outline btn-sm"
              [class.opacity-50]="pagination.page <= 1">
              السابق
            </button>
            <span class="px-3 py-1 text-sm bg-gray-100 rounded">
              {{ pagination.page }} من {{ pagination.totalPages }}
            </span>
            <button 
              (click)="goToPage(pagination.page + 1)"
              [disabled]="pagination.page >= pagination.totalPages"
              class="btn btn-outline btn-sm"
              [class.opacity-50]="pagination.page >= pagination.totalPages">
              التالي
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="partners.length === 0 && !isLoading" class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">لا توجد شركاء</h3>
          <p class="text-gray-600 mb-4">ابدأ بإضافة شريك جديد لإدارة بياناته</p>
          <button 
            (click)="openCreateModal()"
            class="btn btn-primary">
            إضافة شريك جديد
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="text-center py-12">
          <div class="loading-spinner mx-auto mb-4"></div>
          <p class="text-gray-600">جاري تحميل الشركاء...</p>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? 'تعديل الشريك' : 'إضافة شريك جديد' }}
          </h3>
          <button 
            (click)="closeModal()"
            class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form [formGroup]="partnerForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <!-- Name -->
            <div>
              <label class="form-label">الاسم *</label>
              <input 
                type="text" 
                formControlName="name"
                class="form-input"
                [class.border-red-500]="partnerForm.get('name')?.invalid && partnerForm.get('name')?.touched">
              <div *ngIf="partnerForm.get('name')?.invalid && partnerForm.get('name')?.touched" class="form-error">
                <span *ngIf="partnerForm.get('name')?.errors?.['required']">الاسم مطلوب</span>
                <span *ngIf="partnerForm.get('name')?.errors?.['minlength']">الاسم يجب أن يكون حرفين على الأقل</span>
              </div>
            </div>

            <!-- Phone -->
            <div>
              <label class="form-label">الهاتف</label>
              <input 
                type="tel" 
                formControlName="phone"
                class="form-input"
                placeholder="01234567890">
            </div>

            <!-- National ID -->
            <div>
              <label class="form-label">الرقم القومي</label>
              <input 
                type="text" 
                formControlName="nationalId"
                class="form-input"
                placeholder="12345678901234">
            </div>

            <!-- Address -->
            <div>
              <label class="form-label">العنوان</label>
              <textarea 
                formControlName="address"
                class="form-input"
                rows="3"
                placeholder="العنوان الكامل"></textarea>
            </div>

            <!-- Status -->
            <div>
              <label class="form-label">الحالة</label>
              <select formControlName="status" class="form-input">
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
              </select>
            </div>

            <!-- Notes -->
            <div>
              <label class="form-label">ملاحظات</label>
              <textarea 
                formControlName="notes"
                class="form-input"
                rows="3"
                placeholder="ملاحظات إضافية"></textarea>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
              <svg class="w-5 h-5 text-red-400 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-sm text-red-600">{{ errorMessage }}</p>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex items-center justify-end space-x-3 space-x-reverse mt-6">
            <button 
              type="button"
              (click)="closeModal()"
              class="btn btn-outline">
              إلغاء
            </button>
            <button 
              type="submit"
              [disabled]="partnerForm.invalid || isSubmitting"
              class="btn btn-primary"
              [class.opacity-50]="partnerForm.invalid || isSubmitting">
              <svg *ngIf="isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSubmitting ? 'جاري الحفظ...' : (isEditing ? 'تحديث' : 'إضافة') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Partner Details Modal -->
    <div *ngIf="showDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">تفاصيل الشريك</h3>
          <button 
            (click)="closeDetailsModal()"
            class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div *ngIf="selectedPartner" class="space-y-6">
          <!-- Partner Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-gray-900 mb-2">المعلومات الشخصية</h4>
              <div class="space-y-2">
                <p><span class="font-medium">الاسم:</span> {{ selectedPartner.name }}</p>
                <p><span class="font-medium">الهاتف:</span> {{ selectedPartner.phone || '-' }}</p>
                <p><span class="font-medium">الرقم القومي:</span> {{ selectedPartner.nationalId || '-' }}</p>
                <p><span class="font-medium">العنوان:</span> {{ selectedPartner.address || '-' }}</p>
                <p><span class="font-medium">الحالة:</span> 
                  <span class="badge" [ngClass]="selectedPartner.status === 'نشط' ? 'badge-success' : 'badge-warning'">
                    {{ selectedPartner.status }}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <h4 class="font-medium text-gray-900 mb-2">الإحصائيات</h4>
              <div *ngIf="partnerStats" class="space-y-2">
                <p><span class="font-medium">إجمالي الوحدات:</span> {{ partnerStats.totalUnits }}</p>
                <p><span class="font-medium">إجمالي القيمة:</span> {{ partnerStats.totalValue | number:'1.0-0' }} ج.م</p>
              </div>
            </div>
          </div>

          <!-- Partner Units -->
          <div>
            <h4 class="font-medium text-gray-900 mb-2">وحدات الشريك</h4>
            <div *ngIf="partnerUnits.length > 0" class="space-y-2">
              <div *ngFor="let unitPartner of partnerUnits" class="p-3 border border-gray-200 rounded-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium">{{ unitPartner.unit?.name || unitPartner.unit?.code || 'وحدة غير محددة' }}</p>
                    <p class="text-sm text-gray-600">{{ unitPartner.unit?.totalPrice | number:'1.0-0' }} ج.م</p>
                  </div>
                  <span class="text-sm text-gray-500">{{ unitPartner.createdAt | date:'short' }}</span>
                </div>
              </div>
            </div>
            <div *ngIf="partnerUnits.length === 0" class="text-center py-4 text-gray-500">
              لا توجد وحدات لهذا الشريك
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PartnersComponent implements OnInit {
  partners: Partner[] = [];
  selectedPartner: Partner | null = null;
  partnerStats: any = null;
  partnerUnits: any[] = [];
  
  // Modal states
  showModal = false;
  showDetailsModal = false;
  isEditing = false;
  isSubmitting = false;
  isLoading = false;
  errorMessage = '';

  // Filters
  searchTerm = '';
  statusFilter = '';
  currentPage = 1;
  pageSize = 10;

  // Pagination
  pagination: any = null;

  // Form
  partnerForm: FormGroup;

  // Math for template
  Math = Math;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService
  ) {
    this.partnerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: [''],
      nationalId: [''],
      address: [''],
      status: ['نشط'],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadPartners();
  }

  loadPartners(): void {
    this.isLoading = true;
    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      ...(this.searchTerm && { search: this.searchTerm }),
      ...(this.statusFilter && { status: this.statusFilter })
    };

    this.apiService.get<ApiResponse<Partner[]>>('/partners', params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.partners = response.data;
          this.pagination = response.pagination;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading partners:', error);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadPartners();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadPartners();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadPartners();
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.partnerForm.reset();
    this.partnerForm.patchValue({ status: 'نشط' });
    this.showModal = true;
    this.errorMessage = '';
  }

  editPartner(partner: Partner): void {
    this.isEditing = true;
    this.partnerForm.patchValue(partner);
    this.showModal = true;
    this.errorMessage = '';
  }

  viewPartner(partner: Partner): void {
    this.selectedPartner = partner;
    this.loadPartnerDetails(partner.id);
    this.showDetailsModal = true;
  }

  loadPartnerDetails(partnerId: string): void {
    // Load partner stats
    this.apiService.get<ApiResponse>(`/partners/${partnerId}/stats`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.partnerStats = response.data;
        }
      }
    });

    // Load partner units
    this.apiService.get<ApiResponse>(`/partners/${partnerId}/units`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.partnerUnits = response.data;
        }
      }
    });
  }

  deletePartner(partner: Partner): void {
    if (confirm(`هل أنت متأكد من حذف الشريك "${partner.name}"؟`)) {
      this.apiService.delete<ApiResponse>(`/partners/${partner.id}`).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadPartners();
          }
        },
        error: (error) => {
          console.error('Error deleting partner:', error);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.partnerForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const partnerData = this.partnerForm.value;

      if (this.isEditing && this.selectedPartner) {
        // Update partner
        this.apiService.put<ApiResponse<Partner>>(`/partners/${this.selectedPartner.id}`, partnerData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeModal();
              this.loadPartners();
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.errorMessage = error.message || 'حدث خطأ أثناء تحديث الشريك';
            this.isSubmitting = false;
          }
        });
      } else {
        // Create partner
        this.apiService.post<ApiResponse<Partner>>('/partners', partnerData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeModal();
              this.loadPartners();
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.errorMessage = error.message || 'حدث خطأ أثناء إضافة الشريك';
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.selectedPartner = null;
    this.partnerForm.reset();
    this.errorMessage = '';
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedPartner = null;
    this.partnerStats = null;
    this.partnerUnits = [];
  }
}