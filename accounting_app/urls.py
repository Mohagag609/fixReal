from django.urls import path
from . import views

app_name = 'accounting_app'

urlpatterns = [
    # Dashboard
    path('', views.DashboardView.as_view(), name='dashboard'),
    
    # Customers
    path('customers/', views.CustomerListView.as_view(), name='customer_list'),
    path('customers/create/', views.CustomerCreateView.as_view(), name='customer_create'),
    path('customers/<int:pk>/edit/', views.CustomerUpdateView.as_view(), name='customer_update'),
    path('customers/<int:pk>/delete/', views.CustomerDeleteView.as_view(), name='customer_delete'),
    
    # Units
    path('units/', views.UnitListView.as_view(), name='unit_list'),
    path('units/create/', views.UnitCreateView.as_view(), name='unit_create'),
    path('units/<int:pk>/edit/', views.UnitUpdateView.as_view(), name='unit_update'),
    path('units/<int:pk>/delete/', views.UnitDeleteView.as_view(), name='unit_delete'),
    
    # Contracts
    path('contracts/', views.ContractListView.as_view(), name='contract_list'),
    path('contracts/create/', views.ContractCreateView.as_view(), name='contract_create'),
    path('contracts/<int:pk>/edit/', views.ContractUpdateView.as_view(), name='contract_update'),
    path('contracts/<int:pk>/delete/', views.ContractDeleteView.as_view(), name='contract_delete'),
    
    # Installments
    path('installments/', views.InstallmentListView.as_view(), name='installment_list'),
    path('installments/<int:pk>/edit/', views.InstallmentUpdateView.as_view(), name='installment_update'),
    
    # Safes
    path('safes/', views.SafeListView.as_view(), name='safe_list'),
    path('safes/create/', views.SafeCreateView.as_view(), name='safe_create'),
    path('safes/<int:pk>/edit/', views.SafeUpdateView.as_view(), name='safe_update'),
    path('safes/<int:pk>/delete/', views.SafeDeleteView.as_view(), name='safe_delete'),
    
    # Vouchers
    path('vouchers/', views.VoucherListView.as_view(), name='voucher_list'),
    path('vouchers/create/', views.VoucherCreateView.as_view(), name='voucher_create'),
    path('vouchers/<int:pk>/edit/', views.VoucherUpdateView.as_view(), name='voucher_update'),
    path('vouchers/<int:pk>/delete/', views.VoucherDeleteView.as_view(), name='voucher_delete'),
    
    # API endpoints
    path('api/customers/', views.get_customers_api, name='api_customers'),
    path('api/units/', views.get_units_api, name='api_units'),
    path('api/safes/', views.get_safes_api, name='api_safes'),
]