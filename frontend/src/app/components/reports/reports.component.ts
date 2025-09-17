import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-reports',
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">التقارير</h1>
          <p class="mt-2 text-gray-600">تقارير مالية وإحصائية مفصلة</p>
        </div>
        <button class="btn btn-primary">تصدير تقرير</button>
      </div>

      <div class="card">
        <div class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">صفحة التقارير</h3>
          <p class="text-gray-600">سيتم تطوير هذه الصفحة قريباً</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ReportsComponent implements OnInit {
  ngOnInit(): void {}
}