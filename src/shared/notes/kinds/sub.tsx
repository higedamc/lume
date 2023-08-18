import { NoteActions, NoteContent, NoteSkeleton } from '@shared/notes';
import { User } from '@shared/user';

import { useEvent } from '@utils/hooks/useEvent';

export function SubNote({ id, root }: { id: string; root?: string }) {
  const { status, data } = useEvent(id);

  if (status === 'loading') {
    return (
      <div className="relative mb-5 overflow-hidden rounded-xl bg-white/10 px-3 py-3">
        <NoteSkeleton />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mb-5 flex overflow-hidden rounded-xl bg-white/10 px-3 py-3">
        <p className="break-all text-white/50">Failed to fetch event: {id}</p>
      </div>
    );
  }

  return (
    <>
      <div className="absolute bottom-0 left-[18px] h-[calc(100%-3.4rem)] w-0.5 bg-gradient-to-t from-white/20 to-white/10" />
      <div className="mb-5 flex flex-col">
        <User pubkey={data.event.pubkey} time={data.event.created_at} />
        <div className="-mt-6 flex items-start gap-3">
          <div className="w-11 shrink-0" />
          <div className="relative z-20 flex-1">
            <NoteContent content={data.richContent} long={data.event.kind === 30023} />
            <NoteActions id={data.event.id} pubkey={data.event.pubkey} root={root} />
          </div>
        </div>
      </div>
    </>
  );
}
