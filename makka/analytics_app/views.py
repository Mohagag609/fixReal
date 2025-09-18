"""
عروض التحليلات
"""
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required


@login_required
def dashboard(request):
    """لوحة التحليلات"""
    context = {
        'page_title': 'التحليلات والإحصائيات المتقدمة',
    }
    return render(request, 'analytics_app/dashboard.html', context)