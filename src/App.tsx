
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { BadgeProvider } from "@/contexts/BadgeContext";
import { CalendarDecorationProvider } from "@/contexts/CalendarDecorationContext";
import { SharedElementProvider } from "@/contexts/SharedElementContext";
import { OptimisticImageProvider } from "@/contexts/OptimisticImageContext";
import { ExtraCreditsProvider } from "@/contexts/ExtraCreditsContext";
import { SelectedDateProvider } from "@/contexts/SelectedDateContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MobileAuthListener } from "@/components/MobileAuthListener";

const queryClient = new QueryClient();

const App = () => {
  // Back button logic moved to Index.tsx for better state awareness
  // useEffect(() => {
  //   import('@capacitor/app').then(({ App }) => { ... });
  // }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <BadgeProvider>
            <ProfileProvider>
              <ExtraCreditsProvider>
                <CalendarDecorationProvider>
                  <SelectedDateProvider>
                    <OptimisticImageProvider>
                      <SharedElementProvider>
                        <TooltipProvider>
                          <Toaster />
                          <Sonner position="bottom-center" toastOptions={{
                            style: { marginBottom: '84px' } // Float above bottom navigation
                          }} />
                          <BrowserRouter>
                            <MobileAuthListener />
                            <Routes>
                              <Route path="/" element={<Index />} />
                              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </BrowserRouter>
                        </TooltipProvider>
                      </SharedElementProvider>
                    </OptimisticImageProvider>
                  </SelectedDateProvider>
                </CalendarDecorationProvider>
              </ExtraCreditsProvider>
            </ProfileProvider>
          </BadgeProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
