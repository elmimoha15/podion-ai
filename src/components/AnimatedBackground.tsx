
import { Mic, Radio, Headphones, Volume2, Play, Pause, Music, Podcast, Waves, AudioLines } from "lucide-react";

const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 opacity-80" />
      
      {/* More Floating Icons */}
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
      <div className="absolute top-32 right-1/3 animate-float" style={{ animationDelay: '3s' }}>
        <Music className="h-7 w-7 text-blue-300 opacity-40" />
      </div>
      <div className="absolute top-80 left-1/3 animate-float" style={{ animationDelay: '2.5s' }}>
        <Podcast className="h-8 w-8 text-blue-600 opacity-35" />
      </div>
      <div className="absolute bottom-60 left-1/5 animate-float" style={{ animationDelay: '4s' }}>
        <AudioLines className="h-6 w-6 text-blue-400 opacity-30" />
      </div>
      <div className="absolute top-96 right-1/5 animate-float" style={{ animationDelay: '1.8s' }}>
        <Waves className="h-7 w-7 text-blue-500 opacity-25" />
      </div>
      <div className="absolute bottom-96 right-1/4 animate-float" style={{ animationDelay: '3.5s' }}>
        <Pause className="h-5 w-5 text-blue-400 opacity-35" />
      </div>
      
      {/* Animated Waves */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20">
        <div className="flex items-end justify-center h-full space-x-1">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="bg-blue-500 rounded-t-sm animate-wave"
              style={{
                width: '3px',
                height: `${Math.random() * 70 + 15}px`,
                animationDelay: `${i * 0.08}s`,
                animationDuration: `${1.5 + Math.random() * 2.5}s`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Additional Animated Waves - Top */}
      <div className="absolute top-0 left-0 right-0 h-24 opacity-15 rotate-180">
        <div className="flex items-end justify-center h-full space-x-1">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="bg-blue-400 rounded-t-sm animate-wave"
              style={{
                width: '2px',
                height: `${Math.random() * 40 + 10}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${2 + Math.random() * 1.5}s`
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
      <div className="absolute top-1/2 right-1/6 animate-rotate-slow opacity-8" style={{ animationDelay: '5s' }}>
        <div className="w-16 h-16 border border-blue-200 rounded-full" />
      </div>
      
      {/* More Pulsing Dots */}
      <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-blue-400 rounded-full animate-pulse-slow opacity-40" />
      <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-blue-500 rounded-full animate-pulse-slow opacity-50" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/5 w-4 h-4 bg-blue-300 rounded-full animate-pulse-slow opacity-30" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-1/3 right-1/5 w-2 h-2 bg-blue-600 rounded-full animate-pulse-slow opacity-45" style={{ animationDelay: '3s' }} />
      <div className="absolute top-3/4 left-1/6 w-3 h-3 bg-blue-400 rounded-full animate-pulse-slow opacity-35" style={{ animationDelay: '4s' }} />
      
      {/* Floating Orbs */}
      <div className="absolute top-1/5 right-1/3 w-8 h-8 bg-gradient-to-br from-blue-200 to-blue-400 rounded-full opacity-20 animate-float" style={{ animationDelay: '2.2s' }} />
      <div className="absolute bottom-1/5 left-1/4 w-6 h-6 bg-gradient-to-br from-blue-300 to-blue-500 rounded-full opacity-25 animate-float" style={{ animationDelay: '3.8s' }} />
      <div className="absolute top-2/5 left-1/6 w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-300 rounded-full opacity-15 animate-float" style={{ animationDelay: '1.2s' }} />
    </div>
  );
};

export default AnimatedBackground;
