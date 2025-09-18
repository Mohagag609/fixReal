"""
عروض الإعدادات
"""
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required


@login_required
def dashboard(request):
    """لوحة الإعدادات"""
    context = {
        'page_title': 'إعدادات النظام',
    }
    return render(request, 'settings_app/dashboard.html', context)