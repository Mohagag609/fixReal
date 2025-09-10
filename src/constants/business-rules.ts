// Business rules مطابقة لـ business-rules.json بالحرف

export const BUSINESS_RULES = {
  calculation_rules: {
    installment_status: {
      pending: "مجموع المدفوعات = 0",
      partial: "المجموع > 0 وأقل من القيمة",
      paid: "المجموع = القيمة (بنفس التقريب)"
    },
    remaining_calculation: {
      formula: "totalPrice - discountAmount - paidAmount",
      rounding: "2 decimal places"
    },
    collection_percentage: {
      formula: "(totalReceipts / totalSales) * 100",
      rounding: "2 decimal places"
    },
    net_profit: {
      formula: "totalReceipts - totalExpenses"
    }
  },
  validation_rules: {
    phone_format: "^01[0-9]{9}$",
    national_id_format: "^[0-9]{14}$",
    amount_min: 0,
    percentage_min: 0,
    percentage_max: 100,
    date_format: "YYYY-MM-DD",
    unit_code_format: "^[A-Z]-[0-9]+$"
  },
  business_constraints: {
    unit_deletion: "لا يمكن حذف وحدة مرتبطة بعقد",
    customer_deletion: "لا يمكن حذف عميل مرتبط بعقود",
    contract_deletion: "لا يمكن حذف عقد له أقساط مدفوعة",
    safe_deletion: "لا يمكن حذف خزنة لها رصيد أو معاملات"
  },
  uniqueness_constraints: {
    customer_national_id: "unique",
    unit_code: "unique",
    safe_name: "unique",
    broker_name: "unique"
  },
  relationships: {
    contract_to_unit: "one-to-one",
    contract_to_customer: "one-to-one",
    installment_to_unit: "one-to-many",
    voucher_to_safe: "many-to-one",
    unit_partner_to_unit: "many-to-one",
    unit_partner_to_partner: "many-to-one"
  }
} as const

// Helper functions for business rules
export function validatePhone(phone: string): boolean {
  const regex = new RegExp(BUSINESS_RULES.validation_rules.phone_format)
  return regex.test(phone)
}

export function validateNationalId(nationalId: string): boolean {
  const regex = new RegExp(BUSINESS_RULES.validation_rules.national_id_format)
  return regex.test(nationalId)
}

export function validateUnitCode(code: string): boolean {
  const regex = new RegExp(BUSINESS_RULES.validation_rules.unit_code_format)
  return regex.test(code)
}

export function validateAmount(amount: number): boolean {
  return amount >= BUSINESS_RULES.validation_rules.amount_min
}

export function validatePercentage(percentage: number): boolean {
  return percentage >= BUSINESS_RULES.validation_rules.percentage_min && 
         percentage <= BUSINESS_RULES.validation_rules.percentage_max
}

export function validateDate(date: string): boolean {
  const dateObj = new Date(date)
  return !isNaN(dateObj.getTime())
}