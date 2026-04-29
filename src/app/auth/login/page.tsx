"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) { setError("Invalid email or password"); }
      else { router.push("/dashboard"); router.refresh(); }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen">
      {/* Left branding panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(hsl(217 91% 53% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(217 91% 53% / 0.4) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20"><Activity className="h-5 w-5 text-primary" /></div>
            <span className="text-xl font-bold tracking-tight">Flow<span className="text-primary">Trace</span></span>
          </Link>
          <div>
            <h2 className="mb-4 text-3xl font-bold leading-tight">IVR documentation,<br /><span className="gradient-text">simplified.</span></h2>
            <p className="max-w-md text-muted-foreground">Import, visualize, and audit your contact center call flows. Built for architects, QA engineers, and business analysts.</p>
          </div>
          <p className="text-sm text-muted-foreground/50">&copy; {new Date().getFullYear()} FlowTrace</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px] animate-fade-in">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20"><Activity className="h-5 w-5 text-primary" /></div>
            <span className="text-xl font-bold tracking-tight">Flow<span className="text-primary">Trace</span></span>
          </div>

          <Card className="border-border/50 shadow-xl shadow-black/20">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full gap-2" onClick={() => signIn("google", { callbackUrl: "/dashboard" })} type="button">
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </Button>

              <div className="relative my-6"><Separator /><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">or</span></div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required autoComplete="email" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" required autoComplete="current-password" />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading} id="login-submit">
                  {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>) : "Sign In"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}<Link href="/auth/register" className="font-medium text-primary hover:underline">Create one</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
