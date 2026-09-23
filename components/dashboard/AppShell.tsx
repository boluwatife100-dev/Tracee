import Sidebar, { type NavKey } from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({
  title = "Dashboard",
  active = "dashboard",
  children,
}: {
  title?: string;
  active?: NavKey;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100svh] flex-col bg-white">
      <TopBar title={title} />
      <div className="flex flex-1">
        <Sidebar active={active} />
        <main className="flex-1 bg-white px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}