"use client";

import { Children, useState, type ReactNode } from "react";

/**
 * Shows `pageSize` items at a time with a "Show more" button. Hidden items are
 * still in the HTML, so search engines can follow every product link.
 */
export function ProgressiveGrid({ pageSize, children }: { pageSize: number; children: ReactNode }) {
  const items = Children.toArray(children);
  const [visible, setVisible] = useState(pageSize);
  return (
    <>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <li key={index} className={index >= visible ? "hidden" : undefined}>
            {item}
          </li>
        ))}
      </ul>
      {visible < items.length && (
        <div className="mt-12 text-center">
          <button type="button" className="btn btn-outline" onClick={() => setVisible((v) => v + pageSize)}>
            Show more ({items.length - visible} remaining)
          </button>
        </div>
      )}
    </>
  );
}
