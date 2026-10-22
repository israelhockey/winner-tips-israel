import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, HashRouter, Route, Routes, useLocation, Link } from "react-router-dom";

// Normal hosting uses real URLs; the preview build (VITE_PREVIEW=1) runs inside a host page, so it routes in-page.
const Router = import.meta.env.VITE_PREVIEW ? HashRouter : BrowserRouter;
import { AppProvider } from "@/lib/state";
import { Layout } from "@/components/Layout";
import { Loading, Empty } from "@/components/bits";
import Home from "@/pages/Home";

const Picks = lazy(() => import("@/pages/Picks"));
const Fixtures = lazy(() => import("@/pages/Fixtures"));
const MatchPage = lazy(() => import("@/pages/MatchPage"));
const Value = lazy(() => import("@/pages/Value"));
const TicketPage = lazy(() => import("@/pages/TicketPage"));
const Leagues = lazy(() => import("@/pages/Leagues"));
const LeaguePage = lazy(() => import("@/pages/LeaguePage"));
const RecordPage = lazy(() => import("@/pages/RecordPage"));
const Membership = lazy(() => import("@/pages/Membership"));
const Responsible = lazy(() => import("@/pages/Responsible"));
const HowItWorks = lazy(() => import("@/pages/HowItWorks"));

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <ScrollTop />
        <Layout>
          <Suspense fallback={<Loading what="the page" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/picks" element={<Picks />} />
              <Route path="/fixtures" element={<Fixtures />} />
              <Route path="/match/:league/:id" element={<MatchPage />} />
              <Route path="/value" element={<Value />} />
              <Route path="/ticket" element={<TicketPage />} />
              <Route path="/leagues" element={<Leagues />} />
              <Route path="/leagues/:key" element={<LeaguePage />} />
              <Route path="/record" element={<RecordPage />} />
              <Route path="/membership" element={<Membership />} />
              <Route path="/responsible-gambling" element={<Responsible />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="*" element={<Empty title="That page doesn't exist"><Link to="/" className="underline">Go to the home page</Link></Empty>} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AppProvider>
  );
}
