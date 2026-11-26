export function PageSkeleton({ title = "Loading your collection" }: { title?: string }) {
  return (
    <div className="container page-skeleton" aria-label={title} aria-busy="true">
      <div className="skeleton-block skeleton-line short"/>
      <div className="skeleton-block skeleton-title"/>
      <div className="skeleton-block skeleton-line"/>
      <div className="history-skeleton">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="skeleton-card" key={index}>
            <div className="skeleton-block skeleton-image"/>
            <div>
              <div className="skeleton-block skeleton-line short"/>
              <div className="skeleton-block skeleton-line"/>
              <div className="skeleton-block skeleton-line short"/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
