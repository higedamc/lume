import { NoteSkeleton, RepostNote, TextNote, useArk } from "@lume/ark";
import { ArrowRightCircleIcon, LoaderIcon } from "@lume/icons";
import { FETCH_LIMIT } from "@lume/utils";
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { VList } from "virtua";

export function RelayEventList({ relayUrl }: { relayUrl: string }) {
	const ark = useArk();
	const { status, data, hasNextPage, isFetchingNextPage, fetchNextPage } =
		useInfiniteQuery({
			queryKey: ["relay-events", relayUrl],
			initialPageParam: 0,
			queryFn: async ({
				signal,
				pageParam,
			}: {
				signal: AbortSignal;
				pageParam: number;
			}) => {
				const url = `wss://${relayUrl}`;
				const events = await ark.getRelayEvents({
					relayUrl: url,
					filter: {
						kinds: [NDKKind.Text, NDKKind.Repost],
					},
					limit: FETCH_LIMIT,
					pageParam,
					signal,
				});

				return events;
			},
			getNextPageParam: (lastPage) => {
				const lastEvent = lastPage.at(-1);
				if (!lastEvent) return;
				return lastEvent.created_at - 1;
			},
			refetchOnWindowFocus: false,
		});

	const allEvents = useMemo(
		() => (data ? data.pages.flatMap((page) => page) : []),
		[data],
	);

	const renderItem = useCallback(
		(event: NDKEvent) => {
			switch (event.kind) {
				case NDKKind.Text:
					return <TextNote key={event.id} event={event} />;
				case NDKKind.Repost:
					return <RepostNote key={event.id} event={event} />;
				default:
					return <TextNote key={event.id} event={event} />;
			}
		},
		[data],
	);

	return (
		<VList className="mx-auto h-full w-full max-w-[500px] pt-10 scrollbar-none">
			{status === "pending" ? (
				<NoteSkeleton />
			) : (
				allEvents.map((item) => renderItem(item))
			)}
			<div className="flex h-16 items-center justify-center px-3 pb-3">
				{hasNextPage ? (
					<button
						type="button"
						onClick={() => fetchNextPage()}
						disabled={!hasNextPage || isFetchingNextPage}
						className="inline-flex h-10 w-max items-center justify-center gap-2 rounded-full bg-blue-500 px-6 font-medium text-white hover:bg-blue-600 focus:outline-none"
					>
						{isFetchingNextPage ? (
							<LoaderIcon className="h-4 w-4 animate-spin" />
						) : (
							<>
								<ArrowRightCircleIcon className="h-5 w-5" />
								Load more
							</>
						)}
					</button>
				) : null}
			</div>
		</VList>
	);
}
