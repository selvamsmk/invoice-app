import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Product } from '@invoice-app/api'

type Props = {
  products?: Product[] | undefined
  selectedProductId: string
  onAddProduct: (p: Product) => void
}

export default function ProductSelector({ products, selectedProductId, onAddProduct }: Props) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">Add products to the invoice:</p>
      <Select
        value={selectedProductId}
        onValueChange={(value) => {
          const product = products?.find(p => p.id === value)
          if (product) onAddProduct(product)
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose a product to add" />
        </SelectTrigger>
        <SelectContent>
          {products?.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              <div className="flex flex-col items-start">
                <span className="font-medium">{product.name}</span>
                <span className="text-sm text-muted-foreground">
                  ₹{product.defaultRate} - HSN: {product.hsnCode} - GST: {product.gstPercentage}%
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
