import { forwardRef } from "react";
import { LockIcon, Star, Play } from "lucide-react";

const DetailBubble = forwardRef<HTMLDivElement, {
  title: string;
  subtitle: string;
  buttonLabel?: string;
  xp?: string;
  style?: React.CSSProperties;
  blockedStyle?: React.CSSProperties;
  onClick?: () => void;
  dataTestBase?: string;
  ref?: React.RefObject<HTMLDivElement>;
}>(({ title, subtitle, buttonLabel, xp, style, onClick, dataTestBase }, ref) => (
  // bubble container
  <div
    ref={ref}
    data-test={dataTestBase ? `${dataTestBase}-container` : undefined}
    className={`absolute top-[125%] left-1/2 -translate-x-1/2 flex flex-col items-center z-40 rounded-3xl
      ${buttonLabel === 'START' ? 'bg-[#fbb124] text-white' : ''}
      ${buttonLabel === 'PRACTICE' ? 'bg-[#3B6978] text-white' : ''}
      ${buttonLabel === 'LOCKED' ? 'bg-[#b6b6b6] text-black' : ''}
      `}
  >
    {/* bubble content */}
    <div className="text-white rounded-3xl px-6 py-6 shadow-lg relative w-60" style={style} data-test={dataTestBase ? `${dataTestBase}-content` : undefined}>
      
      {/* bubble arrow */}
      <div className="absolute left-1/2 -top-2 -translate-x-1/2">
        <div className={`w-6 h-6 
           rotate-45
           ${buttonLabel === 'START' ? 'bg-[#fbb124]' : ''}
           ${buttonLabel === 'PRACTICE' ? 'bg-[#3B6978]' : ''}
           ${buttonLabel === 'LOCKED' ? 'bg-[#b6b6b6]' : ''}
           `} />
      </div>
      {/* bubble title */}
      <div className="mb-2" data-test={dataTestBase ? `${dataTestBase}-title` : undefined}><span className="font-bold text-lg">{title}</span></div>
      {/* bubble subtitle */}
      <div className="mb-3 text-sm" data-test={dataTestBase ? `${dataTestBase}-subtitle` : undefined}>{subtitle}</div>
      {/* bubble button */}
      <button
        data-test={dataTestBase ? `${dataTestBase}-action` : undefined}
        className={`flex rounded-full 
            px-14 py-2 gap-1.5 text-lg w-full text-center 
            justify-center transition active:scale-95
            bg-[#ffffff] cursor-pointer
            ${buttonLabel === 'START' ? 'text-[#ffa600]' : ''}
            ${buttonLabel === 'PRACTICE' ? 'text-black' : ''}
            ${buttonLabel === 'LOCKED' ? 'text-black' : ''}
        `}
        style={style}
        onClick={onClick}
      >
        {/* bubble button label */}
        <div className="flex items-center gap-1 font-bold">
          {buttonLabel === 'LOCKED' && (
            <LockIcon className="w-5 h-5" />
          )}
          {buttonLabel === 'START' && (
            <Star className="w-5 h-5" />
          )}
          {buttonLabel === 'PRACTICE' && (
            <Play className="w-5 h-5" />
          )}
          <span>{buttonLabel}</span>
        </div>
        <span className="font-bold" data-test={dataTestBase ? `${dataTestBase}-xp` : undefined}>{xp}</span>
      </button>
    </div>
  </div>
));
export default DetailBubble;
