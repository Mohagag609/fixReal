import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <!-- Sidebar -->
      <app-sidebar 
        [isOpen]="sidebarOpen" 
        (toggle)="onSidebarToggle()">
      </app-sidebar>
      
      <!-- Main Content -->
      <div class="transition-all duration-300" [class.lg:mr-72]="sidebarOpen">
        <!-- Header -->
        <app-header 
          [title]="'لوحة التحكم'"
          [subtitle]="'نظام إدارة العقارات المتطور'"
          [icon]="'🏢'"
          (menuToggle)="onSidebarToggle()">
        </app-header>
        
        <!-- Page Content -->
        <div class="max-w-7xl mx-auto px-6 py-8">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AppComponent {
  title = 'estate-management';
  sidebarOpen = true;

  onSidebarToggle() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}