// src/components/Loading/Loading.tsx
interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  className?: string;
}

export const Loading = ({
  message = 'Yükleniyor...',
  size = 'medium',
  fullScreen = true,
  className = '',
}: LoadingProps) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const containerClasses = fullScreen
    ? 'min-h-screen bg-gray-50'
    : 'min-h-[200px]';

  return (
    <div
      className={`flex flex-col justify-center items-center ${containerClasses} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`${sizeClasses[size]} border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin`}
        aria-label="Yükleniyor"
      />
      <p className="mt-4 text-gray-600 text-center text-lg font-medium">
        {message}
      </p>
    </div>
  );
};
