import { useMutation, useQuery } from "@tanstack/react-query";
import { useAppContext } from "@/hooks/useAppContext";

export function useStentInvoices() {
	const { orpc } = useAppContext();

	const list = useQuery(orpc.listStentInvoices.queryOptions());

	const create = useMutation(
		orpc.createStentInvoice.mutationOptions({
			onSuccess: () => list.refetch(),
		}),
	);

	const update = useMutation(
		orpc.updateStentInvoice.mutationOptions({
			onSuccess: () => list.refetch(),
		}),
	);

	const remove = useMutation(
		orpc.deleteStentInvoice.mutationOptions({
			onSuccess: () => list.refetch(),
		}),
	);

	return { list, create, update, remove };
}

export default useStentInvoices;
