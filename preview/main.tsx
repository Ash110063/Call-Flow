import { createRoot } from "react-dom/client";
import { StoreProvider } from "@/lib/store";
import AppShell from "@/components/AppShell";
import LoginPage from "@/app/login/page";
import OverviewPage from "@/app/(app)/page";
import JobsPage from "@/app/(app)/jobs/page";
import NewJobPage from "@/app/(app)/jobs/new/page";
import JobDetailPage from "@/app/(app)/jobs/[id]/page";
import AnalyticsPage from "@/app/(app)/analytics/page";
import SettingsPage from "@/app/(app)/settings/page";
import { splitPath, useLocation } from "./shims/router";

function Routes() {
  const { path } = splitPath(useLocation());
  if (path === "/login") return <LoginPage />;
  let page: React.ReactNode;
  if (path === "/") page = <OverviewPage />;
  else if (path === "/jobs") page = <JobsPage />;
  else if (path === "/jobs/new") page = <NewJobPage />;
  else if (/^\/jobs\/\d+$/.test(path)) page = <JobDetailPage key={path} />;
  else if (path === "/analytics") page = <AnalyticsPage />;
  else if (path === "/settings") page = <SettingsPage />;
  else page = <OverviewPage />;
  return <AppShell>{page}</AppShell>;
}

createRoot(document.getElementById("root")!).render(
  <StoreProvider>
    <Routes />
  </StoreProvider>,
);
