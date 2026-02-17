import React, { useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { Buyer } from '@invoice-app/api'

type Props = {
  buyers?: Buyer[] | undefined
  selectedBuyer: Buyer | null
  editableBuyerData: Buyer | null
  onSelect: (b: Buyer) => void
  onChangeEditable: (b: Buyer) => void
  onClear: () => void
}

export default function BuyerSelector({ buyers, selectedBuyer, editableBuyerData, onSelect, onChangeEditable, onClear }: Props) {
  const uniqueBuyers = useMemo(() => {
    if (!buyers) return []
    const map = new Map<string, Buyer>()
    for (const buyer of buyers) {
      const key = [
        buyer.gstin?.trim() || "",
        buyer.name?.trim() || "",
        buyer.city?.trim() || "",
        buyer.state?.trim() || "",
        buyer.pincode?.trim() || "",
      ].join("|")
      if (!map.has(key)) map.set(key, buyer)
    }
    return Array.from(map.values())
  }, [buyers])

  return (
    <>
      {!selectedBuyer ? (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Select a buyer from the list below:</p>
          <Select onValueChange={(value) => {
            const buyer = uniqueBuyers.find(b => b.id === value)
            if (buyer) onSelect(buyer)
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a buyer" />
            </SelectTrigger>
            <SelectContent>
              {uniqueBuyers.map((buyer) => (
                <SelectItem key={buyer.id} value={buyer.id} textValue={buyer.name}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{buyer.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {buyer.city}, {buyer.state} - {buyer.gstin}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Selected Buyer (Editable for this invoice)</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClear}
            >
              <X className="h-4 w-4 mr-1" />
              Change Buyer
            </Button>
          </div>

          {editableBuyerData && (
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Company Name</FieldLabel>
                <Input
                  value={editableBuyerData.name}
                  onChange={(e) => onChangeEditable({ ...editableBuyerData, name: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel>GSTIN/UIN</FieldLabel>
                <Input
                  value={editableBuyerData.gstin ?? undefined}
                  onChange={(e) => onChangeEditable({ ...editableBuyerData, gstin: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel>Address</FieldLabel>
                <Input
                  value={editableBuyerData.addressLine1}
                  onChange={(e) => onChangeEditable({ ...editableBuyerData, addressLine1: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel>City</FieldLabel>
                <Input
                  value={editableBuyerData.city}
                  onChange={(e) => onChangeEditable({ ...editableBuyerData, city: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel>State</FieldLabel>
                <Input
                  value={editableBuyerData.state}
                  onChange={(e) => onChangeEditable({ ...editableBuyerData, state: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel>Pincode</FieldLabel>
                <Input
                  value={editableBuyerData.pincode}
                  onChange={(e) => onChangeEditable({ ...editableBuyerData, pincode: e.target.value })}
                />
              </Field>
            </div>
          )}
        </div>
      )}
    </>
  )
}
