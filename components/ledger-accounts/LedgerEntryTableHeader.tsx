import { LEDGER_TABLE_HEADERS } from "@/components/ledger-accounts/utils"
import { TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function LedgerEntryTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        {LEDGER_TABLE_HEADERS.map((header, index) => (
          <TableHead
            key={header}
            className={index >= 6 ? "text-right whitespace-nowrap" : "whitespace-nowrap"}
          >
            {header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}
