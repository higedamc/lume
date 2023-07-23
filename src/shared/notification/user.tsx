import { Image } from '@shared/image';

import { DEFAULT_AVATAR } from '@stores/constants';

import { useProfile } from '@utils/hooks/useProfile';
import { displayNpub } from '@utils/shortenKey';

export function NotiUser({ pubkey }: { pubkey: string }) {
  const { status, user } = useProfile(pubkey);

  if (status === 'loading') {
    return (
      <div className="flex items-start gap-2">
        <div className="relative h-8 w-8 shrink-0 animate-pulse rounded-md bg-zinc-800" />
        <div className="flex w-full flex-1 flex-col items-start gap-1 text-start">
          <span className="h-4 w-1/2 animate-pulse rounded bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-start justify-start gap-2">
      <div className="w-88 relative h-8 shrink rounded-md">
        <Image
          src={user.image}
          fallback={DEFAULT_AVATAR}
          alt={pubkey}
          className="w-88 h-8 rounded-md object-cover"
        />
      </div>
      <span className="max-w-[10rem] truncate leading-none text-zinc-200">
        {user.nip05 || user.name || user.displayName || displayNpub(pubkey, 16)}
      </span>
    </div>
  );
}
