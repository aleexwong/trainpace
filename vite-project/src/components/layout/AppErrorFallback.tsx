// Shown by the root error boundary instead of a blank white page.
export default function AppErrorFallback() {
  return (
    <div
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center text-gray-900"
    >
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-gray-600">
        This page failed to load. A new version of TrainPace may have been
        released since you opened it — reloading usually fixes it.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        Reload page
      </button>
    </div>
  );
}
