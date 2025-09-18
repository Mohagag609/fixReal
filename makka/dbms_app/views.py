"""
عروض إدارة قاعدة البيانات
"""
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from realpp.services.dbms import *


@login_required
def dashboard(request):
    """لوحة إدارة قاعدة البيانات"""
    context = {
        'page_title': 'إدارة قاعدة البيانات',
    }
    return render(request, 'dbms_app/dashboard.html', context)


@login_required
def stats(request):
    """إحصائيات قاعدة البيانات"""
    try:
        stats = get_database_stats()
        return JsonResponse({
            'success': True,
            'data': stats
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'خطأ في تحميل الإحصائيات: {str(e)}'
        })


@login_required
def optimize(request):
    """تحسين قاعدة البيانات"""
    try:
        result = optimize_database()
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'خطأ في تحسين قاعدة البيانات: {str(e)}'
        })


@login_required
def health(request):
    """صحة قاعدة البيانات"""
    try:
        health_status = get_database_health()
        return JsonResponse(health_status)
    except Exception as e:
        return JsonResponse({
            'overall_status': 'unhealthy',
            'message': f'خطأ في فحص صحة قاعدة البيانات: {str(e)}'
        })