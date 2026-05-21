import { Check } from "lucide-react";
import { StepStatus, StepItem } from "@/components/common/TravelStepperProtect";

type MotorStepperProps = {
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

export default function MotorStepper({ steps }: MotorStepperProps) {
  return (
    <div className="w-full rounded-2xl md:p-8">
      <div className="grid grid-cols-1 gap-16 md:grid-cols-5">
        {steps.map((item, index) => (
          <div key={item.step} className="relative">
            <div className="flex items-center gap-6">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${statusStyles[item.status]}`}
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

            <div className="mt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase text-gray-700">
                  Step {item.step}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${badgeStyles[item.status]}`}
                >
                  {badgeText[item.status]}
                </span>
              </div>
              <h3 className="mt-1 text-lg font-medium text-black">
                {item.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
