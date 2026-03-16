import { useMutation, useQuery } from "@tanstack/react-query";
import { useAppContext } from "@/hooks/useAppContext";

export function useDeliveryChallans() {
	const { orpc } = useAppContext();

	const list = useQuery(orpc.listDeliveryChallans.queryOptions());

	const create = useMutation(
		orpc.createDeliveryChallan.mutationOptions({
			onSuccess: () => list.refetch(),
		}),
	);

	const update = useMutation(
		orpc.updateDeliveryChallan.mutationOptions({
			onSuccess: () => list.refetch(),
		}),
	);

	const remove = useMutation(
		orpc.deleteDeliveryChallan.mutationOptions({
			onSuccess: () => list.refetch(),
		}),
	);

	return { list, create, update, remove };
}

export default useDeliveryChallans;
