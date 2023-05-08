import { NoteContent } from '@lume/app/note/components/content';
import NoteReplyUser from '@lume/app/note/components/user/reply';
import { noteParser } from '@lume/utils/parser';

export default function Reply({ data }: { data: any }) {
  const content = noteParser(data);

  return (
    <div className="flex h-min min-h-min w-full select-text flex-col px-3 py-3">
      <div className="flex flex-col">
        <NoteReplyUser pubkey={data.pubkey} time={data.created_at} />
        <div className="-mt-[18px] pl-[46px]">
          <NoteContent content={content} />
        </div>
      </div>
    </div>
  );
}