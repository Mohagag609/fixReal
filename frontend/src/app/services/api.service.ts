import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Dashboard
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/stats`, {
      headers: this.getHeaders()
    });
  }

  // Customers
  getCustomers(page = 1, limit = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/customers?page=${page}&limit=${limit}`, {
      headers: this.getHeaders()
    });
  }

  getCustomer(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/customers/${id}`, {
      headers: this.getHeaders()
    });
  }

  createCustomer(customer: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/customers`, customer, {
      headers: this.getHeaders()
    });
  }

  updateCustomer(id: string, customer: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/customers/${id}`, customer, {
      headers: this.getHeaders()
    });
  }

  deleteCustomer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/customers/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Units
  getUnits(page = 1, limit = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/units?page=${page}&limit=${limit}`, {
      headers: this.getHeaders()
    });
  }

  getUnit(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/units/${id}`, {
      headers: this.getHeaders()
    });
  }

  createUnit(unit: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/units`, unit, {
      headers: this.getHeaders()
    });
  }

  updateUnit(id: string, unit: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/units/${id}`, unit, {
      headers: this.getHeaders()
    });
  }

  deleteUnit(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/units/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Contracts
  getContracts(page = 1, limit = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/contracts?page=${page}&limit=${limit}`, {
      headers: this.getHeaders()
    });
  }

  getContract(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/contracts/${id}`, {
      headers: this.getHeaders()
    });
  }

  createContract(contract: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/contracts`, contract, {
      headers: this.getHeaders()
    });
  }

  updateContract(id: string, contract: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/contracts/${id}`, contract, {
      headers: this.getHeaders()
    });
  }

  deleteContract(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/contracts/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Transactions
  getTransactions(page = 1, limit = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/transactions?page=${page}&limit=${limit}`, {
      headers: this.getHeaders()
    });
  }

  getTransaction(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/transactions/${id}`, {
      headers: this.getHeaders()
    });
  }

  createTransaction(transaction: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transactions`, transaction, {
      headers: this.getHeaders()
    });
  }

  updateTransaction(id: string, transaction: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/transactions/${id}`, transaction, {
      headers: this.getHeaders()
    });
  }

  deleteTransaction(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/transactions/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Invoices
  getInvoices(page = 1, limit = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/invoices?page=${page}&limit=${limit}`, {
      headers: this.getHeaders()
    });
  }

  getInvoice(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/invoices/${id}`, {
      headers: this.getHeaders()
    });
  }

  createInvoice(invoice: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/invoices`, invoice, {
      headers: this.getHeaders()
    });
  }

  updateInvoice(id: string, invoice: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/invoices/${id}`, invoice, {
      headers: this.getHeaders()
    });
  }

  deleteInvoice(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/invoices/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Reports
  getReports(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports`, {
      headers: this.getHeaders()
    });
  }

  generateReport(reportData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/generate`, reportData, {
      headers: this.getHeaders()
    });
  }
}