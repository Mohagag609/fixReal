import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span class="text-3xl">🏢</span>
          </div>
          <h2 class="mt-6 text-3xl font-extrabold text-white">
            تسجيل الدخول
          </h2>
          <p class="mt-2 text-sm text-blue-100">
            نظام إدارة العقارات المتطور
          </p>
        </div>

        <!-- Login Form -->
        <div class="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="space-y-6">
            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <i class="fas fa-envelope text-gray-400"></i>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  [(ngModel)]="loginData.email"
                  required
                  email
                  class="appearance-none relative block w-full pr-10 pl-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="أدخل بريدك الإلكتروني">
              </div>
            </div>

            <!-- Password Field -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <i class="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  [(ngModel)]="loginData.password"
                  required
                  class="appearance-none relative block w-full pr-10 pl-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="أدخل كلمة المرور">
              </div>
            </div>

            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  [(ngModel)]="loginData.remember"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="remember-me" class="mr-2 block text-sm text-gray-900">
                  تذكرني
                </label>
              </div>
              <div class="text-sm">
                <a href="/forgot-password" class="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  نسيت كلمة المرور؟
                </a>
              </div>
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              <i class="fas fa-exclamation-circle mr-2"></i>
              {{ errorMessage }}
            </div>

            <!-- Submit Button -->
            <div>
              <button
                type="submit"
                [disabled]="loginForm.invalid || isLoading"
                class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105">
                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                  <i *ngIf="!isLoading" class="fas fa-sign-in-alt text-blue-500 group-hover:text-blue-400"></i>
                  <i *ngIf="isLoading" class="fas fa-spinner fa-spin text-blue-500"></i>
                </span>
                {{ isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول' }}
              </button>
            </div>

            <!-- Register Link -->
            <div class="text-center">
              <p class="text-sm text-gray-600">
                ليس لديك حساب؟
                <a href="/register" class="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  إنشاء حساب جديد
                </a>
              </p>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="text-center">
          <p class="text-xs text-blue-100">
            © 2024 نظام إدارة العقارات. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.6s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LoginComponent implements OnInit {
  loginData = {
    email: '',
    password: '',
    remember: false
  };
  isLoading = false;
  errorMessage = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.router.navigate(['/']);
    }
  }

  onSubmit() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    // Simulate API call (replace with actual authentication service)
    setTimeout(() => {
      // Mock authentication logic
      if (this.loginData.email === 'admin@example.com' && this.loginData.password === 'password') {
        // Store auth token
        localStorage.setItem('auth_token', 'mock_token_123');
        localStorage.setItem('user_data', JSON.stringify({
          id: '1',
          name: 'مدير النظام',
          email: this.loginData.email,
          role: 'admin'
        }));

        // Redirect to dashboard
        this.router.navigate(['/']);
      } else {
        this.errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      }
      
      this.isLoading = false;
    }, 1500);
  }
}