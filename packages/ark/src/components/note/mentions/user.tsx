import { COL_TYPES } from "@lume/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useArk } from "../../../hooks/useArk";
import { useProfile } from "../../../hooks/useProfile";
import { useColumnContext } from "../../column/provider";

export function MentionUser({ pubkey }: { pubkey: string }) {
	const ark = useArk();
	const cleanPubkey = ark.getCleanPubkey(pubkey);

	const { isLoading, isError, user } = useProfile(pubkey);
	const { t } = useTranslation();
	const { addColumn } = useColumnContext();

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger className="text-start text-blue-500 break-words hover:text-blue-600">
				{isLoading
					? "@anon"
					: isError
					  ? pubkey
					  : `@${user?.name || user?.displayName || user?.username || "anon"}`}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content className="flex w-[200px] p-2 flex-col overflow-hidden rounded-2xl bg-white/50 dark:bg-black/50 ring-1 ring-black/10 dark:ring-white/10 backdrop-blur-2xl focus:outline-none">
				<DropdownMenu.Item asChild>
					<Link
						to={`/users/${cleanPubkey}`}
						className="inline-flex items-center gap-3 px-3 text-sm font-medium rounded-lg h-9 text-black/70 hover:bg-black/10 hover:text-black focus:outline-none dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
					>
						{t("note.buttons.viewProfile")}
					</Link>
				</DropdownMenu.Item>
				<DropdownMenu.Item asChild>
					<button
						type="button"
						onClick={async () =>
							await addColumn({
								kind: COL_TYPES.user,
								title: user?.name || user?.displayName || "User",
								content: cleanPubkey,
							})
						}
						className="inline-flex items-center gap-3 px-3 text-sm font-medium rounded-lg h-9 text-black/70 hover:bg-black/10 hover:text-black focus:outline-none dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
					>
						{t("note.buttons.pin")}
					</button>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	);
}
