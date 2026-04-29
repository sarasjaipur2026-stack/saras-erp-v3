import { units, type Unit } from '../../../lib/db/masters'
import type { MasterConfig } from '../MasterPage'

export const unitsConfig: MasterConfig<Unit> = {
  tableName: 'units',
  displayName: 'Units',
  api: units,
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'symbol', label: 'Symbol', width: '90px' },
    { key: 'unit_type', label: 'Type', width: '110px' },
  ],
  searchFields: ['name', 'symbol'],
}
