import { useEffect } from "react";
import { BrowserRouter, HashRouter, Route, Routes, useLocation, Link } from "react-router-dom";

// Normal hosting uses real URLs; the preview build (VITE_PREVIEW=1) runs inside a host page, so it routes in-page.
const Router = import.meta.env.VITE_PREVIEW ? HashRouter : BrowserRouter;
import { AppProvider } from "@/lib/state";
import { Layout } from "@/components/Layout";
import { Empty } from "@/components/bits";
import Home from "@/pages/Home";

import Picks from "@/pages/Picks";
import Fixtures from "@/pages/Fixtures";
import MatchPage from "@/pages/MatchPage";
import Value from "@/pages/Value";
import TicketPage from "@/pages/TicketPage";
import Leagues from "@/pages/Leagues";
import LeaguePage from "@/pages/LeaguePage";
import RecordPage from "@/pages/RecordPage";
import Membership from "@/pages/Membership";
import Responsible from "@/pages/Responsible";
import HowItWorks from "@/pages/HowItWorks";
import Guide from "@/pages/Guide";
import Matchday from "@/pages/Matchday";
import Verify from "@/pages/Verify";

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <Router basename={import.meta.env.VITE_PREVIEW ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
        <ScrollTop />
        <Layout>
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
              <Route path="/guide" element={<Guide />} />
              <Route path="/matchday" element={<Matchday />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="*" element={<Empty title="That page doesn't exist"><Link to="/" className="underline">Go to the home page</Link></Empty>} />
            </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}
