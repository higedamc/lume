import * as Dialog from '@radix-ui/react-dialog';
import { twMerge } from 'tailwind-merge';

import { useStorage } from '@libs/storage/provider';

import { Composer, ComposerUser } from '@shared/composer';
import {
  CancelIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ComposeIcon,
  ExpandIcon,
} from '@shared/icons';

import { useComposer } from '@stores/composer';

export function ComposerModal() {
  const { db } = useStorage();

  const [toggleModal, open] = useComposer((state) => [state.toggleModal, state.open]);
  const [toggleExpand, expand] = useComposer((state) => [
    state.toggleExpand,
    state.expand,
  ]);

  return (
    <Dialog.Root open={open} onOpenChange={toggleModal}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex h-10 items-center gap-2.5 rounded-r-lg border-l-2 border-transparent pl-4 pr-2 text-white/80"
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white/10 backdrop-blur-xl">
            <ComposeIcon className="h-4 w-4 text-white" />
          </span>
          New postr
        </button>
      </Dialog.Trigger>
      <Dialog.Portal className="relative z-10">
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl" />
        <Dialog.Content className="fixed inset-0 z-50 flex min-h-full items-center justify-center">
          <div
            className={twMerge(
              'relative h-min w-full rounded-xl bg-white/10 backdrop-blur-xl',
              expand ? 'max-w-4xl' : 'max-w-2xl'
            )}
          >
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <ComposerUser pubkey={db.account.pubkey} />
                <span>
                  <ChevronRightIcon className="h-4 w-4 text-white/50" />
                </span>
                <div className="inline-flex h-7 w-max items-center justify-center gap-0.5 rounded bg-white/10 pl-3 pr-1.5 text-sm font-medium text-white backdrop-blur-xl">
                  New Post
                  <ChevronDownIcon className="h-4 w-4" />
                </div>
              </div>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleExpand()}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg backdrop-blur-xl hover:bg-white/10"
                >
                  <ExpandIcon className="h-5 w-5 text-white/50" />
                </button>
                <Dialog.Close className="inline-flex h-10 w-10 items-center justify-center rounded-lg backdrop-blur-xl hover:bg-white/10">
                  <CancelIcon className="h-5 w-5 text-white/50" />
                </Dialog.Close>
              </div>
            </div>
            <Composer />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
