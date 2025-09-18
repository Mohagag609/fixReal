"""
URLs للتقارير
"""
from django.urls import path
from . import views

app_name = 'reports_app'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
]