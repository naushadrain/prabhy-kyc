// utils/travelSteps.ts
import { StepItem } from "@/components/common/TravelStepper";

export function getTravelSteps(currentStep: number): StepItem[] {
  return [
    {
      step: 1,
      title: "Insurance Plan",
      status: currentStep > 1 ? "completed" : currentStep === 1 ? "current" : "pending",
    },
    {
      step: 2,
      title: "Coverage Plan",
      status: currentStep > 2 ? "completed" : currentStep === 2 ? "current" : "pending",
    },
    {
      step: 3,
      title: "Coverage Details",
      status: currentStep > 3 ? "completed" : currentStep === 3 ? "current" : "pending",
    },

  ];
}