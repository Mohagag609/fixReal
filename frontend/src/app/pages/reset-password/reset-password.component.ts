import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span class="text-3xl">🔑</span>
          </div>
          <h2 class="mt-6 text-3xl font-extrabold text-white">
            إعادة تعيين كلمة المرور
          </h2>
          <p class="mt-2 text-sm text-indigo-100">
            أدخل كلمة المرور الجديدة
          </p>
        </div>

        <!-- Reset Password Form -->
        <div class="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <form (ngSubmit)="onSubmit()" #resetForm="ngForm" class="space-y-6">
            <!-- New Password Field -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور الجديدة
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <i class="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  [(ngModel)]="resetData.password"
                  required
                  minlength="6"
                  class="appearance-none relative block w-full pr-10 pl-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="أدخل كلمة المرور الجديدة">
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
                  [(ngModel)]="resetData.confirmPassword"
                  required
                  class="appearance-none relative block w-full pr-10 pl-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="أعد إدخال كلمة المرور الجديدة">
              </div>
            </div>

            <!-- Password Strength Indicator -->
            <div *ngIf="resetData.password" class="space-y-2">
              <div class="text-sm text-gray-600">قوة كلمة المرور:</div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-300" 
                     [ngClass]="getPasswordStrengthClass()"
                     [style.width.%]="getPasswordStrength()"></div>
              </div>
              <div class="text-xs text-gray-500">
                <div *ngIf="resetData.password.length < 6" class="text-red-500">
                  كلمة المرور يجب أن تكون 6 أحرف على الأقل
                </div>
                <div *ngIf="resetData.password.length >= 6 && !hasUpperCase()" class="text-yellow-500">
                  أضف حرف كبير واحد على الأقل
                </div>
                <div *ngIf="resetData.password.length >= 6 && hasUpperCase() && !hasNumber()" class="text-yellow-500">
                  أضف رقم واحد على الأقل
                </div>
                <div *ngIf="resetData.password.length >= 6 && hasUpperCase() && hasNumber()" class="text-green-500">
                  كلمة مرور قوية
                </div>
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
                [disabled]="resetForm.invalid || isLoading || !passwordsMatch()"
                class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105">
                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                  <i *ngIf="!isLoading" class="fas fa-key text-indigo-500 group-hover:text-indigo-400"></i>
                  <i *ngIf="isLoading" class="fas fa-spinner fa-spin text-indigo-500"></i>
                </span>
                {{ isLoading ? 'جاري إعادة التعيين...' : 'إعادة تعيين كلمة المرور' }}
              </button>
            </div>

            <!-- Back to Login -->
            <div class="text-center">
              <p class="text-sm text-gray-600">
                تذكرت كلمة المرور؟
                <a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                  العودة لتسجيل الدخول
                </a>
              </p>
            </div>
          </form>
        </div>

        <!-- Security Tips -->
        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
          <h3 class="text-lg font-medium text-white mb-2">نصائح أمان كلمة المرور</h3>
          <ul class="text-sm text-indigo-100 space-y-1">
            <li>• استخدم مزيج من الأحرف الكبيرة والصغيرة</li>
            <li>• أضف أرقام ورموز خاصة</li>
            <li>• تجنب استخدام المعلومات الشخصية</li>
            <li>• لا تستخدم نفس كلمة المرور في مواقع أخرى</li>
          </ul>
        </div>

        <!-- Footer -->
        <div class="text-center">
          <p class="text-xs text-indigo-100">
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
export class ResetPasswordComponent implements OnInit {
  resetData = {
    password: '',
    confirmPassword: ''
  };
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  token = '';

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get token from URL parameters
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.errorMessage = 'رابط إعادة التعيين غير صحيح';
      }
    });

    // Check if user is already logged in
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
      this.router.navigate(['/']);
    }
  }

  passwordsMatch(): boolean {
    return this.resetData.password === this.resetData.confirmPassword;
  }

  hasUpperCase(): boolean {
    return /[A-Z]/.test(this.resetData.password);
  }

  hasNumber(): boolean {
    return /\d/.test(this.resetData.password);
  }

  getPasswordStrength(): number {
    let strength = 0;
    if (this.resetData.password.length >= 6) strength += 25;
    if (this.resetData.password.length >= 8) strength += 25;
    if (this.hasUpperCase()) strength += 25;
    if (this.hasNumber()) strength += 25;
    return strength;
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    if (strength < 50) return 'bg-red-500';
    if (strength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  onSubmit() {
    if (this.isLoading) return;

    if (!this.passwordsMatch()) {
      this.errorMessage = 'كلمات المرور غير متطابقة';
      return;
    }

    if (this.resetData.password.length < 6) {
      this.errorMessage = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Simulate API call (replace with actual reset password service)
    setTimeout(() => {
      // Mock reset password logic
      if (this.token && this.resetData.password) {
        this.successMessage = 'تم إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.';
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      } else {
        this.errorMessage = 'حدث خطأ أثناء إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.';
      }
      
      this.isLoading = false;
    }, 2000);
  }
}