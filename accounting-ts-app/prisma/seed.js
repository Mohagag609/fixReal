"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    const user = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
        },
    });
    console.log('✅ User created:', user);
    const accounts = await Promise.all([
        prisma.account.upsert({
            where: { id: 1 },
            update: {},
            create: {
                name: 'Cash Account',
                type: 'asset',
                description: 'Main cash account',
                balance: 10000,
            },
        }),
        prisma.account.upsert({
            where: { id: 2 },
            update: {},
            create: {
                name: 'Bank Account',
                type: 'asset',
                description: 'Main bank account',
                balance: 50000,
            },
        }),
        prisma.account.upsert({
            where: { id: 3 },
            update: {},
            create: {
                name: 'Rent Income',
                type: 'revenue',
                description: 'Rental income account',
                balance: 0,
            },
        }),
        prisma.account.upsert({
            where: { id: 4 },
            update: {},
            create: {
                name: 'Maintenance Expenses',
                type: 'expense',
                description: 'Property maintenance expenses',
                balance: 0,
            },
        }),
    ]);
    console.log('✅ Accounts created:', accounts.length);
    const properties = await Promise.all([
        prisma.property.upsert({
            where: { id: 1 },
            update: {},
            create: {
                title: 'Downtown Apartment',
                description: 'Modern 2-bedroom apartment in downtown',
                address: '123 Main St, Downtown',
                type: 'apartment',
                status: 'available',
                price: 250000,
                rentPrice: 2000,
                area: 1200,
                rooms: 2,
                bathrooms: 2,
                accountId: 1,
            },
        }),
        prisma.property.upsert({
            where: { id: 2 },
            update: {},
            create: {
                title: 'Suburban House',
                description: 'Family house with garden',
                address: '456 Oak Ave, Suburbs',
                type: 'house',
                status: 'rented',
                price: 400000,
                rentPrice: 3000,
                area: 2000,
                rooms: 4,
                bathrooms: 3,
                accountId: 1,
            },
        }),
    ]);
    console.log('✅ Properties created:', properties.length);
    const tenants = await Promise.all([
        prisma.tenant.upsert({
            where: { id: 1 },
            update: {},
            create: {
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+1234567890',
                address: '789 Tenant St',
                idNumber: 'ID123456789',
            },
        }),
        prisma.tenant.upsert({
            where: { id: 2 },
            update: {},
            create: {
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                phone: '+1234567891',
                address: '321 Renter Ave',
                idNumber: 'ID987654321',
            },
        }),
    ]);
    console.log('✅ Tenants created:', tenants.length);
    const contracts = await Promise.all([
        prisma.contract.upsert({
            where: { id: 1 },
            update: {},
            create: {
                type: 'rent',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31'),
                rentAmount: 2000,
                status: 'active',
                propertyId: 1,
                tenantId: 1,
            },
        }),
        prisma.contract.upsert({
            where: { id: 2 },
            update: {},
            create: {
                type: 'rent',
                startDate: new Date('2024-02-01'),
                endDate: new Date('2025-01-31'),
                rentAmount: 3000,
                status: 'active',
                propertyId: 2,
                tenantId: 2,
            },
        }),
    ]);
    console.log('✅ Contracts created:', contracts.length);
    const transactions = await Promise.all([
        prisma.transaction.upsert({
            where: { id: 1 },
            update: {},
            create: {
                amount: 2000,
                type: 'credit',
                description: 'Rent payment received',
                category: 'rent',
                accountId: 3,
                propertyId: 1,
            },
        }),
        prisma.transaction.upsert({
            where: { id: 2 },
            update: {},
            create: {
                amount: 500,
                type: 'debit',
                description: 'Property maintenance',
                category: 'maintenance',
                accountId: 4,
                propertyId: 1,
            },
        }),
    ]);
    console.log('✅ Transactions created:', transactions.length);
    const invoices = await Promise.all([
        prisma.invoice.upsert({
            where: { id: 1 },
            update: {},
            create: {
                invoiceNumber: 'INV-202401-0001',
                customer: 'John Doe',
                amount: 2000,
                tax: 0,
                total: 2000,
                status: 'paid',
                dueDate: new Date('2024-01-31'),
                description: 'Monthly rent payment',
                propertyId: 1,
            },
        }),
    ]);
    console.log('✅ Invoices created:', invoices.length);
    const payments = await Promise.all([
        prisma.payment.upsert({
            where: { id: 1 },
            update: {},
            create: {
                amount: 2000,
                method: 'bank_transfer',
                reference: 'TXN123456',
                status: 'completed',
                invoiceId: 1,
                contractId: 1,
                tenantId: 1,
            },
        }),
    ]);
    console.log('✅ Payments created:', payments.length);
    const expenses = await Promise.all([
        prisma.expense.upsert({
            where: { id: 1 },
            update: {},
            create: {
                amount: 500,
                category: 'maintenance',
                description: 'Plumbing repair',
                propertyId: 1,
                accountId: 4,
            },
        }),
    ]);
    console.log('✅ Expenses created:', expenses.length);
    console.log('🎉 Database seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map