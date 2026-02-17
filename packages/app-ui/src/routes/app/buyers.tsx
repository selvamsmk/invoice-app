import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AddBuyerDialog } from '@/components/add-buyer-dialog'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Edit, Trash2, Loader2, Users } from 'lucide-react'
import { useState } from 'react'
import type { Buyer } from '@invoice-app/api'

import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRef } from 'react'
import { useAppContext } from '@/hooks/useAppContext'


export const Route = createFileRoute('/app/buyers')({
  component: Buyers,
})

function Buyers() {
  const { orpc } = useAppContext();
  // Fetch buyers from API
  const buyers = useQuery(orpc.listBuyers.queryOptions())

  // Mutations
  const createMutation = useMutation(
    orpc.createBuyer.mutationOptions({
      onSuccess: () => {
        buyers.refetch()
      },
    })
  )

  const updateMutation = useMutation(
    orpc.updateBuyer.mutationOptions({
      onSuccess: () => {
        buyers.refetch()
      },
    })
  )

  const deleteMutation = useMutation(
    orpc.deleteBuyer.mutationOptions({
      onSuccess: () => {
        buyers.refetch()
      },
    })
  )

  const uploadMutation = useMutation(
    orpc.uploadBuyersCSV?.mutationOptions?.({
      onSuccess: (res: any) => {
        buyers.refetch()
        if (res?.duplicateNamesInFile?.length) {
          const names = res.duplicateNamesInFile.join(', ')
          toast.error(`Duplicate names in file: ${names}`, { position: 'top-left' })
        }
        if (res?.existingNames?.length) {
          const names = res.existingNames.join(', ')
          toast.error(`Buyers already exist: ${names}`, { position: 'top-left' })
        }
        if (res?.insertedCount) {
          const names = res.insertedNames?.join(', ') || ''
          const description = names.length > 0 ? names : undefined
          toast.success(`Inserted ${res.insertedCount} buyers`, { description, position: 'top-right' })
        } else {
          toast('No buyers inserted', { position: 'top-right' })
        }
      },
      onError: (err: any) => {
        const extract = (e: any) => {
          if (!e) return 'Failed to upload CSV'
          if (typeof e === 'string') return e
          if (e?.message) return e.message
          if (e?.data?.message) return e.data.message
          if (e?.response?.data?.message) return e.response.data.message
          try {
            return JSON.stringify(e)
          } catch {
            return String(e)
          }
        }
        toast.error(extract(err), { position: 'top-left' })
      },
    }) ?? {}
  )

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [buyerToDelete, setBuyerToDelete] = useState<Buyer | null>(null)
  const [activeTab, setActiveTab] = useState('list')
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null)

  const handleAddBuyer = async (newBuyer: Omit<Buyer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createMutation.mutateAsync({
        name: newBuyer.name,
        addressLine1: newBuyer.addressLine1,
        addressLine2: newBuyer.addressLine2 || undefined,
        addressLine3: newBuyer.addressLine3 || undefined,
        city: newBuyer.city,
        state: newBuyer.state,
        country: newBuyer.country,
        pincode: newBuyer.pincode,
        gstin: newBuyer.gstin ?? "",
        mobileNumber: newBuyer.mobileNumber || undefined,
        emailAddress: newBuyer.emailAddress || undefined,
        drugLicenseNumber: newBuyer.drugLicenseNumber || undefined,
        stateCode: newBuyer.stateCode || undefined,
      })
    } catch (error) {
      console.error('Failed to create buyer:', error)
    }
  }

  const handleEditBuyer = async (updatedBuyer: Buyer) => {
    try {
      await updateMutation.mutateAsync({
        id: updatedBuyer.id,
        name: updatedBuyer.name,
        addressLine1: updatedBuyer.addressLine1,
        addressLine2: updatedBuyer.addressLine2 || undefined,
        addressLine3: updatedBuyer.addressLine3 || undefined,
        city: updatedBuyer.city,
        state: updatedBuyer.state,
        country: updatedBuyer.country,
        pincode: updatedBuyer.pincode,
        gstin: updatedBuyer.gstin ?? "",
        mobileNumber: updatedBuyer.mobileNumber || undefined,
        emailAddress: updatedBuyer.emailAddress || undefined,
        drugLicenseNumber: updatedBuyer.drugLicenseNumber || undefined,
        stateCode: updatedBuyer.stateCode || undefined,
      })
      setEditingBuyer(null)
    } catch (error) {
      console.error('Failed to update buyer:', error)
    }
  }

  const handleOpenEditDialog = (buyer: Buyer) => {
    setEditingBuyer(buyer)
    setIsAddDialogOpen(true)
  }

  const handleOpenAddDialog = () => {
    setEditingBuyer(null)
    setIsAddDialogOpen(true)
  }

  const handleCloseDialog = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      setEditingBuyer(null)
    }
  }

  const handleOpenDeleteDialog = (buyer: Buyer) => {
    setBuyerToDelete(buyer)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (buyerToDelete) {
      try {
        await deleteMutation.mutateAsync({ id: buyerToDelete.id })
      } catch (error) {
        console.error('Failed to delete buyer:', error)
      }
    }
    setDeleteConfirmOpen(false)
    setBuyerToDelete(null)
  }

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false)
    setBuyerToDelete(null)
  }

  const handleViewBuyer = (buyer: Buyer) => {
    setSelectedBuyer(buyer)
    setActiveTab('details')
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      await uploadMutation.mutateAsync({ csv: text })
    } catch (err: any) {
      console.error('Upload failed', err)
      const extract = (e: any) => {
        if (!e) return 'Upload failed'
        if (typeof e === 'string') return e
        if (e?.message) return e.message
        if (e?.data?.message) return e.data.message
        if (e?.response?.data?.message) return e.response.data.message
        try {
          return JSON.stringify(e)
        } catch {
          return String(e)
        }
      }
      toast.error(extract(err), { position: 'top-left' })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Buyers</h1>
            <p className="text-muted-foreground">Manage your customer information and contact details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleOpenAddDialog} className="cursor-pointer" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Buyer
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} className="cursor-pointer" disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Users className="mr-2 h-4 w-4" />
            )}
            Import CSV
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col w-full min-h-0">
        <TabsList className="mb-4 shrink-0">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Buyer List
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Buyer Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="flex-1 flex flex-col min-h-0">
      
      {buyers.isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading buyers...</span>
        </div>
      ) : buyers.error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500">Failed to load buyers. Please try again.</p>
        </div>
      ) : (
      <><div className="flex-1 rounded-md border overflow-hidden min-h-0">{/* rest of table code continues... */}
              <div className="h-full overflow-y-auto">
                <Table className="relative table-fixed">
                  <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10">
                    <TableRow>
                      <TableHead className="w-[200px]">Name</TableHead>
                      <TableHead className="w-[200px]">Address</TableHead>
                      <TableHead className="w-[120px]">City</TableHead>
                      <TableHead className="w-[120px]">State</TableHead>
                      <TableHead className="w-[100px]">Pincode</TableHead>
                      <TableHead className="w-[150px]">GSTIN/UIN</TableHead>
                      <TableHead className="w-20">Invoices</TableHead>
                      <TableHead className="w-[160px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buyers.data?.map((buyer) => {
                      const fullAddress = [
                        buyer.addressLine1,
                        buyer.addressLine2,
                        buyer.addressLine3
                      ].filter(Boolean).join(', ')

                      return (
                        <TableRow key={buyer.id}>
                          <TableCell className="font-medium w-[200px]">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="truncate cursor-help">{buyer.name}</div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{buyer.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="w-[200px]">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-sm truncate cursor-help">{fullAddress}</div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{fullAddress}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="w-[120px]">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="truncate cursor-help">{buyer.city}</div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{buyer.city}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="w-[120px]">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="truncate cursor-help">{buyer.state}</div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{buyer.state}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="w-[100px]">{buyer.pincode}</TableCell>
                          <TableCell className="w-[150px]">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="truncate cursor-help">{buyer.gstin}</div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{buyer.gstin}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="w-20">{buyer.totalInvoices}</TableCell>
                          <TableCell className="text-right w-[160px]">
                            <div className="flex gap-2 justify-end">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewBuyer(buyer)}
                                    className="cursor-pointer"
                                  >
                                    <Users className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View Details</p>
                                </TooltipContent>
                              </Tooltip>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditDialog(buyer)}
                                className="cursor-pointer"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog(buyer)}
                                className="cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
            </>
      )}
        </TabsContent>

        <TabsContent value="details" className="flex-1 flex flex-col min-h-0">
          {selectedBuyer ? (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 pb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Buyer Details</h2>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('list')}
                  >
                    Back to List
                  </Button>
                </div>
                
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="text-lg font-semibold">{selectedBuyer.name}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">GSTIN/UIN</label>
                      <p className="text-lg">{selectedBuyer.gstin}</p>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Address</label>
                      <div className="space-y-1">
                        <p className="text-lg">{selectedBuyer.addressLine1}</p>
                        {selectedBuyer.addressLine2 && <p className="text-lg">{selectedBuyer.addressLine2}</p>}
                        {selectedBuyer.addressLine3 && <p className="text-lg">{selectedBuyer.addressLine3}</p>}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">City</label>
                      <p className="text-lg">{selectedBuyer.city}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">State</label>
                      <p className="text-lg">{selectedBuyer.state}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Country</label>
                      <p className="text-lg">{selectedBuyer.country}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Pincode</label>
                      <p className="text-lg">{selectedBuyer.pincode}</p>
                    </div>
                    
                    {selectedBuyer.stateCode && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">State Code</label>
                        <p className="text-lg">{selectedBuyer.stateCode}</p>
                      </div>
                    )}
                    
                    {selectedBuyer.mobileNumber && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                        <p className="text-lg">{selectedBuyer.mobileNumber}</p>
                      </div>
                    )}
                    
                    {selectedBuyer.emailAddress && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                        <p className="text-lg">{selectedBuyer.emailAddress}</p>
                      </div>
                    )}
                    
                    {selectedBuyer.drugLicenseNumber && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Drug License Number</label>
                        <p className="text-lg">{selectedBuyer.drugLicenseNumber}</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Total Invoices</label>
                      <p className="text-lg font-semibold">{selectedBuyer.totalInvoices}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Buyer ID</label>
                      <p className="text-sm text-muted-foreground">{selectedBuyer.id}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Created At</label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedBuyer.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                    
                    {selectedBuyer.updatedAt && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedBuyer.updatedAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleOpenEditDialog(selectedBuyer)}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Buyer
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleOpenDeleteDialog(selectedBuyer)}
                      className="cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Buyer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Buyer Selected</h2>
                <p className="text-muted-foreground mb-4">
                  Select a buyer from the list to view their details
                </p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('list')}
                >
                  Go to Buyer List
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Dialogs - moved outside tabs so they work from both list and details tabs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />

      <AddBuyerDialog
        open={isAddDialogOpen}
        onOpenChange={handleCloseDialog}
        onAddBuyer={handleAddBuyer}
        onEditBuyer={handleEditBuyer}
        editingBuyer={editingBuyer}
        mode={editingBuyer ? 'edit' : 'add'}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Buyer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{buyerToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancelDelete} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete} className="cursor-pointer">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}