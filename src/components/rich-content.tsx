import { evaluate } from "@mdx-js/mdx";
import Link from "next/link";
import type { ComponentProps } from "react";
import * as runtime from "react/jsx-runtime";
import type { ContentBody } from "@/lib/content";
import { sanitizeHtml } from "@/lib/html";

function MdxLink({ href = "", ...props }: ComponentProps<"a">) {
  if (href.startsWith("/")) return <Link href={href} {...props} />;
  return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />;
}

/** Components available inside MDX files without importing them. */
const components = { a: MdxLink };

/** Renders an MDX/Markdown or sanitised-HTML body from /content. */
export async function RichContent({ body, className = "prose" }: { body: ContentBody; className?: string }) {
  if (body.format === "html") {
    return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeHtml(body.html) }} />;
  }
  const { default: MDXContent } = await evaluate(body.source, { ...runtime });
  return (
    <div className={className}>
      <MDXContent components={components} />
    </div>
  );
}
