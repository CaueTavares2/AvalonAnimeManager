import { ChevronRight } from 'lucide-react';
import MediaCard from './MediaCard';
import type { Media } from '../../types';

interface MediaGridProps {
  title: string;
  items: Media[];
}

export default function MediaGrid({ title, items }: MediaGridProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#516170] uppercase tracking-wider">
          {title}
        </h2>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
        {items.map((item) => (
          <div key={item.id}>
            <MediaCard media={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
