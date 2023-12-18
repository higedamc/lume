import { Outlet } from 'react-router-dom';
import { Navigation } from '@shared/navigation';

export function HomeLayout() {
  return (
    <div className="flex h-full w-full">
      <div className="w-[68px] shrink-0">
        <Navigation />
      </div>
      <div className="min-h-0 flex-1 rounded-tl-lg bg-white shadow-[rgba(50,_50,_105,_0.15)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.05)_0px_1px_1px_0px] dark:bg-black dark:shadow-[inset_0_0_0.5px_1px_hsla(0,0%,100%,0.075),0_0_0_1px_hsla(0,0%,0%,0.05),0_0.3px_0.4px_hsla(0,0%,0%,0.02),0_0.9px_1.5px_hsla(0,0%,0%,0.045),0_3.5px_6px_hsla(0,0%,0%,0.09)]">
        <Outlet />
      </div>
    </div>
  );
}