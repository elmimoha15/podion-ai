
import { 
  Mic, 
  Radio, 
  Headphones, 
  Volume2, 
  Play, 
  Pause,
  Music,
  AudioLines,
  Podcast,
  Waves,
  Speaker,
  MicVocal,
  Music2,
  CirclePlay,
  AudioWaveform,
  Volume1
} from "lucide-react";

const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Enhanced Gradient Background */}
      <div className="absolute inset-0 gradient-bg opacity-90" />
      
      {/* Static Podcast Icons */}
      <div className="absolute top-20 left-10">
        <Mic className="h-8 w-8 text-blue-500 opacity-40" />
      </div>
      <div className="absolute top-40 right-20">
        <Headphones className="h-12 w-12 text-blue-600 opacity-35" />
      </div>
      <div className="absolute top-60 left-1/4">
        <Radio className="h-7 w-7 text-blue-700 opacity-40" />
      </div>
      <div className="absolute bottom-40 right-10">
        <Volume2 className="h-8 w-8 text-blue-500 opacity-35" />
      </div>
      <div className="absolute bottom-20 left-20">
        <Play className="h-10 w-10 text-blue-600 opacity-30" />
      </div>
      
      {/* Additional Podcast Elements */}
      <div className="absolute top-32 left-1/2">
        <Podcast className="h-9 w-9 text-blue-500 opacity-35" />
      </div>
      <div className="absolute top-80 right-1/3">
        <Music className="h-7 w-7 text-blue-600 opacity-40" />
      </div>
      <div className="absolute bottom-60 left-1/3">
        <AudioLines className="h-8 w-8 text-blue-500 opacity-35" />
      </div>
      <div className="absolute top-1/2 right-16">
        <Speaker className="h-6 w-6 text-blue-700 opacity-45" />
      </div>
      <div className="absolute bottom-32 right-1/4">
        <MicVocal className="h-8 w-8 text-blue-500 opacity-30" />
      </div>
      <div className="absolute top-96 left-16">
        <Music2 className="h-7 w-7 text-blue-600 opacity-35" />
      </div>
      <div className="absolute bottom-80 left-1/2">
        <CirclePlay className="h-9 w-9 text-blue-500 opacity-30" />
      </div>
      <div className="absolute top-1/3 left-12">
        <AudioWaveform className="h-8 w-8 text-blue-600 opacity-40" />
      </div>
      <div className="absolute bottom-1/3 right-12">
        <Volume1 className="h-6 w-6 text-blue-700 opacity-35" />
      </div>
      
      {/* Static Waves */}
      <div className="absolute bottom-0 left-0 right-0 h-40 opacity-25">
        <div className="flex items-end justify-center h-full space-x-1">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className="bg-blue-500 rounded-t-sm"
              style={{
                width: '3px',
                height: `${Math.random() * 80 + 20}px`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Static Circles */}
      <div className="absolute top-1/4 right-1/4 opacity-15">
        <div className="w-40 h-40 border-2 border-blue-400 rounded-full" />
      </div>
      <div className="absolute bottom-1/4 left-1/4 opacity-15">
        <div className="w-32 h-32 border-2 border-blue-500 rounded-full" />
      </div>
      <div className="absolute top-1/2 left-1/2 opacity-10">
        <div className="w-28 h-28 border-2 border-blue-600 rounded-full" />
      </div>
      
      {/* Static Dots */}
      <div className="absolute top-1/3 left-1/3 w-4 h-4 bg-blue-500 rounded-full opacity-50" />
      <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-blue-600 rounded-full opacity-60" />
      <div className="absolute top-1/2 left-1/5 w-5 h-5 bg-blue-400 rounded-full opacity-40" />
      <div className="absolute bottom-1/4 right-1/5 w-3 h-3 bg-blue-700 rounded-full opacity-45" />
      <div className="absolute top-1/4 left-2/3 w-4 h-4 bg-blue-500 rounded-full opacity-35" />
      
      {/* Static Sound Wave Particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AnimatedBackground;
