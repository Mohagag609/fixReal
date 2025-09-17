import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface ExportOptions {
  entities: string[];
  format: 'json' | 'excel' | 'csv';
  dateFrom?: string;
  dateTo?: string;
  includeDeleted: boolean;
  includeRelations: boolean;
}

interface ImportOptions {
  file: File;
  entity: string;
  updateExisting: boolean;
  validateData: boolean;
}

@Component({
  selector: 'app-export-import',
  templateUrl: './export-import.component.html',
  styleUrls: ['./export-import.component.css']
})
export class ExportImportComponent implements OnInit {
  exportForm: FormGroup;
  importForm: FormGroup;
  isExporting = false;
  isImporting = false;
  exportProgress = 0;
  importProgress = 0;
  exportStatus = '';
  importStatus = '';
  availableEntities = [
    { value: 'customers', label: 'العملاء', icon: '👥' },
    { value: 'units', label: 'الوحدات', icon: '🏢' },
    { value: 'contracts', label: 'العقود', icon: '📋' },
    { value: 'installments', label: 'الأقساط', icon: '💰' },
    { value: 'partners', label: 'الشركاء', icon: '🤝' },
    { value: 'brokers', label: 'الوسطاء', icon: '🏦' },
    { value: 'safes', label: 'الخزائن', icon: '🔒' },
    { value: 'vouchers', label: 'السندات', icon: '📄' },
    { value: 'transfers', label: 'التحويلات', icon: '🔄' },
    { value: 'settings', label: 'الإعدادات', icon: '⚙️' }
  ];

  exportFormats = [
    { value: 'json', label: 'JSON', icon: '📄' },
    { value: 'excel', label: 'Excel', icon: '📊' },
    { value: 'csv', label: 'CSV', icon: '📋' }
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.exportForm = this.fb.group({
      entities: [[], [Validators.required, Validators.minLength(1)]],
      format: ['json', Validators.required],
      dateFrom: [''],
      dateTo: [''],
      includeDeleted: [false],
      includeRelations: [true]
    });

    this.importForm = this.fb.group({
      file: [null, Validators.required],
      entity: ['', Validators.required],
      updateExisting: [false],
      validateData: [true]
    });
  }

  ngOnInit(): void {
    this.setDateRange();
  }

  setDateRange(): void {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    this.exportForm.patchValue({
      dateFrom: lastMonth.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    });
  }

  onEntitySelectionChange(selectedEntities: string[]): void {
    this.exportForm.patchValue({ entities: selectedEntities });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.importForm.patchValue({ file });
    }
  }

  exportData(): void {
    if (this.exportForm.valid) {
      this.isExporting = true;
      this.exportProgress = 0;
      this.exportStatus = 'جاري التحضير...';

      const formData = this.exportForm.value;
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        if (this.exportProgress < 90) {
          this.exportProgress += Math.random() * 10;
          this.exportStatus = `جاري التصدير... ${Math.round(this.exportProgress)}%`;
        }
      }, 500);

      this.apiService.post('/export', formData).subscribe({
        next: (response) => {
          clearInterval(progressInterval);
          this.exportProgress = 100;
          this.exportStatus = 'تم التصدير بنجاح!';
          
          // Download file
          this.downloadFile(response.data, formData.format);
          
          setTimeout(() => {
            this.isExporting = false;
            this.exportStatus = '';
            this.exportProgress = 0;
          }, 2000);
        },
        error: (error) => {
          clearInterval(progressInterval);
          this.isExporting = false;
          this.exportStatus = 'حدث خطأ في التصدير';
          console.error('Export error:', error);
        }
      });
    }
  }

  importData(): void {
    if (this.importForm.valid) {
      this.isImporting = true;
      this.importProgress = 0;
      this.importStatus = 'جاري التحضير...';

      const formData = new FormData();
      formData.append('file', this.importForm.get('file')?.value);
      formData.append('entity', this.importForm.get('entity')?.value);
      formData.append('updateExisting', this.importForm.get('updateExisting')?.value);
      formData.append('validateData', this.importForm.get('validateData')?.value);

      // Simulate progress
      const progressInterval = setInterval(() => {
        if (this.importProgress < 90) {
          this.importProgress += Math.random() * 10;
          this.importStatus = `جاري الاستيراد... ${Math.round(this.importProgress)}%`;
        }
      }, 500);

      this.apiService.post('/import', formData).subscribe({
        next: (response) => {
          clearInterval(progressInterval);
          this.importProgress = 100;
          this.importStatus = 'تم الاستيراد بنجاح!';
          
          setTimeout(() => {
            this.isImporting = false;
            this.importStatus = '';
            this.importProgress = 0;
            this.importForm.reset();
          }, 2000);
        },
        error: (error) => {
          clearInterval(progressInterval);
          this.isImporting = false;
          this.importStatus = 'حدث خطأ في الاستيراد';
          console.error('Import error:', error);
        }
      });
    }
  }

  downloadFile(data: any, format: string): void {
    let blob: Blob;
    let filename: string;

    switch (format) {
      case 'json':
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        filename = `export-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'excel':
        blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        filename = `export-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;
      case 'csv':
        blob = new Blob([data], { type: 'text/csv' });
        filename = `export-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      default:
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        filename = `export-${new Date().toISOString().split('T')[0]}.json`;
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  downloadTemplate(entity: string): void {
    this.apiService.get(`/export/template/${entity}`).subscribe({
      next: (response) => {
        this.downloadFile(response.data, 'excel');
      },
      error: (error) => {
        console.error('Error downloading template:', error);
      }
    });
  }

  validateImportFile(): void {
    const file = this.importForm.get('file')?.value;
    const entity = this.importForm.get('entity')?.value;
    
    if (file && entity) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entity', entity);
      formData.append('validateOnly', 'true');

      this.apiService.post('/import/validate', formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.importStatus = `الملف صالح - ${response.data.validRecords} سجل صالح`;
          } else {
            this.importStatus = `الملف يحتوي على أخطاء - ${response.data.errors.length} خطأ`;
          }
        },
        error: (error) => {
          this.importStatus = 'خطأ في التحقق من صحة الملف';
          console.error('Validation error:', error);
        }
      });
    }
  }

  getEntityIcon(entity: string): string {
    const entityObj = this.availableEntities.find(e => e.value === entity);
    return entityObj ? entityObj.icon : '📄';
  }

  getEntityLabel(entity: string): string {
    const entityObj = this.availableEntities.find(e => e.value === entity);
    return entityObj ? entityObj.label : entity;
  }

  getFormatIcon(format: string): string {
    const formatObj = this.exportFormats.find(f => f.value === format);
    return formatObj ? formatObj.icon : '📄';
  }

  getFormatLabel(format: string): string {
    const formatObj = this.exportFormats.find(f => f.value === format);
    return formatObj ? formatObj.label : format;
  }
}