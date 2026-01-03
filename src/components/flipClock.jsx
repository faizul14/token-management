import React, { useState, useEffect } from 'react';

// --- Sub-components & Helpers ---

const CardHalf = ({ val, type, sizeConfig }) => {
    const isTop = type === 'top';

    return (
        <div
            className={`absolute left-0 w-full overflow-hidden bg-zinc-800 text-zinc-100 flex justify-center
        ${isTop ? 'top-0 rounded-t-lg' : 'bottom-0 rounded-b-lg'}
      `}
            style={{
                height: '50%', // Setengah tinggi kartu utama
                zIndex: isTop ? 2 : 1,
                backfaceVisibility: 'hidden'
            }}
        >
            <div
                className="absolute w-full flex justify-center items-center"
                style={{
                    height: sizeConfig.height,
                    top: isTop ? 0 : undefined,
                    bottom: !isTop ? 0 : undefined
                }}
            >
                <span
                    className="font-mono font-bold leading-none select-none"
                    style={{ fontSize: sizeConfig.fontSize }}
                >
                    {val}
                </span>
            </div>

            <div
                className={`absolute inset-0 pointer-events-none 
          ${isTop
                        ? 'bg-gradient-to-b from-white/10 to-transparent'
                        : 'bg-gradient-to-t from-black/50 to-transparent'}
        `}
            />
        </div>
    );
};


// Komponen Kartu Flip Individu
const FlipCard = ({ value, sizeConfig }) => {
    const [currentValue, setCurrentValue] = useState(value);
    const [previousValue, setPreviousValue] = useState(value);
    const [isFlipping, setIsFlipping] = useState(false);

    useEffect(() => {
        if (value === currentValue) return;

        setPreviousValue(currentValue);
        setIsFlipping(true);

        const timeout = setTimeout(() => {
            setIsFlipping(false);
            setCurrentValue(value);
        }, 600); // Durasi animasi

        return () => clearTimeout(timeout);
    }, [value, currentValue]);

    return (
        <div
            className="relative rounded-lg shadow-xl bg-zinc-900 perspective-container"
            style={{ width: sizeConfig.width, height: sizeConfig.height }}
        >

            <CardHalf val={value} type="top" sizeConfig={sizeConfig} />

            <CardHalf val={isFlipping ? previousValue : value} type="bottom" sizeConfig={sizeConfig} />


            {isFlipping && (
                <div
                    className="absolute top-0 left-0 w-full h-1/2 z-30 rounded-t-lg overflow-hidden origin-bottom animate-flip-down"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="w-full h-full relative bg-zinc-800 text-zinc-100 overflow-hidden">
                        <div
                            className="absolute left-0 w-full flex justify-center items-center"
                            style={{ height: sizeConfig.height, top: 0 }}
                        >
                            <span className="font-mono font-bold leading-none" style={{ fontSize: sizeConfig.fontSize }}>
                                {previousValue}
                            </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/30" />
                    </div>
                </div>
            )}

            {isFlipping && (
                <div
                    className="absolute bottom-0 left-0 w-full h-1/2 z-40 rounded-b-lg overflow-hidden origin-top animate-flip-up"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="w-full h-full relative bg-zinc-800 text-zinc-100 overflow-hidden">
                        <div
                            className="absolute left-0 w-full flex justify-center items-center"
                            style={{ height: sizeConfig.height, bottom: 0 }}
                        >
                            <span className="font-mono font-bold leading-none" style={{ fontSize: sizeConfig.fontSize }}>
                                {value}
                            </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                </div>
            )}

            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/40 z-50 transform -translate-y-1/2 shadow-sm" />
        </div>
    );
};

// Separator (: titik dua)
const Separator = ({ sizeConfig }) => (
    <div className="flex flex-col gap-3 justify-center items-center mx-1 pb-2 h-full pt-4">
        <div className={`rounded-full bg-zinc-600 ${sizeConfig.dotSize} shadow-inner`} />
        <div className={`rounded-full bg-zinc-600 ${sizeConfig.dotSize} shadow-inner`} />
    </div>
);

// --- Main Component ---

export default function ModernFlipClock({
    size = 'medium',
    showAmPm = true,
    className = ''
}) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const hoursRaw = time.getHours();
    const isPM = hoursRaw >= 12;
    const hours12 = hoursRaw % 12 || 12;

    const hours = String(hours12).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const seconds = String(time.getSeconds()).padStart(2, '0');

    const configs = {
        small: {
            width: 'clamp(30px, 10vw, 40px)',
            height: 'clamp(45px, 15vw, 60px)',
            fontSize: 'clamp(24px, 8vw, 32px)',
            gap: 'gap-1',
            dotSize: 'w-1 h-1'
        },
        medium: {
            width: 'clamp(40px, 10vw, 70px)',
            height: 'clamp(60px, 15vw, 100px)',
            fontSize: 'clamp(36px, 10vw, 64px)',
            gap: 'gap-1 md:gap-2',
            dotSize: 'w-1 h-1 md:w-2 md:h-2'
        },
        large: {
            width: 'clamp(45px, 13vw, 100px)',
            height: 'clamp(70px, 20vw, 150px)',
            fontSize: 'clamp(42px, 13vw, 96px)',
            gap: 'gap-1 md:gap-3',
            dotSize: 'w-1 h-1 md:w-3 md:h-3'
        }
    };

    const currentConfig = configs[size];

    return (
        <div className={`flex flex-col items-center justify-center p-4 md:p-8 rounded-2xl bg-transparent ${className}`}>

            <style>{`
        .perspective-container {
          perspective: 400px;
        }
        @keyframes flip-down {
          0% { transform: rotateX(0deg); opacity: 1; }
          100% { transform: rotateX(-180deg); opacity: 0; }
        }
        @keyframes flip-up {
          0% { transform: rotateX(180deg); opacity: 0; }
          100% { transform: rotateX(0deg); opacity: 1; }
        }
        .animate-flip-down {
          animation: flip-down 0.6s cubic-bezier(0.455, 0.03, 0.515, 0.955) forwards;
          transform-style: preserve-3d;
        }
        .animate-flip-up {
          animation: flip-up 0.6s cubic-bezier(0.455, 0.03, 0.515, 0.955) forwards;
          transform-style: preserve-3d;
        }
      `}</style>

            <div className={`flex items-center ${currentConfig.gap}`}>

                {showAmPm && (
                    <div className="flex flex-col justify-end h-[60%] mr-1 md:mr-2 self-center gap-1 md:gap-2">
                        <span className={`text-[8px] md:text-[10px] font-bold tracking-widest transition-all duration-300 ${!isPM ? 'text-cyan-400 opacity-100 scale-110' : 'text-zinc-800 opacity-40'}`}>AM</span>
                        <span className={`text-[8px] md:text-[10px] font-bold tracking-widest transition-all duration-300 ${isPM ? 'text-pink-500 opacity-100 scale-110' : 'text-zinc-800 opacity-40'}`}>PM</span>
                    </div>
                )}

                {/* Hours */}
                <div className={`flex gap-1`}>
                    <FlipCard value={hours[0]} sizeConfig={currentConfig} />
                    <FlipCard value={hours[1]} sizeConfig={currentConfig} />
                </div>

                <Separator sizeConfig={currentConfig} />

                {/* Minutes */}
                <div className={`flex gap-1`}>
                    <FlipCard value={minutes[0]} sizeConfig={currentConfig} />
                    <FlipCard value={minutes[1]} sizeConfig={currentConfig} />
                </div>

                <Separator sizeConfig={currentConfig} />

                {/* Seconds */}
                <div className={`flex gap-1`}>
                    <FlipCard value={seconds[0]} sizeConfig={currentConfig} />
                    <FlipCard value={seconds[1]} sizeConfig={currentConfig} />
                </div>

            </div>
        </div>
    );
}