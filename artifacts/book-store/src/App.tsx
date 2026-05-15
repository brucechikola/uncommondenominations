import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useTrackVisitor, setAuthTokenGetter } from "@workspace/api-client-react";
import { useAdminAuthStore } from "@/lib/store";

import { PublicLayout } from "@/components/public-layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AboutBook from "@/pages/about-book";
import AboutAuthor from "@/pages/about-author";
import Shop from "@/pages/shop";
import Checkout from "@/pages/checkout";
import Payment from "@/pages/payment";
import Confirmation from "@/pages/confirmation";
import Reviews from "@/pages/reviews";
import Contact from "@/pages/contact";
import Terms from "@/pages/terms";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";

const queryClient = new QueryClient();

// Register a token getter so the API client injects Authorization headers
// correctly — avoids the Headers-spread bug that dropped Content-Type.
setAuthTokenGetter(() => useAdminAuthStore.getState().token);

function VisitorTracker() {
  const [location] = useLocation();
  const trackVisitor = useTrackVisitor();

  useEffect(() => {
    trackVisitor.mutate({ data: { page: location } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return null;
}

function Router() {
  return (
    <>
      <VisitorTracker />
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={AdminDashboard} />
        <Route>
          <PublicLayout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/about-book" component={AboutBook} />
              <Route path="/about-author" component={AboutAuthor} />
              <Route path="/shop" component={Shop} />
              <Route path="/checkout" component={Checkout} />
              <Route path="/payment" component={Payment} />
              <Route path="/confirmation" component={Confirmation} />
              <Route path="/reviews" component={Reviews} />
              <Route path="/contact" component={Contact} />
              <Route path="/terms" component={Terms} />
              <Route component={NotFound} />
            </Switch>
          </PublicLayout>
        </Route>
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
