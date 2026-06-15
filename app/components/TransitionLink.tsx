"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

type TransitionLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

export function TransitionLink({ href, children, onClick, ...props }: TransitionLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    document.body.classList.add("route-exit");

    window.setTimeout(() => {
      window.location.href = href;
    }, 420);
  };

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
