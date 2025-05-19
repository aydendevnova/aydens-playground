import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-white text-gray-800">
      <div className="flex flex-col items-center justify-center gap-8 px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Ayden's <span className="text-blue-600">Playground</span>
        </h1>
        <p>Tools are made in my free time and are free of use. </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8">
          <Link
            className="flex max-w-xs flex-col gap-3 rounded-lg border border-gray-200 p-4 shadow-sm transition-all hover:shadow-md"
            href="/timesheet"
          >
            <h3 className="text-xl font-semibold">Time Sheet Calculator</h3>
            <div className="text-base text-gray-600">
              Calculate your work hours and earnings easily with our time sheet
              tool.
            </div>
          </Link>
          <Link
            className="flex max-w-xs flex-col gap-3 rounded-lg border border-gray-200 p-4 shadow-sm transition-all hover:shadow-md"
            href="/coming-soon"
          >
            <h3 className="text-xl font-semibold">More Tools Coming Soon</h3>
            <div className="text-base text-gray-600">
              Stay tuned for additional productivity tools and calculators.
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
