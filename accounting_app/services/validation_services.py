"""
Validation services for business rules
"""
from decimal import Decimal
from django.core.exceptions import ValidationError
from ..models import Customer, Unit, UnitPartner, PartnerGroupPartner


class CustomerValidationService:
    """Validation service for customer operations"""
    
    @staticmethod
    def validate_phone_uniqueness(phone, customer_id=None):
        """
        Validate phone number uniqueness
        
        Args:
            phone: Phone number to validate
            customer_id: Customer ID to exclude from check (for updates)
            
        Returns:
            bool: True if valid, False otherwise
        """
        if not phone:
            return True
        
        queryset = Customer.objects.filter(
            phone=phone,
            deleted_at__isnull=True
        )
        
        if customer_id:
            queryset = queryset.exclude(id=customer_id)
        
        return not queryset.exists()
    
    @staticmethod
    def validate_national_id_uniqueness(national_id, customer_id=None):
        """
        Validate national ID uniqueness
        
        Args:
            national_id: National ID to validate
            customer_id: Customer ID to exclude from check (for updates)
            
        Returns:
            bool: True if valid, False otherwise
        """
        if not national_id:
            return True
        
        queryset = Customer.objects.filter(
            national_id=national_id,
            deleted_at__isnull=True
        )
        
        if customer_id:
            queryset = queryset.exclude(id=customer_id)
        
        return not queryset.exists()


class UnitValidationService:
    """Validation service for unit operations"""
    
    @staticmethod
    def validate_code_uniqueness(code, unit_id=None):
        """
        Validate unit code uniqueness
        
        Args:
            code: Unit code to validate
            unit_id: Unit ID to exclude from check (for updates)
            
        Returns:
            bool: True if valid, False otherwise
        """
        if not code:
            return False
        
        queryset = Unit.objects.filter(
            code=code,
            deleted_at__isnull=True
        )
        
        if unit_id:
            queryset = queryset.exclude(id=unit_id)
        
        return not queryset.exists()
    
    @staticmethod
    def generate_unit_code(name, floor, building):
        """
        Generate unit code based on name, floor, and building
        
        Args:
            name: Unit name
            floor: Floor number
            building: Building name
            
        Returns:
            str: Generated unit code
        """
        floor_str = str(floor or '0')
        building_str = str(building or '0')
        return f"{name}-{floor_str}-{building_str}"


class PartnerValidationService:
    """Validation service for partner operations"""
    
    @staticmethod
    def validate_partner_percentage(unit, percentage, partner_id=None):
        """
        Validate partner percentage doesn't exceed 100%
        
        Args:
            unit: Unit instance
            percentage: Percentage to validate
            partner_id: Partner ID to exclude from check (for updates)
            
        Returns:
            bool: True if valid, False otherwise
        """
        current_total = unit.unit_partners.filter(
            deleted_at__isnull=True
        ).exclude(
            id=partner_id
        ).aggregate(
            total=models.Sum('percentage')
        )['total'] or 0
        
        return (current_total + percentage) <= 100
    
    @staticmethod
    def get_remaining_percentage(unit, partner_id=None):
        """
        Get remaining percentage for a unit
        
        Args:
            unit: Unit instance
            partner_id: Partner ID to exclude from check
            
        Returns:
            Decimal: Remaining percentage
        """
        current_total = unit.unit_partners.filter(
            deleted_at__isnull=True
        ).exclude(
            id=partner_id
        ).aggregate(
            total=models.Sum('percentage')
        )['total'] or 0
        
        return 100 - current_total


class PartnerGroupValidationService:
    """Validation service for partner group operations"""
    
    @staticmethod
    def validate_group_name_uniqueness(name, group_id=None):
        """
        Validate partner group name uniqueness
        
        Args:
            name: Group name to validate
            group_id: Group ID to exclude from check (for updates)
            
        Returns:
            bool: True if valid, False otherwise
        """
        if not name:
            return False
        
        queryset = PartnerGroup.objects.filter(
            name=name,
            deleted_at__isnull=True
        )
        
        if group_id:
            queryset = queryset.exclude(id=group_id)
        
        return not queryset.exists()
    
    @staticmethod
    def validate_group_partner_percentage(group, percentage, partner_id=None):
        """
        Validate group partner percentage doesn't exceed 100%
        
        Args:
            group: PartnerGroup instance
            percentage: Percentage to validate
            partner_id: Partner ID to exclude from check (for updates)
            
        Returns:
            bool: True if valid, False otherwise
        """
        current_total = group.partners.filter(
            deleted_at__isnull=True
        ).exclude(
            id=partner_id
        ).aggregate(
            total=models.Sum('percentage')
        )['total'] or 0
        
        return (current_total + percentage) <= 100


class FinancialValidationService:
    """Validation service for financial operations"""
    
    @staticmethod
    def validate_safe_balance(safe, amount, operation_type):
        """
        Validate safe has sufficient balance for operation
        
        Args:
            safe: Safe instance
            amount: Amount to validate
            operation_type: 'withdrawal' or 'deposit'
            
        Returns:
            bool: True if valid, False otherwise
        """
        if operation_type == 'withdrawal':
            return safe.balance >= amount
        return True  # Deposits are always valid
    
    @staticmethod
    def validate_positive_amount(amount):
        """
        Validate amount is positive
        
        Args:
            amount: Amount to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        return amount > 0
    
    @staticmethod
    def validate_contract_amounts(total_price, discount_amount, down_payment):
        """
        Validate contract amounts are logical
        
        Args:
            total_price: Total contract price
            discount_amount: Discount amount
            down_payment: Down payment amount
            
        Returns:
            dict: Validation result with 'valid' and 'errors' keys
        """
        errors = []
        
        if total_price <= 0:
            errors.append("السعر الإجمالي يجب أن يكون أكبر من صفر")
        
        if discount_amount < 0:
            errors.append("مبلغ الخصم لا يمكن أن يكون سالب")
        
        if down_payment < 0:
            errors.append("المقدم لا يمكن أن يكون سالب")
        
        if discount_amount > total_price:
            errors.append("مبلغ الخصم لا يمكن أن يتجاوز السعر الإجمالي")
        
        if down_payment > (total_price - discount_amount):
            errors.append("المقدم لا يمكن أن يتجاوز السعر بعد الخصم")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }