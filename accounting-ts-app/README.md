# Real Estate Management System API

A comprehensive real estate management system built with Node.js, Express, TypeScript, Prisma, and PostgreSQL. This system provides complete CRUD operations for managing properties, tenants, contracts, financial transactions, and more.

## 🚀 Features

- **Property Management**: Complete property lifecycle management
- **Tenant Management**: Tenant information and contract tracking
- **Financial Management**: Transactions, invoices, payments, and expenses
- **Contract Management**: Rent and sale contract tracking
- **Reporting**: Comprehensive financial and operational reports
- **TypeScript**: Full type safety and IntelliSense support
- **Prisma ORM**: Type-safe database operations
- **PostgreSQL**: Robust relational database
- **RESTful API**: Clean and consistent API design
- **Unit Tests**: Comprehensive test coverage
- **Docker Support**: Easy deployment with Docker

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd accounting-ts-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment file and configure your database:

```bash
cp .env.example .env
```

Update the `.env` file with your database credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/accounting_db?schema=public"
PORT=4000
NODE_ENV=development
```

### 4. Database Setup

Generate Prisma client:

```bash
npm run generate
```

Run database migrations:

```bash
npm run migrate:dev
```

### 5. Start the development server

```bash
npm run dev
```

The server will start on `http://localhost:4000`

## 📚 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Available Endpoints

#### Accounts
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create new account
- `GET /api/accounts/:id` - Get account by ID
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/accounts/:id/balance` - Get account balance
- `GET /api/accounts/summary` - Get account summary

#### Properties
- `GET /api/properties` - Get all properties
- `POST /api/properties` - Create new property
- `GET /api/properties/:id` - Get property by ID
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `GET /api/properties/search?q=query` - Search properties
- `GET /api/properties/status/:status` - Get properties by status
- `GET /api/properties/type/:type` - Get properties by type

#### Tenants
- `GET /api/tenants` - Get all tenants
- `POST /api/tenants` - Create new tenant
- `GET /api/tenants/:id` - Get tenant by ID
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant
- `GET /api/tenants/active` - Get active tenants
- `GET /api/tenants/search?q=query` - Search tenants

#### Contracts
- `GET /api/contracts` - Get all contracts
- `POST /api/contracts` - Create new contract
- `GET /api/contracts/:id` - Get contract by ID
- `PUT /api/contracts/:id` - Update contract
- `DELETE /api/contracts/:id` - Delete contract
- `GET /api/contracts/active` - Get active contracts
- `PUT /api/contracts/:id/renew` - Renew contract
- `PUT /api/contracts/:id/terminate` - Terminate contract

#### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/account/:accountId` - Get transactions by account
- `GET /api/transactions/property/:propertyId` - Get transactions by property

#### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id` - Get invoice by ID
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/invoices/overdue` - Get overdue invoices
- `PUT /api/invoices/:id/mark-paid` - Mark invoice as paid

#### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create new payment
- `GET /api/payments/:id` - Get payment by ID
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment
- `GET /api/payments/invoice/:invoiceId` - Get payments by invoice
- `GET /api/payments/contract/:contractId` - Get payments by contract

#### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/:id` - Get expense by ID
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/property/:propertyId` - Get expenses by property
- `GET /api/expenses/category/:category` - Get expenses by category

#### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get report by ID
- `DELETE /api/reports/:id` - Delete report
- `GET /api/reports/financial?startDate=2024-01-01&endDate=2024-12-31` - Generate financial report
- `GET /api/reports/property` - Generate property report
- `GET /api/reports/tenant` - Generate tenant report
- `GET /api/reports/revenue?startDate=2024-01-01&endDate=2024-12-31` - Generate revenue report

## 🧪 Testing

Run unit tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm test -- --coverage
```

## 🏗️ Development

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── models/          # TypeScript interfaces
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
└── server.ts        # Application entry point

tests/
├── controllers/     # Controller tests
├── services/        # Service tests
├── integration/     # Integration tests
└── setup.ts         # Test setup

prisma/
└── schema.prisma    # Database schema
```

### Database Schema

The system uses the following main entities:

- **Users**: System users
- **Accounts**: Financial accounts (assets, liabilities, equity, revenue, expenses)
- **Properties**: Real estate properties
- **Tenants**: Property tenants
- **Contracts**: Rent and sale contracts
- **Transactions**: Financial transactions
- **Invoices**: Billing invoices
- **Payments**: Payment records
- **Expenses**: Property expenses
- **Reports**: Generated reports

### Adding New Features

1. Create models in `src/models/`
2. Implement services in `src/services/`
3. Create controllers in `src/controllers/`
4. Add routes in `src/routes/`
5. Write tests in `tests/`
6. Update Prisma schema if needed

## 🐳 Docker Deployment

### Build and run with Docker

```bash
# Build the image
docker build -t accounting-ts-app .

# Run the container
docker run -p 4000:4000 --env-file .env accounting-ts-app
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down
```

## 🚀 Production Deployment

### 1. Build the application

```bash
npm run build
```

### 2. Run database migrations

```bash
npm run migrate:prod
```

### 3. Start the production server

```bash
npm start
```

## 📊 Database Management

### Prisma Commands

```bash
# Generate Prisma client
npm run generate

# Create new migration
npm run migrate:dev

# Reset database
npm run migrate:reset

# Open Prisma Studio
npm run studio
```

### Seeding Data

```bash
npm run seed
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 4000 |
| `NODE_ENV` | Environment | development |
| `JWT_SECRET` | JWT secret key | Required for auth |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository.

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete CRUD operations for all entities
- Financial management features
- Comprehensive reporting
- Unit test coverage
- Docker support