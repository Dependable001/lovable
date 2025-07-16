import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Car, DollarSign, AlertTriangle, TrendingUp, MessageSquare, Ban, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminDashboardProps {
  onBack: () => void;
}

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userType: "rider" | "driver";
  subject: string;
  status: "open" | "resolved" | "pending";
  priority: "low" | "medium" | "high";
  createdAt: string;
}

interface DisputeCase {
  id: string;
  rideId: string;
  riderId: string;
  driverId: string;
  issue: string;
  status: "pending" | "resolved" | "escalated";
  amount: number;
  createdAt: string;
}

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  const platformStats = {
    totalUsers: 15423,
    activeDrivers: 892,
    totalRides: 45678,
    monthlyRevenue: 12450,
    averageRating: 4.7,
    supportTickets: 23
  };

  const supportTickets: SupportTicket[] = [
    {
      id: "1",
      userId: "u123",
      userName: "Sarah M.",
      userType: "rider",
      subject: "Payment issue with ride #1234",
      status: "open",
      priority: "high",
      createdAt: "2024-01-15"
    },
    {
      id: "2",
      userId: "d456",
      userName: "Mike R.",
      userType: "driver",
      subject: "Account verification problems",
      status: "pending",
      priority: "medium",
      createdAt: "2024-01-14"
    },
    {
      id: "3",
      userId: "u789",
      userName: "Jennifer L.",
      userType: "rider",
      subject: "Rating dispute",
      status: "resolved",
      priority: "low",
      createdAt: "2024-01-13"
    }
  ];

  const disputeCases: DisputeCase[] = [
    {
      id: "1",
      rideId: "r123",
      riderId: "u456",
      driverId: "d789",
      issue: "Driver cancelled after pickup",
      status: "pending",
      amount: 24.50,
      createdAt: "2024-01-15"
    },
    {
      id: "2",
      rideId: "r456",
      riderId: "u123",
      driverId: "d456",
      issue: "Fare calculation dispute",
      status: "escalated",
      amount: 32.00,
      createdAt: "2024-01-14"
    }
  ];

  const handleResolveTicket = (ticketId: string) => {
    alert(`Support ticket ${ticketId} marked as resolved`);
  };

  const handleResolveDispute = (disputeId: string) => {
    alert(`Dispute ${disputeId} has been resolved`);
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "open":
      case "pending":
        return "destructive";
      case "resolved":
        return "default";
      case "escalated":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage platform operations and user support</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Platform Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-ubify-trust" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-xl font-bold text-foreground">{platformStats.totalUsers.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Car className="h-8 w-8 text-ubify-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Active Drivers</p>
                      <p className="text-xl font-bold text-foreground">{platformStats.activeDrivers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-ubify-secondary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Rides</p>
                      <p className="text-xl font-bold text-foreground">{platformStats.totalRides.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                      <p className="text-xl font-bold text-foreground">${platformStats.monthlyRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-ubify-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Rating</p>
                      <p className="text-xl font-bold text-foreground">{platformStats.averageRating}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Open Tickets</p>
                      <p className="text-xl font-bold text-foreground">{platformStats.supportTickets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Platform Activity</CardTitle>
                <CardDescription>Latest updates and important metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">New driver registrations today</span>
                    <Badge variant="default">+12</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Platform uptime this month</span>
                    <Badge variant="default">99.9%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Average dispute resolution time</span>
                    <Badge variant="outline">2.3 hours</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Monitor and manage riders and drivers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input placeholder="Search users..." className="max-w-sm" />
                    <Button variant="outline">Filter</Button>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-ubify-trust/20 flex items-center justify-center">
                          <span className="font-semibold text-ubify-trust">S</span>
                        </div>
                        <div>
                          <p className="font-medium">Sarah M.</p>
                          <p className="text-sm text-muted-foreground">Rider • Rating: 4.8 • 45 rides</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="default">Active</Badge>
                        <Button variant="outline" size="sm">View Profile</Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-ubify-primary/20 flex items-center justify-center">
                          <span className="font-semibold text-ubify-primary">M</span>
                        </div>
                        <div>
                          <p className="font-medium">Mike R.</p>
                          <p className="text-sm text-muted-foreground">Driver • Rating: 4.7 • 234 rides</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="default">Active</Badge>
                        <Button variant="outline" size="sm">View Profile</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Manage user support requests and issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={getBadgeVariant(ticket.status)}>
                            {ticket.status}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                            {ticket.priority} priority
                          </Badge>
                          <Badge variant="secondary">
                            {ticket.userType}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-foreground mb-1">{ticket.subject}</h3>
                        <p className="text-sm text-muted-foreground">
                          By {ticket.userName} • {ticket.createdAt}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                        {ticket.status !== "resolved" && (
                          <Button
                            variant="ubify"
                            size="sm"
                            onClick={() => handleResolveTicket(ticket.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dispute Resolution</CardTitle>
                <CardDescription>Handle conflicts between riders and drivers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {disputeCases.map((dispute) => (
                    <div key={dispute.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={getBadgeVariant(dispute.status)}>
                            {dispute.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Ride #{dispute.rideId}
                          </span>
                          <span className="text-sm font-medium text-ubify-primary">
                            ${dispute.amount.toFixed(2)}
                          </span>
                        </div>
                        <h3 className="font-medium text-foreground mb-1">{dispute.issue}</h3>
                        <p className="text-sm text-muted-foreground">
                          Rider: {dispute.riderId} vs Driver: {dispute.driverId} • {dispute.createdAt}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {dispute.status === "pending" && (
                          <Button
                            variant="ubify"
                            size="sm"
                            onClick={() => handleResolveDispute(dispute.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;