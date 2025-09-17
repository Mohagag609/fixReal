import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-installments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">إدارة الأقساط</h1>
          <p class="text-gray-600">إدارة الأقساط والتحصيل</p>
        </div>
        <button class="btn btn-primary">+ قسط جديد</button>
      </div>
      
      <div class="card">
        <p class="text-gray-600">صفحة الأقساط قيد التطوير...</p>
      </div>
    </div>
  `,
  styles: []
})
export class InstallmentsComponent implements OnInit {
  ngOnInit() {}
}