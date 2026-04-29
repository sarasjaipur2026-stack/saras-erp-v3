import { products, type Product } from '../../../lib/db/masters'
import type { MasterConfig } from '../MasterPage'

export const productsConfig: MasterConfig<Product> = {
  tableName: 'products',
  displayName: 'Products',
  api: products,
  columns: [
    { key: 'code', label: 'Code', width: '100px' },
    { key: 'name', label: 'Name' },
    { key: 'hsn_code', label: 'HSN', width: '80px' },
    { key: 'gst_rate', label: 'GST %', width: '70px' },
    { key: 'rate_unit', label: 'Unit', width: '90px', render: (r) => r.rate_unit?.replace('per_', '') ?? '—' },
    { key: 'default_rate', label: 'Rate ₹', width: '80px' },
  ],
  searchFields: ['code', 'name', 'hsn_code', 'category'],
}
