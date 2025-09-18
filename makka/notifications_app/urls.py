"""
URLs للإشعارات
"""
from django.urls import path
from . import views

app_name = 'notifications_app'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
]