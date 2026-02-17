import { useQuery } from '@tanstack/react-query'
import { useAppContext } from '@/hooks/useAppContext'

export function useBuyersProducts() {
  const { orpc } = useAppContext()

  const buyers = useQuery(orpc.listBuyers.queryOptions())
  const products = useQuery(orpc.listProducts.queryOptions())

  return { buyers, products }
}

export default useBuyersProducts
