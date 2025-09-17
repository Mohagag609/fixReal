import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">التقارير</h1>
          <p class="text-gray-600">التقارير والإحصائيات</p>
        </div>
        <button class="btn btn-primary">تصدير تقرير</button>
      </div>
      
      <div class="card">
        <p class="text-gray-600">صفحة التقارير قيد التطوير...</p>
      </div>
    </div>
  `,
  styles: []
})
export class ReportsComponent implements OnInit {
  ngOnInit() {}
}