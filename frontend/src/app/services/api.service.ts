import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Customer, CustomerResponse, CustomerFormData, CustomerFilters } from '../models/customer.model';
import { Unit, UnitResponse, UnitFormData, UnitFilters } from '../models/unit.model';
import { DashboardResponse } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboardData(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.baseUrl}/dashboard`);
  }

  // Customers
  getCustomers(filters?: CustomerFilters): Observable<CustomerResponse> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof CustomerFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<CustomerResponse>(`${this.baseUrl}/customers`, { params });
  }

  getCustomer(id: number): Observable<{ success: boolean; data: Customer }> {
    return this.http.get<{ success: boolean; data: Customer }>(`${this.baseUrl}/customers/${id}`);
  }

  createCustomer(customer: CustomerFormData): Observable<{ success: boolean; data: Customer }> {
    return this.http.post<{ success: boolean; data: Customer }>(`${this.baseUrl}/customers`, customer);
  }

  updateCustomer(id: number, customer: CustomerFormData): Observable<{ success: boolean; data: Customer }> {
    return this.http.put<{ success: boolean; data: Customer }>(`${this.baseUrl}/customers/${id}`, customer);
  }

  deleteCustomer(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/customers/${id}`);
  }

  // Units
  getUnits(filters?: UnitFilters): Observable<UnitResponse> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof UnitFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<UnitResponse>(`${this.baseUrl}/units`, { params });
  }

  getUnit(id: number): Observable<{ success: boolean; data: Unit }> {
    return this.http.get<{ success: boolean; data: Unit }>(`${this.baseUrl}/units/${id}`);
  }

  createUnit(unit: UnitFormData): Observable<{ success: boolean; data: Unit }> {
    return this.http.post<{ success: boolean; data: Unit }>(`${this.baseUrl}/units`, unit);
  }

  updateUnit(id: number, unit: UnitFormData): Observable<{ success: boolean; data: Unit }> {
    return this.http.put<{ success: boolean; data: Unit }>(`${this.baseUrl}/units/${id}`, unit);
  }

  deleteUnit(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/units/${id}`);
  }

  // Health check
  healthCheck(): Observable<{ success: boolean; message: string; timestamp: string }> {
    return this.http.get<{ success: boolean; message: string; timestamp: string }>(`${this.baseUrl}/health`);
  }
}