
import { Mic, Radio, Headphones, Volume2, Play, Pause } from "lucide-react";

const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 opacity-80" />
      
      {/* Floating Icons */}
      <div className="absolute top-20 left-10 animate-float">
        <Mic className="h-8 w-8 text-blue-400 opacity-30" />
      </div>
      <div className="absolute top-40 right-20 animate-float" style={{ animationDelay: '1s' }}>
        <Headphones className="h-10 w-10 text-blue-500 opacity-25" />
      </div>
      <div className="absolute top-60 left-1/4 animate-float" style={{ animationDelay: '2s' }}>
        <Radio className="h-6 w-6 text-blue-600 opacity-35" />
      </div>
      <div className="absolute bottom-40 right-10 animate-float" style={{ animationDelay: '0.5s' }}>
        <Volume2 className="h-7 w-7 text-blue-400 opacity-30" />
      </div>
      <div className="absolute bottom-20 left-20 animate-float" style={{ animationDelay: '1.5s' }}>
        <Play className="h-9 w-9 text-blue-500 opacity-25" />
      </div>
      
      {/* Animated Waves */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20">
        <div className="flex items-end justify-center h-full space-x-1">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="bg-blue-500 rounded-t-sm animate-wave"
              style={{
                width: '4px',
                height: `${Math.random() * 60 + 20}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Rotating Elements */}
      <div className="absolute top-1/4 right-1/4 animate-rotate-slow opacity-10">
        <div className="w-32 h-32 border-2 border-blue-300 rounded-full" />
      </div>
      <div className="absolute bottom-1/4 left-1/4 animate-rotate-slow opacity-10" style={{ animationDirection: 'reverse' }}>
        <div className="w-24 h-24 border-2 border-blue-400 rounded-full" />
      </div>
      
      {/* Pulsing Dots */}
      <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-blue-400 rounded-full animate-pulse-slow opacity-40" />
      <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-blue-500 rounded-full animate-pulse-slow opacity-50" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/5 w-4 h-4 bg-blue-300 rounded-full animate-pulse-slow opacity-30" style={{ animationDelay: '2s' }} />
    </div>
  );
};

export default AnimatedBackground;
