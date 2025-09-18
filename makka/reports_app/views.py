"""
عروض التقارير
"""
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from realpp.services.reports import *


@login_required
def dashboard(request):
    """لوحة التقارير"""
    context = {
        'page_title': 'التقارير والإحصائيات',
    }
    return render(request, 'reports_app/dashboard.html', context)