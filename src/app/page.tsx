import Link from "next/link";

export default function Home() {
  return (
    <main className="w-full">
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-semibold text-white mb-4 leading-snug">
          <span className="block">Welcome to Family Cable Network</span>
          <span className="block">Management System</span>
        </h1>

        <p className="text-gray-300 mb-8">Manage connections, billing, and reports effortlessly.</p>

        <Link href="/login" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md text-base hover:bg-blue-700 transition" aria-label="Go to login">
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
