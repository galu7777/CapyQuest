<p align="left">
  <img height="400" src="./capy-quest-app/src/assets/capyquest.png" alt="CapyQuest Logo"/>
</p>

CapyQuest es un proyecto **Web3** construido con **Solidity** para los smart contracts y **Next.js** para el frontend.  
Nuestro objetivo es crear un ecosistema divertido e interactivo alrededor de **CapyCoin**, combinando blockchain, geolocalización y futuras integraciones de AR.  

🌍 Website: [CapyQuest](https://capy-quest.vercel.app/)

---

## 🚀 Funciones Actuales (Stage 1 y 2)

- Smart contracts desplegados en **Avalanche Fuji Testnet**:  
  - **CapyCoin (ERC-20)**  
  - **CapyNFT (ERC-721)**  
  - **Marketplace**  
- Frontend con **Next.js**  
- Comprar CapyCoins con facilidad  
- **Distribución de NFTs en el mapa**: por punto exacto o aleatoria dentro de un perímetro  
- **Reclamo de NFTs** cerca del punto asignado (radio de 10 m, en testing 150 m)  
- **Marketplace**: vender o quemar NFTs para obtener CapyCoins  
- 5 rarezas de NFTs ya implementadas: Baby, Explore, Wise, Legendary, Golden  

---

## 🖼 Rutas de imágenes de NFTs

| Rareza       | Imagen |
|-------------|-------|
| BabyCapy     | `./capy-quest-app/src/assets/NFTs/BabyCapy.png` |
| ExploreCapy  | `./capy-quest-app/src/assets/NFTs/ExploreCapy.png` |
| WiseCapy     | `./capy-quest-app/src/assets/NFTs/WiseCapy.png` |
| LegendaryCapy| `./capy-quest-app/src/assets/NFTs/LegendaryCapy.png` |
| GoldenCapy   | `./capy-quest-app/src/assets/NFTs/GoldenCapy.png` |

---

## 💰 Modelo Económico de Cazatesoros

### 🎯 Claim (Reclamar)
- **Gratis** para cualquier jugador  
- Solo se puede reclamar un NFT si estás físicamente cerca del punto  
- No se puede reclamar tu propio NFT  

### 🔥 Burn (Convertir a CapyCoin)
- Al **quemar** un NFT, recibes **97% de su valor en CapyCoin**  
- **3% de fee** va al `feeRecipient`  
- Cada rareza tiene su propio valor en CapyCoin:  

| Rareza       | Valor en CapyCoin al mintear | Valor al quemar (97%) |
|-------------|----------------------------|----------------------|
| BabyCapy     | 1 CYC                       | 0.97 CYC             |
| ExploreCapy  | 5 CYC                       | 4.85 CYC             |
| WiseCapy     | 10 CYC                      | 9.7 CYC              |
| LegendaryCapy| 20 CYC                      | 19.4 CYC             |
| GoldenCapy   | 100 CYC                     | 97 CYC               |

### 🏦 Reserva del Contrato
- Los CapyCoins se acumulan al mintear NFTs  
- Solo se liberan al quemar NFTs (con fee aplicado)  
- No hay retiro directo de CapyCoins del contrato  

### 🎮 Incentivos del Juego
- **Distribuir**: los jugadores reparten NFTs para interactuar con su audiencia  
- **Explorar**: otros jugadores buscan y reclaman NFTs gratis  
- **Convertir**: usuarios queman NFTs cuando necesitan liquidez  
- Objetivo: siempre que el jugador gane algo, el repartidor genere engagement significativo con su comunidad  

💡 Ejemplo de uso:  
- Una marca distribuye NFTs dentro de un perímetro en su ciudad  
- Los usuarios caminan, buscan y reclaman los NFTs  
- Los NFT pueden ser vendidos o quemados por CapyCoins  
- Se genera **FOMO real** y engagement sin gastar publicidad tradicional  

---

## 📌 Roadmap AR y Futuro
- Mejoras en **AR** para hacer la experiencia más inmersiva  
- Gamificación del mapa y rarezas en tiempo real  
- Expandir la economía y las interacciones entre jugadores y marcas  

---

## 📂 Tech Stack
- **Smart Contracts**: Solidity  
- **Frontend**: Next.js  
- **Blockchain**: Avalanche-AVAX  

---

## 🤝 Contribuyendo
¡Contribuidores bienvenidos!  
Revisa el [repo](https://github.com/tu-usuario/capy-quest-app) y la roadmap para empezar.  

---

<!-- ## 📧 Contacto
Visítanos en [CapyQuest](https://capy-quest.vercel.app/)  -->


---