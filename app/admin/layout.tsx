import { ProtectedShell } from "@/components/ProtectedShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedShell role="ADMIN">{children}</ProtectedShell>;
}
