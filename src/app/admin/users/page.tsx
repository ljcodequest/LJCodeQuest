"use client";

import { useState, useEffect } from "react";
import { Search, ShieldAlert, UserCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface User {
  _id: string;
  displayName: string;
  email: string;
  username: string;
  role: string;
  xp: number;
  level: number;
  avatarUrl?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.set("search", searchTerm);
      if (roleFilter !== "all") queryParams.set("role", roleFilter);

      const res = await fetch(`/api/admin/users?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, roleFilter]);

  const changeRole = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user to ${newRole}?`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      
      const data = await res.json();
      if (res.ok) {
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Failed to change role", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage platform users and roles.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          className="w-full sm:w-auto bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
          <option value="instructor">Instructor</option>
        </select>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium text-center">Level / XP</th>
                <th className="px-6 py-3 font-medium text-center">Joined</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {user.displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${
                        user.role === 'admin' 
                          ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                          : user.role === 'instructor'
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-medium">Lv {user.level}</div>
                      <div className="text-xs text-muted-foreground">{user.xp} XP</div>
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                       {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger className="p-2 hover:bg-accent rounded-md cursor-pointer">
                          <UserCog className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => changeRole(user._id, "student")} disabled={user.role === "student"}>
                            Make Student
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => changeRole(user._id, "instructor")} disabled={user.role === "instructor"}>
                            Make Instructor
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer font-medium text-purple-500" onClick={() => changeRole(user._id, "admin")} disabled={user.role === "admin"}>
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive text-xs" onClick={() => alert("Suspend not fully implemented yet.")}>
                            <ShieldAlert className="mr-2 h-3 w-3" />
                            Suspend User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
