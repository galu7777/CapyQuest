// app/page.tsx (página principal)

import Landing from "@/pages/Landing/Landing";
import Carrusel from './../pages/Landing/Carrusel';
import Header from "@/pages/Landing/Header";


export default function Home() {
  return (
    <main>
      <Header />
      {/* <BuyCapyCoins /> */}
       <Landing />
      <Carrusel />
    </main>
  );
}
