from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('', views.AnalyticsDashboardView.as_view(), name='dashboard'),
    
    # AJAX endpoints for charts
    path('ajax/revenue-chart/', views.get_revenue_chart_data, name='ajax_revenue_chart'),
    path('ajax/expense-chart/', views.get_expense_chart_data, name='ajax_expense_chart'),
    path('ajax/cash-flow-chart/', views.get_cash_flow_chart_data, name='ajax_cash_flow_chart'),
]