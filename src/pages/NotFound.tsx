import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          {/* Logo/Icon */}
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Shield className="h-16 w-16 text-primary" />
            </div>
          </div>

          {/* 404 Heading */}
          <h1 className="mb-4 text-8xl font-bold text-primary">404</h1>
          
          {/* Error Message */}
          <h2 className="mb-4 text-3xl font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            The page you are looking for doesn't exist or has been moved. 
            Please check the URL or return to the homepage.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="min-w-[160px]">
              <Link to="/">
                <Home className="mr-2 h-5 w-5" />
                Go to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[160px]">
              <Link to={-1 as any}>
                <ArrowLeft className="mr-2 h-5 w-5" />
                Go Back
              </Link>
            </Button>
          </div>

          {/* Additional Help Text */}
          <div className="mt-12 rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
