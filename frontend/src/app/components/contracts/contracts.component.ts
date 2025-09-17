import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-contracts',
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">إدارة العقود</h1>
          <p class="mt-2 text-gray-600">إدارة عقود البيع والإيجار</p>
        </div>
        <button class="btn btn-primary">إضافة عقد جديد</button>
      </div>

      <div class="card">
        <div class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">صفحة العقود</h3>
          <p class="text-gray-600">سيتم تطوير هذه الصفحة قريباً</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ContractsComponent implements OnInit {
  ngOnInit(): void {}
}