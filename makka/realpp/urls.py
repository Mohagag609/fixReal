"""
URL configuration for the realpp app.
"""

from django.urls import path, include
from . import views

app_name = 'realpp'

urlpatterns = [
    # Dashboard
    path('', views.dashboard, name='dashboard'),
    
    # Customer URLs
    path('customers/', views.customers_list, name='customers_list'),
    path('customers/create/', views.customers_create, name='customers_create'),
    path('customers/<int:pk>/', views.customers_detail, name='customers_detail'),
    path('customers/<int:pk>/edit/', views.customers_edit, name='customers_edit'),
    path('customers/<int:pk>/delete/', views.customers_delete, name='customers_delete'),
    path('customers/import/', views.customers_import, name='customers_import'),
    path('customers/export/', views.customers_export, name='customers_export'),
    
    # Unit URLs
    path('units/', views.units_list, name='units_list'),
    path('units/create/', views.units_create, name='units_create'),
    path('units/<int:pk>/', views.units_detail, name='units_detail'),
    path('units/<int:pk>/edit/', views.units_edit, name='units_edit'),
    path('units/<int:pk>/delete/', views.units_delete, name='units_delete'),
    path('units/import/', views.units_import, name='units_import'),
    path('units/export/', views.units_export, name='units_export'),
    
    # Contract URLs
    path('contracts/', views.contracts_list, name='contracts_list'),
    path('contracts/create/', views.contracts_create, name='contracts_create'),
    path('contracts/<int:pk>/', views.contracts_detail, name='contracts_detail'),
    path('contracts/<int:pk>/edit/', views.contracts_edit, name='contracts_edit'),
    path('contracts/<int:pk>/delete/', views.contracts_delete, name='contracts_delete'),
    path('contracts/export/', views.contracts_export, name='contracts_export'),
    
    # Treasury URLs
    path('treasury/', views.treasury_dashboard, name='treasury_dashboard'),
    path('treasury/safes/', views.safes_list, name='safes_list'),
    path('treasury/safes/create/', views.safes_create, name='safes_create'),
    path('treasury/safes/<int:pk>/', views.safes_detail, name='safes_detail'),
    path('treasury/safes/<int:pk>/edit/', views.safes_edit, name='safes_edit'),
    path('treasury/safes/<int:pk>/delete/', views.safes_delete, name='safes_delete'),
    
    # Reports URLs
    path('reports/', views.reports_dashboard, name='reports_dashboard'),
    path('reports/generate/<str:report_type>/<str:format>/', views.generate_report_view, name='generate_report'),
]