import Image from 'next/image';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Cargando..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <Image
            src="/assets/logo_padel_manager.png"
            alt="Logo"
            fill
            className="object-contain animate-pulse"
          />
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="w-3 h-3 bg-white rounded-full mx-1 animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full mx-1 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full mx-1 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-white text-sm font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
} 