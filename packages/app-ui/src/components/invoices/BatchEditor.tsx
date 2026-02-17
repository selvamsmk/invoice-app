import React from 'react'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

type Batch = {
  id: string
  batchNo?: string
  expiryDate?: string
  quantity: number
}

type Props = {
  lineItemId: string
  batch: Batch
  onBatchChange: (lineItemId: string, batchId: string, field: string, value: any) => void
  onRemoveBatch: (lineItemId: string, batchId: string) => void
  canRemove?: boolean
}

export default function BatchEditor({ lineItemId, batch, onBatchChange, onRemoveBatch, canRemove = false }: Props) {
  return (
    <div key={batch.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
      <div className="flex-1 grid grid-cols-3 gap-2">
        <Field>
          <FieldLabel className="text-xs">Batch No (Optional)</FieldLabel>
          <Input
            value={batch.batchNo || ''}
            onChange={(e) => onBatchChange(lineItemId, batch.id, 'batchNo', e.target.value)}
            className="text-sm"
            placeholder="Enter batch number"
          />
        </Field>

        <Field>
          <FieldLabel className="text-xs">Expiry Date (Optional)</FieldLabel>
          <Input
            type="date"
            value={batch.expiryDate || ''}
            onChange={(e) => onBatchChange(lineItemId, batch.id, 'expiryDate', e.target.value)}
            className="text-sm"
          />
        </Field>

        <Field>
          <FieldLabel className="text-xs">Quantity</FieldLabel>
          <Input
            type="number"
            min="0"
            step="1"
            value={batch.quantity}
            onChange={(e) => onBatchChange(lineItemId, batch.id, 'quantity', parseInt(e.target.value) || 0)}
            className="text-sm"
          />
        </Field>
      </div>

      {canRemove && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onRemoveBatch(lineItemId, batch.id)}
          className="text-red-600 hover:text-red-700 flex-shrink-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
