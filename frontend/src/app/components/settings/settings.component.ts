import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  options?: string[];
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  settings: Setting[] = [];
  filteredSettings: Setting[] = [];
  settingsForm: FormGroup;
  categories = ['عام', 'مالي', 'عقاري', 'نظام', 'أمان', 'إشعارات'];
  selectedCategory = 'جميع الفئات';
  searchTerm = '';
  isLoading = false;
  isSaving = false;
  showAddModal = false;
  newSettingForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.settingsForm = this.fb.group({});
    this.newSettingForm = this.fb.group({
      key: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]+$/)]],
      value: ['', Validators.required],
      description: [''],
      category: ['عام', Validators.required],
      type: ['text', Validators.required],
      options: ['']
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.apiService.get('/settings').subscribe({
      next: (response) => {
        this.settings = response.data || [];
        this.filterSettings();
        this.initializeForm();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading settings:', error);
        this.isLoading = false;
      }
    });
  }

  initializeForm(): void {
    const formControls: any = {};
    this.settings.forEach(setting => {
      formControls[setting.key] = [setting.value];
    });
    this.settingsForm = this.fb.group(formControls);
  }

  filterSettings(): void {
    this.filteredSettings = this.settings.filter(setting => {
      const matchesCategory = this.selectedCategory === 'جميع الفئات' || setting.category === this.selectedCategory;
      const matchesSearch = setting.key.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           setting.description?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  onCategoryChange(): void {
    this.filterSettings();
  }

  onSearchChange(): void {
    this.filterSettings();
  }

  saveSettings(): void {
    if (this.settingsForm.valid) {
      this.isSaving = true;
      const settingsToUpdate = this.settingsForm.value;
      
      this.apiService.put('/settings/bulk', { settings: settingsToUpdate }).subscribe({
        next: (response) => {
          console.log('Settings saved successfully');
          this.isSaving = false;
          this.loadSettings();
        },
        error: (error) => {
          console.error('Error saving settings:', error);
          this.isSaving = false;
        }
      });
    }
  }

  resetSettings(): void {
    this.settingsForm.reset();
    this.initializeForm();
  }

  addSetting(): void {
    if (this.newSettingForm.valid) {
      const newSetting = this.newSettingForm.value;
      if (newSetting.options) {
        newSetting.options = newSetting.options.split(',').map((opt: string) => opt.trim());
      }
      
      this.apiService.post('/settings', newSetting).subscribe({
        next: (response) => {
          console.log('Setting added successfully');
          this.showAddModal = false;
          this.newSettingForm.reset();
          this.loadSettings();
        },
        error: (error) => {
          console.error('Error adding setting:', error);
        }
      });
    }
  }

  deleteSetting(settingId: string): void {
    if (confirm('هل أنت متأكد من حذف هذا الإعداد؟')) {
      this.apiService.delete(`/settings/${settingId}`).subscribe({
        next: (response) => {
          console.log('Setting deleted successfully');
          this.loadSettings();
        },
        error: (error) => {
          console.error('Error deleting setting:', error);
        }
      });
    }
  }

  exportSettings(): void {
    this.apiService.get('/settings/export').subscribe({
      next: (response) => {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'settings-backup.json';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting settings:', error);
      }
    });
  }

  importSettings(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target?.result as string);
          this.apiService.post('/settings/import', { settings }).subscribe({
            next: (response) => {
              console.log('Settings imported successfully');
              this.loadSettings();
            },
            error: (error) => {
              console.error('Error importing settings:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing settings file:', error);
        }
      };
      reader.readAsText(file);
    }
  }

  getSettingTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      text: '📝',
      number: '🔢',
      boolean: '✅',
      select: '📋',
      textarea: '📄'
    };
    return icons[type] || '📝';
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'عام': 'bg-blue-100 text-blue-800',
      'مالي': 'bg-green-100 text-green-800',
      'عقاري': 'bg-purple-100 text-purple-800',
      'نظام': 'bg-gray-100 text-gray-800',
      'أمان': 'bg-red-100 text-red-800',
      'إشعارات': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  }
}