// app/page.tsx (página principal)

import Landing from "@/pages/Landing/Landing";
import Carrusel from './../pages/Landing/Carrusel';
import BuyCapyCoins from "@/pages/BuyCapyCoins";


export default function Home() {
  return (
    <main>
      {/* <BuyCapyCoins /> */}
       <Landing />
      <Carrusel />
    </main>
  );
}
