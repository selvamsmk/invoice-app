import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel, FieldMessage } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { z } from 'zod'
import { useEffect } from 'react'
import type { Product } from '@invoice-app/api'

interface AddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void
  onEditProduct?: (product: Product) => void
  editingProduct?: Product | null
  mode?: 'add' | 'edit'
  isSubmitting?: boolean
}

export function AddProductDialog({ open, onOpenChange, onAddProduct, onEditProduct, editingProduct, mode = 'add', isSubmitting = false }: AddProductDialogProps) {
  const form = useForm({
    defaultValues: {
      name: editingProduct?.name || '',
      defaultRate: editingProduct?.defaultRate || 0,
      hsnCode: editingProduct?.hsnCode || '',
      gstPercentage: editingProduct?.gstPercentage || 0,
    },
    onSubmit: async ({ value }) => {
      const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> | Product = mode === 'edit' && editingProduct ? {
        id: editingProduct.id,
        name: value.name,
        defaultRate: value.defaultRate,
        hsnCode: value.hsnCode,
        gstPercentage: value.gstPercentage,
        createdAt: editingProduct.createdAt,
        updatedAt: editingProduct.updatedAt,
      } : {
        name: value.name,
        defaultRate: value.defaultRate,
        hsnCode: value.hsnCode,
        gstPercentage: value.gstPercentage,
      }

      if (mode === 'edit' && onEditProduct && 'id' in productData) {
        await onEditProduct(productData)
      } else {
        await onAddProduct(productData as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>)
      }
      
      onOpenChange(false)
      form.reset()
    }
  })

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
  }

  // Handle dialog opening and cleanup on closing
  useEffect(() => {
    if (open) {
      // When dialog opens, reset form completely and set field values
      form.reset()
      
      form.setFieldValue('name', editingProduct?.name || '')
      form.setFieldValue('defaultRate', editingProduct?.defaultRate || 0)
      form.setFieldValue('hsnCode', editingProduct?.hsnCode || '')
      form.setFieldValue('gstPercentage', editingProduct?.gstPercentage || 0)
    }

    // Cleanup function - runs when component unmounts or when `open` changes from true to false
    return () => {
      if (open) {
        // Reset form completely when dialog is about to close
        form.reset()
      }
    }
  }, [open, editingProduct])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Update the product details below.' : 'Fill in the details below to add a new product.'}
          </DialogDescription>
        </DialogHeader>
        
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <div className="grid gap-4 py-4">
            <form.Field 
              name="name"
              validators={{
                onBlur: ({ value }) => {
                  const result = z.string().min(1, 'Product name is required').min(2, 'Product name must be at least 2 characters').safeParse(value)
                  return result.success ? undefined : result.error.issues[0]?.message
                }
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Product Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter product name"
                  />
                  {!field.state.meta.isValid && (
                    <FieldMessage>{field.state.meta.errors[0]}</FieldMessage>
                  )}
                </Field>
              )}
            </form.Field>
            
            <form.Field 
              name="defaultRate"
              validators={{
                onBlur: ({ value }) => {
                  const result = z.number().positive('Rate must be a positive number').safeParse(Number(value))
                  return result.success ? undefined : result.error.issues[0]?.message
                }
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Default Rate (₹)</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    step="0.01"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="Enter default rate"
                  />
                  {!field.state.meta.isValid && (
                    <FieldMessage>{field.state.meta.errors[0]}</FieldMessage>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field 
              name="hsnCode"
              validators={{
                onBlur: ({ value }) => {
                  const result = z.string().min(1, 'HSN code is required').safeParse(value)
                  return result.success ? undefined : result.error.issues[0]?.message
                }
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>HSN Code</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter HSN code"
                  />
                  {!field.state.meta.isValid && (
                    <FieldMessage>{field.state.meta.errors[0]}</FieldMessage>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field 
              name="gstPercentage"
              validators={{
                onBlur: ({ value }) => {
                  const result = z.number().min(0, 'GST percentage cannot be negative').max(100, 'GST percentage cannot exceed 100').safeParse(Number(value))
                  return result.success ? undefined : result.error.issues[0]?.message
                }
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>GST Percentage (%)</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="Enter GST percentage"
                  />
                  {!field.state.meta.isValid && (
                    <FieldMessage>{field.state.meta.errors[0]}</FieldMessage>
                  )}
                </Field>
              )}
            </form.Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} className="cursor-pointer">
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting || isSubmitting} className="cursor-pointer disabled:cursor-not-allowed">
                  {(isSubmitting || isSubmitting) ? (mode === 'edit' ? 'Saving...' : 'Adding...') : (mode === 'edit' ? 'Save Changes' : 'Add Product')}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}