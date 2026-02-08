export default function StartBubble() {
    return (
      <div className="absolute -top-10 left-1/2 flex flex-col items-center z-20 animate-bounce">
        {/* Bubble */}
        <div className="bg-[#256996] border-2 border-[#fbb124] rounded-xl px-2 py-2 text-white font-bold shadow text- relative">
          START
          {/* Pointer/Notch */}
          <div className="absolute left-1/2 -bottom-1/6 -translate-x-1/2 -rotate-90">
            <div className="w-3 h-3 bg-[#fbb124] border-l-2 border-b-2 border-[#fbb124] rotate-45" />
          </div>
        </div>
      </div>
    );
  }
  