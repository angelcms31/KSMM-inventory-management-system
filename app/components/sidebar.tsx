import { Link, useLocation } from "react-router";

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { name: "Home", path: "/", icon: "/icons/home.svg" },
    { name: "Artisan", path: "/artisan", icon: "/icons/artisan.svg" },
    { name: "Suppliers", path: "/suppliers", icon: "/icons/suppliers.svg" },
    { name: "Audit logs", path: "/audit-logs", icon: "/icons/auditLogs.svg" },
    { name: "Users", path: "/users", icon: "/icons/accounts.svg" },
  ];

  return (
    <aside className="w-[300px] bg-[#222222] h-screen flex flex-col pt-16 pb-8 px-0 text-white shrink-0">

      <div className="mb-14 px-8">
        <h1 className="text-[28px] font-bold leading-tight">
          Welcome back,<br />John!
        </h1>
        <p className="text-[#888888] text-[15px] mt-4 font-light">
          Last update: Today, 10:02am
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div key={item.name} className="pr-4"> 
              <Link
                to={item.path}
                className={`flex items-center justify-between px-8 py-4 transition-all duration-300 ${
                  isActive 
                    ? "bg-white text-black rounded-r-full" 
                    : "text-[#E0E0E0] hover:bg-white/5 rounded-r-full"
                }`}
              >
                <div className="flex items-center gap-5">
                  <img 
                    src={item.icon} 
                    alt="" 
                    className={`w-7 h-7 ${isActive ? "brightness-0" : "brightness-200"}`} 
                  />
                  <span className="text-[20px] font-medium tracking-wide">{item.name}</span>
                </div>
                
                {isActive && (
                  <div className="w-3.5 h-3.5 bg-black rounded-full mr-1"></div>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Log Out Section */}
      <div className="px-4">
        <button className="flex items-center gap-5 px-8 py-4 w-full text-[#E0E0E0] hover:bg-white/5 rounded-r-full transition-all">
          <img 
            src="/icons/home.svg" 
            alt="Logout" 
            className="w-7 h-7 brightness-200 rotate-180 opacity-80" 
          />
          <span className="text-[20px] font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  );
}