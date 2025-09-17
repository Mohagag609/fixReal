import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';

interface Notification {
  id: string;
  type: 'critical' | 'important' | 'info';
  title: string;
  message: string;
  category: string;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  createdAt: Date;
  expiresAt?: Date;
  data?: any;
}

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  unreadCount = 0;
  isLoading = false;
  searchTerm = '';
  selectedType = 'all';
  selectedCategory = 'all';
  showAcknowledged = false;
  private refreshInterval?: Subscription;

  types = [
    { value: 'all', label: 'جميع الأنواع', icon: '📋' },
    { value: 'critical', label: 'حرج', icon: '🚨' },
    { value: 'important', label: 'مهم', icon: '⚠️' },
    { value: 'info', label: 'معلومات', icon: 'ℹ️' }
  ];

  categories = [
    { value: 'all', label: 'جميع الفئات' },
    { value: 'system', label: 'النظام' },
    { value: 'financial', label: 'مالي' },
    { value: 'contracts', label: 'العقود' },
    { value: 'payments', label: 'المدفوعات' },
    { value: 'maintenance', label: 'الصيانة' },
    { value: 'security', label: 'الأمان' }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadNotifications();
    // Refresh notifications every 30 seconds
    this.refreshInterval = interval(30000).subscribe(() => {
      this.loadNotifications();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      this.refreshInterval.unsubscribe();
    }
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.apiService.get('/notifications').subscribe({
      next: (response) => {
        this.notifications = response.data || [];
        this.filterNotifications();
        this.updateUnreadCount();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
      }
    });
  }

  filterNotifications(): void {
    this.filteredNotifications = this.notifications.filter(notification => {
      const matchesType = this.selectedType === 'all' || notification.type === this.selectedType;
      const matchesCategory = this.selectedCategory === 'all' || notification.category === this.selectedCategory;
      const matchesSearch = notification.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           notification.message.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesAcknowledged = this.showAcknowledged || !notification.acknowledged;
      
      return matchesType && matchesCategory && matchesSearch && matchesAcknowledged;
    });
  }

  onFilterChange(): void {
    this.filterNotifications();
  }

  onSearchChange(): void {
    this.filterNotifications();
  }

  acknowledgeNotification(notificationId: string): void {
    this.apiService.put(`/notifications/${notificationId}/acknowledge`, {}).subscribe({
      next: (response) => {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.acknowledged = true;
          notification.acknowledgedAt = new Date();
        }
        this.filterNotifications();
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error acknowledging notification:', error);
      }
    });
  }

  acknowledgeAll(): void {
    this.apiService.put('/notifications/acknowledge-all', {}).subscribe({
      next: (response) => {
        this.notifications.forEach(notification => {
          notification.acknowledged = true;
          notification.acknowledgedAt = new Date();
        });
        this.filterNotifications();
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error acknowledging all notifications:', error);
      }
    });
  }

  deleteNotification(notificationId: string): void {
    if (confirm('هل أنت متأكد من حذف هذا الإشعار؟')) {
      this.apiService.delete(`/notifications/${notificationId}`).subscribe({
        next: (response) => {
          this.notifications = this.notifications.filter(n => n.id !== notificationId);
          this.filterNotifications();
          this.updateUnreadCount();
        },
        error: (error) => {
          console.error('Error deleting notification:', error);
        }
      });
    }
  }

  deleteAllAcknowledged(): void {
    if (confirm('هل أنت متأكد من حذف جميع الإشعارات المقروءة؟')) {
      this.apiService.delete('/notifications/acknowledged').subscribe({
        next: (response) => {
          this.notifications = this.notifications.filter(n => !n.acknowledged);
          this.filterNotifications();
          this.updateUnreadCount();
        },
        error: (error) => {
          console.error('Error deleting acknowledged notifications:', error);
        }
      });
    }
  }

  markAsUnread(notificationId: string): void {
    this.apiService.put(`/notifications/${notificationId}/unacknowledge`, {}).subscribe({
      next: (response) => {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.acknowledged = false;
          notification.acknowledgedAt = undefined;
        }
        this.filterNotifications();
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error marking notification as unread:', error);
      }
    });
  }

  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.acknowledged).length;
  }

  getTypeIcon(type: string): string {
    const typeObj = this.types.find(t => t.value === type);
    return typeObj ? typeObj.icon : '📋';
  }

  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      important: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      system: 'bg-purple-100 text-purple-800',
      financial: 'bg-green-100 text-green-800',
      contracts: 'bg-blue-100 text-blue-800',
      payments: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-orange-100 text-orange-800',
      security: 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isExpired(notification: Notification): boolean {
    if (!notification.expiresAt) return false;
    return new Date(notification.expiresAt) < new Date();
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return this.formatDate(date);
  }
}