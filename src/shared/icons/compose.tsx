import { SVGProps } from 'react';

export function ComposeIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M21 18s-1.334 1.544-2.834 1.544-2.707-1.429-4.18-1.429c-1.472 0-2.326.671-3.236 1.635m6.957-16.293l1.836 1.836a1 1 0 010 1.414l-13.25 13.25a1 1 0 01-.707.293H2.75v-2.836a1 1 0 01.293-.707l13.25-13.25a1 1 0 011.414 0z"
      ></path>
    </svg>
  );
}
