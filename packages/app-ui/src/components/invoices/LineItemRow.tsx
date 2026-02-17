import React from 'react'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import BatchEditor from './BatchEditor'

type Batch = {
  id: string
  batchNo?: string
  expiryDate?: string
  quantity: number
}

type LineItem = {
  id: string
  productId: string
  name: string
  hsnCode: string
  batches: Batch[]
  rate: number
  gstPercentage: number
  amount: number
}

type Props = {
  item: LineItem
  index: number
  onChange: (id: string, field: string, value: any) => void
  onRemove: (id: string) => void
  onAddBatch: (lineItemId: string) => void
  onRemoveBatch: (lineItemId: string, batchId: string) => void
  onBatchChange: (lineItemId: string, batchId: string, field: string, value: any) => void
}

export default function LineItemRow({ item, index, onChange, onRemove, onAddBatch, onRemoveBatch, onBatchChange }: Props) {
  return (
    <div key={item.id} data-index={index} className="border rounded-lg bg-card cursor-move">
      <div className="flex items-center gap-2 p-3 border-b bg-muted/50">
        <div className="flex-shrink-0 w-12">
          <div className="text-sm font-medium text-center">{index + 1}</div>
        </div>

        <div className="flex-1 grid grid-cols-4 gap-2 items-center">
          <Field>
            <FieldLabel className="text-xs">Product Details</FieldLabel>
            <Input value={item.name} onChange={(e) => onChange(item.id, 'name', e.target.value)} className="text-sm" />
          </Field>

          <Field>
            <FieldLabel className="text-xs">HSN</FieldLabel>
            <Input value={item.hsnCode} onChange={(e) => onChange(item.id, 'hsnCode', e.target.value)} className="text-sm" />
          </Field>

          <Field>
            <FieldLabel className="text-xs">Rate (₹)</FieldLabel>
            <Input type="number" min="0" step="0.01" value={item.rate} onChange={(e) => onChange(item.id, 'rate', parseFloat(e.target.value) || 0)} className="text-sm" />
          </Field>

          <Field>
            <FieldLabel className="text-xs">GST (%)</FieldLabel>
            <Input type="number" min="0" max="100" step="0.01" value={item.gstPercentage} onChange={(e) => onChange(item.id, 'gstPercentage', parseFloat(e.target.value) || 0)} className="text-sm" />
          </Field>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={() => onRemove(item.id)} className="text-red-600 hover:text-red-700 flex-shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-medium">Batches (Optional)</h5>
          <Button type="button" variant="outline" size="sm" onClick={() => onAddBatch(item.id)} className="text-green-600 hover:text-green-700">
            <Plus className="h-3 w-3 mr-1" />
            Add Batch
          </Button>
        </div>

        {item.batches.map((batch) => (
          <BatchEditor
            key={batch.id}
            lineItemId={item.id}
            batch={batch}
            onBatchChange={onBatchChange}
            onRemoveBatch={onRemoveBatch}
            canRemove={item.batches.length > 1}
          />
        ))}

        <div className="flex justify-between items-center pt-2 border-t bg-muted/20 px-2 py-1 rounded">
          <span className="text-sm font-medium">Total Quantity: {item.batches.reduce((sum, b) => sum + b.quantity, 0)}</span>
          <span className="text-sm font-medium">Tax: ₹{((item.batches.reduce((sum, b) => sum + b.quantity, 0) * item.rate * item.gstPercentage) / 100).toFixed(2)}</span>
          <span className="text-sm font-medium">Amount: ₹{item.amount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
