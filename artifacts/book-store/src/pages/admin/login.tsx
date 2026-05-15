import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuthStore } from "@/lib/store";
import { useAdminLogin } from "@workspace/api-client-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const setToken = useAdminAuthStore((s) => s.setToken);
  const adminLogin = useAdminLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const result = await adminLogin.mutateAsync({ data: { username, password } });
      setToken(result.token);
      navigate("/admin");
    } catch {
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary to-[hsl(40,10%,15%)] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-card border border-card-border rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-6 mx-auto">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-center mb-1">Admin Login</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">Uncommon Denominators — Dashboard</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" autoComplete="username" required />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full font-serif" disabled={adminLogin.isPending}>
            {adminLogin.isPending ? "Logging in…" : "Log In"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
