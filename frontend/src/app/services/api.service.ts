import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Customer, CustomerResponse, CustomerFormData, CustomerFilters } from '../models/customer.model';
import { Unit, UnitResponse, UnitFormData, UnitFilters } from '../models/unit.model';
import { DashboardResponse } from '../models/dashboard.model';
import { Broker, BrokerStats } from '../models/broker.model';
import { BrokerDue } from '../models/broker-due.model';
import { PartnerDebt, PartnerDebtStats } from '../models/partner-debt.model';
import { AuditLog, AuditLogStats } from '../models/audit-log.model';
import { Settings } from '../models/settings.model';
import { Notification } from '../models/notification.model';

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

  // Brokers
  getBrokers(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      for (const key in filters) {
        if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined) {
          params = params.append(key, filters[key]);
        }
      }
    }
    return this.http.get<any>(`${this.baseUrl}/brokers`, { params });
  }

  getBroker(id: string): Observable<{ success: boolean; data: Broker }> {
    return this.http.get<{ success: boolean; data: Broker }>(`${this.baseUrl}/brokers/${id}`);
  }

  createBroker(broker: Broker): Observable<{ success: boolean; data: Broker }> {
    return this.http.post<{ success: boolean; data: Broker }>(`${this.baseUrl}/brokers`, broker);
  }

  updateBroker(id: string, broker: Broker): Observable<{ success: boolean; data: Broker }> {
    return this.http.put<{ success: boolean; data: Broker }>(`${this.baseUrl}/brokers/${id}`, broker);
  }

  deleteBroker(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/brokers/${id}`);
  }

  getBrokerStats(): Observable<{ success: boolean; data: BrokerStats }> {
    return this.http.get<{ success: boolean; data: BrokerStats }>(`${this.baseUrl}/brokers/stats`);
  }

  // Broker Dues
  getBrokerDues(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      for (const key in filters) {
        if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined) {
          params = params.append(key, filters[key]);
        }
      }
    }
    return this.http.get<any>(`${this.baseUrl}/broker-dues`, { params });
  }

  getBrokerDue(id: string): Observable<{ success: boolean; data: BrokerDue }> {
    return this.http.get<{ success: boolean; data: BrokerDue }>(`${this.baseUrl}/broker-dues/${id}`);
  }

  createBrokerDue(brokerDue: BrokerDue): Observable<{ success: boolean; data: BrokerDue }> {
    return this.http.post<{ success: boolean; data: BrokerDue }>(`${this.baseUrl}/broker-dues`, brokerDue);
  }

  updateBrokerDue(id: string, brokerDue: BrokerDue): Observable<{ success: boolean; data: BrokerDue }> {
    return this.http.put<{ success: boolean; data: BrokerDue }>(`${this.baseUrl}/broker-dues/${id}`, brokerDue);
  }

  deleteBrokerDue(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/broker-dues/${id}`);
  }

  markBrokerDueAsPaid(id: string, paymentData: { payment_date: string; notes?: string }): Observable<{ success: boolean; data: BrokerDue }> {
    return this.http.post<{ success: boolean; data: BrokerDue }>(`${this.baseUrl}/broker-dues/${id}/mark-paid`, paymentData);
  }

  getOverdueBrokerDues(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      for (const key in filters) {
        if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined) {
          params = params.append(key, filters[key]);
        }
      }
    }
    return this.http.get<any>(`${this.baseUrl}/broker-dues/overdue`, { params });
  }

  // Partner Debts
  getPartnerDebts(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      for (const key in filters) {
        if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined) {
          params = params.append(key, filters[key]);
        }
      }
    }
    return this.http.get<any>(`${this.baseUrl}/partner-debts`, { params });
  }

  getPartnerDebt(id: string): Observable<{ success: boolean; data: PartnerDebt }> {
    return this.http.get<{ success: boolean; data: PartnerDebt }>(`${this.baseUrl}/partner-debts/${id}`);
  }

  createPartnerDebt(partnerDebt: PartnerDebt): Observable<{ success: boolean; data: PartnerDebt }> {
    return this.http.post<{ success: boolean; data: PartnerDebt }>(`${this.baseUrl}/partner-debts`, partnerDebt);
  }

  updatePartnerDebt(id: string, partnerDebt: PartnerDebt): Observable<{ success: boolean; data: PartnerDebt }> {
    return this.http.put<{ success: boolean; data: PartnerDebt }>(`${this.baseUrl}/partner-debts/${id}`, partnerDebt);
  }

  deletePartnerDebt(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/partner-debts/${id}`);
  }

  markPartnerDebtAsPaid(id: string, paymentData: { payment_date: string; notes?: string }): Observable<{ success: boolean; data: PartnerDebt }> {
    return this.http.post<{ success: boolean; data: PartnerDebt }>(`${this.baseUrl}/partner-debts/${id}/mark-paid`, paymentData);
  }

  getOverduePartnerDebts(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      for (const key in filters) {
        if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined) {
          params = params.append(key, filters[key]);
        }
      }
    }
    return this.http.get<any>(`${this.baseUrl}/partner-debts/overdue`, { params });
  }

  getPartnerDebtStats(): Observable<{ success: boolean; data: PartnerDebtStats }> {
    return this.http.get<{ success: boolean; data: PartnerDebtStats }>(`${this.baseUrl}/partner-debts/stats`);
  }

  // Audit Logs
  getAuditLogs(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      for (const key in filters) {
        if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined) {
          params = params.append(key, filters[key]);
        }
      }
    }
    return this.http.get<any>(`${this.baseUrl}/audit-logs`, { params });
  }

  getAuditLog(id: string): Observable<{ success: boolean; data: AuditLog }> {
    return this.http.get<{ success: boolean; data: AuditLog }>(`${this.baseUrl}/audit-logs/${id}`);
  }

  getAuditLogStats(): Observable<{ success: boolean; data: AuditLogStats }> {
    return this.http.get<{ success: boolean; data: AuditLogStats }>(`${this.baseUrl}/audit-logs/stats`);
  }

  // Settings
  getSettings(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      for (const key in filters) {
        if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined) {
          params = params.append(key, filters[key]);
        }
      }
    }
    return this.http.get<any>(`${this.baseUrl}/settings`, { params });
  }

  getSetting(id: string): Observable<{ success: boolean; data: Settings }> {
    return this.http.get<{ success: boolean; data: Settings }>(`${this.baseUrl}/settings/${id}`);
  }

  createSetting(setting: Settings): Observable<{ success: boolean; data: Settings }> {
    return this.http.post<{ success: boolean; data: Settings }>(`${this.baseUrl}/settings`, setting);
  }

  updateSetting(id: string, setting: Settings): Observable<{ success: boolean; data: Settings }> {
    return this.http.put<{ success: boolean; data: Settings }>(`${this.baseUrl}/settings/${id}`, setting);
  }

  deleteSetting(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/settings/${id}`);
  }

  getSettingByKey(key: string): Observable<{ success: boolean; data: Settings }> {
    return this.http.get<{ success: boolean; data: Settings }>(`${this.baseUrl}/settings/key/${key}`);
  }

  updateSettingByKey(key: string, setting: Partial<Settings>): Observable<{ success: boolean; data: Settings }> {
    return this.http.put<{ success: boolean; data: Settings }>(`${this.baseUrl}/settings/key/${key}`, setting);
  }

  // Notifications
  getNotifications(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      for (const key in filters) {
        if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined) {
          params = params.append(key, filters[key]);
        }
      }
    }
    return this.http.get<any>(`${this.baseUrl}/notifications`, { params });
  }

  getNotification(id: string): Observable<{ success: boolean; data: Notification }> {
    return this.http.get<{ success: boolean; data: Notification }>(`${this.baseUrl}/notifications/${id}`);
  }

  createNotification(notification: Notification): Observable<{ success: boolean; data: Notification }> {
    return this.http.post<{ success: boolean; data: Notification }>(`${this.baseUrl}/notifications`, notification);
  }

  updateNotification(id: string, notification: Notification): Observable<{ success: boolean; data: Notification }> {
    return this.http.put<{ success: boolean; data: Notification }>(`${this.baseUrl}/notifications/${id}`, notification);
  }

  deleteNotification(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/notifications/${id}`);
  }

  markNotificationAsRead(id: string): Observable<{ success: boolean; data: Notification }> {
    return this.http.post<{ success: boolean; data: Notification }>(`${this.baseUrl}/notifications/${id}/mark-read`, {});
  }

  markAllNotificationsAsRead(userId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/notifications/mark-all-read`, { user_id: userId });
  }

  getUnreadNotificationCount(userId: string): Observable<{ success: boolean; data: { unread_count: number } }> {
    return this.http.get<{ success: boolean; data: { unread_count: number } }>(`${this.baseUrl}/notifications/unread-count?user_id=${userId}`);
  }
}