import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-lg mb-6">This page could not be found.</p>
      <Link href="/home" className="text-blue-600 underline">
        Go back home
      </Link>
    </div>
  );
}
