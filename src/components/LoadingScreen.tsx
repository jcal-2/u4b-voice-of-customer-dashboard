import { useVocData } from '@/context/VocDataContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingScreen() {
  const { loading, error } = useVocData();

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <h1 className="font-display text-2xl font-bold text-uber-red mb-4">Data Error</h1>
          <p className="font-body text-uber-ink-2">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full bg-uber-gray-card rounded-uber" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48 bg-uber-gray-card rounded-uber" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-64 bg-uber-gray-card rounded-uber" />
            <Skeleton className="h-64 bg-uber-gray-card rounded-uber" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
