import { Account, type NDKEventWithReplies, type NIP05 } from "@lume/types";
import NDK, {
	NDKEvent,
	NDKFilter,
	NDKKind,
	NDKNip46Signer,
	NDKPrivateKeySigner,
	NDKRelay,
	NDKSubscriptionCacheUsage,
	NDKTag,
	NDKUser,
	NostrEvent,
} from "@nostr-dev-kit/ndk";
import { ndkAdapter } from "@nostr-fetch/adapter-ndk";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { fetch } from "@tauri-apps/plugin-http";
import { NostrFetcher, normalizeRelayUrl } from "nostr-fetch";
import { nip19 } from "nostr-tools";

export class Ark {
	public ndk: NDK;
	public account: Account;

	constructor({
		ndk,
		account,
	}: {
		ndk: NDK;
		account: Account;
	}) {
		this.ndk = ndk;
		this.account = account;
	}

	public async connectDepot() {
		return this.ndk.addExplicitRelay(
			new NDKRelay(normalizeRelayUrl("ws://localhost:6090")),
			undefined,
			true,
		);
	}

	public updateNostrSigner({
		signer,
	}: { signer: NDKNip46Signer | NDKPrivateKeySigner }) {
		this.ndk.signer = signer;
		return this.ndk.signer;
	}

	public subscribe({
		filter,
		closeOnEose = false,
		cb,
	}: {
		filter: NDKFilter;
		closeOnEose: boolean;
		cb: (event: NDKEvent) => void;
	}) {
		const sub = this.ndk.subscribe(filter, { closeOnEose });
		sub.addListener("event", (event: NDKEvent) => cb(event));
		return sub;
	}

	public getNDKEvent(event: NostrEvent) {
		return new NDKEvent(this.ndk, event);
	}

	public async createEvent({
		kind,
		tags,
		content,
		rootReplyTo = undefined,
		replyTo = undefined,
	}: {
		kind: NDKKind | number;
		tags: NDKTag[];
		content?: string;
		rootReplyTo?: string;
		replyTo?: string;
	}) {
		try {
			const event = new NDKEvent(this.ndk);
			if (content) event.content = content;
			event.kind = kind;
			event.tags = tags;

			if (rootReplyTo) {
				const rootEvent = await this.ndk.fetchEvent(rootReplyTo);
				if (rootEvent) event.tag(rootEvent, "root");
			}

			if (replyTo) {
				const replyEvent = await this.ndk.fetchEvent(replyTo);
				if (replyEvent) event.tag(replyEvent, "reply");
			}

			const publish = await event.publish();

			if (!publish) throw new Error("Failed to publish event");
			return {
				id: event.id,
				seens: [...publish.values()].map((item) => item.url),
			};
		} catch (e) {
			throw new Error(e);
		}
	}

	public getCleanPubkey(pubkey: string) {
		try {
			let hexstring = pubkey
				.replace("nostr:", "")
				.split("'")[0]
				.split(".")[0]
				.split(",")[0]
				.split("?")[0];

			if (
				hexstring.startsWith("npub1") ||
				hexstring.startsWith("nprofile1") ||
				hexstring.startsWith("naddr1")
			) {
				const decoded = nip19.decode(hexstring);

				if (decoded.type === "nprofile") hexstring = decoded.data.pubkey;
				if (decoded.type === "npub") hexstring = decoded.data;
				if (decoded.type === "naddr") hexstring = decoded.data.pubkey;
			}

			return hexstring;
		} catch (e) {
			console.log(e);
		}
	}

	public async getUserProfile(pubkey?: string) {
		try {
			const currentUserPubkey = this.account.pubkey;
			const hexstring = pubkey
				? this.getCleanPubkey(pubkey)
				: currentUserPubkey;

			const user = this.ndk.getUser({
				pubkey: hexstring,
			});

			const profile = await user.fetchProfile({
				cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
			});

			return profile;
		} catch {
			throw new Error("user not found");
		}
	}

	public async getUserContacts(pubkey?: string) {
		try {
			const currentUserPubkey = this.account.pubkey;
			const hexstring = pubkey
				? this.getCleanPubkey(pubkey)
				: currentUserPubkey;

			const user = this.ndk.getUser({
				pubkey: hexstring,
			});

			const contacts = [...(await user.follows(undefined, false))].map(
				(user) => user.pubkey,
			);

			if (!pubkey || pubkey === this.account.pubkey) {
				this.account.contacts = contacts;
			}

			return contacts;
		} catch (e) {
			console.error(e);
		}
	}

	public async getUserRelays({ pubkey }: { pubkey?: string }) {
		try {
			const user = this.ndk.getUser({
				pubkey: pubkey ? pubkey : this.account.pubkey,
			});
			return await user.relayList();
		} catch (e) {
			console.error(e);
		}
	}

	public async newContactList({ tags }: { tags: NDKTag[] }) {
		const publish = await this.createEvent({
			kind: NDKKind.Contacts,
			tags: tags,
		});

		if (publish) {
			this.account.contacts = tags.map((item) => item[1]);
			return publish;
		}
	}

	public async createContact(pubkey: string) {
		const user = this.ndk.getUser({ pubkey: this.account.pubkey });
		const contacts = await user.follows();
		return await user.follow(new NDKUser({ pubkey: pubkey }), contacts);
	}

	public async deleteContact(pubkey: string) {
		const user = this.ndk.getUser({ pubkey: this.account.pubkey });
		const contacts = await user.follows();
		contacts.delete(new NDKUser({ pubkey: pubkey }));

		const event = new NDKEvent(this.ndk);
		event.content = "";
		event.kind = NDKKind.Contacts;
		event.tags = [...contacts].map((item) => [
			"p",
			item.pubkey,
			item.relayUrls?.[0] || "",
			"",
		]);

		return await event.publish();
	}

	public async getAllEvents({ filter }: { filter: NDKFilter }) {
		const events = await this.ndk.fetchEvents(filter);
		if (!events) return [];
		return [...events];
	}

	public getCleanEventId(id: string) {
		let eventId: string = id.replace("nostr:", "").split("'")[0].split(".")[0];

		if (
			eventId.startsWith("nevent1") ||
			eventId.startsWith("note1") ||
			eventId.startsWith("naddr1")
		) {
			const decode = nip19.decode(eventId);
			if (decode.type === "nevent") eventId = decode.data.id;
			if (decode.type === "note") eventId = decode.data;
		}

		return eventId;
	}

	public async getEventById(id: string) {
		try {
			const eventId = this.getCleanEventId(id);
			return await this.ndk.fetchEvent(eventId);
		} catch {
			throw new Error("event not found");
		}
	}

	public async getEventByFilter({
		filter,
		cache,
	}: { filter: NDKFilter; cache?: NDKSubscriptionCacheUsage }) {
		const event = await this.ndk.fetchEvent(filter, {
			cacheUsage: cache || NDKSubscriptionCacheUsage.CACHE_FIRST,
		});

		if (!event) return null;
		return event;
	}

	public async getEvents(filter: NDKFilter) {
		const events = await this.ndk.fetchEvents(filter);
		if (!events) return [];
		return [...events];
	}

	public getEventThread({
		content,
		tags,
	}: { content: string; tags: NDKTag[] }) {
		let rootEventId: string = null;
		let replyEventId: string = null;

		if (content.includes("nostr:note1") || content.includes("nostr:nevent1"))
			return null;

		const events = tags.filter((el) => el[0] === "e" && el[3] !== "mention");

		if (!events.length) return null;

		if (events.length === 1)
			return {
				rootEventId: events[0][1],
				replyEventId: null,
			};

		if (events.length > 1) {
			rootEventId = events.find((el) => el[3] === "root")?.[1];
			replyEventId = events.find((el) => el[3] === "reply")?.[1];

			if (!rootEventId && !replyEventId) {
				rootEventId = events[0][1];
				replyEventId = events[1][1];
			}
		}

		return {
			rootEventId,
			replyEventId,
		};
	}

	public async getThreads(id: string) {
		const eventId = this.getCleanEventId(id);
		const fetcher = NostrFetcher.withCustomPool(ndkAdapter(this.ndk));
		const relayUrls = Array.from(this.ndk.pool.relays.keys());

		try {
			const rawEvents = (await fetcher.fetchAllEvents(
				relayUrls,
				{
					kinds: [NDKKind.Text],
					"#e": [eventId],
				},
				{ since: 0 },
				{ sort: true },
			)) as unknown as NostrEvent[];

			const events = rawEvents.map(
				(event) => new NDKEvent(this.ndk, event),
			) as NDKEvent[] as NDKEventWithReplies[];

			if (events.length > 0) {
				const replies = new Set();
				for (const event of events) {
					const tags = event.tags.filter(
						(el) => el[0] === "e" && el[1] !== id && el[3] !== "mention",
					);
					if (tags.length > 0) {
						for (const tag of tags) {
							const rootIndex = events.findIndex((el) => el.id === tag[1]);
							if (rootIndex !== -1) {
								const rootEvent = events[rootIndex];
								if (rootEvent?.replies) {
									rootEvent.replies.push(event);
								} else {
									rootEvent.replies = [event];
								}
								replies.add(event.id);
							}
						}
					}
				}
				const cleanEvents = events.filter((ev) => !replies.has(ev.id));
				return cleanEvents;
			}

			return events;
		} catch (e) {
			console.log(e);
		} finally {
			fetcher.shutdown();
		}
	}

	public async getAllRelaysFromContacts({ signal }: { signal: AbortSignal }) {
		const fetcher = NostrFetcher.withCustomPool(ndkAdapter(this.ndk));
		const connectedRelays = Array.from(this.ndk.pool.relays.keys());

		try {
			const relayMap = new Map<string, string[]>();
			const relayEvents = fetcher.fetchLatestEventsPerAuthor(
				{
					authors: this.account.contacts,
					relayUrls: connectedRelays,
				},
				{ kinds: [NDKKind.RelayList] },
				1,
				{ abortSignal: signal },
			);

			for await (const { author, events } of relayEvents) {
				if (events.length) {
					const relayTags = events[0].tags.filter((item) => item[0] === "r");
					for (const tag of relayTags) {
						const item = relayMap.get(tag[1]);
						if (item?.length) {
							item.push(author);
						} else {
							relayMap.set(tag[1], [author]);
						}
					}
				}
			}

			return relayMap;
		} catch (e) {
			console.log(e);
		} finally {
			fetcher.shutdown();
		}
	}

	public async getInfiniteEvents({
		filter,
		limit,
		pageParam = 0,
		signal = undefined,
		dedup = true,
	}: {
		filter: NDKFilter;
		limit: number;
		pageParam?: number;
		signal?: AbortSignal;
		dedup?: boolean;
	}) {
		const fetcher = NostrFetcher.withCustomPool(ndkAdapter(this.ndk));
		const relayUrls = Array.from(this.ndk.pool.relays.keys());
		const seenIds = new Set<string>();
		const dedupQueue = new Set<string>();

		try {
			const events = await fetcher.fetchLatestEvents(relayUrls, filter, limit, {
				asOf: pageParam === 0 ? undefined : pageParam,
				abortSignal: signal,
			});

			const ndkEvents = events.map((event) => {
				return new NDKEvent(this.ndk, event);
			});

			if (dedup) {
				for (const event of ndkEvents) {
					const tags = event.tags
						.filter((el) => el[0] === "e")
						?.map((item) => item[1]);

					if (tags.length) {
						for (const tag of tags) {
							if (seenIds.has(tag)) {
								dedupQueue.add(event.id);
								break;
							}

							seenIds.add(tag);
						}
					}
				}

				return ndkEvents
					.filter((event) => !dedupQueue.has(event.id))
					.sort((a, b) => b.created_at - a.created_at);
			}

			return ndkEvents.sort((a, b) => b.created_at - a.created_at);
		} catch (e) {
			console.log(e);
		} finally {
			fetcher.shutdown();
		}
	}

	public async getRelayEvents({
		relayUrl,
		filter,
		limit,
		pageParam = 0,
		signal = undefined,
	}: {
		relayUrl: string;
		filter: NDKFilter;
		limit: number;
		pageParam?: number;
		signal?: AbortSignal;
		dedup?: boolean;
	}) {
		const fetcher = NostrFetcher.withCustomPool(ndkAdapter(this.ndk));

		try {
			const events = await fetcher.fetchLatestEvents(
				[normalizeRelayUrl(relayUrl)],
				filter,
				limit,
				{
					asOf: pageParam === 0 ? undefined : pageParam,
					abortSignal: signal,
				},
			);

			const ndkEvents = events.map((event) => {
				return new NDKEvent(this.ndk, event);
			});

			return ndkEvents.sort((a, b) => b.created_at - a.created_at);
		} catch (e) {
			console.log(e);
		} finally {
			fetcher.shutdown();
		}
	}

	/**
	 * Upload media file to nostr.build
	 * @todo support multiple backends
	 */
	public async upload({ fileExts }: { fileExts?: string[] }) {
		const defaultExts = ["png", "jpeg", "jpg", "gif"].concat(fileExts);

		const selected = await open({
			multiple: false,
			filters: [
				{
					name: "Image",
					extensions: defaultExts,
				},
			],
		});

		if (!selected) return null;

		const file = await readFile(selected.path);
		const blob = new Blob([file]);

		const data = new FormData();
		data.append("fileToUpload", blob);
		data.append("submit", "Upload Image");

		const res = await fetch("https://nostr.build/api/v2/upload/files", {
			method: "POST",
			body: data,
		});

		if (!res.ok) return null;

		const json = await res.json();
		const content = json.data[0];

		return content.url as string;
	}

	public async validateNIP05({
		pubkey,
		nip05,
		signal,
	}: {
		pubkey: string;
		nip05: string;
		signal?: AbortSignal;
	}) {
		const localPath = nip05.split("@")[0];
		const service = nip05.split("@")[1];
		const verifyURL = `https://${service}/.well-known/nostr.json?name=${localPath}`;

		const res = await fetch(verifyURL, {
			method: "GET",
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
			signal,
		});

		if (!res.ok) throw new Error(`Failed to fetch NIP-05 service: ${nip05}`);

		const data: NIP05 = await res.json();

		if (!data.names) return false;
		if (data.names[localPath.toLowerCase()] === pubkey) return true;
		if (data.names[localPath] === pubkey) return true;

		return false;
	}

	public async getAppRecommend({
		unknownKind,
		author,
	}: { unknownKind: string; author?: string }) {
		const event = await this.ndk.fetchEvent({
			kinds: [NDKKind.AppRecommendation],
			"#d": [unknownKind],
			authors: this.account.contacts || [author],
		});

		if (event) return event.tags.filter((item) => item[0] !== "d");

		const altEvent = await this.ndk.fetchEvent({
			kinds: [NDKKind.AppHandler],
			"#k": [unknownKind],
			authors: this.account.contacts || [author],
		});

		if (altEvent) return altEvent.tags.filter((item) => item[0] !== "d");

		return null;
	}

	public async getOAuthServices() {
		const trusted: NDKEvent[] = [];

		const services = await this.ndk.fetchEvents({
			kinds: [NDKKind.AppHandler],
			"#k": ["24133"],
		});

		for (const service of services) {
			const nip05 = JSON.parse(service.content).nip05 as string;
			try {
				const validate = await this.validateNIP05({
					pubkey: service.pubkey,
					nip05,
				});
				if (validate) trusted.push(service);
			} catch (e) {
				console.log(e);
			}
		}

		return trusted;
	}
}
