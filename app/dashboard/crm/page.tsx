// TypeScript / app/dashboard/crm/page.tsx / Next.js 16 / Fit Dali ERP
import { ArrowRight, ArrowUpRight, KeyRound, ShieldCheck, UserRoundPlus } from 'lucide-react'

const MY_KORA_AUTH_URL = 'https://app.botbuilderia.com/auth'

function authHref(mode: 'login' | 'signup') {
  const url = new URL(MY_KORA_AUTH_URL)
  url.searchParams.set('mode', mode)
  url.searchParams.set('redirect', '/crm')
  return url.toString()
}

export default function CRMPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-1 pb-10">
      <section className="relative isolate overflow-hidden rounded-[30px] bg-[#111d1b] px-6 py-8 text-white shadow-[0_24px_70px_-38px_rgba(15,23,42,0.55)] sm:px-10 sm:py-11 lg:px-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-36 -z-10 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-44 left-1/3 -z-10 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5" /> CRM My Kora
            </div>
            <h1 className="mt-6 max-w-xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl lg:text-[42px] lg:leading-[1.08]">
              Entre no seu CRM e continue de onde parou.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
              Acesse com sua conta My Kora. Depois do login ou cadastro, você será levado direto ao CRM.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2"><KeyRound className="h-3.5 w-3.5 text-emerald-300" /> Autenticação My Kora</span>
              <span>Retorno automático ao CRM</span>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur sm:p-5">
            <div className="px-1 pb-4">
              <p className="text-sm font-semibold text-white">Como deseja continuar?</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Use sua conta My Kora ou crie uma nova.</p>
            </div>

            <div className="space-y-3">
              <a href={authHref('login')} className="group flex min-h-[68px] items-center gap-3 rounded-2xl bg-white px-4 py-3 text-slate-950 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#111d1b] text-emerald-200"><KeyRound className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Entrar no My Kora</span><span className="mt-0.5 block text-xs text-slate-500">Já tenho uma conta</span></span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-900" />
              </a>

              <a href={authHref('signup')} className="group flex min-h-[68px] items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/30 px-4 py-3 text-white transition hover:-translate-y-0.5 hover:border-emerald-200/40 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-200"><UserRoundPlus className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Criar conta</span><span className="mt-0.5 block text-xs text-slate-400">Começar no My Kora</span></span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-emerald-200" />
              </a>
            </div>

            <p className="mt-4 px-1 text-[11px] leading-5 text-slate-400">
              O My Kora pode solicitar confirmação de e-mail ou assinatura ativa depois do acesso.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
