import { ProtectedShell } from "@/components/ProtectedShell";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedShell role="PROVIDER">{children}</ProtectedShell>;
}
