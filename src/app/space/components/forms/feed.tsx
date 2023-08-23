import { useState } from 'react';

import { User } from '@app/auth/components/user';

import { useStorage } from '@libs/storage/provider';

import { ArrowRightCircleIcon, CheckCircleIcon } from '@shared/icons';

import { WidgetKinds, useWidgets } from '@stores/widgets';

import { Widget } from '@utils/types';

export function FeedWidgetForm({ params }: { params: Widget }) {
  const { db } = useStorage();

  const [setWidget, removeWidget] = useWidgets((state) => [
    state.setWidget,
    state.removeWidget,
  ]);
  const [title, setTitle] = useState<string>('');
  const [groups, setGroups] = useState<Array<string>>([]);

  // toggle follow state
  const toggleGroup = (pubkey: string) => {
    const arr = groups.includes(pubkey)
      ? groups.filter((i) => i !== pubkey)
      : [...groups, pubkey];
    setGroups(arr);
  };

  const submit = async () => {
    setWidget(db, {
      kind: WidgetKinds.feed,
      title: title || 'Group',
      content: JSON.stringify(groups),
    });
    // remove temp widget
    removeWidget(db, params.id);
  };

  return (
    <div className="flex h-full shrink-0 grow-0 basis-[400px] flex-col items-center justify-center">
      <div className="w-full px-5">
        <h3 className="mb-4 text-center text-lg font-semibold">
          Choose account you want to add to group feeds
        </h3>
        <div className="mb-0 flex flex-col gap-2">
          <div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="relative h-11 w-full rounded-lg bg-white/10 px-3 py-1 text-white !outline-none placeholder:text-white/50"
            />
          </div>
          <div className="scrollbar-hide flex h-[500px] w-full flex-col overflow-y-auto rounded-lg bg-white/10 py-2">
            {db.account.network.map((item: string) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleGroup(item)}
                className="inline-flex transform items-center justify-between px-4 py-2 hover:bg-white/20"
              >
                <User pubkey={item} />
                {groups.includes(item) && (
                  <div>
                    <CheckCircleIcon className="h-4 w-4 text-green-400" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={groups.length < 1}
              onClick={submit}
              className="inline-flex h-11 w-full items-center justify-between gap-2 rounded-lg bg-fuchsia-500 px-6 font-medium leading-none text-white hover:bg-fuchsia-600 focus:outline-none disabled:opacity-50"
            >
              <span className="w-5" />
              <span>Add {groups.length} account to group feed</span>
              <ArrowRightCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}