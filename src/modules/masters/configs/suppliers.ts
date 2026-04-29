import { suppliers, type Supplier } from '../../../lib/db/masters'
import type { MasterConfig } from '../MasterPage'

export const suppliersConfig: MasterConfig<Supplier> = {
  tableName: 'suppliers',
  displayName: 'Suppliers',
  api: suppliers,
  columns: [
    { key: 'firm_name', label: 'Firm' },
    { key: 'contact_name', label: 'Contact' },
    { key: 'phone', label: 'Phone' },
    { key: 'gstin', label: 'GSTIN' },
    { key: 'quality_rating', label: 'Rating', width: '80px' },
  ],
  searchFields: ['firm_name', 'contact_name', 'phone', 'gstin'],
}
