"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { Leaf, LogIn, Sparkles } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export function Nav() {
  const { isLoaded, isSignedIn } = useUser();
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand"><span className="brand-mark"><Leaf size={20}/></span>Karigar<span className="brand-spark"><Sparkles size={12}/></span></Link>
        <div className="nav-links">
          <Link href="/explore">Explore</Link>
          <Link href="/#how-it-works" className="hide-mobile">Our approach</Link>
          <Link href="/gi" className="hide-mobile">GI Guide</Link>
          {isLoaded && isSignedIn && <>
            <Link href="/dashboard" className="hide-mobile">Dashboard</Link>
            <Link href="/favorites" className="hide-mobile">Favorites</Link>
            <Link href="/assistant" className="hide-mobile">Assistant</Link>
            <Link href="/admin" className="hide-mobile">Admin</Link>
          </>}
          <ThemeSwitcher/>
          {isLoaded && isSignedIn ? <UserButton/> : <Link className="nav-login" href="/sign-in"><LogIn size={15}/> Log in</Link>}
          <Link href="/scan" className="nav-cta btn btn-primary">Analyze craft</Link>
        </div>
      </div>
    </nav>
  );
}
