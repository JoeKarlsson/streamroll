import { WebAppJsonLd } from "./_components/WebAppJsonLd";
import { FilmGrain } from "./_components/home/FilmGrain";
import { HeroBand } from "./_components/home/HeroBand";
import { WorksWith } from "./_components/home/WorksWith";
import { HowItWorks } from "./_components/home/HowItWorks";
import { Studio } from "./_components/home/Studio";

export default function Home() {
  return (
    <main
      id="main-content"
      className="relative flex-1 bg-background text-white flex flex-col items-center overflow-hidden"
    >
      <WebAppJsonLd />
      <FilmGrain />
      <HeroBand />
      <WorksWith />
      <HowItWorks />
      <Studio />
    </main>
  );
}
