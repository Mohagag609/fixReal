import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-backup-system',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">نظام النسخ الاحتياطي</h1>
              <p class="text-gray-600 mt-1">إدارة النسخ الاحتياطية واستعادة البيانات</p>
            </div>
            <div class="flex items-center space-x-3 space-x-reverse">
              <button
                (click)="createBackup()"
                [disabled]="isCreatingBackup"
                class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
                <span *ngIf="!isCreatingBackup">إنشاء نسخة احتياطية</span>
                <span *ngIf="isCreatingBackup">جاري الإنشاء...</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Backup Status -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">آخر نسخة احتياطية</p>
                <p class="text-2xl font-bold text-gray-900">{{ lastBackupDate || 'غير متوفر' }}</p>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span class="text-2xl">💾</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">إجمالي النسخ</p>
                <p class="text-2xl font-bold text-gray-900">{{ totalBackups }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span class="text-2xl">📁</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">حجم التخزين</p>
                <p class="text-2xl font-bold text-gray-900">{{ totalSize }}</p>
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span class="text-2xl">💿</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Backup Settings -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">إعدادات النسخ الاحتياطية</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">تكرار النسخ الاحتياطية</label>
              <select 
                [(ngModel)]="backupSettings.frequency"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="daily">يومياً</option>
                <option value="weekly">أسبوعياً</option>
                <option value="monthly">شهرياً</option>
                <option value="manual">يدوياً فقط</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">عدد النسخ المحفوظة</label>
              <input
                type="number"
                [(ngModel)]="backupSettings.retentionCount"
                min="1"
                max="30"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">تضمين المرفقات</label>
              <div class="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  [(ngModel)]="backupSettings.includeAttachments"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500">
                <span class="text-sm text-gray-600">تضمين الملفات المرفقة</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">ضغط النسخ</label>
              <div class="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  [(ngModel)]="backupSettings.compress"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500">
                <span class="text-sm text-gray-600">ضغط الملفات لتوفير المساحة</span>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <button
              (click)="saveBackupSettings()"
              [disabled]="isSavingSettings"
              class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:scale-100">
              <span *ngIf="!isSavingSettings">حفظ الإعدادات</span>
              <span *ngIf="isSavingSettings">جاري الحفظ...</span>
            </button>
          </div>
        </div>

        <!-- Backup List -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900">النسخ الاحتياطية</h2>
            <button
              (click)="refreshBackups()"
              class="text-blue-600 hover:text-blue-700 font-medium">
              تحديث
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-right py-3 px-4 font-medium text-gray-700">التاريخ</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-700">النوع</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-700">الحجم</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-700">الحالة</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let backup of backups" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-4 px-4 text-gray-900">{{ backup.created_at | date:'short' }}</td>
                  <td class="py-4 px-4">
                    <span class="px-3 py-1 rounded-full text-xs font-medium"
                          [class]="backup.type === 'full' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'">
                      {{ backup.type === 'full' ? 'كامل' : 'جزئي' }}
                    </span>
                  </td>
                  <td class="py-4 px-4 text-gray-900">{{ backup.size }}</td>
                  <td class="py-4 px-4">
                    <span class="px-3 py-1 rounded-full text-xs font-medium"
                          [class]="backup.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'">
                      {{ backup.status === 'completed' ? 'مكتمل' : 'قيد التنفيذ' }}
                    </span>
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex items-center space-x-2 space-x-reverse">
                      <button
                        (click)="downloadBackup(backup.id)"
                        class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        تحميل
                      </button>
                      <button
                        (click)="restoreBackup(backup.id)"
                        class="text-green-600 hover:text-green-700 text-sm font-medium">
                        استعادة
                      </button>
                      <button
                        (click)="deleteBackup(backup.id)"
                        class="text-red-600 hover:text-red-700 text-sm font-medium">
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
    </div>
  `,
  styles: [`
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `]
})
export class BackupSystemComponent implements OnInit {
  backups: any[] = [];
  lastBackupDate: string = '';
  totalBackups: number = 0;
  totalSize: string = '0 MB';
  isCreatingBackup = false;
  isSavingSettings = false;

  backupSettings = {
    frequency: 'daily',
    retentionCount: 7,
    includeAttachments: true,
    compress: true
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadBackups();
    this.loadBackupSettings();
  }

  loadBackups() {
    // Mock data - replace with actual API call
    this.backups = [
      {
        id: 1,
        created_at: new Date(),
        type: 'full',
        size: '45.2 MB',
        status: 'completed'
      },
      {
        id: 2,
        created_at: new Date(Date.now() - 86400000),
        type: 'incremental',
        size: '12.8 MB',
        status: 'completed'
      }
    ];
    this.totalBackups = this.backups.length;
    this.lastBackupDate = this.backups[0]?.created_at | date:'short';
  }

  loadBackupSettings() {
    // Mock data - replace with actual API call
    this.backupSettings = {
      frequency: 'daily',
      retentionCount: 7,
      includeAttachments: true,
      compress: true
    };
  }

  createBackup() {
    this.isCreatingBackup = true;
    // Mock API call
    setTimeout(() => {
      this.isCreatingBackup = false;
      this.loadBackups();
    }, 3000);
  }

  saveBackupSettings() {
    this.isSavingSettings = true;
    // Mock API call
    setTimeout(() => {
      this.isSavingSettings = false;
    }, 1000);
  }

  refreshBackups() {
    this.loadBackups();
  }

  downloadBackup(id: number) {
    // Mock download
    console.log('Downloading backup:', id);
  }

  restoreBackup(id: number) {
    if (confirm('هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟')) {
      // Mock restore
      console.log('Restoring backup:', id);
    }
  }

  deleteBackup(id: number) {
    if (confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
      // Mock delete
      this.backups = this.backups.filter(b => b.id !== id);
      this.totalBackups = this.backups.length;
    }
  }
}