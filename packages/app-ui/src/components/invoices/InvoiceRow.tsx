import React from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Eye, Printer, Edit, Download, Trash2 } from 'lucide-react'
import type { Invoice } from '@/components/invoices/preview'

type Props = {
  invoice: Invoice
  formatCurrency: (n: number) => string
  formatDate: (s: string) => string
  getStatusBadge: (s: string) => React.ReactNode
  onEdit: (inv: Invoice) => void
  onDelete: (id: string) => void
  onPreview: (inv: Invoice) => void
}

export default function InvoiceRow({ invoice, formatCurrency, formatDate, getStatusBadge, onEdit, onDelete, onPreview }: Props) {
  return (
    <TableRow key={invoice.id}>
      <TableCell className="font-medium w-35">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="truncate cursor-help">{invoice.invoiceNumber}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{invoice.invoiceNumber}</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>

      <TableCell className="w-25">{formatDate(invoice.invoiceDate)}</TableCell>

      <TableCell className="w-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="truncate cursor-help">{invoice.buyerName}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{invoice.buyerName}</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>

      <TableCell className="w-30">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="truncate cursor-help">{invoice.buyerCity}, {invoice.buyerState}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{invoice.buyerCity}, {invoice.buyerState}</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>

      <TableCell className="w-32.5 text-right font-medium">{formatCurrency(invoice.totalAmount)}</TableCell>

      <TableCell className="w-25">{formatDate(invoice.dueDate ?? "")}</TableCell>

      <TableCell className="w-25">{getStatusBadge(invoice.status)}</TableCell>

      <TableCell className="text-right w-37.5">
        <div className="flex gap-1 justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => onPreview(invoice)}>
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Invoice</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Printer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Print Invoice</p>
            </TooltipContent>
          </Tooltip>

          {!invoice.isFinalized && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => onEdit(invoice)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Invoice</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download PDF</p>
            </TooltipContent>
          </Tooltip>

          {!invoice.isFinalized && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => onDelete(invoice.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Invoice</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
