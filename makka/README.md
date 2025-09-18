# Accounting System - Django Migration Project

A comprehensive accounting system built with Django, featuring advanced database management, reporting, analytics, and notification systems.

## Features

### Core Accounting
- **Customer Management**: Complete customer database with contact information and credit limits
- **Vendor Management**: Supplier management with payment terms and history
- **Invoice Management**: Create, edit, and track invoices with line items and tax calculations
- **Bill Management**: Handle vendor bills and expense tracking
- **Payment Processing**: Record and allocate payments to invoices and bills
- **Chart of Accounts**: Flexible account structure with parent-child relationships
- **Journal Entries**: Double-entry bookkeeping with automatic balancing
- **Product Management**: Inventory and service catalog with pricing

### Advanced Features
- **Database Management System (DBMS)**: 
  - Browse and edit database tables
  - SQL query executor with syntax highlighting
  - Database statistics and performance monitoring
  - Backup and restore functionality
  - Import/export CSV/Excel data
  - Index management and optimization

- **Advanced Reporting**:
  - Invoice and bill reports with filtering
  - Customer and vendor statements
  - Sales and expense summaries
  - Cash flow analysis
  - Tax reports
  - Export to PDF/Excel/CSV

- **Analytics Dashboard**:
  - Revenue and expense trends
  - Customer and vendor analytics
  - Cash flow visualization
  - Interactive charts and graphs
  - KPI tracking

- **Notification System**:
  - Real-time notifications
  - Email and push notifications
  - Notification categories and priorities
  - Scheduled notifications
  - User preferences

- **Settings Management**:
  - User preferences (theme, currency, date format)
  - Company settings
  - System configuration
  - Audit logging
  - Security settings

## Technology Stack

- **Backend**: Django 5.2.6
- **Database**: SQLite (development) / PostgreSQL (production)
- **Frontend**: Tailwind CSS + Alpine.js + HTMX
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Deployment**: Gunicorn + WhiteNoise

## Installation

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd makka
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser**:
   ```bash
   python manage.py createsuperuser
   ```

6. **Run development server**:
   ```bash
   python manage.py runserver
   ```

7. **Access the application**:
   - Main application: http://127.0.0.1:8000/
   - Admin panel: http://127.0.0.1:8000/admin/

### Production Deployment

1. **Set environment variables**:
   ```bash
   export SECRET_KEY="your-secret-key"
   export DEBUG=False
   export DATABASE_URL="postgres://user:password@host:port/dbname"
   ```

2. **Install production dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run migrations**:
   ```bash
   python manage.py migrate
   ```

4. **Collect static files**:
   ```bash
   python manage.py collectstatic
   ```

5. **Start with Gunicorn**:
   ```bash
   gunicorn accounting_project.wsgi
   ```

## Project Structure

```
makka/
├── accounting_project/          # Main Django project
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── accounting_app/              # Core accounting functionality
│   ├── models.py
│   ├── views.py
│   ├── forms.py
│   ├── services/
│   │   ├── calculations.py
│   │   ├── reports.py
│   │   ├── dbms.py
│   │   └── backups.py
│   └── templates/
├── dbms_app/                    # Database management
├── reports_app/                 # Reporting system
├── notifications_app/           # Notification system
├── analytics_app/               # Analytics and charts
├── settings_app/                # Settings management
├── templates/                   # Base templates
├── static/                      # Static files
├── media/                       # Media files
├── requirements.txt
├── runtime.txt
├── Procfile
└── README.md
```

## Key Features Implementation

### Financial Calculations
- Automatic invoice/bill total calculations
- Tax calculations with multiple rates
- Account balance calculations
- Trial balance generation
- Aged receivables/payables reports
- Profit & Loss statements
- Balance sheet generation

### Database Management
- Table browser with pagination and filtering
- SQL query executor with syntax validation
- Database statistics and performance metrics
- Automated backup scheduling
- Data import/export functionality
- Index management and optimization

### Reporting System
- Comprehensive report builder
- Multiple export formats (PDF, Excel, CSV)
- Scheduled report generation
- Custom report templates
- Interactive filtering and sorting

### Analytics Dashboard
- Real-time KPI tracking
- Interactive charts and graphs
- Trend analysis
- Customer and vendor insights
- Cash flow visualization

## Security Features

- User authentication and authorization
- Role-based access control
- Audit logging for all changes
- Password policy enforcement
- Session management
- CSRF protection
- XSS protection

## API Endpoints

The system provides AJAX endpoints for:
- Dynamic data loading
- Real-time calculations
- Chart data updates
- Notification management
- Settings updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.