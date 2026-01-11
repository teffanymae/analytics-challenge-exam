"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useTeamMembers,
  useInviteTeamMember,
  useRemoveTeamMember,
  type TeamMember,
} from "@/lib/hooks/use-teams";

export default function TeamsPage() {
  const [email, setEmail] = useState("");

  const { data: members = [], isLoading } = useTeamMembers();
  const inviteMutation = useInviteTeamMember();
  const removeMutation = useRemoveTeamMember();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate(email, {
      onSuccess: () => setEmail(""),
    });
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this member?")) return;
    removeMutation.mutate(id);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Team Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Invite Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={inviteMutation.isPending}
              required
            />
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? "Inviting..." : "Invite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-4">Loading...</p>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No members yet</p>
          ) : (
            <div className="space-y-2">
              {members.map((member: TeamMember) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <span>{member.invited_email}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemove(member.id)}
                    disabled={removeMutation.isPending}
                  >
                    {removeMutation.isPending ? "Removing..." : "Remove"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
