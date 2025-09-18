"""
عروض الإشعارات
"""
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required


@login_required
def dashboard(request):
    """لوحة الإشعارات"""
    context = {
        'page_title': 'الإشعارات',
    }
    return render(request, 'notifications_app/dashboard.html', context)