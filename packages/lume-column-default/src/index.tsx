import { Column, useColumnContext } from "@lume/ark";
import { IColumn } from "@lume/types";
import { COL_TYPES } from "@lume/utils";

export function Default({ column }: { column: IColumn }) {
	const { addColumn } = useColumnContext();

	return (
		<Column.Root>
			<Column.Header id={column.id} title="Add columns" />
			<div className="h-full flex-1 px-3 mt-3 flex flex-col gap-3 overflow-y-auto scrollbar-none">
				<div className="shrink-0 h-11 flex items-center gap-5">
					<button
						type="button"
						className="h-9 w-max px-3 text-sm font-semibold inline-flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 rounded-lg"
					>
						Official
					</button>
					<button
						type="button"
						disabled
						className="h-9 w-max px-3 text-sm inline-flex items-center justify-center rounded-lg disabled:opacity-50"
					>
						Community (Coming Soon)
					</button>
				</div>
				<div className="shrink-0 flex flex-col rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-950 ring-1 ring-neutral-100 dark:ring-neutral-900">
					<div className="h-[100px] w-full px-3 pt-3">
						<img
							src="/columns/group.jpg"
							srcSet="/columns/group@2x.jpg 2x"
							alt="group"
							loading="lazy"
							decoding="async"
							className="w-full h-auto object-cover rounded-lg"
						/>
					</div>
					<div className="h-16 shrink-0 px-3 flex items-center justify-between">
						<div>
							<h1 className="font-semibold">Group Feeds</h1>
							<p className="max-w-[18rem] truncate text-sm text-neutral-600 dark:text-neutral-500">
								Collective of people you're interested in.
							</p>
						</div>
						<button
							type="button"
							onClick={() => {
								addColumn({ kind: COL_TYPES.group, title: "", content: "" });
							}}
							className="shrink-0 w-16 h-8 rounded-lg text-sm font-semibold bg-neutral-100 dark:bg-neutral-900 text-blue-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 inline-flex items-center justify-center"
						>
							Add
						</button>
					</div>
				</div>
				<div className="shrink-0 flex flex-col rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-950 ring-1 ring-neutral-100 dark:ring-neutral-900">
					<div className="h-[100px] w-full px-3 pt-3">
						<img
							src="/columns/antenas.jpg"
							srcSet="/columns/antenas@2x.jpg 2x"
							alt="antenas"
							loading="lazy"
							decoding="async"
							className="w-full h-auto object-cover rounded-lg"
						/>
					</div>
					<div className="h-16 shrink-0 px-3 flex items-center justify-between">
						<div>
							<h1 className="font-semibold">Antenas</h1>
							<p className="max-w-[18rem] truncate text-sm text-neutral-600 dark:text-neutral-500">
								Keep track to specific content.
							</p>
						</div>
						<button
							type="button"
							onClick={() => {
								addColumn({ kind: COL_TYPES.antenas, title: "", content: "" });
							}}
							className="shrink-0 w-16 h-8 rounded-lg text-sm font-semibold bg-neutral-100 dark:bg-neutral-900 text-blue-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 inline-flex items-center justify-center"
						>
							Add
						</button>
					</div>
				</div>
				<div className="shrink-0 flex flex-col rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-950 ring-1 ring-neutral-100 dark:ring-neutral-900">
					<div className="h-[100px] w-full px-3 pt-3">
						<img
							src="/columns/trending-notes.jpg"
							srcSet="/columns/trending-notes@2x.jpg 2x"
							alt="trendingNotes"
							loading="lazy"
							decoding="async"
							className="w-full h-auto object-cover rounded-lg"
						/>
					</div>
					<div className="h-16 shrink-0 px-3 flex items-center justify-between">
						<div>
							<h1 className="font-semibold">Trending Notes</h1>
							<p className="max-w-[18rem] truncate text-sm text-neutral-600 dark:text-neutral-500">
								What is trending on Nostr?.
							</p>
						</div>
						<button
							type="button"
							onClick={() => {
								addColumn({
									kind: COL_TYPES.trendingNotes,
									title: "",
									content: "",
								});
							}}
							className="shrink-0 w-16 h-8 rounded-lg text-sm font-semibold bg-neutral-100 dark:bg-neutral-900 text-blue-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 inline-flex items-center justify-center"
						>
							Add
						</button>
					</div>
				</div>
				<div className="shrink-0 flex flex-col rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-950 ring-1 ring-neutral-100 dark:ring-neutral-900">
					<div className="h-[100px] w-full px-3 pt-3">
						<img
							src="/columns/global.jpg"
							srcSet="/columns/global@2x.jpg 2x"
							alt="global"
							loading="lazy"
							decoding="async"
							className="w-full h-auto object-cover rounded-lg"
						/>
					</div>
					<div className="h-16 shrink-0 px-3 flex items-center justify-between">
						<div>
							<h1 className="font-semibold">Global</h1>
							<p className="max-w-[18rem] truncate text-sm text-neutral-600 dark:text-neutral-500">
								All things around the world.
							</p>
						</div>
						<button
							type="button"
							onClick={() => {
								addColumn({
									kind: COL_TYPES.global,
									title: "",
									content: "",
								});
							}}
							className="shrink-0 w-16 h-8 rounded-lg text-sm font-semibold bg-neutral-100 dark:bg-neutral-900 text-blue-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 inline-flex items-center justify-center"
						>
							Add
						</button>
					</div>
				</div>
				<div className="shrink-0 flex flex-col rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-950 ring-1 ring-neutral-100 dark:ring-neutral-900">
					<div className="h-[100px] w-full px-3 pt-3">
						<img
							src="/columns/waifu.jpg"
							srcSet="/columns/waifu@2x.jpg 2x"
							alt="waifu"
							loading="lazy"
							decoding="async"
							className="w-full h-auto object-cover rounded-lg"
						/>
					</div>
					<div className="h-16 shrink-0 px-3 flex items-center justify-between">
						<div>
							<h1 className="font-semibold">Waifu</h1>
							<p className="max-w-[18rem] truncate text-sm text-neutral-600 dark:text-neutral-500">
								Show a random waifu image to boost your morale.
							</p>
						</div>
						<button
							type="button"
							onClick={() => {
								addColumn({
									kind: COL_TYPES.waifu,
									title: "Waifu",
									content: "",
								});
							}}
							className="shrink-0 w-16 h-8 rounded-lg text-sm font-semibold bg-neutral-100 dark:bg-neutral-900 text-blue-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 inline-flex items-center justify-center"
						>
							Add
						</button>
					</div>
				</div>
				<div className="h-3" />
			</div>
		</Column.Root>
	);
}
