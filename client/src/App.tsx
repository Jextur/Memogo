import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Chat from "@/pages/Chat";
import Packages from "@/pages/Packages";
import { ItineraryDetail } from "@/pages/ItineraryDetail";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

function HomeRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/chat");
  }, [setLocation]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/chat" component={Chat} />
      <Route path="/packages" component={Packages} />
      <Route path="/itinerary/:id" component={ItineraryDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
