import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Logo and Title -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-primary-950 rounded-full flex items-center justify-center">
            <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h2 class="mt-6 text-3xl font-bold text-gray-900">
            نظام إدارة العقارات
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            سجل دخولك للوصول إلى النظام
          </p>
        </div>

        <!-- Login Form -->
        <form class="mt-8 space-y-6" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <!-- Username -->
            <div>
              <label for="username" class="form-label">
                اسم المستخدم
              </label>
              <input
                id="username"
                type="text"
                formControlName="username"
                class="form-input"
                placeholder="أدخل اسم المستخدم"
                [class.border-red-500]="loginForm.get('username')?.invalid && loginForm.get('username')?.touched">
              <div *ngIf="loginForm.get('username')?.invalid && loginForm.get('username')?.touched" class="form-error">
                <span *ngIf="loginForm.get('username')?.errors?.['required']">
                  اسم المستخدم مطلوب
                </span>
                <span *ngIf="loginForm.get('username')?.errors?.['minlength']">
                  اسم المستخدم يجب أن يكون 3 أحرف على الأقل
                </span>
              </div>
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="form-label">
                كلمة المرور
              </label>
              <div class="relative">
                <input
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  class="form-input pr-10"
                  placeholder="أدخل كلمة المرور"
                  [class.border-red-500]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                <button
                  type="button"
                  (click)="togglePasswordVisibility()"
                  class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg *ngIf="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  <svg *ngIf="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                  </svg>
                </button>
              </div>
              <div *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched" class="form-error">
                <span *ngIf="loginForm.get('password')?.errors?.['required']">
                  كلمة المرور مطلوبة
                </span>
                <span *ngIf="loginForm.get('password')?.errors?.['minlength']">
                  كلمة المرور يجب أن تكون 6 أحرف على الأقل
                </span>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
              <svg class="w-5 h-5 text-red-400 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-sm text-red-600">{{ errorMessage }}</p>
            </div>
          </div>

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              [disabled]="loginForm.invalid || isLoading"
              class="w-full btn btn-primary flex justify-center items-center"
              [class.opacity-50]="loginForm.invalid || isLoading">
              <svg *ngIf="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول' }}
            </button>
          </div>

          <!-- Demo Credentials -->
          <div class="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 class="text-sm font-medium text-gray-900 mb-2">بيانات تجريبية:</h3>
            <div class="text-xs text-gray-600 space-y-1">
              <p><strong>المدير:</strong> admin / admin123</p>
              <p><strong>المستخدم:</strong> user / user123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  returnUrl = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const credentials = this.loginForm.value;
      
      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.router.navigate([this.returnUrl]);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'حدث خطأ أثناء تسجيل الدخول';
        }
      });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}