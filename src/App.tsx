import { useState, useEffect } from "react";
import { TopBar } from "./components/TopBar";
import { BottomNav } from "./components/BottomNav";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { ProviderAuth } from "./components/ProviderAuth";
import { CustomerAuth } from "./components/CustomerAuth";
import { HomeScreen } from "./components/HomeScreen";
import { ExploreScreen } from "./components/ExploreScreen";
import { ServiceDetailScreen } from "./components/ServiceDetailScreen";
import { MessagesScreen } from "./components/MessagesScreen";
import { ChatScreen } from "./components/ChatScreen";
import { BookingsScreen } from "./components/BookingsScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { ProviderDashboard } from "./components/ProviderDashboard";
import { ProviderServices } from "./components/ProviderServices";
import { ProviderEarnings } from "./components/ProviderEarnings";
import { ProviderSchedule } from "./components/ProviderSchedule";
import { ProviderProfile } from "./components/ProviderProfile";
import { ProviderBottomNav } from "./components/ProviderBottomNav";
import { AIChatbot } from "./components/AIChatbot";
import { Toaster } from "./components/ui/sonner";
import { supabaseClient } from "./utils/api";
import {
  projectId,
  publicAnonKey,
} from "./utils/supabase/info";

type CustomerScreen =
  | "home"
  | "explore"
  | "messages"
  | "bookings"
  | "profile"
  | "service-detail"
  | "chat";
type ProviderScreen =
  | "dashboard"
  | "services"
  | "earnings"
  | "schedule"
  | "profile"
  | "chat";
type Mode =
  | "welcome"
  | "customer"
  | "provider"
  | "provider-auth"
  | "customer-auth";

export default function App() {
  const [mode, setMode] = useState<Mode>("welcome");
  const [isProviderAuthenticated, setIsProviderAuthenticated] =
    useState(false);
  const [isCustomerAuthenticated, setIsCustomerAuthenticated] =
    useState(false);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [currentScreen, setCurrentScreen] = useState<
    CustomerScreen | ProviderScreen
  >("home");
  const [selectedServiceId, setSelectedServiceId] = useState<
    string | null
  >(null);
  const [pendingScreen, setPendingScreen] =
    useState<CustomerScreen | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<string>("all");
  const [selectedChatUserId, setSelectedChatUserId] = useState<
    string | null
  >(null);
  const [selectedChatUserName, setSelectedChatUserName] =
    useState<string>("User");

  // Check for existing session on load and clear demo data
  useEffect(() => {
    const initialize = async () => {
      // Clear demo data on startup
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-241dc560/clear-demo-data`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Demo data cleared:", data.message);
        }
      } catch (error) {
        console.error("Failed to clear demo data:", error);
      }

      // Check for existing session
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();
        if (session?.user) {
          const userType =
            session.user.user_metadata?.user_type;
          if (userType === "provider") {
            setIsProviderAuthenticated(true);
            setMode("provider");
            setActiveTab("dashboard");
            setCurrentScreen("dashboard");
          } else if (userType === "customer") {
            setIsCustomerAuthenticated(true);
            setMode("customer");
            setActiveTab("home");
            setCurrentScreen("home");
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    initialize();
  }, []);

  const handleServiceClick = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setCurrentScreen("service-detail");
  };

  const handleBackToHome = () => {
    setCurrentScreen(activeTab as CustomerScreen);
  };

  const handleTabChange = (tab: string) => {
    // Check if customer needs to be authenticated for this tab
    if (
      mode === "customer" &&
      ["messages", "bookings", "profile"].includes(tab) &&
      !isCustomerAuthenticated
    ) {
      setPendingScreen(tab as CustomerScreen);
      setMode("customer-auth");
      return;
    }

    // Reset category filter when navigating to explore via bottom nav
    if (tab === "explore") {
      setSelectedCategory("all");
    }

    setActiveTab(tab);
    setCurrentScreen(tab as CustomerScreen | ProviderScreen);
  };

  const handleSearchClick = () => {
    setActiveTab("explore");
    setCurrentScreen("explore");
  };

  const handleSelectMode = (
    selectedMode: "customer" | "provider",
  ) => {
    if (selectedMode === "provider") {
      // Show provider auth screen first
      setMode("provider-auth");
    } else {
      setMode("customer");
      setActiveTab("home");
      setCurrentScreen("home");
    }
  };

  const handleProviderAuthSuccess = () => {
    setIsProviderAuthenticated(true);
    setMode("provider");
    setActiveTab("dashboard");
    setCurrentScreen("dashboard");
  };

  const handleBackToWelcome = () => {
    setMode("welcome");
    setIsProviderAuthenticated(false);
  };

  const handleCustomerAuthSuccess = () => {
    setIsCustomerAuthenticated(true);
    setMode("customer");

    // Navigate to the screen they were trying to access
    if (pendingScreen) {
      setActiveTab(pendingScreen);
      setCurrentScreen(pendingScreen);
      setPendingScreen(null);
    } else {
      setActiveTab("home");
      setCurrentScreen("home");
    }
  };

  const handleBackFromCustomerAuth = () => {
    setMode("customer");
    setPendingScreen(null);
    // Keep them on the home or explore screen
    if (
      currentScreen !== "home" &&
      currentScreen !== "explore" &&
      currentScreen !== "service-detail"
    ) {
      setActiveTab("home");
      setCurrentScreen("home");
    }
  };

  const handleLogout = async () => {
    try {
      const { logout } = await import("./utils/api");
      await logout();

      // Reset all state
      setIsCustomerAuthenticated(false);
      setIsProviderAuthenticated(false);
      setMode("welcome");
      setActiveTab("home");
      setCurrentScreen("home");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const renderCustomerScreen = () => {
    switch (currentScreen) {
      case "home":
        return (
          <HomeScreen
            onServiceClick={handleServiceClick}
            onCategoryClick={async (categoryId) => {
              const categories = [
                { value: "all", label: "All Categories" },
                { value: "cleaning", label: "Cleaning" },
                {
                  value: "repair",
                  label: "Repair & Maintenance",
                },
                { value: "beauty", label: "Beauty & Wellness" },
                { value: "tutoring", label: "Tutoring" },
                { value: "moving", label: "Moving & Delivery" },
                { value: "photography", label: "Photography" },
                { value: "event", label: "Event Planning" },
                { value: "pet", label: "Pet Care" },
              ];

              const categoryLabel =
                categories.find((c) => c.value === categoryId)
                  ?.label || categoryId;

              setSelectedCategory(categoryId);
              setActiveTab("explore");
              setCurrentScreen("explore");

              // Import and show toast
              const { toast } = await import("sonner@2.0.3");
              toast.success(`Browsing ${categoryLabel}`);
            }}
          />
        );
      case "explore":
        return (
          <ExploreScreen
            onServiceClick={handleServiceClick}
            initialCategory={selectedCategory}
          />
        );
      case "messages":
        return (
          <MessagesScreen
            onConversationClick={(userId, userName) => {
              setSelectedChatUserId(userId);
              setSelectedChatUserName(userName);
              setCurrentScreen("chat");
            }}
          />
        );
      case "chat":
        return selectedChatUserId ? (
          <ChatScreen
            userId={selectedChatUserId}
            userName={selectedChatUserName}
            onBack={() => {
              setCurrentScreen("messages");
              setSelectedChatUserId(null);
            }}
          />
        ) : (
          <MessagesScreen
            onConversationClick={(userId, userName) => {
              setSelectedChatUserId(userId);
              setSelectedChatUserName(userName);
              setCurrentScreen("chat");
            }}
          />
        );
      case "bookings":
        return (
          <BookingsScreen
            onContactClick={(providerId, providerName) => {
              setSelectedChatUserId(providerId);
              setSelectedChatUserName(providerName);
              setCurrentScreen("chat");
            }}
          />
        );
      case "profile":
        return (
          <ProfileScreen
            onMenuClick={(menuId) => {
              if (menuId === "settings") {
                // Could open settings modal
              }
            }}
            onLogout={handleLogout}
          />
        );
      case "service-detail":
        return selectedServiceId ? (
          <ServiceDetailScreen
            serviceId={selectedServiceId}
            onBack={handleBackToHome}
            onBookingClick={() => {
              // Navigate to bookings after successful booking
              setActiveTab("bookings");
              setCurrentScreen("bookings");
            }}
            onContactClick={(providerId, providerName) => {
              // Open chat with the provider
              setSelectedChatUserId(providerId);
              setSelectedChatUserName(providerName);
              setCurrentScreen("chat");
            }}
            onAuthRequired={() => {
              // Customer needs to authenticate before booking
              setPendingScreen("service-detail");
              setMode("customer-auth");
            }}
          />
        ) : (
          <HomeScreen onServiceClick={handleServiceClick} />
        );
      default:
        return (
          <HomeScreen onServiceClick={handleServiceClick} />
        );
    }
  };

  const renderProviderScreen = () => {
    switch (currentScreen) {
      case "dashboard":
        return <ProviderDashboard />;
      case "services":
        return <ProviderServices />;
      case "messages":
        return (
          <MessagesScreen
            onConversationClick={(userId, userName) => {
              setSelectedChatUserId(userId);
              setSelectedChatUserName(userName);
              setCurrentScreen("chat");
            }}
          />
        );
      case "chat":
        return selectedChatUserId ? (
          <ChatScreen
            userId={selectedChatUserId}
            userName={selectedChatUserName}
            onBack={() => {
              setCurrentScreen("messages");
              setSelectedChatUserId(null);
            }}
          />
        ) : (
          <MessagesScreen
            onConversationClick={(userId, userName) => {
              setSelectedChatUserId(userId);
              setSelectedChatUserName(userName);
              setCurrentScreen("chat");
            }}
          />
        );
      case "earnings":
        return <ProviderEarnings />;
      case "schedule":
        return <ProviderSchedule />;
      case "profile":
        return <ProviderProfile onLogout={handleLogout} />;
      default:
        return <ProviderDashboard />;
    }
  };

  // Show welcome screen if mode is not selected
  if (mode === "welcome") {
    return (
      <>
        <WelcomeScreen onSelectMode={handleSelectMode} />
        <Toaster />
      </>
    );
  }

  // Show provider auth screen
  if (mode === "provider-auth") {
    return (
      <>
        <ProviderAuth
          onBack={handleBackToWelcome}
          onAuthSuccess={handleProviderAuthSuccess}
        />
        <Toaster />
      </>
    );
  }

  // Show customer auth screen
  if (mode === "customer-auth") {
    return (
      <>
        <CustomerAuth
          onBack={handleBackFromCustomerAuth}
          onAuthSuccess={handleCustomerAuthSuccess}
          redirectFeature={
            pendingScreen as
              | "messages"
              | "bookings"
              | "profile"
              | undefined
          }
        />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar - hide on service detail screen, chat, and provider dashboard */}
      {mode === "customer" &&
        currentScreen !== "service-detail" &&
        currentScreen !== "chat" && (
          <TopBar
            onSearchClick={handleSearchClick}
            showSearch={currentScreen !== "explore"}
          />
        )}

      {mode === "provider" && currentScreen !== "chat" && (
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 px-4 py-3">
          <h2>Provider Portal</h2>
        </div>
      )}

      {/* Main Content */}
      <main
        className={
          mode === "customer" &&
          currentScreen !== "service-detail" &&
          currentScreen !== "chat"
            ? "pt-16"
            : mode === "provider" && currentScreen !== "chat"
              ? "pt-16"
              : ""
        }
      >
        {mode === "customer"
          ? renderCustomerScreen()
          : renderProviderScreen()}
      </main>

      {/* Bottom Navigation */}
      {mode === "customer" && currentScreen !== "chat" ? (
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      ) : mode === "provider" && currentScreen !== "chat" ? (
        <ProviderBottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      ) : null}

      {/* AI Chatbot - Only show in customer mode */}
      {mode === "customer" && currentScreen !== "chat" && <AIChatbot />}

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}