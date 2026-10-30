import React from "react";
import { Users, CalendarCheck2, Boxes, ShieldCheck, Sparkles } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen w-full bg-[#fff7f2] flex flex-col lg:flex-row">
      {/* LEFT SECTION: 52% Desktop Branding & Hero Presentation */}
      <section 
        aria-label="Branding and Features"
        className="w-full lg:w-[52%] p-6 sm:p-10 lg:p-16 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#fff7f2] via-[#fff3ec] to-[#ffe9dc]"
      >
        {/* Subtle Decorative Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#f47b5b]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#f47b5b]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Oppidan ERMS Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#f47b5b] to-[#f9a489] flex items-center justify-center text-white shadow-md shadow-[#f47b5b]/25">
            <span className="font-extrabold text-xl tracking-tight">O</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-lg text-[#252525] tracking-tight">
                Oppidan ERMS
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#fff0e8] text-[#f47b5b] px-2 py-0.5 rounded-full border border-[#eadbd2]">
                Group Portal
              </span>
            </div>
            <p className="text-xs text-[#77716e]">Oppidan India Group</p>
          </div>
        </div>

        {/* Middle: Headline, Value Proposition & Abstract Graphic */}
        <div className="relative z-10 my-8 lg:my-auto max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#eadbd2] text-[#f47b5b] text-xs font-semibold mb-6 shadow-xs backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enterprise Workspace Edition</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#252525] leading-[1.15] tracking-tight mb-4">
            Your workforce, <br />
            <span className="text-[#f47b5b]">organized.</span>
          </h1>

          <p className="text-[#77716e] text-base sm:text-lg leading-relaxed mb-8">
            Manage employees, attendance, resources and everyday operations from one secure workspace.
          </p>

          {/* Feature Highlights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/70 backdrop-blur-xs border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#fff0e8] text-[#f47b5b] flex items-center justify-center mb-3">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-semibold text-sm text-[#252525] mb-1">
                Employee Management
              </h2>
              <p className="text-xs text-[#77716e] leading-snug">
                Profiles, departments & role assignments
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-xs border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#fff0e8] text-[#f47b5b] flex items-center justify-center mb-3">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-semibold text-sm text-[#252525] mb-1">
                Attendance & Leave
              </h2>
              <p className="text-xs text-[#77716e] leading-snug">
                Real-time tracking & automated approvals
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-xs border border-[#eadbd2] rounded-2xl p-4 shadow-xs hover:border-[#f47b5b]/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#fff0e8] text-[#f47b5b] flex items-center justify-center mb-3">
                <Boxes className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-semibold text-sm text-[#252525] mb-1">
                Resource Tracking
              </h2>
              <p className="text-xs text-[#77716e] leading-snug">
                Asset allocation & hardware inventories
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: Security Assurance Footer */}
        <div className="relative z-10 pt-4 flex items-center gap-2 text-xs text-[#77716e]">
          <ShieldCheck className="w-4 h-4 text-[#23855b]" />
          <span>Secured with JWT, AES token hashing & role-based data isolation.</span>
        </div>
      </section>

      {/* RIGHT SECTION: 48% Desktop Authentication Card */}
      <section 
        aria-label="Authentication Form"
        className="w-full lg:w-[48%] flex items-center justify-center p-4 sm:p-8 lg:p-12 relative"
      >
        <div className="w-full max-w-[460px] bg-white rounded-[24px] border border-[#eadbd2] shadow-xl shadow-[#f47b5b]/5 p-6 sm:p-10 my-auto">
          {/* Card Header */}
          <div className="text-left mb-6">
            <h2 className="font-heading text-2xl font-bold text-[#252525] tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-[#77716e] mt-1">
              {subtitle}
            </p>
          </div>

          {/* Form Content */}
          {children}
        </div>
      </section>
    </div>
  );
};
