import Link from "next/link";
import { storeConfig } from "@root/store.config";
import { getPosts } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/blog",
  title: "Blog",
  description: `News, stories and guides from ${storeConfig.name}.`,
});

export default function BlogPage() {
  const posts = getPosts();
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <h1 className="text-3xl font-semibold">Blog</h1>
      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts yet.</p>
      ) : (
        <ul className="divide-border divide-y">
          {posts.map((post) => (
            <li key={post.slug} className="py-8">
              <Link href={post.path} className="group block space-y-2">
                <p className="text-muted-foreground text-sm">
                  <time dateTime={post.date}>{post.date}</time>
                  {post.author && ` · ${post.author}`}
                </p>
                <h2 className="text-2xl font-semibold group-hover:underline">{post.title}</h2>
                {post.description && <p className="text-muted-foreground">{post.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
