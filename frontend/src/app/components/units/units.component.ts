import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-units',
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">إدارة الوحدات</h1>
          <p class="mt-2 text-gray-600">إدارة الوحدات العقارية والمعلومات</p>
        </div>
        <button class="btn btn-primary">إضافة وحدة جديدة</button>
      </div>

      <div class="card">
        <div class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">صفحة الوحدات</h3>
          <p class="text-gray-600">سيتم تطوير هذه الصفحة قريباً</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UnitsComponent implements OnInit {
  ngOnInit(): void {}
}