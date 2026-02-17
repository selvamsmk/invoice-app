import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel, FieldMessage } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { z } from 'zod'
import { useEffect } from 'react'
import type { Buyer } from '@invoice-app/api'


interface AddBuyerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddBuyer: (buyer: Omit<Buyer, 'id' | 'createdAt' | 'updatedAt'>) => void
  onEditBuyer?: (buyer: Buyer) => void
  editingBuyer?: Buyer | null
  mode?: 'add' | 'edit'
  isSubmitting?: boolean
}

export function AddBuyerDialog({ open, onOpenChange, onAddBuyer, onEditBuyer, editingBuyer, mode = 'add', isSubmitting = false }: AddBuyerDialogProps) {
  const indianStatesWithCodes = [
    { name: 'Jammu and Kashmir', code: '01' },
    { name: 'Himachal Pradesh', code: '02' },
    { name: 'Punjab', code: '03' },
    { name: 'Chandigarh', code: '04' },
    { name: 'Uttarakhand', code: '05' },
    { name: 'Haryana', code: '06' },
    { name: 'Delhi', code: '07' },
    { name: 'Rajasthan', code: '08' },
    { name: 'Uttar Pradesh', code: '09' },
    { name: 'Bihar', code: '10' },
    { name: 'Sikkim', code: '11' },
    { name: 'Arunachal Pradesh', code: '12' },
    { name: 'Nagaland', code: '13' },
    { name: 'Manipur', code: '14' },
    { name: 'Mizoram', code: '15' },
    { name: 'Tripura', code: '16' },
    { name: 'Meghalaya', code: '17' },
    { name: 'Assam', code: '18' },
    { name: 'West Bengal', code: '19' },
    { name: 'Jharkhand', code: '20' },
    { name: 'Odisha', code: '21' },
    { name: 'Chhattisgarh', code: '22' },
    { name: 'Madhya Pradesh', code: '23' },
    { name: 'Gujarat', code: '24' },
    { name: 'Dadra and Nagar Haveli and Daman and Diu', code: '26' },
    { name: 'Maharashtra', code: '27' },
    { name: 'Karnataka', code: '29' },
    { name: 'Goa', code: '30' },
    { name: 'Lakshadweep', code: '31' },
    { name: 'Kerala', code: '32' },
    { name: 'Tamil Nadu', code: '33' },
    { name: 'Puducherry', code: '34' },
    { name: 'Andaman and Nicobar Islands', code: '35' },
    { name: 'Telangana', code: '36' },
    { name: 'Andhra Pradesh', code: '37' },
    { name: 'Ladakh', code: '38' }
  ]

  const form = useForm({
    defaultValues: {
      name: editingBuyer?.name || '',
      addressLine1: editingBuyer?.addressLine1 || '',
      addressLine2: editingBuyer?.addressLine2 || '',
      addressLine3: editingBuyer?.addressLine3 || '',
      city: editingBuyer?.city || '',
      state: editingBuyer?.state || '',
      country: editingBuyer?.country || 'India',
      pincode: editingBuyer?.pincode || '',
      gstin: editingBuyer?.gstin || '',
      mobileNumber: editingBuyer?.mobileNumber || '',
      emailAddress: editingBuyer?.emailAddress || '',
      drugLicenseNumber: editingBuyer?.drugLicenseNumber || '',
      stateCode: editingBuyer?.stateCode || ''
    },
    onSubmit: async ({ value }) => {
      const buyerData: Omit<Buyer, 'id' | 'createdAt' | 'updatedAt'> | Buyer = mode === 'edit' && editingBuyer ? {
        id: editingBuyer.id,
        name: value.name,
        addressLine1: value.addressLine1,
        addressLine2: value.addressLine2 || null,
        addressLine3: value.addressLine3 || null,
        city: value.city,
        state: value.state,
        country: value.country,
        pincode: value.pincode,
        gstin: value.gstin,
        mobileNumber: value.mobileNumber || null,
        emailAddress: value.emailAddress || null,
        drugLicenseNumber: value.drugLicenseNumber || null,
        stateCode: value.stateCode || null,
        totalInvoices: editingBuyer.totalInvoices
      } : {
        name: value.name,
        addressLine1: value.addressLine1,
        addressLine2: value.addressLine2 || null,
        addressLine3: value.addressLine3 || null,
        city: value.city,
        state: value.state,
        country: value.country,
        pincode: value.pincode,
        gstin: value.gstin,
        mobileNumber: value.mobileNumber || null,
        emailAddress: value.emailAddress || null,
        drugLicenseNumber: value.drugLicenseNumber || null,
        stateCode: value.stateCode || null,
        totalInvoices: 0
      }

      if (mode === 'edit' && onEditBuyer && 'id' in buyerData) {
        await onEditBuyer(buyerData)
      } else {
        await onAddBuyer(buyerData as Omit<Buyer, 'id' | 'createdAt' | 'updatedAt'>)
      }
      
      onOpenChange(false)
      form.reset()
    }
  })

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
  }

  // Clear field errors helper function
  const clearFieldErrors = () => {
    form.setFieldMeta('name', (prev) => ({ ...prev, errors: [], isValid: true }))
    form.setFieldMeta('addressLine1', (prev) => ({ ...prev, errors: [], isValid: true }))
    form.setFieldMeta('city', (prev) => ({ ...prev, errors: [], isValid: true }))
    form.setFieldMeta('state', (prev) => ({ ...prev, errors: [], isValid: true }))
    form.setFieldMeta('pincode', (prev) => ({ ...prev, errors: [], isValid: true }))
    form.setFieldMeta('gstin', (prev) => ({ ...prev, errors: [], isValid: true }))
  }

  // Handle dialog opening and cleanup on closing
  useEffect(() => {
    if (open) {
      // When dialog opens, reset form completely and set field values
      form.reset()
      
      form.setFieldValue('name', editingBuyer?.name || '')
      form.setFieldValue('addressLine1', editingBuyer?.addressLine1 || '')
      form.setFieldValue('addressLine2', editingBuyer?.addressLine2 || '')
      form.setFieldValue('addressLine3', editingBuyer?.addressLine3 || '')
      form.setFieldValue('city', editingBuyer?.city || '')
      form.setFieldValue('state', editingBuyer?.state || '')
      form.setFieldValue('country', editingBuyer?.country || 'India')
      form.setFieldValue('pincode', editingBuyer?.pincode || '')
      form.setFieldValue('gstin', editingBuyer?.gstin || '')
      form.setFieldValue('mobileNumber', editingBuyer?.mobileNumber || '')
      form.setFieldValue('emailAddress', editingBuyer?.emailAddress || '')
      form.setFieldValue('drugLicenseNumber', editingBuyer?.drugLicenseNumber || '')
      form.setFieldValue('stateCode', editingBuyer?.stateCode || '')
    }

    // Cleanup function - runs when component unmounts or when `open` changes from true to false
    return () => {
      if (open) {
        // Reset form completely when dialog is about to close
        form.reset()
      }
    }
  }, [open, editingBuyer])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Buyer' : 'Add New Buyer'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Update the buyer details below.' : 'Fill in the details below to add a new buyer to your list.'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Hidden element to receive focus instead of form fields */}
        <div tabIndex={0} className="sr-only" />
        
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <form.Field 
                name="name"
                validators={{
                  onBlur: ({ value }) => {
                    const result = z.string().min(1, 'Company name is required').min(2, 'Company name must be at least 2 characters').safeParse(value)
                    return result.success ? undefined : result.error.issues[0]?.message
                  }
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Company Name *</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter company name"
                      autoFocus={false}
                    />
                    {!field.state.meta.isValid && (
                      <FieldMessage>{field.state.meta.errors.join(', ')}</FieldMessage>
                    )}
                  </Field>
                )}
              </form.Field>
              
              <form.Field 
                name="gstin"
                validators={{
                  onBlur: ({ value }) => {
                    const result = z.string().min(1, 'GSTIN/UIN is required').safeParse(value)
                    return result.success ? undefined : result.error.issues[0]?.message
                  }
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>GSTIN/UIN *</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter GSTIN/UIN"
                    />
                    {!field.state.meta.isValid && (
                      <FieldMessage>{field.state.meta.errors.join(', ')}</FieldMessage>
                    )}
                  </Field>
                )}
              </form.Field>
            </div>

            <form.Field 
              name="addressLine1"
              validators={{
                onBlur: ({ value }) => {
                  const result = z.string().min(1, 'Address line 1 is required').safeParse(value)
                  return result.success ? undefined : result.error.issues[0]?.message
                }
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Address Line 1 *</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter address line 1"
                  />
                  {!field.state.meta.isValid && (
                    <FieldMessage>{field.state.meta.errors.join(', ')}</FieldMessage>
                  )}
                </Field>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="addressLine2">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Address Line 2</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter address line 2"
                    />
                  </Field>
                )}
              </form.Field>
              
              <form.Field name="addressLine3">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Address Line 3</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter address line 3"
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <form.Field 
                name="city"
                validators={{
                  onBlur: ({ value }) => {
                    const result = z.string().min(1, 'City is required').safeParse(value)
                    return result.success ? undefined : result.error.issues[0]?.message
                  }
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>City *</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter city"
                    />
                    {!field.state.meta.isValid && (
                      <FieldMessage>{field.state.meta.errors.join(', ')}</FieldMessage>
                    )}
                  </Field>
                )}
              </form.Field>
              
              <form.Field 
                name="state"
                validators={{
                  onBlur: ({ value }) => {
                    const result = z.string().min(1, 'State is required').safeParse(value)
                    return result.success ? undefined : result.error.issues[0]?.message
                  }
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>State *</FieldLabel>
                    <select
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        const selectedStateName = e.target.value
                        field.handleChange(selectedStateName)
                        
                        // Auto-populate state code when state is selected
                        const selectedState = indianStatesWithCodes.find(state => state.name === selectedStateName)
                        if (selectedState) {
                          form.setFieldValue('stateCode', selectedState.code)
                        }
                      }}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select state</option>
                      {indianStatesWithCodes.map(state => (
                        <option key={state.name} value={state.name}>
                          {state.name} ({state.code})
                        </option>
                      ))}
                    </select>
                    {!field.state.meta.isValid && (
                      <FieldMessage>{field.state.meta.errors.join(', ')}</FieldMessage>
                    )}
                  </Field>
                )}
              </form.Field>
              
              <form.Field 
                name="pincode"
                validators={{
                  onBlur: ({ value }) => {
                    const result = z.string().min(1, 'Pincode is required').regex(/^\d{6}$/, 'Pincode must be exactly 6 digits').safeParse(value)
                    return result.success ? undefined : result.error.issues[0]?.message
                  }
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Pincode *</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter pincode"
                    />
                    {!field.state.meta.isValid && (
                      <FieldMessage>{field.state.meta.errors.join(', ')}</FieldMessage>
                    )}
                  </Field>
                )}
              </form.Field>
            </div>

            <form.Field name="country">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Country</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    disabled
                    className="bg-muted"
                  />
                </Field>
              )}
            </form.Field>

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="mobileNumber">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Mobile Number</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter mobile number"
                      type="tel"
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="emailAddress">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter email address"
                      type="email"
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            {/* Regulatory Information */}
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="drugLicenseNumber">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Drug License Number</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter drug license number"
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="stateCode">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>State Code</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Auto-filled when state is selected"
                      readOnly
                      className="bg-muted"
                    />
                  </Field>
                )}
              </form.Field>
            </div>
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
                  {(isSubmitting || isSubmitting) ? (mode === 'edit' ? 'Saving...' : 'Adding...') : (mode === 'edit' ? 'Save Changes' : 'Add Buyer')}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}