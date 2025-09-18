# Migration Mapping Document - نظام إدارة العقارات

## نظرة عامة على المشروع
هذا المشروع هو نظام إدارة عقارات شامل مبني بـ Django مع PostgreSQL، يتضمن إدارة العملاء، الوحدات، العقود، الأقساط، الخزائن، السندات، الشركاء، السماسرة، والتحويلات المالية.

## 1. Models Mapping (Django Models)

### 1.1 BaseModel
```python
class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
```

### 1.2 Customer Model
- **Fields**: name, phone, national_id, address, status, notes
- **Constraints**: phone unique, national_id unique
- **Indexes**: status+deleted_at, name, phone, created_at

### 1.3 Unit Model
- **Fields**: code, name, unit_type, area, floor, building, total_price, status, notes
- **Choices**: UNIT_TYPE_CHOICES, STATUS_CHOICES
- **Constraints**: code unique
- **Indexes**: status+deleted_at, unit_type+deleted_at, total_price, created_at, code

### 1.4 Partner Model
- **Fields**: name, phone, notes
- **Indexes**: name, phone, deleted_at

### 1.5 UnitPartner Model (Many-to-Many with percentage)
- **Fields**: unit, partner, percentage
- **Constraints**: unique_together unit+partner
- **Indexes**: unit+deleted_at, partner+deleted_at

### 1.6 Contract Model
- **Fields**: unit, customer, start, total_price, discount_amount, broker_name, broker_percent, broker_amount, commission_safe_id, down_payment_safe_id, maintenance_deposit, installment_type, installment_count, extra_annual, annual_payment_value, down_payment, payment_type
- **Choices**: PAYMENT_TYPE_CHOICES, INSTALLMENT_TYPE_CHOICES
- **Indexes**: unit+deleted_at, customer+deleted_at, start, total_price, created_at

### 1.7 Installment Model
- **Fields**: unit, amount, due_date, status, notes
- **Choices**: STATUS_CHOICES
- **Indexes**: unit+deleted_at, status+deleted_at, due_date, amount

### 1.8 Safe Model
- **Fields**: name, balance
- **Constraints**: name unique

### 1.9 Voucher Model
- **Fields**: type, date, amount, safe, description, payer, beneficiary, linked_ref
- **Choices**: TYPE_CHOICES

### 1.10 Transfer Model
- **Fields**: from_safe, to_safe, amount, description

### 1.11 Broker Model
- **Fields**: name, phone, notes
- **Constraints**: name unique

### 1.12 PartnerDebt Model
- **Fields**: partner, amount, due_date, status, notes
- **Choices**: STATUS_CHOICES

### 1.13 BrokerDue Model
- **Fields**: broker, amount, due_date, status, notes
- **Choices**: STATUS_CHOICES

### 1.14 PartnerGroup Model
- **Fields**: name, notes
- **Constraints**: name unique

### 1.15 PartnerGroupPartner Model
- **Fields**: partner_group, partner, percentage
- **Constraints**: unique_together partner_group+partner

### 1.16 UnitPartnerGroup Model
- **Fields**: unit, partner_group
- **Constraints**: unique_together unit+partner_group

### 1.17 AuditLog Model
- **Fields**: action, entity_type, entity_id, old_values, new_values, user_id, ip_address, user_agent

### 1.18 Settings Model
- **Fields**: key, value
- **Constraints**: key unique

### 1.19 KeyVal Model
- **Fields**: key, value
- **Constraints**: key unique

## 2. Views Mapping (Class-Based Views)

### 2.1 Dashboard
- **View**: DashboardView
- **Template**: accounting_app/dashboard.html
- **KPIs**: total_contracts, total_customers, total_units, total_installments, total_contracts_value, total_installments_value, pending_installments

### 2.2 Customer Management
- **List**: CustomerListView (search, status filter, pagination)
- **Create**: CustomerCreateView (phone/national_id uniqueness validation)
- **Update**: CustomerUpdateView (phone/national_id uniqueness validation)
- **Delete**: CustomerDeleteView (soft delete)

### 2.3 Unit Management
- **List**: UnitListView (search, status filter, pagination)
- **Create**: UnitCreateView (auto-generate code)
- **Update**: UnitUpdateView (update code)
- **Delete**: UnitDeleteView (soft delete)

### 2.4 Contract Management
- **List**: ContractListView (search, payment_type filter, pagination)
- **Create**: ContractCreateView (create installments if installment type)
- **Update**: ContractUpdateView (recreate installments if type changed)
- **Delete**: ContractDeleteView (soft delete)

### 2.5 Installment Management
- **List**: InstallmentListView (search, status filter, pagination)
- **Update**: InstallmentUpdateView (amount, due_date, status, notes)

### 2.6 Safe Management
- **List**: SafeListView
- **Create**: SafeCreateView
- **Update**: SafeUpdateView
- **Delete**: SafeDeleteView (soft delete)

### 2.7 Voucher Management
- **List**: VoucherListView (search, type filter, pagination)
- **Create**: VoucherCreateView (update safe balance with transaction)
- **Update**: VoucherUpdateView (recalculate safe balances with transaction)
- **Delete**: VoucherDeleteView (recalculate safe balance with transaction)

### 2.8 Partner Management
- **List**: PartnerListView (search, pagination)
- **Create**: PartnerCreateView
- **Update**: PartnerUpdateView
- **Delete**: PartnerDeleteView (soft delete)

### 2.9 Broker Management
- **List**: BrokerListView (search, pagination)
- **Create**: BrokerCreateView
- **Update**: BrokerUpdateView
- **Delete**: BrokerDeleteView (soft delete)

### 2.10 Partner Group Management
- **List**: PartnerGroupListView (search, pagination)
- **Create**: PartnerGroupCreateView
- **Update**: PartnerGroupUpdateView
- **Delete**: PartnerGroupDeleteView (soft delete)

### 2.11 Transfer Management
- **List**: TransferListView (search, pagination)
- **Create**: TransferCreateView (update both safe balances with transaction)
- **Delete**: TransferDeleteView (recalculate both safe balances with transaction)

### 2.12 Debt Management
- **Partner Debts**: PartnerDebtListView (search, status filter, pagination)
- **Broker Dues**: BrokerDueListView (search, status filter, pagination)

### 2.13 Unit Partner Management
- **View Partners**: UnitPartnersView (show partners with total percentage)
- **Add Partner**: UnitAddPartnerView (percentage validation)
- **Edit Partner**: UnitEditPartnerView (percentage validation)
- **Remove Partner**: UnitRemovePartnerView (soft delete)

### 2.14 Unit Partner Group Management
- **View Groups**: UnitPartnerGroupsView (show partner groups)
- **Add Group**: UnitAddPartnerGroupView (uniqueness validation)
- **Remove Group**: UnitRemovePartnerGroupView (soft delete)

### 2.15 API Endpoints
- **get_customers_api**: Search customers for AJAX
- **get_units_api**: Search units for AJAX
- **get_safes_api**: Get safes for AJAX

## 3. Templates Structure

### 3.1 Base Template
- **File**: templates/base.html
- **Features**: RTL support, Tailwind CSS, HTMX, Alpine.js, responsive sidebar, animations

### 3.2 Page Templates
- **Dashboard**: accounting_app/dashboard.html
- **Customer**: accounting_app/customers/{list,form,confirm_delete}.html
- **Unit**: accounting_app/units/{list,form,confirm_delete,partners,add_partner,edit_partner,confirm_remove_partner,partner_groups,add_partner_group,confirm_remove_partner_group}.html
- **Contract**: accounting_app/contracts/{list,form,confirm_delete}.html
- **Installment**: accounting_app/installments/{list,form}.html
- **Safe**: accounting_app/safes/{list,form,confirm_delete}.html
- **Voucher**: accounting_app/vouchers/{list,form,confirm_delete}.html
- **Partner**: accounting_app/partners/{list,form,confirm_delete}.html
- **Broker**: accounting_app/brokers/{list,form,confirm_delete}.html
- **Partner Group**: accounting_app/partner_groups/{list,form,confirm_delete}.html
- **Transfer**: accounting_app/transfers/{list,form,confirm_delete}.html
- **Debts**: accounting_app/debts/{partner_debts,broker_dues}.html

## 4. URL Patterns

### 4.1 Main URLs
- **Dashboard**: `/`
- **Customers**: `/customers/`, `/customers/create/`, `/customers/<id>/edit/`, `/customers/<id>/delete/`
- **Units**: `/units/`, `/units/create/`, `/units/<id>/edit/`, `/units/<id>/delete/`
- **Contracts**: `/contracts/`, `/contracts/create/`, `/contracts/<id>/edit/`, `/contracts/<id>/delete/`
- **Installments**: `/installments/`, `/installments/<id>/edit/`
- **Safes**: `/safes/`, `/safes/create/`, `/safes/<id>/edit/`, `/safes/<id>/delete/`
- **Vouchers**: `/vouchers/`, `/vouchers/create/`, `/vouchers/<id>/edit/`, `/vouchers/<id>/delete/`
- **Partners**: `/partners/`, `/partners/create/`, `/partners/<id>/edit/`, `/partners/<id>/delete/`
- **Brokers**: `/brokers/`, `/brokers/create/`, `/brokers/<id>/edit/`, `/brokers/<id>/delete/`
- **Partner Groups**: `/partner-groups/`, `/partner-groups/create/`, `/partner-groups/<id>/edit/`, `/partner-groups/<id>/delete/`
- **Transfers**: `/transfers/`, `/transfers/create/`, `/transfers/<id>/delete/`
- **Debts**: `/partner-debts/`, `/broker-dues/`

### 4.2 Unit Management URLs
- **Unit Partners**: `/units/<unit_id>/partners/`, `/units/<unit_id>/add-partner/`, `/units/<unit_id>/edit-partner/<id>/`, `/units/<unit_id>/remove-partner/<id>/`
- **Unit Partner Groups**: `/units/<unit_id>/partner-groups/`, `/units/<unit_id>/add-partner-group/`, `/units/<unit_id>/remove-partner-group/<id>/`

### 4.3 API URLs
- **API**: `/api/customers/`, `/api/units/`, `/api/safes/`

## 5. Business Logic & Calculations

### 5.1 Financial Calculations
- **Installment Amount**: (total_price - discount_amount - down_payment) / installment_count
- **Safe Balance Updates**: Automatic on voucher create/update/delete
- **Transfer Balance Updates**: Automatic on transfer create/delete

### 5.2 Validation Rules
- **Phone Uniqueness**: Customer phone must be unique
- **National ID Uniqueness**: Customer national_id must be unique
- **Partner Percentage**: Total percentage per unit cannot exceed 100%
- **Safe Balance**: Cannot go negative (implicit validation)

### 5.3 Transaction Management
- **Voucher Operations**: All safe balance updates wrapped in transaction.atomic()
- **Transfer Operations**: Both safe updates wrapped in transaction.atomic()
- **Contract Operations**: Installment creation wrapped in transaction.atomic()

## 6. Database Configuration

### 6.1 Current Setup
- **Engine**: django.db.backends.sqlite3 (development)
- **Target**: PostgreSQL with DATABASE_URL

### 6.2 Required Changes
- **Add**: dj-database-url dependency
- **Update**: DATABASES setting to use DATABASE_URL
- **Add**: WhiteNoise for static files

## 7. Static Files & UI

### 7.1 Current Setup
- **CSS**: Tailwind CSS via CDN
- **JS**: HTMX, Alpine.js via CDN
- **Fonts**: Cairo font from Google Fonts

### 7.2 Required Changes
- **Build**: Local Tailwind build process
- **Static**: Proper static files collection
- **HTMX**: Add proper HTMX endpoints for AJAX

## 8. Missing Features to Implement

### 8.1 HTMX Endpoints
- **Inline Editing**: For quick updates
- **Partial Updates**: For table rows, forms
- **AJAX Responses**: JSON format with HTML fragments

### 8.2 Enhanced UI
- **Animations**: Fade-in, slide-in effects
- **Hover Effects**: Scale, shadow transitions
- **Responsive Design**: Mobile-first approach

### 8.3 Error Handling
- **Form Validation**: Client-side + server-side
- **Error Messages**: User-friendly error display
- **Success Feedback**: Toast notifications

## 9. Deployment Requirements

### 9.1 Build Commands
- **Python**: pip install -r requirements.txt
- **CSS**: npm run build:css
- **Django**: python manage.py migrate, python manage.py collectstatic

### 9.2 Environment Variables
- **DATABASE_URL**: PostgreSQL connection string
- **SECRET_KEY**: Django secret key
- **DEBUG**: Boolean flag
- **ALLOWED_HOSTS**: Comma-separated hosts

### 9.3 Runtime Files
- **Procfile**: web: gunicorn accounting_project.wsgi
- **runtime.txt**: python-3.11.8
- **requirements.txt**: All dependencies

## 10. Testing Requirements

### 10.1 Unit Tests
- **Service Functions**: Financial calculations
- **Model Validation**: Field constraints
- **View Logic**: CRUD operations

### 10.2 Integration Tests
- **Transaction Integrity**: Safe balance updates
- **Form Validation**: Client-server validation
- **API Endpoints**: JSON responses

### 10.3 Manual Testing
- **User Workflows**: Complete user journeys
- **Error Scenarios**: Edge cases and error handling
- **Performance**: Large dataset handling

## 11. Security Considerations

### 11.1 Data Protection
- **Soft Deletes**: No hard deletes for data integrity
- **Audit Logging**: Track all changes
- **Input Validation**: Server-side validation

### 11.2 Access Control
- **Single User**: No authentication required
- **Data Isolation**: Soft delete for data separation

## 12. Performance Optimizations

### 12.1 Database
- **Indexes**: Strategic indexing for common queries
- **Select Related**: Reduce database queries
- **Pagination**: Limit result sets

### 12.2 Frontend
- **Lazy Loading**: Load data on demand
- **Caching**: Static file caching
- **Compression**: Minified CSS/JS

---

## Notes
- All monetary amounts use DecimalField with max_digits=15, decimal_places=2
- All timestamps use timezone-aware datetime fields
- All soft deletes use deleted_at field instead of hard deletes
- All financial operations are wrapped in database transactions
- All forms include proper validation and error handling
- All templates are RTL-compatible with Arabic text support