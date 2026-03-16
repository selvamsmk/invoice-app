import { useMutation, useQuery } from "@tanstack/react-query";
import { useAppContext } from "@/hooks/useAppContext";

export function useInvoices() {
	const { orpc } = useAppContext();

	const list = useQuery(orpc.listInvoices.queryOptions());

	const create = useMutation(
		orpc.createInvoice.mutationOptions({
			onSuccess: () => list.refetch(),
		}),
	);

	const update = useMutation(
		orpc.updateInvoice.mutationOptions({
			onSuccess: () => list.refetch(),
		}),
	);

	const remove = useMutation(
		orpc.deleteInvoice.mutationOptions({
			onSuccess: () => list.refetch(),
		}),
	);

	return { list, create, update, remove };
}

export default useInvoices;
