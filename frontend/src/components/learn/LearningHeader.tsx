import { CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import HeartIcon from "../../assets/heart.png"
import React, { useState } from "react";

interface LearningHeaderProps {
  progress: number
  hearts: number
}

export default function LearningHeader({ progress, hearts }: LearningHeaderProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBack = () => {
    setShowConfirm(true);
  };

  const handleContinue = () => {
    setShowConfirm(false);
  };

  const handleBackToHome = () => {
    window.location.href = "/home";
  };

  return (
    <>
      <CardHeader>
        <div className="flex items-center w-full px-6 min-h-[48px]" data-test="learn-header-bar">
          {/* Left: X button */}
          <div className="w-10 flex-shrink-0 flex items-center justify-start">
            <button
              onClick={handleBack}
              aria-label="Go back"
              data-test="learn-exit"
              className="text-xl text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              X
            </button>
          </div>
          {/* Center: Progress bar */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <Progress 
              value={progress} 
              data-test="learn-progress"
              className="h-3 rounded-full w-full 
              bg-[#FFF7E0] [&_[data-slot=progress-indicator]]:bg-gradient-to-r 
              [&_[data-slot=progress-indicator]]:from-orange-400 
              [&_[data-slot=progress-indicator]]:to-yellow-400" 
            />
          </div>
          {/* Right: HeartIcon */}
          <div className="w-14 flex-shrink-0 flex items-center justify-end">
            <span className="text-xl font-medium flex items-center" data-test="learn-hearts">
              <img src={HeartIcon} className="w-6 h-6 ml-1" alt="hearts" />
              {hearts}
            </span>
          </div>
        </div>
      </CardHeader>
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" data-test="learn-exit-modal">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full flex flex-col items-center mx-2">
            <div className="text-lg font-bold text-red-600 mb-2 text-center">Don't go!</div>
            <div className="text-gray-700 text-center mb-4">Your progress will not be counted if you leave now. Are you sure you want to exit?</div>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={handleContinue}
                data-test="learn-exit-continue"
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg py-2 transition"
              >
                Continue
              </button>
              <button
                onClick={handleBackToHome}
                data-test="learn-exit-confirm"
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg py-2 transition"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
