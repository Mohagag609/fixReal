from django.urls import path, include
from . import views

app_name = 'accounting'

urlpatterns = [
    # Dashboard
    path('', views.DashboardView.as_view(), name='dashboard'),
    
    # Customers
    path('customers/', views.CustomerListView.as_view(), name='customer_list'),
    path('customers/create/', views.CustomerCreateView.as_view(), name='customer_create'),
    path('customers/<int:pk>/', views.CustomerDetailView.as_view(), name='customer_detail'),
    path('customers/<int:pk>/edit/', views.CustomerUpdateView.as_view(), name='customer_update'),
    path('customers/<int:pk>/delete/', views.CustomerDeleteView.as_view(), name='customer_delete'),
    
    # Vendors
    path('vendors/', views.VendorListView.as_view(), name='vendor_list'),
    path('vendors/create/', views.VendorCreateView.as_view(), name='vendor_create'),
    path('vendors/<int:pk>/edit/', views.VendorUpdateView.as_view(), name='vendor_update'),
    path('vendors/<int:pk>/delete/', views.VendorDeleteView.as_view(), name='vendor_delete'),
    
    # Invoices
    path('invoices/', views.InvoiceListView.as_view(), name='invoice_list'),
    path('invoices/create/', views.InvoiceCreateView.as_view(), name='invoice_create'),
    path('invoices/<int:pk>/', views.InvoiceDetailView.as_view(), name='invoice_detail'),
    path('invoices/<int:pk>/edit/', views.InvoiceUpdateView.as_view(), name='invoice_update'),
    path('invoices/<int:pk>/delete/', views.InvoiceDeleteView.as_view(), name='invoice_delete'),
    
    # Bills
    path('bills/', views.BillListView.as_view(), name='bill_list'),
    path('bills/create/', views.BillCreateView.as_view(), name='bill_create'),
    path('bills/<int:pk>/', views.BillDetailView.as_view(), name='bill_detail'),
    path('bills/<int:pk>/edit/', views.BillUpdateView.as_view(), name='bill_update'),
    path('bills/<int:pk>/delete/', views.BillDeleteView.as_view(), name='bill_delete'),
    
    # Payments
    path('payments/', views.PaymentListView.as_view(), name='payment_list'),
    path('payments/create/', views.PaymentCreateView.as_view(), name='payment_create'),
    path('payments/<int:pk>/edit/', views.PaymentUpdateView.as_view(), name='payment_update'),
    path('payments/<int:pk>/delete/', views.PaymentDeleteView.as_view(), name='payment_delete'),
    
    # Chart of Accounts
    path('chart-of-accounts/', views.ChartOfAccountsListView.as_view(), name='chart_of_accounts_list'),
    
    # Journal Entries
    path('journal-entries/', views.JournalEntryListView.as_view(), name='journal_entry_list'),
    path('journal-entries/create/', views.JournalEntryCreateView.as_view(), name='journal_entry_create'),
    path('journal-entries/<int:pk>/', views.JournalEntryDetailView.as_view(), name='journal_entry_detail'),
    
    # Products
    path('products/', views.ProductListView.as_view(), name='product_list'),
    path('products/create/', views.ProductCreateView.as_view(), name='product_create'),
    path('products/<int:pk>/edit/', views.ProductUpdateView.as_view(), name='product_update'),
    path('products/<int:pk>/delete/', views.ProductDeleteView.as_view(), name='product_delete'),
    
    # AJAX endpoints
    path('ajax/customer-invoices/<int:customer_id>/', views.get_customer_invoices, name='ajax_customer_invoices'),
    path('ajax/vendor-bills/<int:vendor_id>/', views.get_vendor_bills, name='ajax_vendor_bills'),
    path('ajax/calculate-invoice-totals/<int:invoice_id>/', views.calculate_invoice_totals, name='ajax_calculate_invoice_totals'),
    path('ajax/calculate-bill-totals/<int:bill_id>/', views.calculate_bill_totals, name='ajax_calculate_bill_totals'),
]