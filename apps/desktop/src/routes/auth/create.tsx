import { useArk, useStorage } from "@lume/ark";
import { ArrowLeftIcon, InfoIcon, LoaderIcon } from "@lume/icons";
import { User } from "@lume/ui";
import { NDKKind, NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import { downloadDir } from "@tauri-apps/api/path";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { motion } from "framer-motion";
import { minidenticon } from "minidenticons";
import { generatePrivateKey, getPublicKey, nip19 } from "nostr-tools";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AvatarUploader } from "./components/avatarUploader";

export function CreateAccountScreen() {
	const [picture, setPicture] = useState("");
	const [downloaded, setDownloaded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [keys, setKeys] = useState<null | {
		npub: string;
		nsec: string;
	}>(null);

	const {
		register,
		handleSubmit,
		formState: { isDirty, isValid },
	} = useForm();

	const ark = useArk();
	const storage = useStorage();
	const navigate = useNavigate();

	const svgURI = `data:image/svg+xml;utf8,${encodeURIComponent(
		minidenticon("lume new account", 90, 50),
	)}`;

	const onSubmit = async (data: { name: string; about: string }) => {
		try {
			setLoading(true);

			const profile = {
				...data,
				name: data.name,
				display_name: data.name,
				bio: data.about,
				picture: picture,
				avatar: picture,
			};

			const userPrivkey = generatePrivateKey();
			const userPubkey = getPublicKey(userPrivkey);
			const userNpub = nip19.npubEncode(userPubkey);
			const userNsec = nip19.nsecEncode(userPrivkey);

			const signer = new NDKPrivateKeySigner(userPrivkey);
			ark.updateNostrSigner({ signer });

			const publish = await ark.createEvent({
				content: JSON.stringify(profile),
				kind: NDKKind.Metadata,
				tags: [],
			});

			if (publish) {
				await storage.createAccount({
					id: userNpub,
					pubkey: userPubkey,
					privkey: userPrivkey,
				});

				setKeys({ npub: userNpub, nsec: userNsec });
				setLoading(false);
			} else {
				toast.error("Cannot publish user profile, please try again later.");
				setLoading(false);
			}
		} catch (e) {
			return toast.error(e);
		}
	};

	const copyNsec = async () => {
		await writeText(keys.nsec);
	};

	const download = async () => {
		try {
			const downloadPath = await downloadDir();
			const fileName = `nostr_keys_${new Date().toISOString()}.txt`;
			const filePath = await save({
				defaultPath: `${downloadPath}/${fileName}`,
			});

			if (filePath) {
				await writeTextFile(
					filePath,
					`Nostr account, generated by Lume (lume.nu)\nPublic key: ${keys.npub}\nPrivate key: ${keys.nsec}`,
				);

				setDownloaded(true);
			} // else { user cancel action }
		} catch (e) {
			return toast.error(e);
		}
	};

	return (
		<div className="relative flex h-full w-full items-center justify-center">
			<div className="absolute left-[8px] top-2">
				{!keys ? (
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="group inline-flex items-center gap-2 text-sm font-medium"
					>
						<div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-200 text-neutral-800 group-hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:group-hover:bg-neutral-700">
							<ArrowLeftIcon className="h-4 w-4" />
						</div>
						Back
					</button>
				) : null}
			</div>
			<div className="mx-auto flex w-full max-w-md flex-col gap-10">
				<h1 className="text-center text-2xl font-semibold">
					Let&apos;s set up your account.
				</h1>
				<div className="flex flex-col gap-3">
					{!keys ? (
						<div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-950">
							<form
								onSubmit={handleSubmit(onSubmit)}
								className="mb-0 flex flex-col"
							>
								<input
									type={"hidden"}
									{...register("picture")}
									value={picture}
								/>
								<div className="flex flex-col gap-4">
									<div className="flex flex-col gap-1">
										<span className="font-semibold">Avatar</span>
										<div className="flex h-36 w-full flex-col items-center justify-center gap-3 rounded-lg bg-neutral-100 dark:bg-neutral-900">
											{picture.length > 0 ? (
												<img
													src={picture}
													alt="user's avatar"
													className="h-14 w-14 rounded-xl object-cover"
												/>
											) : (
												<img
													src={svgURI}
													alt="user's avatar"
													className="h-14 w-14 rounded-xl bg-black dark:bg-white"
												/>
											)}
											<AvatarUploader setPicture={setPicture} />
										</div>
									</div>
									<div className="flex flex-col gap-1">
										<label htmlFor="name" className="font-semibold">
											Name *
										</label>
										<input
											type={"text"}
											{...register("name", {
												required: true,
												minLength: 1,
											})}
											spellCheck={false}
											className="h-11 rounded-lg border-transparent bg-neutral-100 px-3 placeholder:text-neutral-500 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:bg-neutral-900 dark:placeholder:text-neutral-400 dark:focus:ring-blue-800"
										/>
									</div>
									<div className="flex flex-col gap-1">
										<label htmlFor="about" className="font-semibold">
											Bio
										</label>
										<textarea
											{...register("about")}
											spellCheck={false}
											className="relative h-24 w-full resize-none rounded-lg border-transparent bg-neutral-100 px-3 py-2 !outline-none placeholder:text-neutral-500 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:bg-neutral-900 dark:placeholder:text-neutral-400 dark:focus:ring-blue-800"
										/>
									</div>
									<div className="flex flex-col gap-3">
										<div className="flex items-center gap-2 rounded-lg bg-blue-100 p-3 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">
											<InfoIcon className="h-8 w-8" />
											<p>
												There are many more settings you can configure from the
												&quot;Settings&quot; screen. Be sure to visit it later.
											</p>
										</div>
										<button
											type="submit"
											disabled={!isDirty || !isValid}
											className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-lg bg-blue-500 font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
										>
											{loading ? (
												<LoaderIcon className="h-4 w-4 animate-spin" />
											) : (
												"Create and Continue"
											)}
										</button>
									</div>
								</div>
							</form>
						</div>
					) : (
						<>
							<motion.div
								initial={{ opacity: 0, y: 50 }}
								animate={{
									opacity: 1,
									y: 0,
								}}
								className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-950"
							>
								<User pubkey={keys.npub} variant="simple" />
							</motion.div>
							<motion.div
								initial={{ opacity: 0, y: 80 }}
								animate={{
									opacity: 1,
									y: 0,
								}}
								className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-950"
							>
								<div className="flex flex-col gap-1.5">
									<h5 className="font-semibold">Backup account</h5>
									<div>
										<p className="mb-2 select-text text-sm text-neutral-800 dark:text-neutral-200">
											Your private key is your password. If you lose this key,
											you will lose access to your account! Copy it and keep it
											in a safe place.{" "}
											<span className="text-red-500">
												There is no way to reset your private key.
											</span>
										</p>
										<p className="select-text text-sm text-neutral-800 dark:text-neutral-200">
											Public key is used for sharing with other people so that
											they can find you using the public key.
										</p>
									</div>
									<div className="mt-3 flex flex-col gap-3">
										<div className="flex flex-col gap-1">
											<label htmlFor="nsec" className="text-sm font-semibold">
												Private key
											</label>
											<div className="relative w-full">
												<input
													readOnly
													value={`${keys.nsec.substring(
														0,
														10,
													)}**************************`}
													className="h-11 w-full rounded-lg border-transparent bg-neutral-100 px-3 placeholder:text-neutral-500 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:bg-neutral-900 dark:placeholder:text-neutral-400 dark:focus:ring-blue-800"
												/>
												<div className="absolute right-0 top-0 inline-flex h-11 items-center justify-center px-2">
													<button
														type="button"
														onClick={copyNsec}
														className="rounded-md bg-neutral-200 px-2 py-1 text-sm font-medium hover:bg-neutral-400 dark:bg-neutral-700 dark:hover:bg-neutral-600"
													>
														Copy
													</button>
												</div>
											</div>
										</div>
										<div className="flex flex-col gap-1">
											<label htmlFor="nsec" className="text-sm font-semibold">
												Public key
											</label>
											<input
												readOnly
												value={keys.npub}
												className="h-11 w-full rounded-lg border-transparent bg-neutral-100 px-3 placeholder:text-neutral-500 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:bg-neutral-900 dark:placeholder:text-neutral-400 dark:focus:ring-blue-800"
											/>
										</div>
									</div>
									{!downloaded ? (
										<button
											type="button"
											onClick={() => download()}
											className="mt-1 inline-flex h-11 w-full shrink-0 items-center justify-center rounded-lg bg-blue-500 font-semibold text-white hover:bg-blue-600"
										>
											Download account keys
										</button>
									) : null}
								</div>
							</motion.div>
						</>
					)}
					{downloaded ? (
						<motion.button
							initial={{ opacity: 0, y: 50 }}
							animate={{
								opacity: 1,
								y: 0,
							}}
							className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-lg bg-blue-500 font-semibold text-white hover:bg-blue-600"
							type="button"
							onClick={() => navigate("/auth/onboarding")}
						>
							Finish
						</motion.button>
					) : null}
				</div>
			</div>
		</div>
	);
}
