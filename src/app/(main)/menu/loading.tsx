export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100svh-64px)]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
    </div>
  );
}
