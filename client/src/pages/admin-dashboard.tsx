import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { StatsCard } from "@/components/stats-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, UserPlus, Users, Calendar, DollarSign } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    enabled: !!user && user.role === "admin",
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />

      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 bg-white md:flex bg-white shadow-sm">
          <div className="flex-1 px-4 py-2 flex justify-between items-center">
            <button 
              type="button" 
              className="md:hidden px-4 text-gray-500 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="relative">
                <button type="button" className="p-1 text-gray-600 rounded-full hover:text-gray-700 focus:outline-none">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 pb-8 px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your clinic and user roles</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <StatsCard
                  title="Total Patients"
                  value={dashboardData?.counts?.patients || 0}
                  icon={Users}
                  linkText="View all patients"
                  linkHref="/admin/users?role=patient"
                />

                <StatsCard
                  title="Appointments Today"
                  value={dashboardData?.counts?.todayAppointments || 0}
                  icon={Calendar}
                  linkText="View calendar"
                  linkHref="/admin/calendar"
                  iconColor="text-success"
                  iconBgColor="bg-green-100"
                />

                <StatsCard
                  title="Revenue (This Month)"
                  value="$0"
                  icon={DollarSign}
                  linkText="View financial reports"
                  linkHref="/admin/finance"
                  iconColor="text-purple-600"
                  iconBgColor="bg-purple-100"
                />
              </div>

              <div className="mt-8">
                <Card>
                  <CardHeader className="flex justify-between items-center">
                    <CardTitle>Staff Management</CardTitle>
                    <Button className="whitespace-nowrap">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add New User
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Edit</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(dashboardData?.recentUsers || []).map((staff) => (
                            <tr key={staff.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <UserAvatar user={staff} className="h-10 w-10" />
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {staff.fullName}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 capitalize">{staff.role}</div>
                                {staff.specialty && (
                                  <div className="text-sm text-gray-500">{staff.specialty}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{staff.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Active
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <a href="#" className="text-primary hover:text-primary-dark">Edit</a>
                              </td>
                            </tr>
                          ))}
                          {(!dashboardData?.recentUsers || dashboardData.recentUsers.length === 0) && (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                No staff members found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
