import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="min-h-screen bg-gray-50" *ngIf="!isLoggedIn">
      <app-login></app-login>
    </div>
    
    <div class="min-h-screen bg-gray-50 flex" *ngIf="isLoggedIn">
      <app-sidebar></app-sidebar>
      <div class="flex-1 flex flex-col">
        <app-header></app-header>
        <main class="flex-1 p-6">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class AppComponent {
  isLoggedIn = false;

  constructor(private authService: AuthService) {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isLoggedIn = isAuth;
    });
  }
}