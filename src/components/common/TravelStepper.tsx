// components/common/TravelStepper.tsx
import React from "react";
import { Check } from "lucide-react";

export type StepStatus = "completed" | "current" | "pending";

export type StepItem = {
  step: number;
  title: string;
  status: StepStatus;
};

type TravelStepperProps = {
  steps: StepItem[];
};

const statusStyles: Record<StepStatus, string> = {
  completed: "bg-green-500 text-white border-green-500",
  current: "bg-white text-violet-600 border-violet-500",
  pending: "bg-gray-200 text-gray-400 border-gray-300",
};

const badgeStyles: Record<StepStatus, string> = {
  completed: "bg-green-100 text-green-600",
  current: "bg-violet-100 text-violet-600",
  pending: "bg-orange-100 text-orange-500",
};

const badgeText: Record<StepStatus, string> = {
  completed: "Completed",
  current: "In Process",
  pending: "Pending",
};

export default function TravelStepper({ steps }: TravelStepperProps) {
  return (
    <div className="w-full rounded-2xl md:p-10">
      <div className="grid grid-cols-1 gap-20 md:grid-cols-3">
        {steps.map((item, index) => (
          <div key={item.step} className="relative">
            <div className="flex items-center gap-10">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${statusStyles[item.status]}`}
              >
                {item.status === "completed" ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <div className="h-3 w-3 rounded-full border-2 border-current" />
                )}
              </div>

              {index < steps.length - 1 && (
                <div className="hidden h-1 flex-1 rounded bg-gray-300 md:block" />
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm uppercase text-gray-700">
                  Step {item.step}
                </span>
                <span
                  className={`rounded-md px-3 py-1 text-xs font-medium ${badgeStyles[item.status]}`}
                >
                  {badgeText[item.status]}
                </span>
              </div>
              <h3 className="mt-2 text-2xl font-medium text-black">
                {item.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}