import { Events } from "@/components/Events";
import { Footer } from "@/components/Footer";
import { Grain } from "@/components/Grain";
import { Hero } from "@/components/Hero";
import { Loader } from "@/components/Loader";
import { Marquee } from "@/components/Marquee";
import { Passes } from "@/components/Passes";
import { Timeline } from "@/components/Timeline";
import { SideNav } from "@/components/SideNav";
import { TopBar } from "@/components/TopBar";

export default function App() {
  return (
    <>
      <Loader />
      <Grain />
      <SideNav />

      <main>
        <TopBar />
        <Hero />
        <Marquee />
        <Events />
        <Passes />
        <Timeline />
      </main>

      <Footer />
    </>
  );
}
