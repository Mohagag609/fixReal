import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vouchers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">إدارة السندات</h1>
          <p class="text-gray-600">سندات القبض والدفع</p>
        </div>
        <button class="btn btn-primary">+ سند جديد</button>
      </div>
      
      <div class="card">
        <p class="text-gray-600">صفحة السندات قيد التطوير...</p>
      </div>
    </div>
  `,
  styles: []
})
export class VouchersComponent implements OnInit {
  ngOnInit() {}
}