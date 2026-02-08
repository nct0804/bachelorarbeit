export interface Step {
  id: number;
  title: string;
  description: string;
  isLocked: boolean;
  isLearned: boolean;
  icon: React.ReactNode;
  order: number;
  xpReward: string;
  lessonId: number;
  onClick: () => void;
  bubbleRef: React.RefObject<HTMLDivElement> | null;
  nodeWrapperRef: React.RefObject<HTMLDivElement> | null;
  blockedBubbleRef: React.RefObject<HTMLDivElement> | null;
}