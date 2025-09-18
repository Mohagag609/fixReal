"""
Financial services for accounting operations
"""
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from ..models import Safe, Voucher, Transfer, Installment, Contract


class SafeService:
    """Service for safe operations"""
    
    @staticmethod
    @transaction.atomic
    def update_balance_on_voucher(safe, amount, voucher_type):
        """
        Update safe balance when voucher is created/updated/deleted
        
        Args:
            safe: Safe instance
            amount: Decimal amount
            voucher_type: 'receipt' or 'payment'
        """
        if voucher_type == 'receipt':
            safe.balance += amount
        else:  # payment
            safe.balance -= amount
        
        safe.save()
        return safe
    
    @staticmethod
    @transaction.atomic
    def transfer_money(from_safe, to_safe, amount):
        """
        Transfer money between safes
        
        Args:
            from_safe: Source safe
            to_safe: Destination safe
            amount: Decimal amount to transfer
        """
        from_safe.balance -= amount
        to_safe.balance += amount
        
        from_safe.save()
        to_safe.save()
        
        return from_safe, to_safe
    
    @staticmethod
    def get_safe_balance(safe_id):
        """Get current balance of a safe"""
        try:
            safe = Safe.objects.get(id=safe_id, deleted_at__isnull=True)
            return safe.balance
        except Safe.DoesNotExist:
            return Decimal('0')


class InstallmentService:
    """Service for installment operations"""
    
    @staticmethod
    @transaction.atomic
    def create_installments_for_contract(contract):
        """
        Create installments for a contract
        
        Args:
            contract: Contract instance
        """
        if contract.payment_type != 'installment' or contract.installment_count <= 0:
            return []
        
        # Delete existing installments
        Installment.objects.filter(
            unit=contract.unit, 
            deleted_at__isnull=True
        ).update(deleted_at=timezone.now())
        
        # Calculate installment amount
        remaining_amount = (
            contract.total_price - 
            contract.discount_amount - 
            contract.down_payment
        )
        installment_amount = remaining_amount / contract.installment_count
        
        # Create installments
        installments = []
        for i in range(contract.installment_count):
            due_date = contract.start + timezone.timedelta(days=30 * (i + 1))
            installment = Installment.objects.create(
                unit=contract.unit,
                amount=installment_amount,
                due_date=due_date,
                status='معلق'
            )
            installments.append(installment)
        
        return installments
    
    @staticmethod
    def calculate_installment_amount(total_price, discount_amount, down_payment, installment_count):
        """
        Calculate installment amount
        
        Args:
            total_price: Total contract price
            discount_amount: Discount amount
            down_payment: Down payment amount
            installment_count: Number of installments
            
        Returns:
            Decimal: Installment amount
        """
        if installment_count <= 0:
            return Decimal('0')
        
        remaining_amount = total_price - discount_amount - down_payment
        return remaining_amount / installment_count
    
    @staticmethod
    def get_pending_installments_count():
        """Get count of pending installments"""
        return Installment.objects.filter(
            deleted_at__isnull=True,
            status='معلق'
        ).count()
    
    @staticmethod
    def get_total_paid_installments():
        """Get total amount of paid installments"""
        result = Installment.objects.filter(
            deleted_at__isnull=True,
            status='مدفوع'
        ).aggregate(total=models.Sum('amount'))
        
        return result['total'] or Decimal('0')


class ContractService:
    """Service for contract operations"""
    
    @staticmethod
    def calculate_contract_value(total_price, discount_amount, down_payment):
        """
        Calculate contract value after discounts and down payment
        
        Args:
            total_price: Original total price
            discount_amount: Discount amount
            down_payment: Down payment amount
            
        Returns:
            dict: Calculated values
        """
        net_price = total_price - discount_amount
        remaining_amount = net_price - down_payment
        
        return {
            'net_price': net_price,
            'remaining_amount': remaining_amount,
            'discount_percentage': (discount_amount / total_price * 100) if total_price > 0 else 0
        }
    
    @staticmethod
    def get_contract_statistics():
        """Get contract statistics for dashboard"""
        from django.db.models import Sum, Count
        
        contracts = Contract.objects.filter(deleted_at__isnull=True)
        
        total_contracts = contracts.count()
        total_value = contracts.aggregate(
            total=Sum('total_price')
        )['total'] or Decimal('0')
        
        return {
            'total_contracts': total_contracts,
            'total_value': total_value
        }


class VoucherService:
    """Service for voucher operations"""
    
    @staticmethod
    @transaction.atomic
    def create_voucher(voucher_data):
        """
        Create voucher and update safe balance
        
        Args:
            voucher_data: Dictionary with voucher data
            
        Returns:
            Voucher: Created voucher instance
        """
        voucher = Voucher.objects.create(**voucher_data)
        
        # Update safe balance
        SafeService.update_balance_on_voucher(
            voucher.safe,
            voucher.amount,
            voucher.type
        )
        
        return voucher
    
    @staticmethod
    @transaction.atomic
    def update_voucher(voucher, voucher_data):
        """
        Update voucher and recalculate safe balances
        
        Args:
            voucher: Voucher instance to update
            voucher_data: Dictionary with new voucher data
            
        Returns:
            Voucher: Updated voucher instance
        """
        old_safe = voucher.safe
        old_amount = voucher.amount
        old_type = voucher.type
        
        # Revert old safe balance
        SafeService.update_balance_on_voucher(old_safe, old_amount, old_type)
        
        # Update voucher
        for key, value in voucher_data.items():
            setattr(voucher, key, value)
        voucher.save()
        
        # Update new safe balance
        SafeService.update_balance_on_voucher(
            voucher.safe,
            voucher.amount,
            voucher.type
        )
        
        return voucher
    
    @staticmethod
    @transaction.atomic
    def delete_voucher(voucher):
        """
        Delete voucher and revert safe balance
        
        Args:
            voucher: Voucher instance to delete
        """
        # Revert safe balance
        SafeService.update_balance_on_voucher(
            voucher.safe,
            voucher.amount,
            voucher.type
        )
        
        # Soft delete voucher
        voucher.deleted_at = timezone.now()
        voucher.save()


class TransferService:
    """Service for transfer operations"""
    
    @staticmethod
    @transaction.atomic
    def create_transfer(transfer_data):
        """
        Create transfer and update both safe balances
        
        Args:
            transfer_data: Dictionary with transfer data
            
        Returns:
            Transfer: Created transfer instance
        """
        transfer = Transfer.objects.create(**transfer_data)
        
        # Update both safe balances
        SafeService.transfer_money(
            transfer.from_safe,
            transfer.to_safe,
            transfer.amount
        )
        
        return transfer
    
    @staticmethod
    @transaction.atomic
    def delete_transfer(transfer):
        """
        Delete transfer and revert both safe balances
        
        Args:
            transfer: Transfer instance to delete
        """
        # Revert both safe balances
        SafeService.transfer_money(
            transfer.to_safe,  # Reverse direction
            transfer.from_safe,
            transfer.amount
        )
        
        # Soft delete transfer
        transfer.deleted_at = timezone.now()
        transfer.save()