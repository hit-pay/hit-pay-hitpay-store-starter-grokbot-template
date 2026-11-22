import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The page you&apos;re looking for has moved or no longer exists.</p>
      <div className="flex justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Go home
        </Link>
        <Link href="/products" className="btn btn-outline">
          Shop products
        </Link>
      </div>
    </div>
  );
}
