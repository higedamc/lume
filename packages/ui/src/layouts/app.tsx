import { cn } from "@lume/utils";
import { type Platform } from "@tauri-apps/plugin-os";
import { Outlet } from "react-router-dom";
import { Editor } from "../editor/column";
import { Navigation } from "../navigation";
import { SearchDialog } from "../search/dialog";
import { WindowTitleBar } from "../titlebar";

export function AppLayout({ platform }: { platform: Platform }) {
	return (
		<div
			className={cn(
				"flex h-screen w-screen flex-col",
				platform !== "macos" ? "bg-neutral-50 dark:bg-neutral-950" : "",
			)}
		>
			{platform === "windows" ? (
				<WindowTitleBar platform={platform} />
			) : (
				<div data-tauri-drag-region className="h-9 shrink-0" />
			)}
			<div className="flex w-full h-full min-h-0">
				<Navigation />
				<Editor />
				<SearchDialog />
				<div className="flex-1 h-full px-1 pb-1">
					<Outlet />
				</div>
			</div>
		</div>
	);
}
