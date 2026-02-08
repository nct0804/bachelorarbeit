import { useState, useRef, useEffect } from "react";
import LearningStep from "./LearningStep";
import type { Step } from "../types/step";


export default function VerticalStep({ steps }: { steps: Step[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the first not-learned lesson to highlight as
  const activeIndex = steps.findIndex(step => !step.isLearned);
  // One ref for each node wrapper
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  // One ref for each bubble (may be undefined)
  const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Return true if click is in ANY node or ANY bubble
      const clickedInsideNode = nodeRefs.current.some(
        ref => ref && ref.contains(event.target as Node)
      );
      const clickedInsideBubble = bubbleRefs.current.some(
        ref => ref && ref.contains(event.target as Node)
      );
      if (
        !clickedInsideNode &&
        !clickedInsideBubble
      ) {
        setSelectedIndex(null);
      }
    }
    if (selectedIndex !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [selectedIndex]);

  function handleNodeClick(i: number) {
    console.log("handleNodeClick", i);
    setSelectedIndex((prev) => (prev === i ? null : i));
  }

  return (
    <div
      className="flex flex-col items-center relative gap-10 min-h-[400px] w-full max-w-xs mx-auto py-20"
      ref={containerRef}
      data-test="lesson-steps"
    >
      
      {/* Steps */}
      {steps.map((step, i) => (
        <LearningStep
          key={step.id}
          title={step.title}
          subtitle={step.description || ""}
          xpReward={step.xpReward}
          lessonId={step.id}
          order={step.order}
          icon={
            step.icon ? (
              <img src={step.icon} alt={step.title} className="w-12 h-12" />
            ) : null
          }
          first={i === 0}
          last={i === steps.length - 1}
          active={i === activeIndex && !step.isLocked ? true : false}
          learned={step.isLearned}
          selected={selectedIndex === i}
          onClick={() => handleNodeClick(i)}
          nodeWrapperRef={el => (nodeRefs.current[i] = el)}
          bubbleRef={el => (bubbleRefs.current[i] = el)}
        />
      ))}
    </div>
  );
}
