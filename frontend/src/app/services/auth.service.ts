import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User, LoginRequest, LoginResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  /**
   * Initialize authentication state from localStorage
   */
  initializeAuth(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const userObj = JSON.parse(user);
        this.currentUserSubject.next(userObj);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('/auth/login', credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuth(response.data.user, response.data.token);
          }
        }),
        catchError(error => {
          this.clearAuth();
          throw error;
        })
      );
  }

  /**
   * Register new user
   */
  register(userData: any): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('/auth/register', userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuth(response.data.user, response.data.token);
          }
        }),
        catchError(error => {
          this.clearAuth();
          throw error;
        })
      );
  }

  /**
   * Logout user
   */
  logout(): void {
    this.clearAuth();
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  /**
   * Get user profile
   */
  getProfile(): Observable<ApiResponse<User>> {
    return this.apiService.get<ApiResponse<User>>('/auth/profile');
  }

  /**
   * Update user profile
   */
  updateProfile(userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.apiService.put<ApiResponse<User>>('/auth/profile', userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          }
        })
      );
  }

  /**
   * Change password
   */
  changePassword(passwordData: { currentPassword: string; newPassword: string }): Observable<ApiResponse> {
    return this.apiService.put<ApiResponse>('/auth/change-password', passwordData);
  }

  /**
   * Get all users (admin only)
   */
  getAllUsers(): Observable<ApiResponse<User[]>> {
    return this.apiService.get<ApiResponse<User[]>>('/auth/users');
  }

  /**
   * Update user (admin only)
   */
  updateUser(id: string, userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.apiService.put<ApiResponse<User>>(`/auth/users/${id}`, userData);
  }

  /**
   * Delete user (admin only)
   */
  deleteUser(id: string): Observable<ApiResponse> {
    return this.apiService.delete<ApiResponse>(`/auth/users/${id}`);
  }

  /**
   * Set authentication data
   */
  private setAuth(user: User, token: string): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Clear authentication data
   */
  private clearAuth(): void {
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}