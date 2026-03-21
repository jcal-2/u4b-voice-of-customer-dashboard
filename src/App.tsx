import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VocDataProvider } from "@/context/VocDataContext";
import Navbar from "@/components/Navbar";
import VocSynthesis from "@/pages/VocSynthesis";
import MasterFeedback from "@/pages/MasterFeedback";
import SurveyFramework from "@/pages/SurveyFramework";
import CustomerArchetypes from "@/pages/CustomerArchetypes";
import RawData from "@/pages/RawData";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <VocDataProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<VocSynthesis />} />
            <Route path="/feedback" element={<MasterFeedback />} />
            <Route path="/surveys" element={<SurveyFramework />} />
            <Route path="/archetypes" element={<CustomerArchetypes />} />
            <Route path="/data" element={<RawData />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </VocDataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
