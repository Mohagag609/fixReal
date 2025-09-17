import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-700 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span class="text-3xl">🔐</span>
          </div>
          <h2 class="mt-6 text-3xl font-extrabold text-white">
            نسيت كلمة المرور؟
          </h2>
          <p class="mt-2 text-sm text-purple-100">
            لا تقلق، سنرسل لك رابط إعادة تعيين كلمة المرور
          </p>
        </div>

        <!-- Forgot Password Form -->
        <div class="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <form (ngSubmit)="onSubmit()" #forgotForm="ngForm" class="space-y-6">
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
                  [(ngModel)]="forgotData.email"
                  required
                  email
                  class="appearance-none relative block w-full pr-10 pl-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="أدخل بريدك الإلكتروني">
              </div>
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
                [disabled]="forgotForm.invalid || isLoading"
                class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105">
                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                  <i *ngIf="!isLoading" class="fas fa-paper-plane text-purple-500 group-hover:text-purple-400"></i>
                  <i *ngIf="isLoading" class="fas fa-spinner fa-spin text-purple-500"></i>
                </span>
                {{ isLoading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين' }}
              </button>
            </div>

            <!-- Back to Login -->
            <div class="text-center">
              <p class="text-sm text-gray-600">
                تذكرت كلمة المرور؟
                <a href="/login" class="font-medium text-purple-600 hover:text-purple-500 transition-colors">
                  العودة لتسجيل الدخول
                </a>
              </p>
            </div>
          </form>
        </div>

        <!-- Instructions -->
        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
          <h3 class="text-lg font-medium text-white mb-2">تعليمات إعادة تعيين كلمة المرور</h3>
          <ul class="text-sm text-purple-100 space-y-1">
            <li>• ستحصل على رابط إعادة التعيين في بريدك الإلكتروني</li>
            <li>• انقر على الرابط لفتح صفحة إعادة تعيين كلمة المرور</li>
            <li>• أدخل كلمة مرور جديدة وقوية</li>
            <li>• تأكد من حفظ كلمة المرور الجديدة في مكان آمن</li>
          </ul>
        </div>

        <!-- Footer -->
        <div class="text-center">
          <p class="text-xs text-purple-100">
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
export class ForgotPasswordComponent implements OnInit {
  forgotData = {
    email: ''
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

  onSubmit() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Simulate API call (replace with actual forgot password service)
    setTimeout(() => {
      // Mock forgot password logic
      if (this.forgotData.email) {
        this.successMessage = 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد الخاص بك.';
        
        // Clear form
        this.forgotData.email = '';
      } else {
        this.errorMessage = 'يرجى إدخال بريد إلكتروني صحيح';
      }
      
      this.isLoading = false;
    }, 2000);
  }
}