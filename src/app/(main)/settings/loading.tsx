export default function Loading() {
  return (
    <div className="flex min-h-[calc(100svh-64px)] items-center justify-center">
      <div className="border-primary h-16 w-16 animate-spin rounded-full border-t-4 border-b-4"></div>
    </div>
  );
}
