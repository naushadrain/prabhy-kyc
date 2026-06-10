export type StepStatus = "complete" | "current" | "upcoming";

export type AccidentStep = {
  id: number;
  title: string;
  status: StepStatus;
};

export const getAccidentSteps = (currentStep: number): AccidentStep[] => {
  const steps = [
    { id: 1, title: "Select Plan" },
    { id: 2, title: "Personal Details" },
    { id: 3, title: "Coverage Details" },
    { id: 4, title: "Documents" },
    { id: 5, title: "Review & Submit" },
  ];

  return steps.map((step) => ({
    ...step,
    status:
      step.id < currentStep
        ? "complete"
        : step.id === currentStep
          ? "current"
          : "upcoming",
  }));
};