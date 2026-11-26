import Link from "next/link";
import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import { Leaf, Sparkles } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one"/><div className="auth-glow auth-glow-two"/>
      <Link href="/" className="brand auth-brand"><span className="brand-mark"><Leaf size={20}/></span>Karigar</Link>
      <div className="auth-theme"><ThemeSwitcher/></div>
      <section className="auth-card">
        <span className="auth-spark"><Sparkles size={17}/></span>
        <p className="eyebrow">Welcome back</p>
        <h1>Your craft journey<br/>continues here.</h1>
        <p className="auth-subtitle">Sign in to revisit your discoveries and saved traditions.</p>
        <Suspense fallback={<div className="auth-widget-loading">Loading secure sign in…</div>}>
          <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
        </Suspense>
      </section>
      <p className="auth-bottom">A little more wonder in every detail. <Link href="/sign-up">Create an account</Link></p>
    </main>
  );
}
