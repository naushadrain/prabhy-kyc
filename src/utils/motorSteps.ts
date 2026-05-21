import { StepItem } from "@/components/common/TravelStepperProtect";

export function getMotorSteps(currentStep: number): StepItem[] {
  return [
    {
      step: 1,
      title: "Insurance Type",
      status: currentStep > 1 ? "completed" : currentStep === 1 ? "current" : "pending",
    },
    {
      step: 2,
      title: "Coverage Plan",
      status: currentStep > 2 ? "completed" : currentStep === 2 ? "current" : "pending",
    },
    {
      step: 3,
      title: "Premium Details",
      status: currentStep > 3 ? "completed" : currentStep === 3 ? "current" : "pending",
    },
    {
      step: 4,
      title: "Vehicle Details",
      status: currentStep > 4 ? "completed" : currentStep === 4 ? "current" : "pending",
    },
    {
      step: 5,
      title: "Review & Submit",
      status: currentStep > 5 ? "completed" : currentStep === 5 ? "current" : "pending",
    },
  ];
}
