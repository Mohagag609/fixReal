from django.urls import path
from . import views

app_name = 'reports'

urlpatterns = [
    path('', views.ReportsDashboardView.as_view(), name='dashboard'),
    path('invoice-report/', views.InvoiceReportView.as_view(), name='invoice_report'),
    path('bill-report/', views.BillReportView.as_view(), name='bill_report'),
    path('customer-statement/', views.CustomerStatementView.as_view(), name='customer_statement'),
    path('vendor-statement/', views.VendorStatementView.as_view(), name='vendor_statement'),
    path('sales-summary/', views.SalesSummaryView.as_view(), name='sales_summary'),
    path('expense-summary/', views.ExpenseSummaryView.as_view(), name='expense_summary'),
    path('cash-flow/', views.CashFlowReportView.as_view(), name='cash_flow'),
    path('tax-report/', views.TaxReportView.as_view(), name='tax_report'),
    
    # Export endpoints
    path('export/<str:report_type>/csv/', views.export_report_csv, name='export_csv'),
]