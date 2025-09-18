"""
Business logic calculations for the real estate management system.
This module contains all the calculation functions translated from the old TypeScript calculations.
"""

from decimal import Decimal
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from django.db.models import Sum, Count, Q
from ..models import (
    Customer, Unit, Contract, Installment, PartnerDebt, 
    Safe, Transfer, Broker, BrokerDue, AuditLog
)


def calculate_installment_status(installment: Installment) -> str:
    """
    Calculate the status of an installment based on payment dates and amounts.
    
    Args:
        installment: The installment object
        
    Returns:
        str: Status of the installment ('paid', 'overdue', 'pending')
    """
    if installment.paid_date and installment.paid_amount >= installment.amount:
        return 'paid'
    
    if installment.due_date < datetime.now().date():
        return 'overdue'
    
    return 'pending'


def calculate_remaining(contract: Contract) -> Dict[str, Any]:
    """
    Calculate remaining amount and percentage for a contract.
    
    Args:
        contract: The contract object
        
    Returns:
        Dict containing remaining amount and percentage
    """
    total_paid = contract.installments.filter(status='paid').aggregate(
        total=Sum('paid_amount')
    )['total'] or Decimal('0')
    
    remaining_amount = contract.final_price - total_paid
    remaining_percentage = (remaining_amount / contract.final_price) * 100
    
    return {
        'remaining_amount': remaining_amount,
        'remaining_percentage': float(remaining_percentage)
    }


def calculate_collection_percentage(contract: Contract) -> float:
    """
    Calculate the collection percentage for a contract.
    
    Args:
        contract: The contract object
        
    Returns:
        float: Collection percentage (0-100)
    """
    total_paid = contract.installments.filter(status='paid').aggregate(
        total=Sum('paid_amount')
    )['total'] or Decimal('0')
    
    if contract.final_price > 0:
        return float((total_paid / contract.final_price) * 100)
    
    return 0.0


def calculate_net_profit(contract: Contract) -> Decimal:
    """
    Calculate net profit for a contract.
    
    Args:
        contract: The contract object
        
    Returns:
        Decimal: Net profit amount
    """
    total_commission = contract.broker_commission or Decimal('0')
    total_costs = contract.unit.area * Decimal('100')  # Assuming cost per sqm
    
    return contract.final_price - total_commission - total_costs


def calculate_total_sales() -> Dict[str, Any]:
    """
    Calculate total sales statistics.
    
    Returns:
        Dict containing total sales and counts
    """
    contracts = Contract.objects.all()
    
    total_sales = contracts.aggregate(total=Sum('final_price'))['total'] or Decimal('0')
    total_contracts = contracts.count()
    active_contracts = contracts.filter(status='active').count()
    completed_contracts = contracts.filter(status='completed').count()
    
    return {
        'total_sales': total_sales,
        'total_contracts': total_contracts,
        'active_contracts': active_contracts,
        'completed_contracts': completed_contracts
    }


def calculate_total_receipts() -> Decimal:
    """
    Calculate total receipts from all sources.
    
    Returns:
        Decimal: Total receipts amount
    """
    total_receipts = Installment.objects.filter(status='paid').aggregate(
        total=Sum('paid_amount')
    )['total'] or Decimal('0')
    
    return total_receipts


def calculate_total_expenses() -> Decimal:
    """
    Calculate total expenses including commissions and costs.
    
    Returns:
        Decimal: Total expenses amount
    """
    total_commissions = BrokerDue.objects.aggregate(
        total=Sum('commission_amount')
    )['total'] or Decimal('0')
    
    return total_commissions


def calculate_total_debt() -> Decimal:
    """
    Calculate total outstanding debt.
    
    Returns:
        Decimal: Total debt amount
    """
    total_debt = Installment.objects.filter(status__in=['pending', 'overdue']).aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0')
    
    return total_debt


def calculate_unit_counts() -> Dict[str, int]:
    """
    Calculate unit statistics.
    
    Returns:
        Dict containing unit counts by status
    """
    total_units = Unit.objects.count()
    available_units = Unit.objects.filter(status='available').count()
    sold_units = Unit.objects.filter(status='sold').count()
    reserved_units = Unit.objects.filter(status='reserved').count()
    
    return {
        'total_units': total_units,
        'available_units': available_units,
        'sold_units': sold_units,
        'reserved_units': reserved_units
    }


def calculate_investor_count() -> int:
    """
    Calculate total number of investors (partners).
    
    Returns:
        int: Number of investors
    """
    return PartnerDebt.objects.values('partner').distinct().count()


def calculate_dashboard_kpis() -> Dict[str, Any]:
    """
    Calculate all dashboard KPIs.
    
    Returns:
        Dict containing all dashboard metrics
    """
    sales_data = calculate_total_sales()
    unit_data = calculate_unit_counts()
    
    return {
        'total_sales': sales_data['total_sales'],
        'total_customers': Customer.objects.count(),
        'total_units': unit_data['total_units'],
        'available_units': unit_data['available_units'],
        'sold_units': unit_data['sold_units'],
        'total_contracts': sales_data['total_contracts'],
        'active_contracts': sales_data['active_contracts'],
        'completed_contracts': sales_data['completed_contracts'],
        'total_receipts': calculate_total_receipts(),
        'total_expenses': calculate_total_expenses(),
        'total_debt': calculate_total_debt(),
        'investor_count': calculate_investor_count(),
    }


def calculate_monthly_sales(year: int, month: int) -> Dict[str, Any]:
    """
    Calculate sales for a specific month.
    
    Args:
        year: Year
        month: Month (1-12)
        
    Returns:
        Dict containing monthly sales data
    """
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    monthly_contracts = Contract.objects.filter(
        created_at__gte=start_date,
        created_at__lt=end_date
    )
    
    monthly_sales = monthly_contracts.aggregate(total=Sum('final_price'))['total'] or Decimal('0')
    
    return {
        'monthly_sales': monthly_sales,
        'contract_count': monthly_contracts.count(),
        'year': year,
        'month': month
    }


def calculate_partner_share(contract: Contract, partner_id: int) -> Dict[str, Any]:
    """
    Calculate partner's share in a contract.
    
    Args:
        contract: The contract object
        partner_id: Partner ID
        
    Returns:
        Dict containing partner share information
    """
    # This would need to be implemented based on the specific business logic
    # for how partners share in contracts
    pass


def calculate_installment_amount(contract: Contract) -> Decimal:
    """
    Calculate installment amount for a contract.
    
    Args:
        contract: The contract object
        
    Returns:
        Decimal: Installment amount
    """
    if contract.installment_count > 0:
        remaining_amount = contract.final_price - contract.down_payment
        return remaining_amount / contract.installment_count
    
    return Decimal('0')


def calculate_contract_summary(contract_id: int) -> Dict[str, Any]:
    """
    Calculate comprehensive summary for a contract.
    
    Args:
        contract_id: Contract ID
        
    Returns:
        Dict containing contract summary
    """
    try:
        contract = Contract.objects.get(id=contract_id)
        
        remaining_data = calculate_remaining(contract)
        collection_percentage = calculate_collection_percentage(contract)
        installment_amount = calculate_installment_amount(contract)
        
        return {
            'contract_id': contract_id,
            'contract_number': contract.contract_number,
            'customer_name': contract.customer.name,
            'unit_number': contract.unit.unit_number,
            'total_price': contract.total_price,
            'final_price': contract.final_price,
            'down_payment': contract.down_payment,
            'remaining_amount': remaining_data['remaining_amount'],
            'remaining_percentage': remaining_data['remaining_percentage'],
            'collection_percentage': collection_percentage,
            'installment_amount': installment_amount,
            'installment_count': contract.installment_count,
            'status': contract.status,
        }
    except Contract.DoesNotExist:
        return {}


def calculate_safe_balance(safe_id: int) -> Decimal:
    """
    Calculate current balance of a safe.
    
    Args:
        safe_id: Safe ID
        
    Returns:
        Decimal: Current balance
    """
    try:
        safe = Safe.objects.get(id=safe_id)
        
        # Calculate total deposits
        total_deposits = Transfer.objects.filter(
            to_safe=safe,
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # Calculate total withdrawals
        total_withdrawals = Transfer.objects.filter(
            from_safe=safe,
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        return safe.initial_balance + total_deposits - total_withdrawals
        
    except Safe.DoesNotExist:
        return Decimal('0')


def calculate_broker_commission(broker_id: int, start_date: datetime = None, end_date: datetime = None) -> Dict[str, Any]:
    """
    Calculate broker commission for a specific period.
    
    Args:
        broker_id: Broker ID
        start_date: Start date for calculation
        end_date: End date for calculation
        
    Returns:
        Dict containing commission information
    """
    try:
        broker = Broker.objects.get(id=broker_id)
        
        commissions = BrokerDue.objects.filter(broker=broker)
        
        if start_date:
            commissions = commissions.filter(created_at__gte=start_date)
        if end_date:
            commissions = commissions.filter(created_at__lte=end_date)
        
        total_commission = commissions.aggregate(total=Sum('commission_amount'))['total'] or Decimal('0')
        paid_commission = commissions.filter(status='paid').aggregate(
            total=Sum('commission_amount')
        )['total'] or Decimal('0')
        
        return {
            'broker_name': broker.name,
            'total_commission': total_commission,
            'paid_commission': paid_commission,
            'pending_commission': total_commission - paid_commission,
            'commission_count': commissions.count()
        }
        
    except Broker.DoesNotExist:
        return {}


def calculate_financial_summary() -> Dict[str, Any]:
    """
    Calculate comprehensive financial summary.
    
    Returns:
        Dict containing all financial metrics
    """
    sales_data = calculate_total_sales()
    
    return {
        'total_sales': sales_data['total_sales'],
        'total_receipts': calculate_total_receipts(),
        'total_expenses': calculate_total_expenses(),
        'total_debt': calculate_total_debt(),
        'net_profit': sales_data['total_sales'] - calculate_total_expenses(),
        'receipt_rate': float(calculate_total_receipts() / sales_data['total_sales'] * 100) if sales_data['total_sales'] > 0 else 0,
    }