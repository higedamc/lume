import { NDKKind, NDKTag } from "@nostr-dev-kit/ndk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { normalizeRelayUrl } from "nostr-fetch";
import { useArk } from "./useArk";

export function useRelaylist() {
	const ark = useArk();
	const queryClient = useQueryClient();

	const connectRelay = useMutation({
		mutationFn: async (
			relay: WebSocket["url"],
			purpose?: "read" | "write" | undefined,
		) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: ["relay-personal"],
			});

			const relayUrl = normalizeRelayUrl(relay);

			// Snapshot the previous value
			const prevRelays: NDKTag[] = queryClient.getQueryData(["relay-personal"]);

			// create new relay list if not exist
			if (!prevRelays) {
				await ark.createEvent({
					kind: NDKKind.RelayList,
					tags: [["r", relay, purpose ?? ""]],
				});
			}

			// add relay to exist list
			const index = prevRelays.findIndex((el) => el[1] === relay);
			if (index > -1) return;

			await ark.createEvent({
				kind: NDKKind.RelayList,
				tags: [...prevRelays, ["r", relayUrl, purpose ?? ""]],
			});

			// Optimistically update to the new value
			queryClient.setQueryData(["relay-personal"], (prev: NDKTag[]) => [
				...prev,
				["r", relayUrl, purpose ?? ""],
			]);

			// Return a context object with the snapshotted value
			return { prevRelays };
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: ["relay-personal"],
			});
		},
	});

	const removeRelay = useMutation({
		mutationFn: async (relay: WebSocket["url"]) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: ["relay-personal"],
			});

			// Snapshot the previous value
			const prevRelays: NDKTag[] = queryClient.getQueryData(["relay-personal"]);

			if (!prevRelays) return;

			const index = prevRelays.findIndex((el) => el[1] === relay);
			if (index > -1) prevRelays.splice(index, 1);

			await ark.createEvent({
				kind: NDKKind.RelayList,
				tags: prevRelays,
			});

			// Optimistically update to the new value
			queryClient.setQueryData(["relay-personal"], prevRelays);

			// Return a context object with the snapshotted value
			return { prevRelays };
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: ["relay-personal"],
			});
		},
	});

	return { connectRelay, removeRelay };
}
