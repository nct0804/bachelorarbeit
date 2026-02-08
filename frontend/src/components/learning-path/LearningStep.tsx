import { useState } from "react";
import DetailBubble from "./DetailBubble";
import { useNavigate } from "react-router-dom";

export default function LearningStep({
  icon,
  first = false,
  last = false,
  active = false,
  learned = false,
  selected = false,
  title = "",
  subtitle = "",
  xpReward = "",
  order,
  lessonId,
  onClick,
  bubbleRef,
  nodeWrapperRef,
}: {
  icon: React.ReactNode;
  first?: boolean;
  last?: boolean;
  active?: boolean;
  learned?: boolean;
  selected?: boolean;
  title?: string;
  subtitle?: string;
  xpReward: string;
  order: number;
  lessonId?: number;
  onClick?: () => void;
  bubbleRef?: (el: HTMLDivElement | null) => void;
  nodeWrapperRef?: (el: HTMLDivElement | null) => void;
}) {
  const [pressed, setPressed] = useState(false);
  const navigate = useNavigate();

  const handleStartClick = (lessonId: number) => {
    navigate("/learn", {
      state: {lessonId: lessonId}
    });
  };

  const handlePracticeClick = () => {
    if (lessonId) {
      navigate("/learn", {
        state: { 
          lessonId: lessonId,
          isLearned: true
         }
      });
    }
  };

  const dataTestBase = `lesson-step-${lessonId ?? order}`;

  return (
    <div className="flex flex-col items-center relative" data-test={dataTestBase}>
      {/* {active && !selected && <StartBubble />} */}

      {/* Connection Path */}
      {!first && (
        <div className={`w-2 h-16 absolute -top-11 left-1/2 -translate-x-1/2 rounded-full
          ${learned ? 'bg-[#3B6978]' : active ? 'bg-yellow-300 animate-pulse' : 'bg-gray-200'}
        `}
        data-test={`${dataTestBase}-connector-top`}
        ></div>
      )}

      <div ref={nodeWrapperRef} className="relative flex flex-col items-center" data-test={`${dataTestBase}-node`}>
        {/* Animated shadow */}
        <div
          className={`
            absolute w-20 h-20 rounded-full z-0
            ${active ? 'bg-yellow-200 animate-pulse' : learned ? 'bg-green-100' : 'bg-gray-100'}
            left-1/2 -translate-x-1/2
            transition-all duration-200 pointer-events-none
            ${pressed ? 'translate-y-4 opacity-0' : 'translate-y-3 opacity-80'}
          `}
          style={{ top: 0 }}
        />

        {/* Step number badge */}
        <span className={`absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold shadow
          ${active ? 'bg-yellow-400 text-white' : learned ? 'bg-[#3B6978] text-white' : 'bg-gray-300 text-gray-700'}
        `}
        data-test={`${dataTestBase}-order`}
        >
          {order}
        </span>

        {/* Circle lesson node*/}
        <button
          data-test={`${dataTestBase}-button`}
          className={`
            relative z-10 w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-200 shadow-lg cursor-pointer
            ${active ? 'ring-4 ring-yellow-400 animate-bounce translate-y-3 translate-x-9.75' : ''}
            ${learned ? 'bg-[#3B6978]' : active ? 'bg-yellow-100' : 'bg-gray-100'}
            ${pressed ? 'scale-95' : ''}
            ${selected && learned ? 'ring-4 ring-green-400' : ''}
          `}
          onClick={onClick}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)}
          aria-label={title}
        >
          {learned ? (
            <svg
              className="w-8 h-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              data-test={`${dataTestBase}-check`}
            >
              <polyline points="20 6 10 18 4 12" />
            </svg>
          ) : (
            <span className="relative z-20" data-test={`${dataTestBase}-icon`}>{icon}</span>
          )}
        </button>
      </div>

      {/* BUBBLES */}
      {selected && (
        active ? (
          <DetailBubble
            ref={bubbleRef}
            title={title}
            subtitle={subtitle || ""}
            buttonLabel="START"
            xp={`+` + xpReward + `XP`}
            onClick={() => handleStartClick(lessonId || 0)}
            dataTestBase={`${dataTestBase}-bubble`}
          />
        ) : learned ? (
          <DetailBubble
            ref={bubbleRef}
            title={title}
            subtitle={subtitle || ""}
            buttonLabel="PRACTICE"
            xp={`+` + xpReward + `XP`}
            onClick={handlePracticeClick}
            dataTestBase={`${dataTestBase}-bubble`}
          />
        ) : (
          <DetailBubble
            ref={bubbleRef}
            title={title}
            subtitle={subtitle || ""}
            buttonLabel="LOCKED"
            onClick={() => {}}
            dataTestBase={`${dataTestBase}-bubble`}
          />
        )
      )}
      
      {/* Connection Path */}
      {!last && (
        <div className={`w-2 h-10 absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-full
          ${learned ? 'bg-green-300' : active ? 'bg-yellow-300 animate-pulse' : 'bg-gray-200'}
        `}
        data-test={`${dataTestBase}-connector-bottom`}
        ></div>
      )}
    </div>
  );
}
