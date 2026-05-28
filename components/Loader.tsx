import Image from 'next/image';

interface LoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loader = ({ 
  message = "Loader...", 
  size = 'md' 
}: LoaderProps) => {
  const sizes = {
    sm: { width: 60, height: 15 },
    md: { width: 80, height: 20 },
    lg: { width: 100, height: 25 },
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Image
        src="/interchanging.gif"
        alt="Loader"
        width={sizes[size].width}
        height={sizes[size].height}
        unoptimized
      />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};
