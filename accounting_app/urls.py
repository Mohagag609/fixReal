from django.urls import path
from . import views
from . import htmx_views

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
    
    # Partners
    path('partners/', views.PartnerListView.as_view(), name='partner_list'),
    path('partners/create/', views.PartnerCreateView.as_view(), name='partner_create'),
    path('partners/<int:pk>/edit/', views.PartnerUpdateView.as_view(), name='partner_update'),
    path('partners/<int:pk>/delete/', views.PartnerDeleteView.as_view(), name='partner_delete'),
    
    # Brokers
    path('brokers/', views.BrokerListView.as_view(), name='broker_list'),
    path('brokers/create/', views.BrokerCreateView.as_view(), name='broker_create'),
    path('brokers/<int:pk>/edit/', views.BrokerUpdateView.as_view(), name='broker_update'),
    path('brokers/<int:pk>/delete/', views.BrokerDeleteView.as_view(), name='broker_delete'),
    
    # Partner Groups
    path('partner-groups/', views.PartnerGroupListView.as_view(), name='partner_group_list'),
    path('partner-groups/create/', views.PartnerGroupCreateView.as_view(), name='partner_group_create'),
    path('partner-groups/<int:pk>/edit/', views.PartnerGroupUpdateView.as_view(), name='partner_group_update'),
    path('partner-groups/<int:pk>/delete/', views.PartnerGroupDeleteView.as_view(), name='partner_group_delete'),
    
    # Transfers
    path('transfers/', views.TransferListView.as_view(), name='transfer_list'),
    path('transfers/create/', views.TransferCreateView.as_view(), name='transfer_create'),
    path('transfers/<int:pk>/delete/', views.TransferDeleteView.as_view(), name='transfer_delete'),
    
    # Debts
    path('partner-debts/', views.PartnerDebtListView.as_view(), name='partner_debt_list'),
    path('broker-dues/', views.BrokerDueListView.as_view(), name='broker_due_list'),
    
    # Unit Partners
    path('units/<int:unit_id>/partners/', views.UnitPartnersView.as_view(), name='unit_partners'),
    path('units/<int:unit_id>/add-partner/', views.UnitAddPartnerView.as_view(), name='unit_add_partner'),
    path('units/<int:unit_id>/edit-partner/<int:pk>/', views.UnitEditPartnerView.as_view(), name='unit_edit_partner'),
    path('units/<int:unit_id>/remove-partner/<int:pk>/', views.UnitRemovePartnerView.as_view(), name='unit_remove_partner'),
    
    # Unit Partner Groups
    path('units/<int:unit_id>/partner-groups/', views.UnitPartnerGroupsView.as_view(), name='unit_partner_groups'),
    path('units/<int:unit_id>/add-partner-group/', views.UnitAddPartnerGroupView.as_view(), name='unit_add_partner_group'),
    path('units/<int:unit_id>/remove-partner-group/<int:pk>/', views.UnitRemovePartnerGroupView.as_view(), name='unit_remove_partner_group'),
    
    # API endpoints
    path('api/customers/', views.get_customers_api, name='api_customers'),
    path('api/units/', views.get_units_api, name='api_units'),
    path('api/safes/', views.get_safes_api, name='api_safes'),
    
    # HTMX endpoints
    path('htmx/customers/', htmx_views.get_customers_htmx, name='htmx_customers'),
    path('htmx/units/', htmx_views.get_units_htmx, name='htmx_units'),
    path('htmx/safes/', htmx_views.get_safes_htmx, name='htmx_safes'),
    path('htmx/installments/<int:installment_id>/status/', htmx_views.update_installment_status_htmx, name='htmx_installment_status'),
    path('htmx/vouchers/create/', htmx_views.create_voucher_htmx, name='htmx_voucher_create'),
    path('htmx/dashboard/stats/', htmx_views.get_dashboard_stats_htmx, name='htmx_dashboard_stats'),
    path('htmx/safes/<int:safe_id>/balance/', htmx_views.get_safe_balance_htmx, name='htmx_safe_balance'),
]