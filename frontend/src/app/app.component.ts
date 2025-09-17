import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="min-h-screen bg-background">
      <router-outlet></router-outlet>
      <app-loading-spinner></app-loading-spinner>
      <app-notification></app-notification>
    </div>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'نظام إدارة العقارات';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Initialize authentication state
    this.authService.initializeAuth();
  }
}