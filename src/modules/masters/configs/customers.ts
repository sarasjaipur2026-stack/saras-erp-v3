import { customers, type Customer } from '../../../lib/db/masters'
import type { MasterConfig } from '../MasterPage'

export const customersConfig: MasterConfig<Customer> = {
  tableName: 'customers',
  displayName: 'Customers',
  api: customers,
  columns: [
    { key: 'firm_name', label: 'Firm' },
    { key: 'contact_name', label: 'Contact' },
    { key: 'phone', label: 'Phone' },
    { key: 'gstin', label: 'GSTIN' },
    { key: 'state_code', label: 'State', width: '60px' },
  ],
  searchFields: ['firm_name', 'contact_name', 'phone', 'gstin'],
}
