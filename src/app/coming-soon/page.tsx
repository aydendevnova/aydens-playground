export default function ComingSoonPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-white text-gray-800">
      <div className="flex flex-col items-center justify-center gap-8 px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Coming Soon
        </h1>
        <p className="max-w-lg text-lg text-gray-600">
          While I am working on more tools, you can get early access to my pixel
          art editor at:
        </p>
        <a
          href="https://editor.pixelnova.app"
          className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-blue-700"
          target="_blank"
          rel="noopener noreferrer"
        >
          Try Pixel Nova Editor
        </a>
        <p className="text-sm text-gray-500">
          This is an unlisted link - feel free to try it out!
        </p>
      </div>
    </main>
  );
}
