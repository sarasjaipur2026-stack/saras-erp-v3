import { hsnCodes, type HsnCode } from '../../../lib/db/masters'
import type { MasterConfig } from '../MasterPage'

export const hsnCodesConfig: MasterConfig<HsnCode> = {
  tableName: 'hsn_codes',
  displayName: 'HSN Codes',
  api: hsnCodes,
  columns: [
    { key: 'code', label: 'Code', width: '120px' },
    { key: 'description', label: 'Description' },
    { key: 'cgst_pct', label: 'CGST', width: '70px' },
    { key: 'sgst_pct', label: 'SGST', width: '70px' },
    { key: 'igst_pct', label: 'IGST', width: '70px' },
  ],
  searchFields: ['code', 'description'],
}
