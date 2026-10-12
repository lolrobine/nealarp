export default function ExperiencesLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--secondary)] mb-4 animate-pulse">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--muted-foreground)] border-t-transparent animate-spin" />
        </div>
        <p className="text-[var(--muted-foreground)]">Loading experience...</p>
      </div>
    </div>
  );
}
