-- CreateTable
CREATE TABLE "public"."customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "nationalId" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'نشط',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "unitType" TEXT NOT NULL DEFAULT 'سكني',
    "area" TEXT,
    "floor" TEXT,
    "building" TEXT,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'متاحة',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."unit_partners" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "unit_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contracts" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "brokerName" TEXT,
    "brokerPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "brokerAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionSafeId" TEXT,
    "downPaymentSafeId" TEXT,
    "maintenanceDeposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "installmentType" TEXT NOT NULL DEFAULT 'شهري',
    "installmentCount" INTEGER NOT NULL DEFAULT 0,
    "extraAnnual" INTEGER NOT NULL DEFAULT 0,
    "annualPaymentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "downPayment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentType" TEXT NOT NULL DEFAULT 'installment',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."installments" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'معلق',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."partner_debts" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'معلق',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "partner_debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."safes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "safes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transfers" (
    "id" TEXT NOT NULL,
    "fromSafeId" TEXT NOT NULL,
    "toSafeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vouchers" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "safeId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payer" TEXT,
    "beneficiary" TEXT,
    "linkedRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."brokers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "brokers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."broker_dues" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'معلق',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "broker_dues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."partner_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "partner_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."partner_group_partners" (
    "id" TEXT NOT NULL,
    "partnerGroupId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "partner_group_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."unit_partner_groups" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "partnerGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "unit_partner_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" TEXT,
    "newValues" TEXT,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."keyval" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "keyval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "public"."customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_nationalId_key" ON "public"."customers"("nationalId");

-- CreateIndex
CREATE INDEX "customers_status_deletedAt_idx" ON "public"."customers"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "public"."customers"("name");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "public"."customers"("phone");

-- CreateIndex
CREATE INDEX "customers_createdAt_idx" ON "public"."customers"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "units_code_key" ON "public"."units"("code");

-- CreateIndex
CREATE INDEX "units_status_deletedAt_idx" ON "public"."units"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "units_unitType_deletedAt_idx" ON "public"."units"("unitType", "deletedAt");

-- CreateIndex
CREATE INDEX "units_totalPrice_idx" ON "public"."units"("totalPrice");

-- CreateIndex
CREATE INDEX "units_createdAt_idx" ON "public"."units"("createdAt");

-- CreateIndex
CREATE INDEX "units_code_idx" ON "public"."units"("code");

-- CreateIndex
CREATE INDEX "partners_name_idx" ON "public"."partners"("name");

-- CreateIndex
CREATE INDEX "partners_phone_idx" ON "public"."partners"("phone");

-- CreateIndex
CREATE INDEX "partners_deletedAt_idx" ON "public"."partners"("deletedAt");

-- CreateIndex
CREATE INDEX "unit_partners_unitId_deletedAt_idx" ON "public"."unit_partners"("unitId", "deletedAt");

-- CreateIndex
CREATE INDEX "unit_partners_partnerId_deletedAt_idx" ON "public"."unit_partners"("partnerId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "unit_partners_unitId_partnerId_key" ON "public"."unit_partners"("unitId", "partnerId");

-- CreateIndex
CREATE INDEX "contracts_unitId_deletedAt_idx" ON "public"."contracts"("unitId", "deletedAt");

-- CreateIndex
CREATE INDEX "contracts_customerId_deletedAt_idx" ON "public"."contracts"("customerId", "deletedAt");

-- CreateIndex
CREATE INDEX "contracts_start_idx" ON "public"."contracts"("start");

-- CreateIndex
CREATE INDEX "contracts_totalPrice_idx" ON "public"."contracts"("totalPrice");

-- CreateIndex
CREATE INDEX "contracts_createdAt_idx" ON "public"."contracts"("createdAt");

-- CreateIndex
CREATE INDEX "installments_unitId_deletedAt_idx" ON "public"."installments"("unitId", "deletedAt");

-- CreateIndex
CREATE INDEX "installments_status_deletedAt_idx" ON "public"."installments"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "installments_dueDate_idx" ON "public"."installments"("dueDate");

-- CreateIndex
CREATE INDEX "installments_amount_idx" ON "public"."installments"("amount");

-- CreateIndex
CREATE UNIQUE INDEX "safes_name_key" ON "public"."safes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "brokers_name_key" ON "public"."brokers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "partner_groups_name_key" ON "public"."partner_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "partner_group_partners_partnerGroupId_partnerId_key" ON "public"."partner_group_partners"("partnerGroupId", "partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "unit_partner_groups_unitId_partnerGroupId_key" ON "public"."unit_partner_groups"("unitId", "partnerGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "public"."settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "keyval_key_key" ON "public"."keyval"("key");

-- AddForeignKey
ALTER TABLE "public"."unit_partners" ADD CONSTRAINT "unit_partners_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."unit_partners" ADD CONSTRAINT "unit_partners_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."installments" ADD CONSTRAINT "installments_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."partner_debts" ADD CONSTRAINT "partner_debts_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transfers" ADD CONSTRAINT "transfers_fromSafeId_fkey" FOREIGN KEY ("fromSafeId") REFERENCES "public"."safes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transfers" ADD CONSTRAINT "transfers_toSafeId_fkey" FOREIGN KEY ("toSafeId") REFERENCES "public"."safes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vouchers" ADD CONSTRAINT "vouchers_safeId_fkey" FOREIGN KEY ("safeId") REFERENCES "public"."safes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vouchers" ADD CONSTRAINT "vouchers_linkedRef_fkey" FOREIGN KEY ("linkedRef") REFERENCES "public"."units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."broker_dues" ADD CONSTRAINT "broker_dues_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "public"."brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."partner_group_partners" ADD CONSTRAINT "partner_group_partners_partnerGroupId_fkey" FOREIGN KEY ("partnerGroupId") REFERENCES "public"."partner_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."partner_group_partners" ADD CONSTRAINT "partner_group_partners_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."unit_partner_groups" ADD CONSTRAINT "unit_partner_groups_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."unit_partner_groups" ADD CONSTRAINT "unit_partner_groups_partnerGroupId_fkey" FOREIGN KEY ("partnerGroupId") REFERENCES "public"."partner_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
