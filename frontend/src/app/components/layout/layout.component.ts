import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models';

@Component({
  selector: 'app-layout',
  template: `
    <div class="min-h-screen bg-background">
      <!-- Sidebar -->
      <app-sidebar 
        [isOpen]="sidebarOpen" 
        (toggle)="toggleSidebar()"
        (navigate)="navigateTo($event)">
      </app-sidebar>

      <!-- Main Content -->
      <div class="main-content" [class.sidebar-open]="sidebarOpen" [class.sidebar-closed]="!sidebarOpen">
        <!-- Header -->
        <app-header 
          [user]="currentUser"
          (toggleSidebar)="toggleSidebar()"
          (logout)="logout()">
        </app-header>

        <!-- Page Content -->
        <main class="p-6">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class LayoutComponent implements OnInit {
  sidebarOpen = true;
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}