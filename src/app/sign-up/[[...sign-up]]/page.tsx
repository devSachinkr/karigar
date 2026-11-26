import Link from "next/link";
import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import { Leaf, Sparkles } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one"/><div className="auth-glow auth-glow-two"/>
      <Link href="/" className="brand auth-brand"><span className="brand-mark"><Leaf size={20}/></span>Karigar</Link>
      <div className="auth-theme"><ThemeSwitcher/></div>
      <section className="auth-card">
        <span className="auth-spark"><Sparkles size={17}/></span>
        <p className="eyebrow">Join the journey</p>
        <h1>Make room for<br/>more discovery.</h1>
        <p className="auth-subtitle">Create your Karigar account to keep your craft discoveries close.</p>
        <Suspense fallback={<div className="auth-widget-loading">Loading secure sign up…</div>}>
          <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
        </Suspense>
      </section>
      <p className="auth-bottom">Already have an account? <Link href="/sign-in">Sign in</Link></p>
    </main>
  );
}
