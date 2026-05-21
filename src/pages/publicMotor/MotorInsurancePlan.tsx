import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export const MotorInsurancePlan = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const insurancePlans = [
    { id: 'two-wheeler', title: 'Two Wheeler', icon: '🏍️', route: '/motor/two-wheeler' },
    { id: 'private', title: 'Private Vehicle', icon: '🚗', route: '/motor/private-vehicle' },
    { id: 'commercial', title: 'Commercial Vehicle', icon: '🚚', route: '/motor/commercial-vehicle' },
  ];

  const handlePlanSelect = (planId: string, route: string) => {
    localStorage.setItem('motor.vehicleType', planId);
    navigate(route);
  };

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-8 bg-background">
        {/* Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto">
          <button className="text-3xl font-bold mb-2" onClick={() => navigate('/dashboard')}>❮ Motor Insurance</button>
          <p className="text-muted-foreground mb-8">Choose your Insurance Plan</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {insurancePlans.map((plan) => (
              <Card
                key={plan.id}
                className="p-8 hover:shadow-lg transition-all cursor-pointer h-full text-center border-2 hover:border-primary"
                onClick={() => handlePlanSelect(plan.id, plan.route)}
              >
                <h3 className="text-lg font-bold mb-8">{plan.title}</h3>
                <div className="flex items-center justify-center py-8">
                  <div className="text-7xl opacity-80">{plan.icon}</div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-3">What is Motor Insurance?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vehicle insurance (also known as car insurance, motor insurance, or auto insurance) is insurance for cars, trucks, motorcycles, and other road vehicles. Its primary use is to provide financial protection against physical damage or bodily injury resulting from traffic collisions and against liability that could also arise from incidents in a vehicle. Vehicle insurance may additionally offer financial protection against theft of the vehicle, and against damage to the vehicle sustained from events other than traffic collisions, such as keying, weather or natural disasters, and damage sustained by colliding with stationary objects. The specific terms of vehicle insurance vary with legal regulations in each region.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">Why do you need Motor Insurance?</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In many jurisdictions, it is compulsory to have vehicle insurance before using or keeping a motor vehicle on public roads. Most jurisdictions relate insurance to both the car and the driver; however, the degree of each varies greatly.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Several jurisdictions have experimented with a 'pay-as-you-drive' insurance plan which utilizes either a tracking device in the vehicle or vehicle diagnostics. This would address issues of uninsured motorists by providing additional options and also charge based on the miles (kilometers) driven, which could theoretically increase the efficiency of the insurance, through streamlined collection.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};