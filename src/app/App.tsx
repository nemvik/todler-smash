import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "@/app/AppShell";
import { LandingPage } from "@/pages/LandingPage";
import { ParentStudioPage } from "@/pages/ParentStudioPage";
import { PlayPage } from "@/pages/PlayPage";
import { AppSessionProvider } from "@/providers/AppSessionProvider";

export function App() {
  return (
    <BrowserRouter>
      <AppSessionProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/play" element={<PlayPage />} />
            <Route path="/parent/studio" element={<ParentStudioPage />} />
          </Route>
        </Routes>
      </AppSessionProvider>
    </BrowserRouter>
  );
}
