import { Events } from "@/components/Events";
import { Footer } from "@/components/Footer";
import { Grain } from "@/components/Grain";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Passes } from "@/components/Passes";
import { Proshow } from "@/components/Proshow";
import { SideNav } from "@/components/SideNav";
import { TopBar } from "@/components/TopBar";

export default function App() {
  return (
    <>
      <Grain />
      <SideNav />

      <main>
        <TopBar />
        <Hero />
        <Marquee />
        <Events />
        <Passes />
        <Proshow />
      </main>

      <Footer />
    </>
  );
}