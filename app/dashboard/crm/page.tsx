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
      <section className="relative isolate overflow-hidden rounded-[30px] border border-slate-200 bg-white px-6 py-8 text-slate-900 shadow-[0_20px_55px_-42px_rgba(15,23,42,0.28)] sm:px-10 sm:py-11 lg:px-12 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-36 -z-10 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl dark:bg-emerald-900/15" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-44 left-1/3 -z-10 h-80 w-80 rounded-full bg-slate-100/80 blur-3xl dark:bg-slate-800/40" />

        <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Fit DaLi ERP · CRM My Kora
            </div>
            <h1 className="mt-6 max-w-xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl lg:text-[42px] lg:leading-[1.08]">
              Entre no seu CRM e continue de onde parou.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">
              Acesse com sua conta My Kora. Depois do login ou cadastro, você será levado direto ao CRM.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-2"><KeyRound className="h-3.5 w-3.5 text-[#2e7d32]" /> Autenticação My Kora</span>
              <span>Retorno automático ao CRM</span>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 text-slate-900 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100">
            <div className="px-1 pb-4">
              <p className="text-sm font-semibold text-slate-900">Como deseja continuar?</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Use sua conta My Kora ou crie uma nova.</p>
            </div>

            <div className="space-y-3">
              <a href={authHref('login')} className="group flex min-h-[68px] items-center gap-3 rounded-2xl bg-[#2e7d32] px-4 py-3 text-white shadow-sm transition-colors hover:bg-[#25692b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d32] focus-visible:ring-offset-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white"><KeyRound className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Entrar no My Kora</span><span className="mt-0.5 block text-xs text-white/80">Já tenho uma conta</span></span>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/75 transition group-hover:translate-x-0.5 group-hover:text-white" />
              </a>

              <a href={authHref('signup')} className="group flex min-h-[68px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-colors hover:border-emerald-300 hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d32] focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#2e7d32] dark:bg-emerald-950/60 dark:text-emerald-300"><UserRoundPlus className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Criar conta</span><span className="mt-0.5 block text-xs text-slate-500">Começar no My Kora</span></span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-[#2e7d32]" />
              </a>
            </div>

            <p className="mt-4 px-1 text-[11px] leading-5 text-slate-500">
              O My Kora pode solicitar confirmação de e-mail ou assinatura ativa depois do acesso.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
