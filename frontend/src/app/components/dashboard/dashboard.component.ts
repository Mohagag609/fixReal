import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="card" *ngFor="let stat of stats">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 rounded-full flex items-center justify-center" [class]="stat.bgColor">
                <i [class]="stat.icon" class="text-white"></i>
              </div>
            </div>
            <div class="mr-4">
              <p class="text-sm font-medium text-gray-500">{{ stat.label }}</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stat.value }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="text-lg font-medium text-gray-900 mb-4">المعاملات الشهرية</h3>
          <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p class="text-gray-500">رسم بياني للمعاملات</p>
          </div>
        </div>
        
        <div class="card">
          <h3 class="text-lg font-medium text-gray-900 mb-4">الأرباح والخسائر</h3>
          <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p class="text-gray-500">رسم بياني للأرباح</p>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">المعاملات الأخيرة</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header">التاريخ</th>
                <th class="table-header">الوصف</th>
                <th class="table-header">المبلغ</th>
                <th class="table-header">النوع</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let transaction of recentTransactions">
                <td class="table-cell">{{ transaction.date | date:'short' }}</td>
                <td class="table-cell">{{ transaction.description }}</td>
                <td class="table-cell">{{ transaction.amount | currency:'SAR' }}</td>
                <td class="table-cell">
                  <span class="px-2 py-1 text-xs font-medium rounded-full" 
                        [class]="transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ transaction.type === 'income' ? 'دخل' : 'مصروف' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit {
  stats = [
    { label: 'إجمالي العملاء', value: '0', icon: 'fas fa-users', bgColor: 'bg-blue-500' },
    { label: 'إجمالي الوحدات', value: '0', icon: 'fas fa-building', bgColor: 'bg-green-500' },
    { label: 'إجمالي العقود', value: '0', icon: 'fas fa-file-contract', bgColor: 'bg-yellow-500' },
    { label: 'إجمالي المعاملات', value: '0', icon: 'fas fa-exchange-alt', bgColor: 'bg-purple-500' }
  ];

  recentTransactions: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.apiService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats[0].value = data.customers.toString();
        this.stats[1].value = data.units.toString();
        this.stats[2].value = data.contracts.toString();
        this.stats[3].value = data.transactions.toString();
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
      }
    });

    this.apiService.getTransactions(1, 5).subscribe({
      next: (data) => {
        this.recentTransactions = data.data || [];
      },
      error: (error) => {
        console.error('Error loading recent transactions:', error);
      }
    });
  }
}