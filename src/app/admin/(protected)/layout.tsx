import { requireAdmin } from '@/lib/auth';
import { AdminSidebar, AdminTopBar } from '@/components/layout/admin-shell';

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check — redirects to login if not authorized
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-[var(--color-canvas)]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="container-admin">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
