function PostCardSkeleton() {
  return (
    <div className="bg-darkBox rounded-2xl overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-darkBoxSub"></div>
          <div>
            <div className="h-4 bg-darkBoxSub rounded w-24 mb-2"></div>
            <div className="h-3 bg-darkBoxSub rounded w-16"></div>
          </div>
        </div>
        <div className="w-6 h-6 bg-darkBoxSub rounded"></div>
      </div>

      {/* Description Skeleton */}
      <div className="px-4 pb-3">
        <div className="h-4 bg-darkBoxSub rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-darkBoxSub rounded w-1/2"></div>
      </div>

      {/* Video Skeleton */}
      <div className="aspect-square bg-darkBoxSub"></div>

      {/* Actions Skeleton */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-darkBoxSub rounded"></div>
            <div className="h-4 bg-darkBoxSub rounded w-8"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-darkBoxSub rounded"></div>
            <div className="h-4 bg-darkBoxSub rounded w-8"></div>
          </div>
          <div className="w-6 h-6 bg-darkBoxSub rounded"></div>
        </div>

        <div className="h-10 bg-darkBoxSub rounded-full"></div>
      </div>
    </div>
  );
}

export default PostCardSkeleton;
