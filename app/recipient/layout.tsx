import { ProtectedShell } from "@/components/ProtectedShell";

export default function RecipientLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedShell role="RECIPIENT">{children}</ProtectedShell>;
}
