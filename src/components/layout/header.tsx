import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">
            Ayden's <span className="text-blue-600">Playground</span>
          </span>
        </Link>
        <div className="flex gap-4">
          <Link href="/timesheet" className="text-gray-600 hover:text-blue-600">
            Time Sheet Calculator
          </Link>
          <Link
            href="/coming-soon"
            className="text-gray-600 hover:text-blue-600"
          >
            More Tools
          </Link>
        </div>
      </nav>
    </header>
  );
}
