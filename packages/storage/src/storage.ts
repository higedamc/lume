import {
	Account,
	IColumn,
	Interests,
	NDKCacheEvent,
	NDKCacheEventTag,
	NDKCacheUser,
	NDKCacheUserProfile,
} from "@lume/types";
import { invoke } from "@tauri-apps/api/core";
import { resolve, appConfigDir, resolveResource } from "@tauri-apps/api/path";
import { VITE_FLATPAK_RESOURCE } from "@lume/utils";
import { Platform } from "@tauri-apps/plugin-os";
import { Child, Command } from "@tauri-apps/plugin-shell";
import Database from "@tauri-apps/plugin-sql";
import { nip19 } from "nostr-tools";

export class LumeStorage {
	#db: Database;
	#depot: Child;
	readonly platform: Platform;
	readonly locale: string;
	public currentUser: Account;
	public interests: Interests;
	public nwc: string;
	public settings: {
		autoupdate: boolean;
		nsecbunker: boolean;
		media: boolean;
		hashtag: boolean;
		depot: boolean;
		tunnelUrl: string;
		lowPower: boolean;
		translation: boolean;
		translateApiKey: string;
		instantZap: boolean;
	};

	constructor(db: Database, platform: Platform, locale: string) {
		this.#db = db;
		this.locale = locale;
		this.platform = platform;
		this.interests = null;
		this.nwc = null;
		this.settings = {
			autoupdate: false,
			nsecbunker: false,
			media: true,
			hashtag: true,
			depot: false,
			tunnelUrl: "",
			lowPower: false,
			translation: false,
			translateApiKey: "",
			instantZap: false,
		};
	}

	public async init() {
		const settings = await this.getAllSettings();
		const account = await this.getActiveAccount();

		if (account) {
			this.currentUser = account;
			this.interests = await this.getInterests();
		}

		for (const item of settings) {
			if (item.value.length > 10) {
				this.settings[item.key] = item.value;
			} else {
				this.settings[item.key] = !!parseInt(item.value);
			}
		}
	}

	async #keyring_save(key: string, value: string) {
		return await invoke("secure_save", { key, value });
	}

	async #keyring_load(key: string) {
		try {
			const value: string = await invoke("secure_load", { key });
			if (!value) return null;
			return value;
		} catch {
			return null;
		}
	}

	async #keyring_remove(key: string) {
		return await invoke("secure_remove", { key });
	}

	public async launchDepot() {
		const configPath =
			VITE_FLATPAK_RESOURCE !== null
				? await resolve("/", VITE_FLATPAK_RESOURCE)
				: await resolveResource("resources/config.toml");
		const dataPath = await appConfigDir();

		const command = Command.sidecar("bin/depot", [
			"-c",
			configPath,
			"-d",
			dataPath,
		]);
		this.#depot = await command.spawn();
	}

	public checkDepot() {
		if (this.#depot) return true;
		return false;
	}

	public async stopDepot() {
		if (this.#depot) return this.#depot.kill();
	}

	public async getCacheUser(pubkey: string) {
		const results: Array<NDKCacheUser> = await this.#db.select(
			"SELECT * FROM ndk_users WHERE pubkey = $1 ORDER BY pubkey DESC LIMIT 1;",
			[pubkey],
		);

		if (!results.length) return null;

		if (typeof results[0].profile === "string")
			results[0].profile = JSON.parse(results[0].profile);

		return results[0];
	}

	public async getCacheEvent(id: string) {
		const results: Array<NDKCacheEvent> = await this.#db.select(
			"SELECT * FROM ndk_events WHERE id = $1 ORDER BY id DESC LIMIT 1;",
			[id],
		);

		if (!results.length) return null;
		return results[0];
	}

	public async getCacheEvents(ids: string[]) {
		const idsArr = `'${ids.join("','")}'`;

		const results: Array<NDKCacheEvent> = await this.#db.select(
			`SELECT * FROM ndk_events WHERE id IN (${idsArr}) ORDER BY id;`,
		);

		if (!results.length) return [];
		return results;
	}

	public async getCacheEventsByPubkey(pubkey: string) {
		const results: Array<NDKCacheEvent> = await this.#db.select(
			"SELECT * FROM ndk_events WHERE pubkey = $1 ORDER BY id;",
			[pubkey],
		);

		if (!results.length) return [];
		return results;
	}

	public async getCacheEventsByKind(kind: number) {
		const results: Array<NDKCacheEvent> = await this.#db.select(
			"SELECT * FROM ndk_events WHERE kind = $1 ORDER BY id;",
			[kind],
		);

		if (!results.length) return [];
		return results;
	}

	public async getCacheEventsByKindAndAuthor(kind: number, pubkey: string) {
		const results: Array<NDKCacheEvent> = await this.#db.select(
			"SELECT * FROM ndk_events WHERE kind = $1 AND pubkey = $2 ORDER BY id;",
			[kind, pubkey],
		);

		if (!results.length) return [];
		return results;
	}

	public async getCacheEventTagsByTagValue(tagValue: string) {
		const results: Array<NDKCacheEventTag> = await this.#db.select(
			"SELECT * FROM ndk_eventtags WHERE tagValue = $1 ORDER BY id;",
			[tagValue],
		);

		if (!results.length) return [];
		return results;
	}

	public async setCacheEvent({
		id,
		pubkey,
		content,
		kind,
		createdAt,
		relay,
		event,
	}: NDKCacheEvent) {
		return await this.#db.execute(
			"INSERT OR IGNORE INTO ndk_events (id, pubkey, content, kind, createdAt, relay, event) VALUES ($1, $2, $3, $4, $5, $6, $7);",
			[id, pubkey, content, kind, createdAt, relay, event],
		);
	}

	public async setCacheEventTag({
		id,
		eventId,
		tag,
		value,
		tagValue,
	}: NDKCacheEventTag) {
		return await this.#db.execute(
			"INSERT OR IGNORE INTO ndk_eventtags (id, eventId, tag, value, tagValue) VALUES ($1, $2, $3, $4, $5);",
			[id, eventId, tag, value, tagValue],
		);
	}

	public async setCacheProfiles(profiles: Array<NDKCacheUser>) {
		return await Promise.all(
			profiles.map(
				async (profile) =>
					await this.#db.execute(
						"INSERT OR IGNORE INTO ndk_users (pubkey, profile, createdAt) VALUES ($1, $2, $3);",
						[profile.pubkey, profile.profile, profile.createdAt],
					),
			),
		);
	}

	public async getAllCacheUsers() {
		const results: Array<NDKCacheUser> = await this.#db.select(
			"SELECT * FROM ndk_users ORDER BY createdAt DESC;",
		);

		if (!results.length) return [];

		const users: NDKCacheUserProfile[] = results.map((item) => ({
			npub: nip19.npubEncode(item.pubkey),
			...JSON.parse(item.profile as string),
		}));

		return users;
	}

	public async checkAccount() {
		const result: Array<{ total: string }> = await this.#db.select(
			'SELECT COUNT(*) AS "total" FROM accounts WHERE is_active = "1" ORDER BY id DESC LIMIT 1;',
		);
		return parseInt(result[0].total);
	}

	public async getActiveAccount() {
		const results: Array<Account> = await this.#db.select(
			'SELECT * FROM accounts WHERE is_active = "1" ORDER BY id DESC LIMIT 1;',
		);

		if (results.length) {
			this.currentUser = results[0];
			return results[0];
		}
		return null;
	}

	public async createAccount({
		pubkey,
		privkey,
	}: {
		pubkey: string;
		privkey?: string;
	}) {
		const existAccounts: Array<Account> = await this.#db.select(
			"SELECT * FROM accounts WHERE pubkey = $1 ORDER BY id DESC LIMIT 1;",
			[pubkey],
		);

		if (existAccounts.length) {
			await this.#db.execute(
				"UPDATE accounts SET is_active = '1' WHERE pubkey = $1;",
				[pubkey],
			);
		} else {
			await this.#db.execute(
				"INSERT OR IGNORE INTO accounts (pubkey, is_active) VALUES ($1, $2);",
				[pubkey, 1],
			);

			if (privkey) await this.#keyring_save(pubkey, privkey);
		}

		const account = await this.getActiveAccount();
		return account;
	}

	/**
	 * Save private key to OS secure storage
	 * @deprecated this method will be remove in the next update
	 */
	public async createPrivkey(name: string, privkey: string) {
		return await this.#keyring_save(name, privkey);
	}

	/**
	 * Load private key from OS secure storage
	 * @deprecated this method will be remove in the next update
	 */
	public async loadPrivkey(name: string) {
		return await this.#keyring_load(name);
	}

	/**
	 * Remove private key from OS secure storage
	 * @deprecated this method will be remove in the next update
	 */
	public async removePrivkey(name: string) {
		return await this.#keyring_remove(name);
	}

	public async updateAccount(column: string, value: string) {
		const insert = await this.#db.execute(
			`UPDATE accounts SET ${column} = $1 WHERE id = $2;`,
			[value, this.currentUser.id],
		);

		if (insert) {
			const account = await this.getActiveAccount();
			return account;
		}
	}

	public async getColumns() {
		if (!this.currentUser) return [];

		const columns: Array<IColumn> = await this.#db.select(
			"SELECT * FROM columns WHERE account_id = $1 ORDER BY created_at DESC;",
			[this.currentUser.id],
		);

		return columns;
	}

	public async createColumn(
		kind: number,
		title: string,
		content: string | string[],
	) {
		const insert = await this.#db.execute(
			"INSERT INTO columns (account_id, kind, title, content) VALUES ($1, $2, $3, $4);",
			[this.currentUser.id, kind, title, content],
		);

		if (insert) {
			const columns: Array<IColumn> = await this.#db.select(
				"SELECT * FROM columns WHERE id = $1 ORDER BY id DESC LIMIT 1;",
				[insert.lastInsertId],
			);
			if (!columns.length) console.error("get created widget failed");
			return columns[0];
		}
	}

	public async updateColumn(id: number, title: string, content: string) {
		return await this.#db.execute(
			"UPDATE columns SET title = $1, content = $2 WHERE id = $3;",
			[title, content, id],
		);
	}

	public async removeColumn(id: number) {
		const res = await this.#db.execute("DELETE FROM columns WHERE id = $1;", [
			id,
		]);
		if (res) return id;
	}

	public async createSetting(key: string, value: string | undefined) {
		const currentSetting = await this.checkSettingValue(key);

		if (!currentSetting) {
			if (key !== "translateApiKey" && key !== "tunnelUrl")
				this.settings[key] === !!parseInt(value);

			return await this.#db.execute(
				"INSERT OR IGNORE INTO settings (key, value) VALUES ($1, $2);",
				[key, value],
			);
		}

		return await this.#db.execute(
			"UPDATE settings SET value = $1 WHERE key = $2;",
			[value, key],
		);
	}

	public async getAllSettings() {
		const results: { key: string; value: string }[] = await this.#db.select(
			"SELECT * FROM settings ORDER BY id DESC;",
		);
		if (results.length < 1) return [];
		return results;
	}

	public async checkSettingValue(key: string) {
		const results: { key: string; value: string }[] = await this.#db.select(
			"SELECT * FROM settings WHERE key = $1 ORDER BY id DESC LIMIT 1;",
			[key],
		);
		if (!results.length) return false;
		return results[0].value;
	}

	public async getSettingValue(key: string) {
		const results: { key: string; value: string }[] = await this.#db.select(
			"SELECT * FROM settings WHERE key = $1 ORDER BY id DESC LIMIT 1;",
			[key],
		);
		if (!results.length) return "0";
		return results[0].value;
	}

	public async getInterests() {
		const results: { key: string; value: string }[] = await this.#db.select(
			"SELECT * FROM settings WHERE key = 'interests' ORDER BY id DESC LIMIT 1;",
		);

		if (!results.length) return null;
		if (!results[0].value.length) return null;

		return JSON.parse(results[0].value) as Interests;
	}

	public async clearCache() {
		await this.#db.execute("DELETE FROM ndk_events;");
		await this.#db.execute("DELETE FROM ndk_eventtags;");
		await this.#db.execute("DELETE FROM ndk_users;");
	}

	public async clearProfileCache(pubkey: string) {
		await this.#db.execute("DELETE FROM ndk_users WHERE pubkey = $1;", [
			pubkey,
		]);
	}

	public async logout() {
		await this.createSetting("nsecbunker", "0");
		await this.#db.execute(
			"UPDATE accounts SET is_active = '0' WHERE id = $1;",
			[this.currentUser.id],
		);

		this.currentUser = null;
		this.nwc = null;
	}
}
