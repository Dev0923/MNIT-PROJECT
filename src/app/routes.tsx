import { createBrowserRouter, Outlet } from "react-router";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ServicePage } from "./pages/ServicePage";
import { DonationPage } from "./pages/DonationPage";
import { MelaMapPage } from "./pages/MelaMapPage";
import { HelpSupportPage } from "./pages/HelpSupportPage";
import { LiveDarshanPage } from "./pages/LiveDarshanPage";
import { GalleryPage } from "./pages/GalleryPage";
import { GalleryVideosPage } from "./pages/GalleryVideosPage";
import { GalleryVirtualTourPage } from "./pages/GalleryVirtualTourPage";
import { SiteMapPage } from "./pages/SiteMapPage";
import { DarshanBookingPage } from "./pages/DarshanBookingPage";
import { AdminPage } from "./pages/AdminPage";
import { AnnadaanPage } from "./pages/AnnadaanPage";
import { VehiclePermitApplicationPage } from "./pages/VehiclePermitApplicationPage";
import { VehicleRegistrationPage } from "./pages/VehicleRegistrationPage";
import { BandharaPermissionPage } from "./pages/BandharaPermissionPage";
import { AboutTemplePage } from "./pages/AboutTemplePage";
import { TempleTimingsPage } from "./pages/TempleTimingsPage";
import { TempleHistoryPage } from "./pages/TempleHistoryPage";
import { ImportantDaysPage } from "./pages/ImportantDaysPage";
import { NewsEventsPage } from "./pages/NewsEventsPage";
import { AboutKhatuPage } from "./pages/AboutKhatuPage";
import { LostFoundPage } from "./pages/LostFoundPage";
import { ReportLostItemPage } from "./pages/ReportLostItemPage";
import { MedicalCampPermissionPage } from "./pages/MedicalCampPermissionPage";

function RootLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/admin", Component: AdminPage },
  { path: "/login", Component: LoginPage },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "gallery", Component: GalleryPage },
      { path: "gallery/videos", Component: GalleryVideosPage },
      { path: "gallery/virtual-tour", Component: GalleryVirtualTourPage },
      { path: "sitemap", Component: SiteMapPage },
      { path: "mela-map", Component: MelaMapPage },
      { path: "help", Component: HelpSupportPage },
      { path: "live-darshan", Component: LiveDarshanPage },
      { path: "darshan-booking", Component: DarshanBookingPage },
      { path: "services/donation-portal", Component: DonationPage },
      { path: "services/annadaan-seva", Component: AnnadaanPage },
      { path: "services/bandhara-permission", Component: BandharaPermissionPage },
      { path: "services/medical-camp", Component: MedicalCampPermissionPage },
      { path: "services/vehicle-registration", Component: VehicleRegistrationPage },
      { path: "services/vehicle-permits/apply", Component: VehiclePermitApplicationPage },
      { path: "services/about-temple", Component: AboutTemplePage },
      { path: "services/temple-timings", Component: TempleTimingsPage },
      { path: "services/temple-history", Component: TempleHistoryPage },
      { path: "services/important-days", Component: ImportantDaysPage },
      { path: "services/news-events", Component: NewsEventsPage },
      { path: "services/about-khatu", Component: AboutKhatuPage },
      { path: "services/lost-and-found", Component: LostFoundPage },
      { path: "services/lost-and-found/report", Component: ReportLostItemPage },
      { path: "services/:slug", Component: ServicePage },
      { path: "*", Component: HomePage },
    ],
  },
]);
