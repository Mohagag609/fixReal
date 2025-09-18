from django.urls import path
from . import views

urlpatterns = [
    path('', views.reports_dashboard, name='reports_dashboard'),
    
    # التقارير
    path('customers/', views.customers_report, name='customers_report'),
    path('contracts/', views.contracts_report, name='contracts_report'),
    path('units/', views.units_report, name='units_report'),
    path('financial/', views.financial_report, name='financial_report'),
    path('partners/', views.partners_report, name='partners_report'),
    path('safes/', views.safes_report, name='safes_report'),
    
    # التصدير
    path('export/<str:report_type>/', views.export_report, name='export_report'),
    
    # API للرسوم البيانية
    path('api/chart/<str:chart_type>/', views.get_chart_data, name='get_chart_data'),
]