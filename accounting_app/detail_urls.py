"""
URLs للصفحات الفرعية - Detail URLs
تحتوي على جميع مسارات الصفحات الفرعية
"""

from django.urls import path
from . import detail_views

app_name = 'details'

urlpatterns = [
    # Partner Detail URLs
    path('partners/<int:pk>/', detail_views.PartnerDetailView.as_view(), name='partner_detail'),
    path('api/partners/<int:partner_id>/daily-transactions/', detail_views.get_partner_daily_transactions, name='partner_daily_transactions'),
    path('api/partners/<int:partner_id>/monthly-summary/', detail_views.get_partner_monthly_summary, name='partner_monthly_summary'),
    path('api/partners/daily-transactions/create/', detail_views.create_partner_daily_transaction, name='create_partner_daily_transaction'),
    
    # Unit Detail URLs
    path('units/<int:pk>/', detail_views.UnitDetailView.as_view(), name='unit_detail'),
    path('api/units/<int:unit_id>/partners/', detail_views.get_unit_partners, name='unit_partners'),
    
    # Contract Detail URLs
    path('contracts/<int:pk>/', detail_views.ContractDetailView.as_view(), name='contract_detail'),
    path('api/contracts/<int:contract_id>/installments/', detail_views.get_contract_installments, name='contract_installments'),
    
    # Installment Detail URLs
    path('installments/<int:pk>/', detail_views.InstallmentDetailView.as_view(), name='installment_detail'),
    
    # Voucher Detail URLs
    path('vouchers/<int:pk>/', detail_views.VoucherDetailView.as_view(), name='voucher_detail'),
    
    # Safe Detail URLs
    path('safes/<int:pk>/', detail_views.SafeDetailView.as_view(), name='safe_detail'),
    path('api/safes/<int:safe_id>/transactions/', detail_views.get_safe_transactions, name='safe_transactions'),
    
    # Broker Detail URLs
    path('brokers/<int:pk>/', detail_views.BrokerDetailView.as_view(), name='broker_detail'),
    
    # Customer Detail URLs
    path('customers/<int:pk>/', detail_views.CustomerDetailView.as_view(), name='customer_detail'),
    
    # Partner Group Detail URLs
    path('partner-groups/<int:pk>/', detail_views.PartnerGroupDetailView.as_view(), name='partner_group_detail'),
]