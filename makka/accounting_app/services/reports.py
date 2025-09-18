from decimal import Decimal
from django.db.models import Sum, Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
import csv
import io
from ..models import (
    Invoice, Bill, Payment, Customer, Vendor, Company,
    ChartOfAccounts, JournalEntry, BankAccount
)


class ReportGenerator:
    """Report generation and export functionality"""
    
    def __init__(self, company):
        self.company = company
    
    def generate_invoice_report(self, start_date, end_date, status=None, customer=None):
        """Generate invoice report"""
        invoices = Invoice.objects.filter(
            company=self.company,
            invoice_date__range=[start_date, end_date]
        )
        
        if status:
            invoices = invoices.filter(status=status)
        
        if customer:
            invoices = invoices.filter(customer=customer)
        
        report_data = {
            'invoices': invoices,
            'total_invoices': invoices.count(),
            'total_amount': invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0'),
            'paid_amount': invoices.aggregate(Sum('paid_amount'))['paid_amount__sum'] or Decimal('0'),
            'outstanding_amount': invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0') - 
                                (invoices.aggregate(Sum('paid_amount'))['paid_amount__sum'] or Decimal('0')),
            'start_date': start_date,
            'end_date': end_date
        }
        
        return report_data
    
    def generate_bill_report(self, start_date, end_date, status=None, vendor=None):
        """Generate bill report"""
        bills = Bill.objects.filter(
            company=self.company,
            bill_date__range=[start_date, end_date]
        )
        
        if status:
            bills = bills.filter(status=status)
        
        if vendor:
            bills = bills.filter(vendor=vendor)
        
        report_data = {
            'bills': bills,
            'total_bills': bills.count(),
            'total_amount': bills.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0'),
            'paid_amount': bills.aggregate(Sum('paid_amount'))['paid_amount__sum'] or Decimal('0'),
            'outstanding_amount': bills.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0') - 
                                (bills.aggregate(Sum('paid_amount'))['paid_amount__sum'] or Decimal('0')),
            'start_date': start_date,
            'end_date': end_date
        }
        
        return report_data
    
    def generate_customer_statement(self, customer, start_date, end_date):
        """Generate customer statement"""
        invoices = Invoice.objects.filter(
            company=self.company,
            customer=customer,
            invoice_date__range=[start_date, end_date]
        ).order_by('invoice_date')
        
        payments = Payment.objects.filter(
            company=self.company,
            customer=customer,
            payment_date__range=[start_date, end_date]
        ).order_by('payment_date')
        
        # Calculate opening balance
        opening_balance = Decimal('0')
        opening_invoices = Invoice.objects.filter(
            company=self.company,
            customer=customer,
            invoice_date__lt=start_date
        )
        opening_payments = Payment.objects.filter(
            company=self.company,
            customer=customer,
            payment_date__lt=start_date
        )
        
        opening_balance += sum(inv.total_amount for inv in opening_invoices)
        opening_balance -= sum(pay.amount for pay in opening_payments)
        
        # Calculate closing balance
        closing_balance = opening_balance
        closing_balance += sum(inv.total_amount for inv in invoices)
        closing_balance -= sum(pay.amount for pay in payments)
        
        statement_data = {
            'customer': customer,
            'invoices': invoices,
            'payments': payments,
            'opening_balance': opening_balance,
            'closing_balance': closing_balance,
            'start_date': start_date,
            'end_date': end_date
        }
        
        return statement_data
    
    def generate_vendor_statement(self, vendor, start_date, end_date):
        """Generate vendor statement"""
        bills = Bill.objects.filter(
            company=self.company,
            vendor=vendor,
            bill_date__range=[start_date, end_date]
        ).order_by('bill_date')
        
        payments = Payment.objects.filter(
            company=self.company,
            vendor=vendor,
            payment_date__range=[start_date, end_date]
        ).order_by('payment_date')
        
        # Calculate opening balance
        opening_balance = Decimal('0')
        opening_bills = Bill.objects.filter(
            company=self.company,
            vendor=vendor,
            bill_date__lt=start_date
        )
        opening_payments = Payment.objects.filter(
            company=self.company,
            vendor=vendor,
            payment_date__lt=start_date
        )
        
        opening_balance += sum(bill.total_amount for bill in opening_bills)
        opening_balance -= sum(pay.amount for pay in opening_payments)
        
        # Calculate closing balance
        closing_balance = opening_balance
        closing_balance += sum(bill.total_amount for bill in bills)
        closing_balance -= sum(pay.amount for pay in payments)
        
        statement_data = {
            'vendor': vendor,
            'bills': bills,
            'payments': payments,
            'opening_balance': opening_balance,
            'closing_balance': closing_balance,
            'start_date': start_date,
            'end_date': end_date
        }
        
        return statement_data
    
    def generate_sales_summary(self, start_date, end_date):
        """Generate sales summary report"""
        invoices = Invoice.objects.filter(
            company=self.company,
            invoice_date__range=[start_date, end_date],
            status__in=['SENT', 'PAID']
        )
        
        # Group by customer
        customer_sales = {}
        for invoice in invoices:
            customer = invoice.customer
            if customer not in customer_sales:
                customer_sales[customer] = {
                    'invoice_count': 0,
                    'total_amount': Decimal('0')
                }
            customer_sales[customer]['invoice_count'] += 1
            customer_sales[customer]['total_amount'] += invoice.total_amount
        
        # Group by month
        monthly_sales = {}
        current_date = start_date
        while current_date <= end_date:
            month_key = current_date.strftime('%Y-%m')
            monthly_invoices = invoices.filter(
                invoice_date__year=current_date.year,
                invoice_date__month=current_date.month
            )
            monthly_sales[month_key] = {
                'invoice_count': monthly_invoices.count(),
                'total_amount': monthly_invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0')
            }
            current_date += timedelta(days=32)
            current_date = current_date.replace(day=1)
        
        summary_data = {
            'total_invoices': invoices.count(),
            'total_sales': invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0'),
            'customer_sales': customer_sales,
            'monthly_sales': monthly_sales,
            'start_date': start_date,
            'end_date': end_date
        }
        
        return summary_data
    
    def generate_expense_summary(self, start_date, end_date):
        """Generate expense summary report"""
        bills = Bill.objects.filter(
            company=self.company,
            bill_date__range=[start_date, end_date],
            status__in=['RECEIVED', 'PAID']
        )
        
        # Group by vendor
        vendor_expenses = {}
        for bill in bills:
            vendor = bill.vendor
            if vendor not in vendor_expenses:
                vendor_expenses[vendor] = {
                    'bill_count': 0,
                    'total_amount': Decimal('0')
                }
            vendor_expenses[vendor]['bill_count'] += 1
            vendor_expenses[vendor]['total_amount'] += bill.total_amount
        
        # Group by month
        monthly_expenses = {}
        current_date = start_date
        while current_date <= end_date:
            month_key = current_date.strftime('%Y-%m')
            monthly_bills = bills.filter(
                bill_date__year=current_date.year,
                bill_date__month=current_date.month
            )
            monthly_expenses[month_key] = {
                'bill_count': monthly_bills.count(),
                'total_amount': monthly_bills.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0')
            }
            current_date += timedelta(days=32)
            current_date = current_date.replace(day=1)
        
        summary_data = {
            'total_bills': bills.count(),
            'total_expenses': bills.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0'),
            'vendor_expenses': vendor_expenses,
            'monthly_expenses': monthly_expenses,
            'start_date': start_date,
            'end_date': end_date
        }
        
        return summary_data
    
    def generate_cash_flow_report(self, start_date, end_date):
        """Generate cash flow report"""
        # Cash inflows
        customer_payments = Payment.objects.filter(
            company=self.company,
            payment_type='CUSTOMER_PAYMENT',
            payment_date__range=[start_date, end_date]
        )
        
        # Cash outflows
        vendor_payments = Payment.objects.filter(
            company=self.company,
            payment_type='VENDOR_PAYMENT',
            payment_date__range=[start_date, end_date]
        )
        
        # Bank transactions
        bank_accounts = BankAccount.objects.filter(company=self.company)
        bank_inflows = Decimal('0')
        bank_outflows = Decimal('0')
        
        for account in bank_accounts:
            deposits = account.transactions.filter(
                transaction_type__in=['DEPOSIT', 'TRANSFER_IN'],
                transaction_date__range=[start_date, end_date]
            ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
            
            withdrawals = account.transactions.filter(
                transaction_type__in=['WITHDRAWAL', 'TRANSFER_OUT'],
                transaction_date__range=[start_date, end_date]
            ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
            
            bank_inflows += deposits
            bank_outflows += withdrawals
        
        total_inflows = (customer_payments.aggregate(Sum('amount'))['amount__sum'] or Decimal('0')) + bank_inflows
        total_outflows = (vendor_payments.aggregate(Sum('amount'))['amount__sum'] or Decimal('0')) + bank_outflows
        net_cash_flow = total_inflows - total_outflows
        
        cash_flow_data = {
            'customer_payments': customer_payments.aggregate(Sum('amount'))['amount__sum'] or Decimal('0'),
            'vendor_payments': vendor_payments.aggregate(Sum('amount'))['amount__sum'] or Decimal('0'),
            'bank_inflows': bank_inflows,
            'bank_outflows': bank_outflows,
            'total_inflows': total_inflows,
            'total_outflows': total_outflows,
            'net_cash_flow': net_cash_flow,
            'start_date': start_date,
            'end_date': end_date
        }
        
        return cash_flow_data
    
    def export_to_csv(self, data, filename):
        """Export report data to CSV"""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers based on data structure
        if 'invoices' in data:
            writer.writerow(['Invoice Number', 'Date', 'Customer', 'Amount', 'Status'])
            for invoice in data['invoices']:
                writer.writerow([
                    invoice.invoice_number,
                    invoice.invoice_date,
                    invoice.customer.name,
                    invoice.total_amount,
                    invoice.status
                ])
        elif 'bills' in data:
            writer.writerow(['Bill Number', 'Date', 'Vendor', 'Amount', 'Status'])
            for bill in data['bills']:
                writer.writerow([
                    bill.bill_number,
                    bill.bill_date,
                    bill.vendor.name,
                    bill.total_amount,
                    bill.status
                ])
        
        return output.getvalue()
    
    def generate_tax_report(self, start_date, end_date):
        """Generate tax report"""
        invoices = Invoice.objects.filter(
            company=self.company,
            invoice_date__range=[start_date, end_date],
            status__in=['SENT', 'PAID']
        )
        
        bills = Bill.objects.filter(
            company=self.company,
            bill_date__range=[start_date, end_date],
            status__in=['RECEIVED', 'PAID']
        )
        
        # Calculate tax collected (from invoices)
        tax_collected = invoices.aggregate(Sum('tax_amount'))['tax_amount__sum'] or Decimal('0')
        
        # Calculate tax paid (from bills)
        tax_paid = bills.aggregate(Sum('tax_amount'))['tax_amount__sum'] or Decimal('0')
        
        # Net tax liability
        net_tax_liability = tax_collected - tax_paid
        
        tax_data = {
            'tax_collected': tax_collected,
            'tax_paid': tax_paid,
            'net_tax_liability': net_tax_liability,
            'start_date': start_date,
            'end_date': end_date
        }
        
        return tax_data