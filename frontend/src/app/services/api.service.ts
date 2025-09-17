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

  // Contracts
  getContracts(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/contracts`, { params });
  }

  getContract(id: number): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.baseUrl}/contracts/${id}`);
  }

  createContract(contract: any): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.baseUrl}/contracts`, contract);
  }

  updateContract(id: number, contract: any): Observable<{ success: boolean; data: any }> {
    return this.http.put<{ success: boolean; data: any }>(`${this.baseUrl}/contracts/${id}`, contract);
  }

  deleteContract(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/contracts/${id}`);
  }

  // Installments
  getInstallments(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/installments`, { params });
  }

  getInstallment(id: number): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.baseUrl}/installments/${id}`);
  }

  createInstallment(installment: any): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.baseUrl}/installments`, installment);
  }

  updateInstallment(id: number, installment: any): Observable<{ success: boolean; data: any }> {
    return this.http.put<{ success: boolean; data: any }>(`${this.baseUrl}/installments/${id}`, installment);
  }

  deleteInstallment(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/installments/${id}`);
  }

  markInstallmentAsPaid(id: number, paymentData: any): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.baseUrl}/installments/${id}/mark-paid`, paymentData);
  }

  // Vouchers
  getVouchers(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/vouchers`, { params });
  }

  getVoucher(id: number): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.baseUrl}/vouchers/${id}`);
  }

  createVoucher(voucher: any): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.baseUrl}/vouchers`, voucher);
  }

  updateVoucher(id: number, voucher: any): Observable<{ success: boolean; data: any }> {
    return this.http.put<{ success: boolean; data: any }>(`${this.baseUrl}/vouchers/${id}`, voucher);
  }

  deleteVoucher(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/vouchers/${id}`);
  }

  getVoucherStats(): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.baseUrl}/vouchers/stats`);
  }

  // Partners
  getPartners(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/partners`, { params });
  }

  getPartner(id: number): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.baseUrl}/partners/${id}`);
  }

  createPartner(partner: any): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.baseUrl}/partners`, partner);
  }

  updatePartner(id: number, partner: any): Observable<{ success: boolean; data: any }> {
    return this.http.put<{ success: boolean; data: any }>(`${this.baseUrl}/partners/${id}`, partner);
  }

  deletePartner(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/partners/${id}`);
  }

  getPartnerStats(): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.baseUrl}/partners/stats`);
  }

  // Partner Groups
  getPartnerGroups(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/partner-groups`, { params });
  }

  getPartnerGroup(id: number): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.baseUrl}/partner-groups/${id}`);
  }

  createPartnerGroup(group: any): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.baseUrl}/partner-groups`, group);
  }

  updatePartnerGroup(id: number, group: any): Observable<{ success: boolean; data: any }> {
    return this.http.put<{ success: boolean; data: any }>(`${this.baseUrl}/partner-groups/${id}`, group);
  }

  deletePartnerGroup(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/partner-groups/${id}`);
  }

  // Safes
  getSafes(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/safes`, { params });
  }

  getSafe(id: number): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.baseUrl}/safes/${id}`);
  }

  createSafe(safe: any): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.baseUrl}/safes`, safe);
  }

  updateSafe(id: number, safe: any): Observable<{ success: boolean; data: any }> {
    return this.http.put<{ success: boolean; data: any }>(`${this.baseUrl}/safes/${id}`, safe);
  }

  deleteSafe(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/safes/${id}`);
  }

  getSafeStats(): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.baseUrl}/safes/stats`);
  }

  getSafeTransactions(id: number, filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/safes/${id}/transactions`, { params });
  }

  transferBetweenSafes(transferData: any): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/safes/transfer`, transferData);
  }

  // Health check
  healthCheck(): Observable<{ success: boolean; message: string; timestamp: string }> {
    return this.http.get<{ success: boolean; message: string; timestamp: string }>(`${this.baseUrl}/health`);
  }
}