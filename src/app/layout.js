import "./globals.css";
import { GameStateProvider } from "@/hooks/useGameState";
import { InventoryProvider } from "@/hooks/useInventory";
import { WalletProvider } from "@/hooks/useWallet";
import { LeaderboardProvider } from "@/hooks/useLeaderboard";
import { MarketplaceProvider } from "@/hooks/useMarketplace";
import { AudioProvider } from "@/hooks/useAudio";
import { ParticleProvider } from "@/components/ui/ParticleEffects";
import { TransitionProvider } from "@/components/ui/Transitions";

export const metadata = {
  title: "Cooter",
  description: "A turtle morphing game on a magical clock",
  icons: {
    icon: '/favicon.svg',
  },
};

function Providers({ children }) {
  return (
    <AudioProvider>
      <TransitionProvider>
        <ParticleProvider>
          <WalletProvider>
            <LeaderboardProvider>
              <MarketplaceProvider>
                <GameStateProvider>
                  <InventoryProvider>
                    {children}
                  </InventoryProvider>
                </GameStateProvider>
              </MarketplaceProvider>
            </LeaderboardProvider>
          </WalletProvider>
        </ParticleProvider>
      </TransitionProvider>
    </AudioProvider>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
