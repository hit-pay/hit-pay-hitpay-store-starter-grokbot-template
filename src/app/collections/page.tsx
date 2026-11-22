import Image from "next/image";
import Link from "next/link";
import { storeConfig } from "@root/store.config";
import { getCollections } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/collections",
  title: "Collections",
  description: `Shop ${storeConfig.name} by collection.`,
});

export default async function CollectionsPage() {
  const collections = await getCollections();
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <h1 className="text-3xl font-semibold">Collections</h1>
      {collections.length === 0 ? (
        <p className="text-muted-foreground">No collections yet.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <li key={collection.id}>
              <Link href={`/collections/${collection.handle}`} className="group block">
                <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-[var(--radius-brand)]">
                  {collection.imageUrl ? (
                    <Image src={collection.imageUrl} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <span className="font-heading text-muted-foreground flex h-full items-center justify-center p-6 text-center text-2xl">
                      {collection.name}
                    </span>
                  )}
                </div>
                <p className="font-heading mt-3 text-lg font-semibold group-hover:underline">{collection.name}</p>
                <p className="text-muted-foreground text-sm">
                  {collection.productIds.length} {collection.productIds.length === 1 ? "product" : "products"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
