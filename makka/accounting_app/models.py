from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
from django.core.validators import MinValueValidator
import uuid


class BaseModel(models.Model):
    """Base model with common fields"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        abstract = True


class Company(BaseModel):
    """Company/Organization model"""
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    currency = models.CharField(max_length=3, default='USD')
    fiscal_year_start = models.DateField()
    
    def __str__(self):
        return self.name


class ChartOfAccounts(BaseModel):
    """Chart of Accounts"""
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    account_type = models.CharField(max_length=50, choices=[
        ('ASSET', 'Asset'),
        ('LIABILITY', 'Liability'),
        ('EQUITY', 'Equity'),
        ('REVENUE', 'Revenue'),
        ('EXPENSE', 'Expense'),
    ])
    parent_account = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)
    is_parent = models.BooleanField(default=False)
    normal_balance = models.CharField(max_length=10, choices=[
        ('DEBIT', 'Debit'),
        ('CREDIT', 'Credit'),
    ])
    description = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Customer(BaseModel):
    """Customer model"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True)
    credit_limit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    payment_terms = models.IntegerField(default=30)  # days
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Vendor(BaseModel):
    """Vendor/Supplier model"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True)
    payment_terms = models.IntegerField(default=30)  # days
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Invoice(BaseModel):
    """Invoice model"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=[
        ('DRAFT', 'Draft'),
        ('SENT', 'Sent'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
        ('CANCELLED', 'Cancelled'),
    ], default='DRAFT')
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-invoice_date']
    
    def __str__(self):
        return f"Invoice {self.invoice_number}"
    
    @property
    def balance_due(self):
        return self.total_amount - self.paid_amount


class InvoiceItem(BaseModel):
    """Invoice line items"""
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    unit_price = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    def save(self, *args, **kwargs):
        self.line_total = self.quantity * self.unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.description} - {self.quantity} x {self.unit_price}"


class Bill(BaseModel):
    """Bill/Vendor Invoice model"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    bill_number = models.CharField(max_length=50)
    bill_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=[
        ('DRAFT', 'Draft'),
        ('RECEIVED', 'Received'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
        ('CANCELLED', 'Cancelled'),
    ], default='DRAFT')
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-bill_date']
    
    def __str__(self):
        return f"Bill {self.bill_number}"
    
    @property
    def balance_due(self):
        return self.total_amount - self.paid_amount


class BillItem(BaseModel):
    """Bill line items"""
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    unit_price = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    def save(self, *args, **kwargs):
        self.line_total = self.quantity * self.unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.description} - {self.quantity} x {self.unit_price}"


class Payment(BaseModel):
    """Payment model"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    payment_type = models.CharField(max_length=20, choices=[
        ('CUSTOMER_PAYMENT', 'Customer Payment'),
        ('VENDOR_PAYMENT', 'Vendor Payment'),
    ])
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, null=True, blank=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=[
        ('CASH', 'Cash'),
        ('CHECK', 'Check'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CREDIT_CARD', 'Credit Card'),
        ('OTHER', 'Other'),
    ])
    reference = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-payment_date']
    
    def __str__(self):
        return f"Payment {self.amount} - {self.payment_date}"


class PaymentAllocation(BaseModel):
    """Payment allocation to invoices/bills"""
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='allocations')
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, null=True, blank=True)
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, null=True, blank=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    
    def __str__(self):
        return f"Allocation {self.amount}"


class JournalEntry(BaseModel):
    """Journal Entry model"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    entry_number = models.CharField(max_length=50, unique=True)
    entry_date = models.DateField()
    description = models.CharField(max_length=255)
    reference = models.CharField(max_length=100, blank=True, null=True)
    total_debit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_credit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    is_posted = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-entry_date']
    
    def __str__(self):
        return f"JE {self.entry_number} - {self.description}"


class JournalEntryLine(BaseModel):
    """Journal Entry Line Items"""
    journal_entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(ChartOfAccounts, on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    debit_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    credit_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.account.code} - {self.description}"


class BankAccount(BaseModel):
    """Bank Account model"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    account_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=50)
    bank_name = models.CharField(max_length=255)
    account_type = models.CharField(max_length=20, choices=[
        ('CHECKING', 'Checking'),
        ('SAVINGS', 'Savings'),
        ('MONEY_MARKET', 'Money Market'),
        ('OTHER', 'Other'),
    ])
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.bank_name} - {self.account_name}"


class BankTransaction(BaseModel):
    """Bank Transaction model"""
    bank_account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='transactions')
    transaction_date = models.DateField()
    description = models.CharField(max_length=255)
    reference = models.CharField(max_length=100, blank=True, null=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    balance_after = models.DecimalField(max_digits=15, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=[
        ('DEPOSIT', 'Deposit'),
        ('WITHDRAWAL', 'Withdrawal'),
        ('TRANSFER_IN', 'Transfer In'),
        ('TRANSFER_OUT', 'Transfer Out'),
    ])
    
    class Meta:
        ordering = ['-transaction_date']
    
    def __str__(self):
        return f"{self.description} - {self.amount}"


class TaxRate(BaseModel):
    """Tax Rate model"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    rate = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} - {self.rate}%"


class Product(BaseModel):
    """Product/Service model"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    sku = models.CharField(max_length=100, unique=True)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    cost_price = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    tax_rate = models.ForeignKey(TaxRate, on_delete=models.SET_NULL, null=True, blank=True)
    is_service = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class InventoryItem(BaseModel):
    """Inventory tracking"""
    product = models.OneToOneField(Product, on_delete=models.CASCADE)
    quantity_on_hand = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    minimum_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    maximum_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reorder_point = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.product.name} - {self.quantity_on_hand}"


class UserProfile(BaseModel):
    """User Profile extension"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, choices=[
        ('ADMIN', 'Administrator'),
        ('ACCOUNTANT', 'Accountant'),
        ('MANAGER', 'Manager'),
        ('VIEWER', 'Viewer'),
    ])
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.role}"