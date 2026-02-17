import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel, FieldMessage } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Building, Save, Edit, X, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import type { Company } from '@invoice-app/api'
import { z } from 'zod'
import { useAppContext } from '@/hooks/useAppContext'

export const Route = createFileRoute('/app/my-details')({
  component: MyDetails,
})

function MyDetails() {
  const [isEditing, setIsEditing] = useState(false)
  const { orpc } = useAppContext();
  
  // Fetch company data from API
  const companyQuery = useQuery(orpc.getCompany.queryOptions())
  
  // Update company mutation
  const updateMutation = useMutation(
    orpc.updateCompany.mutationOptions({
      onSuccess: () => {
        companyQuery.refetch()
        setIsEditing(false)
      },
    })
  )
  
  // Get current company data (handle null case)
  const currentCompany = companyQuery.data

  const form = useForm({
    defaultValues: {
      companyName: '',
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      gstin: '',
      drugLicenseNumber: '',
      phoneNumber: '',
      emailAddress: '',
      bankAccountNumber: '',
      ifscCode: '',
      bankName: '',
      branch: '',
    } as Partial<Company>,
    onSubmit: async ({ value }) => {
      try {
        await updateMutation.mutateAsync({
          companyName: value.companyName!,
          addressLine1: value.addressLine1!,
          addressLine2: value.addressLine2 || undefined,
          addressLine3: value.addressLine3 || undefined,
          city: value.city!,
          state: value.state!,
          country: value.country!,
          pincode: value.pincode!,
          gstin: value.gstin!,
          drugLicenseNumber: value.drugLicenseNumber || undefined,
          phoneNumber: value.phoneNumber || undefined,
          emailAddress: value.emailAddress || undefined,
          bankAccountNumber: value.bankAccountNumber || undefined,
          ifscCode: value.ifscCode || undefined,
          bankName: value.bankName || undefined,
          branch: value.branch || undefined,
        })
      } catch (error) {
        console.error('Failed to update company:', error)
      }
    },
  })
  
  // Update form values when company data is loaded
  useEffect(() => {
    if (currentCompany && !isEditing) {
      Object.keys(currentCompany).forEach((key) => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'logoUrl') {
          const value = currentCompany[key as keyof Company]
          form.setFieldValue(key as keyof Company, value || '')
        }
      })
    }
  }, [currentCompany, form, isEditing])

  const handleEdit = () => {
    form.reset()
    // Set form values to current company data
    if (currentCompany) {
      Object.keys(currentCompany).forEach((key) => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'logoUrl') {
          const value = currentCompany[key as keyof Company]
          form.setFieldValue(key as keyof Company, value || '')
        }
      })
    }
    setIsEditing(true)
  }

  const handleCancel = () => {
    form.reset()
    setIsEditing(false)
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Details</h1>
            <p className="text-muted-foreground">Manage your company profile and business information</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={handleEdit} className="cursor-pointer" disabled={companyQuery.isLoading}>
              {companyQuery.isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Edit className="mr-2 h-4 w-4" />
              )}
              Edit Details
            </Button>
          ) : (
            <Button onClick={handleCancel} variant="outline" className="cursor-pointer">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {companyQuery.isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading company details...</span>
        </div>
      ) : companyQuery.error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500">Failed to load company details. Please try again.</p>
        </div>
      ) : !currentCompany ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Company Details Found</h2>
            <p className="text-muted-foreground mb-4">Click "Add Company Details" to add your company information.</p>
            <Button onClick={handleEdit} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Add Company Details
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto w-full">
          <div className="w-full max-w-none pb-8">
          <form
          className="w-full flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          {/* Company Information */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Basic company details that appear on your invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field 
                name="companyName"
                validators={{
                  onBlur: ({ value }) => {
                    const result = z.string().min(1, 'Company name is required').safeParse(value)
                    return result.success ? undefined : result.error.issues[0]?.message
                  }
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Company Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter company name"
                      disabled={!isEditing}
                      className={!isEditing ? "bg-muted" : ""}
                    />
                    {!field.state.meta.isValid && isEditing && (
                      <FieldMessage>{field.state.meta.errors[0]}</FieldMessage>
                    )}
                  </Field>
                )}
              </form.Field>

              <form.Field name="addressLine1">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Address Line 1</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter address line 1"
                      disabled={!isEditing}
                      className={!isEditing ? "bg-muted" : ""}
                    />
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
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter address line 2"
                        disabled={!isEditing}
                        className={!isEditing ? "bg-muted" : ""}
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
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter address line 3"
                        disabled={!isEditing}
                        className={!isEditing ? "bg-muted" : ""}
                      />
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <form.Field name="city">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>City</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter city"
                        disabled={!isEditing}
                        className={!isEditing ? "bg-muted" : ""}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="state">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>State</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter state"
                        disabled={!isEditing}
                        className={!isEditing ? "bg-muted" : ""}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="pincode">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Pincode</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter pincode"
                        disabled={!isEditing}
                        className={!isEditing ? "bg-muted" : ""}
                      />
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
                      value={field.state.value || ''}
                      disabled
                      className="bg-muted"
                    />
                  </Field>
                )}
              </form.Field>
            </CardContent>
          </Card>

          {/* Tax & Regulatory Information */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Tax & Regulatory Information</CardTitle>
              <CardDescription>
                GST and licensing details for compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="gstin">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>GSTIN/UIN</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter GSTIN/UIN"
                      disabled={!isEditing}
                      className={!isEditing ? "bg-muted" : ""}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="drugLicenseNumber">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Drug License Number</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter drug license number"
                      disabled={!isEditing}
                      className={!isEditing ? "bg-muted" : ""}
                    />
                  </Field>
                )}
              </form.Field>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Phone and email details for customer communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="phoneNumber">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Phone Number</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter phone number"
                        disabled={!isEditing}
                        className={!isEditing ? "bg-muted" : ""}
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
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter email address"
                        disabled={!isEditing}
                        className={!isEditing ? "bg-muted" : ""}
                      />
                    </Field>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
              <CardDescription>
                Banking information for payment processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="bankAccountNumber">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Bank Account Number</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter account number"
                        disabled={!isEditing}
                        className={!isEditing ? "bg-muted" : ""}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="ifscCode">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>IFSC Code</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter IFSC code"
                        disabled={!isEditing}
                        className={!isEditing ? "bg-muted" : ""}
                      />
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="bankName">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Bank Name</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter bank name"
                        disabled={!isEditing}
                        className={!isEditing ? "bg-muted" : ""}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="branch">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Branch</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter branch name"
                        disabled={!isEditing}
                        className={!isEditing ? "bg-muted" : ""}
                      />
                    </Field>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>

          {isEditing && (
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel} className="cursor-pointer">
                Cancel
              </Button>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit || isSubmitting || updateMutation.isPending} className="cursor-pointer">
                    {(isSubmitting || updateMutation.isPending) ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {(isSubmitting || updateMutation.isPending) ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          )}
        </form>
        </div>
        </div>
      )}
    </div>
  )
}