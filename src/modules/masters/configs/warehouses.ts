import { warehouses, type Warehouse } from '../../../lib/db/masters'
import type { MasterConfig } from '../MasterPage'

export const warehousesConfig: MasterConfig<Warehouse> = {
  tableName: 'warehouses',
  displayName: 'Warehouses',
  api: warehouses,
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'warehouse_type', label: 'Type', width: '140px' },
    { key: 'address', label: 'Address' },
  ],
  searchFields: ['name', 'address'],
}
