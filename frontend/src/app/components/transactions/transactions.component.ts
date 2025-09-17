import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-transactions',
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">إدارة المعاملات</h1>
          <p class="mt-2 text-gray-600">إدارة المعاملات المالية والإيصالات</p>
        </div>
        <button class="btn btn-primary">إضافة معاملة جديدة</button>
      </div>

      <div class="card">
        <div class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">صفحة المعاملات</h3>
          <p class="text-gray-600">سيتم تطوير هذه الصفحة قريباً</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TransactionsComponent implements OnInit {
  ngOnInit(): void {}
}