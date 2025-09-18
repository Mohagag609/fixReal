from decimal import Decimal, ROUND_HALF_UP
from django.db.models import Sum, Q
from django.db import transaction
from ..models import (
    Invoice, Bill, Payment, JournalEntry, JournalEntryLine,
    ChartOfAccounts, BankAccount, BankTransaction
)


class FinancialCalculations:
    """Financial calculations and business logic"""
    
    @staticmethod
    def calculate_invoice_totals(invoice):
        """Calculate invoice subtotal, tax, and total"""
        items = invoice.items.all()
        subtotal = sum(item.line_total for item in items)
        
        # Calculate tax
        tax_amount = Decimal('0')
        for item in items:
            if item.tax_rate > 0:
                tax_amount += (item.line_total * item.tax_rate / 100)
        
        total = subtotal + tax_amount
        
        # Update invoice
        invoice.subtotal = subtotal.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        invoice.tax_amount = tax_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        invoice.total_amount = total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        invoice.save()
        
        return {
            'subtotal': invoice.subtotal,
            'tax_amount': invoice.tax_amount,
            'total_amount': invoice.total_amount
        }
    
    @staticmethod
    def calculate_bill_totals(bill):
        """Calculate bill subtotal, tax, and total"""
        items = bill.items.all()
        subtotal = sum(item.line_total for item in items)
        
        # Calculate tax
        tax_amount = Decimal('0')
        for item in items:
            if item.tax_rate > 0:
                tax_amount += (item.line_total * item.tax_rate / 100)
        
        total = subtotal + tax_amount
        
        # Update bill
        bill.subtotal = subtotal.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        bill.tax_amount = tax_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        bill.total_amount = total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        bill.save()
        
        return {
            'subtotal': bill.subtotal,
            'tax_amount': bill.tax_amount,
            'total_amount': bill.total_amount
        }
    
    @staticmethod
    def calculate_account_balance(account, as_of_date=None):
        """Calculate account balance as of specific date"""
        if as_of_date is None:
            as_of_date = timezone.now().date()
        
        # Get all journal entry lines for this account
        lines = JournalEntryLine.objects.filter(
            account=account,
            journal_entry__entry_date__lte=as_of_date,
            journal_entry__is_posted=True
        )
        
        # Calculate balance based on account type
        if account.normal_balance == 'DEBIT':
            debit_total = lines.aggregate(Sum('debit_amount'))['debit_amount__sum'] or Decimal('0')
            credit_total = lines.aggregate(Sum('credit_amount'))['credit_amount__sum'] or Decimal('0')
            balance = debit_total - credit_total
        else:  # CREDIT
            debit_total = lines.aggregate(Sum('debit_amount'))['debit_amount__sum'] or Decimal('0')
            credit_total = lines.aggregate(Sum('credit_amount'))['credit_amount__sum'] or Decimal('0')
            balance = credit_total - debit_total
        
        return balance.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    @staticmethod
    def calculate_trial_balance(as_of_date=None):
        """Calculate trial balance"""
        if as_of_date is None:
            as_of_date = timezone.now().date()
        
        accounts = ChartOfAccounts.objects.filter(is_parent=False)
        trial_balance = []
        
        total_debits = Decimal('0')
        total_credits = Decimal('0')
        
        for account in accounts:
            balance = FinancialCalculations.calculate_account_balance(account, as_of_date)
            
            if balance != 0:
                if account.normal_balance == 'DEBIT':
                    trial_balance.append({
                        'account': account,
                        'debit': balance,
                        'credit': Decimal('0')
                    })
                    total_debits += balance
                else:
                    trial_balance.append({
                        'account': account,
                        'debit': Decimal('0'),
                        'credit': balance
                    })
                    total_credits += balance
        
        return {
            'trial_balance': trial_balance,
            'total_debits': total_debits,
            'total_credits': total_credits,
            'is_balanced': total_debits == total_credits
        }
    
    @staticmethod
    def calculate_aged_receivables(customer=None, as_of_date=None):
        """Calculate aged receivables report"""
        if as_of_date is None:
            as_of_date = timezone.now().date()
        
        invoices = Invoice.objects.filter(
            status__in=['SENT', 'OVERDUE'],
            company__is_active=True
        )
        
        if customer:
            invoices = invoices.filter(customer=customer)
        
        aged_data = {
            'current': Decimal('0'),
            '1_30_days': Decimal('0'),
            '31_60_days': Decimal('0'),
            '61_90_days': Decimal('0'),
            'over_90_days': Decimal('0'),
            'total': Decimal('0')
        }
        
        for invoice in invoices:
            days_overdue = (as_of_date - invoice.due_date).days
            balance = invoice.balance_due
            
            if days_overdue <= 0:
                aged_data['current'] += balance
            elif days_overdue <= 30:
                aged_data['1_30_days'] += balance
            elif days_overdue <= 60:
                aged_data['31_60_days'] += balance
            elif days_overdue <= 90:
                aged_data['61_90_days'] += balance
            else:
                aged_data['over_90_days'] += balance
            
            aged_data['total'] += balance
        
        return aged_data
    
    @staticmethod
    def calculate_aged_payables(vendor=None, as_of_date=None):
        """Calculate aged payables report"""
        if as_of_date is None:
            as_of_date = timezone.now().date()
        
        bills = Bill.objects.filter(
            status__in=['RECEIVED', 'OVERDUE'],
            company__is_active=True
        )
        
        if vendor:
            bills = bills.filter(vendor=vendor)
        
        aged_data = {
            'current': Decimal('0'),
            '1_30_days': Decimal('0'),
            '31_60_days': Decimal('0'),
            '61_90_days': Decimal('0'),
            'over_90_days': Decimal('0'),
            'total': Decimal('0')
        }
        
        for bill in bills:
            days_overdue = (as_of_date - bill.due_date).days
            balance = bill.balance_due
            
            if days_overdue <= 0:
                aged_data['current'] += balance
            elif days_overdue <= 30:
                aged_data['1_30_days'] += balance
            elif days_overdue <= 60:
                aged_data['31_60_days'] += balance
            elif days_overdue <= 90:
                aged_data['61_90_days'] += balance
            else:
                aged_data['over_90_days'] += balance
            
            aged_data['total'] += balance
        
        return aged_data
    
    @staticmethod
    def calculate_profit_loss(start_date, end_date, company):
        """Calculate profit and loss statement"""
        # Revenue accounts
        revenue_accounts = ChartOfAccounts.objects.filter(
            account_type='REVENUE',
            company=company
        )
        
        # Expense accounts
        expense_accounts = ChartOfAccounts.objects.filter(
            account_type='EXPENSE',
            company=company
        )
        
        revenue_total = Decimal('0')
        expense_total = Decimal('0')
        
        # Calculate revenue
        for account in revenue_accounts:
            balance = FinancialCalculations.calculate_account_balance(account, end_date)
            revenue_total += balance
        
        # Calculate expenses
        for account in expense_accounts:
            balance = FinancialCalculations.calculate_account_balance(account, end_date)
            expense_total += balance
        
        net_income = revenue_total - expense_total
        
        return {
            'revenue_total': revenue_total,
            'expense_total': expense_total,
            'net_income': net_income,
            'start_date': start_date,
            'end_date': end_date
        }
    
    @staticmethod
    def calculate_balance_sheet(as_of_date, company):
        """Calculate balance sheet"""
        # Assets
        asset_accounts = ChartOfAccounts.objects.filter(
            account_type='ASSET',
            company=company
        )
        
        # Liabilities
        liability_accounts = ChartOfAccounts.objects.filter(
            account_type='LIABILITY',
            company=company
        )
        
        # Equity
        equity_accounts = ChartOfAccounts.objects.filter(
            account_type='EQUITY',
            company=company
        )
        
        total_assets = Decimal('0')
        total_liabilities = Decimal('0')
        total_equity = Decimal('0')
        
        # Calculate assets
        for account in asset_accounts:
            balance = FinancialCalculations.calculate_account_balance(account, as_of_date)
            total_assets += balance
        
        # Calculate liabilities
        for account in liability_accounts:
            balance = FinancialCalculations.calculate_account_balance(account, as_of_date)
            total_liabilities += balance
        
        # Calculate equity
        for account in equity_accounts:
            balance = FinancialCalculations.calculate_account_balance(account, as_of_date)
            total_equity += balance
        
        return {
            'total_assets': total_assets,
            'total_liabilities': total_liabilities,
            'total_equity': total_equity,
            'is_balanced': total_assets == (total_liabilities + total_equity),
            'as_of_date': as_of_date
        }
    
    @staticmethod
    @transaction.atomic
    def post_journal_entry(journal_entry):
        """Post journal entry and update account balances"""
        if journal_entry.is_posted:
            raise ValueError("Journal entry is already posted")
        
        # Validate debits equal credits
        total_debits = journal_entry.lines.aggregate(Sum('debit_amount'))['debit_amount__sum'] or Decimal('0')
        total_credits = journal_entry.lines.aggregate(Sum('credit_amount'))['credit_amount__sum'] or Decimal('0')
        
        if total_debits != total_credits:
            raise ValueError("Total debits must equal total credits")
        
        # Update journal entry totals
        journal_entry.total_debit = total_debits
        journal_entry.total_credit = total_credits
        journal_entry.is_posted = True
        journal_entry.save()
        
        return True
    
    @staticmethod
    def calculate_bank_balance(bank_account, as_of_date=None):
        """Calculate bank account balance"""
        if as_of_date is None:
            as_of_date = timezone.now().date()
        
        transactions = BankTransaction.objects.filter(
            bank_account=bank_account,
            transaction_date__lte=as_of_date
        ).order_by('transaction_date')
        
        balance = bank_account.opening_balance
        
        for transaction in transactions:
            if transaction.transaction_type in ['DEPOSIT', 'TRANSFER_IN']:
                balance += transaction.amount
            else:  # WITHDRAWAL, TRANSFER_OUT
                balance -= transaction.amount
        
        return balance.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


# Import timezone for date calculations
from django.utils import timezone