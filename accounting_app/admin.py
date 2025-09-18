from django.contrib import admin
from .models import (
    Customer, Unit, Partner, Contract, Installment, Safe, Voucher, Broker,
    PartnerDebt, BrokerDue, PartnerGroup, UnitPartner, PartnerGroupPartner,
    UnitPartnerGroup, AuditLog, Settings, KeyVal, Transfer, Notification
)


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'national_id', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'phone', 'national_id']
    ordering = ['-created_at']


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'unit_type', 'floor', 'building', 'total_price', 'status', 'created_at']
    list_filter = ['unit_type', 'status', 'created_at']
    search_fields = ['code', 'name', 'building']
    ordering = ['-created_at']


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ['unit', 'customer', 'start', 'total_price', 'payment_type', 'installment_count', 'created_at']
    list_filter = ['payment_type', 'start', 'created_at']
    search_fields = ['unit__code', 'customer__name', 'broker_name']
    ordering = ['-created_at']


@admin.register(Installment)
class InstallmentAdmin(admin.ModelAdmin):
    list_display = ['unit', 'amount', 'due_date', 'status', 'created_at']
    list_filter = ['status', 'due_date', 'created_at']
    search_fields = ['unit__code', 'unit__name']
    ordering = ['-due_date']


@admin.register(Safe)
class SafeAdmin(admin.ModelAdmin):
    list_display = ['name', 'balance', 'created_at']
    search_fields = ['name']
    ordering = ['name']


@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ['type', 'date', 'amount', 'safe', 'description', 'payer', 'created_at']
    list_filter = ['type', 'date', 'created_at']
    search_fields = ['description', 'payer', 'beneficiary']
    ordering = ['-date']


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'created_at']
    search_fields = ['name', 'phone']
    ordering = ['name']


@admin.register(Broker)
class BrokerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'created_at']
    search_fields = ['name', 'phone']
    ordering = ['name']


@admin.register(PartnerGroup)
class PartnerGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']
    ordering = ['name']


@admin.register(UnitPartner)
class UnitPartnerAdmin(admin.ModelAdmin):
    list_display = ['unit', 'partner', 'percentage', 'created_at']
    list_filter = ['created_at']
    search_fields = ['unit__code', 'partner__name']
    ordering = ['-created_at']


@admin.register(PartnerGroupPartner)
class PartnerGroupPartnerAdmin(admin.ModelAdmin):
    list_display = ['partner_group', 'partner', 'percentage', 'created_at']
    list_filter = ['created_at']
    search_fields = ['partner_group__name', 'partner__name']
    ordering = ['-created_at']


@admin.register(UnitPartnerGroup)
class UnitPartnerGroupAdmin(admin.ModelAdmin):
    list_display = ['unit', 'partner_group', 'created_at']
    list_filter = ['created_at']
    search_fields = ['unit__code', 'partner_group__name']
    ordering = ['-created_at']


@admin.register(PartnerDebt)
class PartnerDebtAdmin(admin.ModelAdmin):
    list_display = ['partner', 'amount', 'due_date', 'status', 'created_at']
    list_filter = ['status', 'due_date', 'created_at']
    search_fields = ['partner__name']
    ordering = ['-due_date']


@admin.register(BrokerDue)
class BrokerDueAdmin(admin.ModelAdmin):
    list_display = ['broker', 'amount', 'due_date', 'status', 'created_at']
    list_filter = ['status', 'due_date', 'created_at']
    search_fields = ['broker__name']
    ordering = ['-due_date']


@admin.register(Transfer)
class TransferAdmin(admin.ModelAdmin):
    list_display = ['from_safe', 'to_safe', 'amount', 'description', 'created_at']
    list_filter = ['created_at']
    search_fields = ['from_safe__name', 'to_safe__name', 'description']
    ordering = ['-created_at']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'entity_type', 'entity_id', 'user_id', 'created_at']
    list_filter = ['action', 'entity_type', 'created_at']
    search_fields = ['entity_type', 'entity_id', 'user_id']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Settings)
class SettingsAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'created_at']
    search_fields = ['key']
    ordering = ['key']


@admin.register(KeyVal)
class KeyValAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'created_at']
    search_fields = ['key']
    ordering = ['key']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'type', 'category', 'acknowledged', 'created_at']
    list_filter = ['type', 'category', 'acknowledged', 'created_at']
    search_fields = ['title', 'message']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']