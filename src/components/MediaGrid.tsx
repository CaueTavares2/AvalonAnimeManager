import { ChevronRight } from 'lucide-react';
import MediaCard from './MediaCard';
import type { Media } from '../types';

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
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {items.map((item) => (
          <div key={item.id}>
            <MediaCard media={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
