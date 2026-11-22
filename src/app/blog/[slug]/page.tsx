import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichContent } from "@/components/rich-content";
import { getPost, getPosts } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const posts = getPosts();
  return posts.length > 0 ? posts.map((post) => ({ slug: post.slug })) : [{ slug: "__no-posts" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return pageMetadata({
    path: post.path,
    title: post.seoTitle ?? post.title,
    description: post.description,
    image: post.image,
    type: "article",
  });
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/blog" className="text-muted-foreground text-sm hover:underline">
        ← All posts
      </Link>
      <header className="mt-6 mb-10 space-y-3">
        <h1 className="text-4xl leading-tight font-semibold">{post.title}</h1>
        <p className="text-muted-foreground text-sm">
          <time dateTime={post.date}>{post.date}</time>
          {post.author && ` · ${post.author}`}
        </p>
      </header>
      {post.image && (
        <div className="bg-muted relative mb-10 aspect-[16/9] overflow-hidden rounded-[var(--radius-brand)]">
          <Image src={post.image} alt="" fill priority className="object-cover" unoptimized />
        </div>
      )}
      <RichContent body={post.body} />
    </article>
  );
}
