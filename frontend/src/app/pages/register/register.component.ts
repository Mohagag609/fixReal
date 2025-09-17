import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-teal-900 via-blue-800 to-purple-700 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span class="text-3xl">🏢</span>
          </div>
          <h2 class="mt-6 text-3xl font-extrabold text-white">
            إنشاء حساب جديد
          </h2>
          <p class="mt-2 text-sm text-teal-100">
            انضم إلى نظام إدارة العقارات المتطور
          </p>
        </div>

        <!-- Register Form -->
        <div class="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <form (ngSubmit)="onSubmit()" #registerForm="ngForm" class="space-y-6">
            <!-- Name Field -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                الاسم الكامل
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <i class="fas fa-user text-gray-400"></i>
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  [(ngModel)]="registerData.name"
                  required
                  minlength="2"
                  class="appearance-none relative block w-full pr-10 pl-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                  placeholder="أدخل اسمك الكامل">
              </div>
            </div>

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
                  [(ngModel)]="registerData.email"
                  required
                  email
                  class="appearance-none relative block w-full pr-10 pl-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                  placeholder="أدخل بريدك الإلكتروني">
              </div>
            </div>

            <!-- Phone Field -->
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <i class="fas fa-phone text-gray-400"></i>
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  [(ngModel)]="registerData.phone"
                  required
                  class="appearance-none relative block w-full pr-10 pl-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                  placeholder="أدخل رقم هاتفك">
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
                  [(ngModel)]="registerData.password"
                  required
                  minlength="6"
                  class="appearance-none relative block w-full pr-10 pl-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                  placeholder="أدخل كلمة المرور">
              </div>
            </div>

            <!-- Confirm Password Field -->
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
                تأكيد كلمة المرور
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <i class="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  [(ngModel)]="registerData.confirmPassword"
                  required
                  class="appearance-none relative block w-full pr-10 pl-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                  placeholder="أعد إدخال كلمة المرور">
              </div>
            </div>

            <!-- Terms and Conditions -->
            <div class="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                [(ngModel)]="registerData.acceptTerms"
                required
                class="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded">
              <label for="terms" class="mr-2 block text-sm text-gray-900">
                أوافق على 
                <a href="#" class="text-teal-600 hover:text-teal-500">الشروط والأحكام</a>
                و
                <a href="#" class="text-teal-600 hover:text-teal-500">سياسة الخصوصية</a>
              </label>
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              <i class="fas fa-exclamation-circle mr-2"></i>
              {{ errorMessage }}
            </div>

            <!-- Success Message -->
            <div *ngIf="successMessage" class="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
              <i class="fas fa-check-circle mr-2"></i>
              {{ successMessage }}
            </div>

            <!-- Submit Button -->
            <div>
              <button
                type="submit"
                [disabled]="registerForm.invalid || isLoading || !passwordsMatch()"
                class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105">
                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                  <i *ngIf="!isLoading" class="fas fa-user-plus text-teal-500 group-hover:text-teal-400"></i>
                  <i *ngIf="isLoading" class="fas fa-spinner fa-spin text-teal-500"></i>
                </span>
                {{ isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب' }}
              </button>
            </div>

            <!-- Login Link -->
            <div class="text-center">
              <p class="text-sm text-gray-600">
                لديك حساب بالفعل؟
                <a href="/login" class="font-medium text-teal-600 hover:text-teal-500 transition-colors">
                  تسجيل الدخول
                </a>
              </p>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="text-center">
          <p class="text-xs text-teal-100">
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
export class RegisterComponent implements OnInit {
  registerData = {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  };
  isLoading = false;
  errorMessage = '';
  successMessage = '';

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

  passwordsMatch(): boolean {
    return this.registerData.password === this.registerData.confirmPassword;
  }

  onSubmit() {
    if (this.isLoading) return;

    if (!this.passwordsMatch()) {
      this.errorMessage = 'كلمات المرور غير متطابقة';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Simulate API call (replace with actual registration service)
    setTimeout(() => {
      // Mock registration logic
      if (this.registerData.email && this.registerData.password) {
        this.successMessage = 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.';
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      } else {
        this.errorMessage = 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.';
      }
      
      this.isLoading = false;
    }, 2000);
  }
}