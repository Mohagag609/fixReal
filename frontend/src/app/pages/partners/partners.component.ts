import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">إدارة الشركاء</h1>
          <p class="text-gray-600">إدارة الشركاء والمجموعات</p>
        </div>
        <div class="flex gap-2">
          <button 
            class="btn btn-primary"
            (click)="openAddModal()">
            + شريك جديد
          </button>
          <button 
            class="btn btn-secondary"
            (click)="openGroupModal()">
            + مجموعة جديدة
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">إجمالي الشركاء</p>
              <p class="text-lg font-bold text-blue-600">{{ stats.total_partners || 0 }}</p>
            </div>
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">👥</span>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">الشركاء النشطين</p>
              <p class="text-lg font-bold text-green-600">{{ stats.active_partners || 0 }}</p>
            </div>
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">✅</span>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">الشركاء غير النشطين</p>
              <p class="text-lg font-bold text-red-600">{{ stats.inactive_partners || 0 }}</p>
            </div>
            <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">❌</span>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 mb-1">المجموعات</p>
              <p class="text-lg font-bold text-purple-600">{{ stats.total_groups || 0 }}</p>
            </div>
            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span class="text-sm">📁</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="card">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button 
              class="py-2 px-1 border-b-2 font-medium text-sm"
              [ngClass]="activeTab === 'partners' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
              (click)="setActiveTab('partners')">
              الشركاء
            </button>
            <button 
              class="py-2 px-1 border-b-2 font-medium text-sm"
              [ngClass]="activeTab === 'groups' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
              (click)="setActiveTab('groups')">
              المجموعات
            </button>
          </nav>
        </div>
      </div>

      <!-- Partners Tab -->
      <div *ngIf="activeTab === 'partners'">
        <!-- Filters -->
        <div class="card">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">البحث</label>
              <input 
                type="text" 
                class="input"
                placeholder="البحث بالاسم أو الهاتف..."
                [(ngModel)]="filters.search"
                (input)="onSearch()">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">المجموعة</label>
              <select 
                class="input"
                [(ngModel)]="filters.group_id"
                (change)="onFilterChange()">
                <option value="">جميع المجموعات</option>
                <option *ngFor="let group of groups" [value]="group.id">
                  {{ group.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
              <select 
                class="input"
                [(ngModel)]="filters.status"
                (change)="onFilterChange()">
                <option value="">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
            <div class="flex items-end">
              <button 
                class="btn btn-secondary w-full"
                (click)="resetFilters()">
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>

        <!-- Partners Table -->
        <div class="card p-0 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الهاتف</th>
                  <th>الهوية الوطنية</th>
                  <th>المجموعات</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let partner of partners" class="animate-fade-in">
                  <td class="font-medium">{{ partner.name }}</td>
                  <td>{{ partner.phone || '-' }}</td>
                  <td>{{ partner.national_id || '-' }}</td>
                  <td>
                    <div class="flex flex-wrap gap-1">
                      <span 
                        *ngFor="let group of partner.groups" 
                        class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {{ group.name }}
                      </span>
                      <span *ngIf="!partner.groups?.length" class="text-gray-400 text-sm">-</span>
                    </div>
                  </td>
                  <td>
                    <span 
                      class="px-2 py-1 text-xs rounded-full"
                      [ngClass]="partner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                      {{ partner.status_label }}
                    </span>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button 
                        class="btn btn-secondary text-xs"
                        (click)="editPartner(partner)">
                        تعديل
                      </button>
                      <button 
                        class="btn btn-danger text-xs"
                        (click)="deletePartner(partner)">
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Groups Tab -->
      <div *ngIf="activeTab === 'groups'">
        <!-- Groups Table -->
        <div class="card p-0 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>اسم المجموعة</th>
                  <th>الوصف</th>
                  <th>عدد الشركاء</th>
                  <th>تاريخ الإنشاء</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let group of groups" class="animate-fade-in">
                  <td class="font-medium">{{ group.name }}</td>
                  <td class="max-w-xs truncate">{{ group.description || '-' }}</td>
                  <td>
                    <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {{ group.partners_count }} شريك
                    </span>
                  </td>
                  <td>{{ formatDate(group.created_at) }}</td>
                  <td>
                    <div class="flex gap-2">
                      <button 
                        class="btn btn-secondary text-xs"
                        (click)="editGroup(group)">
                        تعديل
                      </button>
                      <button 
                        class="btn btn-danger text-xs"
                        (click)="deleteGroup(group)">
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Add/Edit Partner Modal -->
      <div *ngIf="showPartnerModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl animate-scale-in">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ editingPartner ? 'تعديل الشريك' : 'شريك جديد' }}
            </h3>
          </div>
          
          <form [formGroup]="partnerForm" (ngSubmit)="onPartnerSubmit()" class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">الاسم *</label>
                <input 
                  type="text" 
                  class="input"
                  formControlName="name"
                  placeholder="اسم الشريك">
                <div *ngIf="partnerForm.get('name')?.invalid && partnerForm.get('name')?.touched" 
                     class="text-red-500 text-xs mt-1">
                  الاسم مطلوب
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">الهاتف</label>
                <input 
                  type="text" 
                  class="input"
                  formControlName="phone"
                  placeholder="رقم الهاتف">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">الهوية الوطنية</label>
                <input 
                  type="text" 
                  class="input"
                  formControlName="national_id"
                  placeholder="رقم الهوية الوطنية">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                <select class="input" formControlName="status">
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                <textarea 
                  class="input"
                  formControlName="address"
                  placeholder="عنوان الشريك"
                  rows="2"></textarea>
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">المجموعات</label>
                <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  <label *ngFor="let group of groups" class="flex items-center space-x-2 text-sm">
                    <input 
                      type="checkbox" 
                      [value]="group.id"
                      (change)="onGroupToggle(group.id, $event)">
                    <span>{{ group.name }}</span>
                  </label>
                </div>
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea 
                  class="input"
                  formControlName="notes"
                  placeholder="ملاحظات إضافية"
                  rows="3"></textarea>
              </div>
            </div>

            <div class="flex gap-3 pt-4">
              <button 
                type="submit" 
                class="btn btn-primary flex-1"
                [disabled]="partnerForm.invalid || submitting">
                {{ submitting ? 'جاري الحفظ...' : (editingPartner ? 'تحديث' : 'إضافة') }}
              </button>
              <button 
                type="button" 
                class="btn btn-secondary"
                (click)="closePartnerModal()">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add/Edit Group Modal -->
      <div *ngIf="showGroupModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-scale-in">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ editingGroup ? 'تعديل المجموعة' : 'مجموعة جديدة' }}
            </h3>
          </div>
          
          <form [formGroup]="groupForm" (ngSubmit)="onGroupSubmit()" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">اسم المجموعة *</label>
              <input 
                type="text" 
                class="input"
                formControlName="name"
                placeholder="اسم المجموعة">
              <div *ngIf="groupForm.get('name')?.invalid && groupForm.get('name')?.touched" 
                   class="text-red-500 text-xs mt-1">
                اسم المجموعة مطلوب
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
              <textarea 
                class="input"
                formControlName="description"
                placeholder="وصف المجموعة"
                rows="3"></textarea>
            </div>

            <div class="flex gap-3 pt-4">
              <button 
                type="submit" 
                class="btn btn-primary flex-1"
                [disabled]="groupForm.invalid || submitting">
                {{ submitting ? 'جاري الحفظ...' : (editingGroup ? 'تحديث' : 'إضافة') }}
              </button>
              <button 
                type="button" 
                class="btn btn-secondary"
                (click)="closeGroupModal()">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PartnersComponent implements OnInit {
  partners: any[] = [];
  groups: any[] = [];
  loading = false;
  error: string | null = null;
  showPartnerModal = false;
  showGroupModal = false;
  editingPartner: any = null;
  editingGroup: any = null;
  submitting = false;
  activeTab = 'partners';
  
  stats: any = {};
  
  filters: any = {
    search: '',
    group_id: '',
    status: '',
    page: 1,
    per_page: 15
  };

  partnerForm: FormGroup;
  groupForm: FormGroup;
  selectedGroups: number[] = [];

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.partnerForm = this.fb.group({
      name: ['', Validators.required],
      phone: [''],
      national_id: [''],
      address: [''],
      status: ['active'],
      notes: ['']
    });

    this.groupForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadPartners();
    this.loadGroups();
    this.loadStats();
  }

  loadPartners() {
    this.loading = true;
    this.error = null;

    this.apiService.getPartners(this.filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.partners = response.data;
        } else {
          this.error = 'فشل في تحميل الشركاء';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.loading = false;
        console.error('Partners error:', error);
      }
    });
  }

  loadGroups() {
    this.apiService.getPartnerGroups().subscribe({
      next: (response) => {
        if (response.success) {
          this.groups = response.data;
        }
      },
      error: (error) => {
        console.error('Groups error:', error);
      }
    });
  }

  loadStats() {
    this.apiService.getPartnerStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data;
        }
      },
      error: (error) => {
        console.error('Stats error:', error);
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  onSearch() {
    this.filters.page = 1;
    this.loadPartners();
  }

  onFilterChange() {
    this.filters.page = 1;
    this.loadPartners();
  }

  resetFilters() {
    this.filters = {
      search: '',
      group_id: '',
      status: '',
      page: 1,
      per_page: 15
    };
    this.loadPartners();
  }

  openAddModal() {
    this.editingPartner = null;
    this.selectedGroups = [];
    this.partnerForm.reset({
      status: 'active'
    });
    this.showPartnerModal = true;
  }

  editPartner(partner: any) {
    this.editingPartner = partner;
    this.selectedGroups = partner.groups?.map((g: any) => g.id) || [];
    this.partnerForm.patchValue(partner);
    this.showPartnerModal = true;
  }

  closePartnerModal() {
    this.showPartnerModal = false;
    this.editingPartner = null;
    this.partnerForm.reset();
    this.selectedGroups = [];
  }

  openGroupModal() {
    this.editingGroup = null;
    this.groupForm.reset();
    this.showGroupModal = true;
  }

  editGroup(group: any) {
    this.editingGroup = group;
    this.groupForm.patchValue(group);
    this.showGroupModal = true;
  }

  closeGroupModal() {
    this.showGroupModal = false;
    this.editingGroup = null;
    this.groupForm.reset();
  }

  onGroupToggle(groupId: number, event: any) {
    if (event.target.checked) {
      this.selectedGroups.push(groupId);
    } else {
      this.selectedGroups = this.selectedGroups.filter(id => id !== groupId);
    }
  }

  onPartnerSubmit() {
    if (this.partnerForm.invalid) return;

    this.submitting = true;
    const formData = {
      ...this.partnerForm.value,
      groups: this.selectedGroups
    };

    const operation = this.editingPartner 
      ? this.apiService.updatePartner(this.editingPartner.id, formData)
      : this.apiService.createPartner(formData);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
          this.closePartnerModal();
          this.loadPartners();
          this.loadStats();
        } else {
          this.error = 'فشل في حفظ الشريك';
        }
        this.submitting = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.submitting = false;
        console.error('Save partner error:', error);
      }
    });
  }

  onGroupSubmit() {
    if (this.groupForm.invalid) return;

    this.submitting = true;
    const formData = this.groupForm.value;

    const operation = this.editingGroup 
      ? this.apiService.updatePartnerGroup(this.editingGroup.id, formData)
      : this.apiService.createPartnerGroup(formData);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
          this.closeGroupModal();
          this.loadGroups();
          this.loadStats();
        } else {
          this.error = 'فشل في حفظ المجموعة';
        }
        this.submitting = false;
      },
      error: (error) => {
        this.error = 'خطأ في الاتصال بالخادم';
        this.submitting = false;
        console.error('Save group error:', error);
      }
    });
  }

  deletePartner(partner: any) {
    if (confirm(`هل أنت متأكد من حذف الشريك "${partner.name}"؟`)) {
      this.apiService.deletePartner(partner.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadPartners();
            this.loadStats();
          } else {
            this.error = 'فشل في حذف الشريك';
          }
        },
        error: (error) => {
          this.error = 'خطأ في الاتصال بالخادم';
          console.error('Delete partner error:', error);
        }
      });
    }
  }

  deleteGroup(group: any) {
    if (confirm(`هل أنت متأكد من حذف المجموعة "${group.name}"؟`)) {
      this.apiService.deletePartnerGroup(group.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadGroups();
            this.loadStats();
          } else {
            this.error = 'فشل في حذف المجموعة';
          }
        },
        error: (error) => {
          this.error = 'خطأ في الاتصال بالخادم';
          console.error('Delete group error:', error);
        }
      });
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA');
  }
}