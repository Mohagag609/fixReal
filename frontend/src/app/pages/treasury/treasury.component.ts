import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-treasury',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">إدارة الخزينة</h1>
          <p class="text-gray-600">إدارة الخزائن والمعاملات</p>
        </div>
        <button class="btn btn-primary">+ معاملة جديدة</button>
      </div>
      
      <div class="card">
        <p class="text-gray-600">صفحة الخزينة قيد التطوير...</p>
      </div>
    </div>
  `,
  styles: []
})
export class TreasuryComponent implements OnInit {
  ngOnInit() {}
}