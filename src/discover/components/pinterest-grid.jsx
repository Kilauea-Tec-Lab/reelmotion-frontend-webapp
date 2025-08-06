import { useState, useEffect, useRef } from "react";
import PinterestCard from "./pinterest-card";

function PinterestGrid({ posts, onCardClick }) {
  const [columns, setColumns] = useState(5);
  const [columnItems, setColumnItems] = useState([]);
  const gridRef = useRef(null);

  // Responsive columns
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(1); // sm
      else if (width < 768) setColumns(2); // md
      else if (width < 1024) setColumns(3); // lg
      else if (width < 1280) setColumns(4); // xl
      else setColumns(5); // 2xl
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // Distribute posts across columns (masonry layout)
  useEffect(() => {
    if (posts.length === 0) {
      setColumnItems([]);
      return;
    }

    const newColumns = Array.from({ length: columns }, () => []);
    const columnHeights = Array(columns).fill(0);

    posts.forEach((post, index) => {
      // Find the shortest column
      const shortestColumnIndex = columnHeights.indexOf(
        Math.min(...columnHeights)
      );

      // Add post to the shortest column
      newColumns[shortestColumnIndex].push(post);

      // Estimate height (you might want to adjust this based on your content)
      const estimatedHeight = 250 + (post.description?.length || 0) * 0.5;
      columnHeights[shortestColumnIndex] += estimatedHeight;
    });

    setColumnItems(newColumns);
  }, [posts, columns]);

  return (
    <div
      ref={gridRef}
      className="grid gap-4 auto-rows-min"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {columnItems.map((columnPosts, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-4">
          {columnPosts.map((post) => (
            <PinterestCard key={post.id} post={post} onClick={onCardClick} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default PinterestGrid;
