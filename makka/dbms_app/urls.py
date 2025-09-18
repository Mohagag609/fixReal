"""
URLs لإدارة قاعدة البيانات
"""
from django.urls import path
from . import views

app_name = 'dbms_app'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('stats/', views.stats, name='stats'),
    path('optimize/', views.optimize, name='optimize'),
    path('health/', views.health, name='health'),
]