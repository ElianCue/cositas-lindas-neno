import { Header } from "@/components/tienda/header";
import { Footer } from "@/components/tienda/footer";

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
