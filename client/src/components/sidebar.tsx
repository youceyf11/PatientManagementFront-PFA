import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  Calendar, 
  ClipboardList, 
  Users, 
  Building2, 
  BarChart2, 
  FileText, 
  Settings, 
  LogOut, 
  PlusCircle,
  CircleDollarSign, 
  UserCircle, 
  Mail,
  Pill
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { UserAvatar } from "./user-avatar";
import { cn } from "@/lib/utils";

type SidebarProps = {
  onLogout: () => void;
};

export function Sidebar({ onLogout }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  // Determine links based on user role
  const getNavLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case 'admin':
        return [
          { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
          { href: '/admin/users', label: 'Manage Users', icon: Users },
          { href: '/admin/clinic', label: 'Clinic Info', icon: Building2 },
          { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
          { href: '/admin/settings', label: 'Settings', icon: Settings },
        ];
      case 'doctor':
        return [
          { href: '/doctor/dashboard', label: 'Dashboard', icon: Home },
          { href: '/doctor/schedule', label: 'My Schedule', icon: Calendar },
          { href: '/doctor/patients', label: 'Patient Records', icon: ClipboardList },
          { href: '/doctor/prescriptions', label: 'Prescriptions', icon: Pill },
        ];
      case 'patient':
        return [
          { href: '/patient/dashboard', label: 'Dashboard', icon: Home },
          { href: '/patient/profile', label: 'My Profile', icon: UserCircle },
          { href: '/patient/appointments', label: 'Appointments', icon: Calendar },
          { href: '/patient/records', label: 'Medical Records', icon: ClipboardList },
          { href: '/patient/messages', label: 'Messages', icon: Mail },
          { href: '/patient/billing', label: 'Billing', icon: CircleDollarSign },
        ];
      case 'receptionist':
        return [
          { href: '/receptionist/dashboard', label: 'Dashboard', icon: Home },
          { href: '/receptionist/appointments', label: 'Appointments', icon: Calendar },
          { href: '/receptionist/patients', label: 'Patient Registration', icon: PlusCircle },
          { href: '/receptionist/billing', label: 'Billing', icon: CircleDollarSign },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-10">
      <div className="flex items-center justify-center h-16 border-b">
        <h1 className="text-xl font-bold text-primary">MediManage</h1>
      </div>
      <div className="px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center mb-3">
            {user && (
              <>
                <UserAvatar user={user} />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">{user.fullName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </>
            )}
          </div>
        </div>
        
        <nav className="space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            
            return (
              <Link key={link.href} href={link.href}>
                <a
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Icon className="text-gray-500 mr-3 h-5 w-5" />
                  {link.label}
                </a>
              </Link>
            );
          })}
          
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onLogout();
            }}
            className="text-gray-700 hover:bg-gray-50 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
          >
            <LogOut className="text-gray-500 mr-3 h-5 w-5" />
            Sign Out
          </a>
        </nav>
      </div>
    </div>
  );
}
