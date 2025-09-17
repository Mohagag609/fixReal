import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface SearchField {
  field: string;
  operator: string;
  value: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
}

interface SearchGroup {
  operator: 'AND' | 'OR';
  fields: SearchField[];
}

interface SearchResult {
  entity: string;
  id: string;
  title: string;
  description: string;
  score: number;
  data: any;
}

@Component({
  selector: 'app-advanced-search',
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.css']
})
export class AdvancedSearchComponent implements OnInit {
  searchForm: FormGroup;
  searchResults: SearchResult[] = [];
  isSearching = false;
  hasSearched = false;
  totalResults = 0;
  currentPage = 1;
  pageSize = 20;

  entities = [
    { value: 'customers', label: 'العملاء', icon: '👥', fields: [
      { name: 'name', label: 'الاسم', type: 'text' },
      { name: 'phone', label: 'الهاتف', type: 'text' },
      { name: 'nationalId', label: 'الرقم القومي', type: 'text' },
      { name: 'address', label: 'العنوان', type: 'text' },
      { name: 'status', label: 'الحالة', type: 'select', options: ['نشط', 'غير نشط'] },
      { name: 'createdAt', label: 'تاريخ الإنشاء', type: 'date' }
    ]},
    { value: 'units', label: 'الوحدات', icon: '🏢', fields: [
      { name: 'code', label: 'الكود', type: 'text' },
      { name: 'name', label: 'الاسم', type: 'text' },
      { name: 'unitType', label: 'نوع الوحدة', type: 'select', options: ['سكني', 'تجاري', 'إداري'] },
      { name: 'area', label: 'المساحة', type: 'text' },
      { name: 'floor', label: 'الطابق', type: 'text' },
      { name: 'building', label: 'المبنى', type: 'text' },
      { name: 'totalPrice', label: 'السعر الإجمالي', type: 'number' },
      { name: 'status', label: 'الحالة', type: 'select', options: ['متاحة', 'محجوزة', 'مباعة'] }
    ]},
    { value: 'contracts', label: 'العقود', icon: '📋', fields: [
      { name: 'start', label: 'تاريخ البداية', type: 'date' },
      { name: 'totalPrice', label: 'السعر الإجمالي', type: 'number' },
      { name: 'discountAmount', label: 'مبلغ الخصم', type: 'number' },
      { name: 'brokerName', label: 'اسم الوكيل', type: 'text' },
      { name: 'brokerPercent', label: 'نسبة الوكيل', type: 'number' },
      { name: 'installmentType', label: 'نوع التقسيط', type: 'select', options: ['شهري', 'ربع سنوي', 'نصف سنوي', 'سنوي'] },
      { name: 'installmentCount', label: 'عدد الأقساط', type: 'number' },
      { name: 'paymentType', label: 'نوع الدفع', type: 'select', options: ['installment', 'cash', 'mixed'] }
    ]},
    { value: 'partners', label: 'الشركاء', icon: '🤝', fields: [
      { name: 'name', label: 'الاسم', type: 'text' },
      { name: 'phone', label: 'الهاتف', type: 'text' },
      { name: 'notes', label: 'ملاحظات', type: 'text' },
      { name: 'createdAt', label: 'تاريخ الإنشاء', type: 'date' }
    ]},
    { value: 'brokers', label: 'الوسطاء', icon: '🏦', fields: [
      { name: 'name', label: 'الاسم', type: 'text' },
      { name: 'phone', label: 'الهاتف', type: 'text' },
      { name: 'notes', label: 'ملاحظات', type: 'text' },
      { name: 'createdAt', label: 'تاريخ الإنشاء', type: 'date' }
    ]},
    { value: 'safes', label: 'الخزائن', icon: '🔒', fields: [
      { name: 'name', label: 'الاسم', type: 'text' },
      { name: 'balance', label: 'الرصيد', type: 'number' },
      { name: 'createdAt', label: 'تاريخ الإنشاء', type: 'date' }
    ]}
  ];

  operators = [
    { value: 'equals', label: 'يساوي', icon: '=' },
    { value: 'not_equals', label: 'لا يساوي', icon: '≠' },
    { value: 'contains', label: 'يحتوي على', icon: '⊃' },
    { value: 'not_contains', label: 'لا يحتوي على', icon: '⊅' },
    { value: 'starts_with', label: 'يبدأ بـ', icon: '^' },
    { value: 'ends_with', label: 'ينتهي بـ', icon: '$' },
    { value: 'greater_than', label: 'أكبر من', icon: '>' },
    { value: 'less_than', label: 'أصغر من', icon: '<' },
    { value: 'greater_equal', label: 'أكبر من أو يساوي', icon: '≥' },
    { value: 'less_equal', label: 'أصغر من أو يساوي', icon: '≤' },
    { value: 'between', label: 'بين', icon: '↔' },
    { value: 'in', label: 'في', icon: '∈' },
    { value: 'not_in', label: 'ليس في', icon: '∉' },
    { value: 'is_null', label: 'فارغ', icon: '∅' },
    { value: 'is_not_null', label: 'ليس فارغ', icon: '∅' }
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.searchForm = this.fb.group({
      query: [''],
      entities: [[]],
      groups: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.addSearchGroup();
  }

  get groups(): FormArray {
    return this.searchForm.get('groups') as FormArray;
  }

  addSearchGroup(): void {
    const group = this.fb.group({
      operator: ['AND'],
      fields: this.fb.array([])
    });
    this.groups.push(group);
    this.addSearchField(this.groups.length - 1);
  }

  removeSearchGroup(index: number): void {
    if (this.groups.length > 1) {
      this.groups.removeAt(index);
    }
  }

  getFields(groupIndex: number): FormArray {
    return this.groups.at(groupIndex).get('fields') as FormArray;
  }

  addSearchField(groupIndex: number): void {
    const field = this.fb.group({
      entity: [''],
      field: [''],
      operator: ['equals'],
      value: [''],
      type: ['text']
    });
    this.getFields(groupIndex).push(field);
  }

  removeSearchField(groupIndex: number, fieldIndex: number): void {
    const fields = this.getFields(groupIndex);
    if (fields.length > 1) {
      fields.removeAt(fieldIndex);
    }
  }

  onEntityChange(groupIndex: number, fieldIndex: number): void {
    const field = this.getFields(groupIndex).at(fieldIndex);
    const entityValue = field.get('entity')?.value;
    const entity = this.entities.find(e => e.value === entityValue);
    
    if (entity) {
      field.patchValue({
        field: '',
        type: 'text'
      });
    }
  }

  onFieldChange(groupIndex: number, fieldIndex: number): void {
    const field = this.getFields(groupIndex).at(fieldIndex);
    const entityValue = field.get('entity')?.value;
    const fieldName = field.get('field')?.value;
    
    const entity = this.entities.find(e => e.value === entityValue);
    if (entity) {
      const fieldDef = entity.fields.find(f => f.name === fieldName);
      if (fieldDef) {
        field.patchValue({
          type: fieldDef.type
        });
      }
    }
  }

  getFieldOptions(groupIndex: number, fieldIndex: number): any[] {
    const field = this.getFields(groupIndex).at(fieldIndex);
    const entityValue = field.get('entity')?.value;
    const fieldName = field.get('field')?.value;
    
    const entity = this.entities.find(e => e.value === entityValue);
    if (entity) {
      const fieldDef = entity.fields.find(f => f.name === fieldName);
      return fieldDef?.options || [];
    }
    return [];
  }

  getOperatorsForType(type: string): any[] {
    switch (type) {
      case 'text':
        return this.operators.filter(op => 
          ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_null', 'is_not_null'].includes(op.value)
        );
      case 'number':
        return this.operators.filter(op => 
          ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'between', 'is_null', 'is_not_null'].includes(op.value)
        );
      case 'date':
        return this.operators.filter(op => 
          ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'between', 'is_null', 'is_not_null'].includes(op.value)
        );
      case 'select':
        return this.operators.filter(op => 
          ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null'].includes(op.value)
        );
      case 'boolean':
        return this.operators.filter(op => 
          ['equals', 'not_equals'].includes(op.value)
        );
      default:
        return this.operators;
    }
  }

  search(): void {
    if (this.searchForm.valid) {
      this.isSearching = true;
      this.hasSearched = true;
      
      const searchData = this.searchForm.value;
      
      this.apiService.post('/search/advanced', searchData).subscribe({
        next: (response) => {
          this.searchResults = response.data.results || [];
          this.totalResults = response.data.total || 0;
          this.isSearching = false;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.isSearching = false;
        }
      });
    }
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.searchResults = [];
    this.hasSearched = false;
    this.totalResults = 0;
    this.currentPage = 1;
    
    // Reset to one group with one field
    this.groups.clear();
    this.addSearchGroup();
  }

  exportResults(): void {
    if (this.searchResults.length > 0) {
      const data = this.searchResults.map(result => ({
        entity: result.entity,
        title: result.title,
        description: result.description,
        score: result.score,
        ...result.data
      }));
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-results-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }

  getEntityIcon(entity: string): string {
    const entityObj = this.entities.find(e => e.value === entity);
    return entityObj ? entityObj.icon : '📄';
  }

  getEntityLabel(entity: string): string {
    const entityObj = this.entities.find(e => e.value === entity);
    return entityObj ? entityObj.label : entity;
  }

  getOperatorIcon(operator: string): string {
    const op = this.operators.find(o => o.value === operator);
    return op ? op.icon : '?';
  }

  getOperatorLabel(operator: string): string {
    const op = this.operators.find(o => o.value === operator);
    return op ? op.label : operator;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG');
  }

  formatNumber(number: number): string {
    return new Intl.NumberFormat('ar-EG').format(number);
  }

  getScoreColor(score: number): string {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 0.4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  }
}