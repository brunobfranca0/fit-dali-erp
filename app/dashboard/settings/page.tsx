'use client'

import { useState } from 'react'
import Image from 'next/image'
import Logo from '@/components/brand/Logo'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import KokonutBadge from '@/components/kokonutui/badge'
import { 
  Palette, 
  Download, 
  Copy, 
  Check, 
  Eye, 
  Package, 
  Clock, 
  Dumbbell,
  ExternalLink,
  Leaf,
  Heart,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'

export default function SettingsPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedColor(text)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  const brandColors = [
    {
      name: 'Rosa Magenta (Principal)',
      hex: '#E60067',
      rgb: 'rgb(230, 0, 103)',
      use: 'Logo "DaLi", botões primários, badges de destaque e Arroz Branco',
      textColor: 'text-white'
    },
    {
      name: 'Verde Fresco (Saúde)',
      hex: '#38A149',
      rgb: 'rgb(56, 161, 73)',
      use: 'Logo "Fit", folhagens, categoria Low Carb e nutrição',
      textColor: 'text-white'
    },
    {
      name: 'Verde Oliva (Equilíbrio)',
      hex: '#689F38',
      rgb: 'rgb(104, 159, 56)',
      use: 'Categoria Arroz Integral e elementos botânicos secundários',
      textColor: 'text-white'
    },
    {
      name: 'Vinho Carmim (Embalagem)',
      hex: '#B71C3D',
      rgb: 'rgb(183, 28, 61)',
      use: 'Selo das marmitas, carimbos e materiais impressos monocromáticos',
      textColor: 'text-white'
    },
    {
      name: 'Rosa Suave (Fundo)',
      hex: '#FDF2F7',
      rgb: 'rgb(253, 242, 247)',
      use: 'Cards de destaque, fundos de tela e efeitos hover suaves',
      textColor: 'text-pink-900'
    },
    {
      name: 'Verde Menta (Fundo)',
      hex: '#F0FDF4',
      rgb: 'rgb(240, 253, 244)',
      use: 'Fundos de status de sucesso e cards de produtos saudáveis',
      textColor: 'text-emerald-900'
    },
  ]

  const combos = [
    {
      name: 'Combo 10 Marmitas',
      color: 'border-pink-200/80 bg-rose-50/40',
      badgeColor: 'pink' as const,
      prices: [
        { cat: 'Arroz Branco', val: 'R$ 199,00', un: 'R$ 19,90/un' },
        { cat: 'Arroz Integral', val: 'R$ 219,00', un: 'R$ 21,90/un' },
        { cat: 'Low Carb', val: 'R$ 239,00', un: 'R$ 23,90/un' },
      ]
    },
    {
      name: 'Combo 20 Marmitas',
      color: 'border-emerald-200/80 bg-emerald-50/40',
      badgeColor: 'green' as const,
      prices: [
        { cat: 'Arroz Branco', val: 'R$ 378,00', un: 'R$ 18,90/un' },
        { cat: 'Arroz Integral', val: 'R$ 418,00', un: 'R$ 20,90/un' },
        { cat: 'Low Carb', val: 'R$ 458,00', un: 'R$ 22,90/un' },
      ]
    },
    {
      name: 'Valor Unitário (Avulso)',
      color: 'border-purple-200/80 bg-purple-50/40',
      badgeColor: 'purple' as const,
      prices: [
        { cat: 'Arroz Branco', val: 'R$ 21,90', un: 'unidade' },
        { cat: 'Arroz Integral', val: 'R$ 22,90', un: 'unidade' },
        { cat: 'Low Carb', val: 'R$ 24,90', un: 'unidade' },
      ]
    }
  ]

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <KokonutBadge variant="pink" dot>
              Brand System Oficial
            </KokonutBadge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Identidade Visual & Configurações
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            Manual de aplicação da marca Fit DaLi, paleta cromática e materiais físicos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a href="/logo.svg" download="fit-dali-logo.svg">
            <GlowButton variant="outline" size="sm">
              <Download className="w-3.5 h-3.5 text-[#e60067]" />
              <span>Baixar SVG</span>
            </GlowButton>
          </a>
          <a href="/logo.png" download="fit-dali-logo.png">
            <GlowButton variant="primary" size="sm">
              <Download className="w-3.5 h-3.5" />
              <span>Baixar PNG</span>
            </GlowButton>
          </a>
        </div>
      </div>

      {/* Brand Hero Bento Card */}
      <BentoCard glow glowColor="pink" className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 justify-between">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white rounded-3xl shadow-sm border border-pink-100 flex-shrink-0 transition-transform hover:scale-105">
              <Logo variant="full" size="lg" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-2xl font-black text-[#38A149]">Fit</span>
                <span className="text-2xl font-black text-[#E60067]">DaLi</span>
                <KokonutBadge variant="green" dot>
                  Marmitas Fitness
                </KokonutBadge>
              </div>
              <p className="text-sm font-bold text-emerald-800 italic mb-2">
                &ldquo;saudável com sabor!&rdquo;
              </p>
              <p className="text-xs text-gray-600 max-w-md font-medium">
                Comida de verdade para uma vida mais leve! Equilíbrio, sabor e praticidade em cada refeição.
              </p>
            </div>
          </div>

          {/* Quick Pillars */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white/90 rounded-2xl border border-gray-100 text-xs font-bold text-gray-700 shadow-2xs">
              <Leaf className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Ingredientes Selecionados</span>
            </div>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white/90 rounded-2xl border border-gray-100 text-xs font-bold text-gray-700 shadow-2xs">
              <Clock className="w-4 h-4 text-[#e60067] flex-shrink-0" />
              <span>Praticidade no seu dia</span>
            </div>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white/90 rounded-2xl border border-gray-100 text-xs font-bold text-gray-700 shadow-2xs">
              <Heart className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>Cuide da sua saúde</span>
            </div>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white/90 rounded-2xl border border-gray-100 text-xs font-bold text-gray-700 shadow-2xs">
              <Dumbbell className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span>Mais energia no dia</span>
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Logos & Assets Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#e60067]" />
          Variações da Logo no Sistema
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Full Logo */}
          <BentoCard className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">
                1. Logo Principal (Completa)
              </span>
              <div className="h-32 bg-gray-50/70 rounded-2xl flex items-center justify-center p-4 mb-4 border border-dashed border-gray-200">
                <Logo variant="full" size="md" />
              </div>
              <p className="text-xs text-gray-600 font-medium mb-2">
                Usada na tela de login, splash screen, cabeçalhos principais e impressões de recibos.
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
              <span className="text-gray-400 font-mono text-[11px]">/logo.svg</span>
              <a href="/logo.svg" target="_blank" className="text-[#e60067] font-bold hover:underline flex items-center gap-1">
                Visualizar <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </BentoCard>

          {/* 2. Horizontal Navbar Logo */}
          <BentoCard className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">
                2. Logo Horizontal (Navegação & Topo)
              </span>
              <div className="h-32 bg-gray-50/70 rounded-2xl flex items-center justify-center p-4 mb-4 border border-dashed border-gray-200">
                <Logo variant="horizontal" size="md" />
              </div>
              <p className="text-xs text-gray-600 font-medium mb-2">
                Otimizada para o topo da barra lateral e cabeçalho responsivo mobile do ERP.
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
              <span className="text-gray-400 font-mono text-[11px]">/logo-icon.svg</span>
              <a href="/logo-icon.svg" target="_blank" className="text-[#e60067] font-bold hover:underline flex items-center gap-1">
                Visualizar <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </BentoCard>

          {/* 3. Packaging Badge Logo */}
          <BentoCard className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">
                3. Selo de Embalagem (Marmitas)
              </span>
              <div className="h-32 bg-gray-50/70 rounded-2xl flex items-center justify-center p-2 mb-4 border border-dashed border-gray-200">
                <Logo variant="packaging" size="sm" />
              </div>
              <p className="text-xs text-gray-600 font-medium mb-2">
                Versão impressa nas embalagens: &ldquo;Saúde • Sabor • Praticidade&rdquo; em vermelho carmim.
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
              <span className="text-gray-400 font-mono text-[11px]">/logo-box.svg</span>
              <a href="/logo-box.svg" target="_blank" className="text-[#e60067] font-bold hover:underline flex items-center gap-1">
                Visualizar <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </BentoCard>
        </div>
      </div>

      {/* Official Color Palette */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
          <Palette className="w-5 h-5 text-emerald-600" />
          Paleta de Cores Oficial
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brandColors.map((color) => (
            <BentoCard
              key={color.hex}
              className="p-4 flex items-start gap-4 hover:border-pink-300"
            >
              <div
                className="w-14 h-14 rounded-2xl shadow-sm flex-shrink-0 flex items-center justify-center border border-black/5"
                style={{ backgroundColor: color.hex }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{color.name}</h3>
                  <button
                    onClick={() => copyToClipboard(color.hex)}
                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copiar HEX"
                  >
                    {copiedColor === color.hex ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="font-mono text-xs font-bold text-gray-700">{color.hex}</p>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-tight font-medium">{color.use}</p>
              </div>
            </BentoCard>
          ))}
        </div>
      </div>

      {/* Official Materials & Photos Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            Materiais Físicos Oficiais (Panfleto & Embalagem)
          </h2>
          <span className="text-xs text-gray-400 font-medium">Clique para ampliar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cardápio da Semana */}
          <BentoCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-900">Cardápio da Semana Oficial</span>
              <button
                onClick={() => setPreviewImage('/brand/cardapio-semanal.jpg')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#e60067] hover:underline"
              >
                <Eye className="w-3.5 h-3.5" /> Ampliar
              </button>
            </div>
            <div
              onClick={() => setPreviewImage('/brand/cardapio-semanal.jpg')}
              className="relative aspect-[3/4] max-h-80 w-full rounded-2xl overflow-hidden cursor-pointer group bg-gray-100 border border-gray-100 shadow-2xs"
            >
              <Image
                src="/brand/cardapio-semanal.jpg"
                alt="Cardápio da Semana Oficial Fit DaLi"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-white/95 px-3.5 py-1.5 rounded-full text-xs font-bold text-gray-900 shadow">
                  Clique para ver completo
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Arte com todos os pratos (Low Carb, Arroz Branco, Arroz Integral) e combos oficiais.
            </p>
          </BentoCard>

          {/* Embalagem com Logo */}
          <BentoCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-900">Embalagem Oficial das Marmitas</span>
              <button
                onClick={() => setPreviewImage('/brand/embalagem-fit-dali.jpg')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#e60067] hover:underline"
              >
                <Eye className="w-3.5 h-3.5" /> Ampliar
              </button>
            </div>
            <div
              onClick={() => setPreviewImage('/brand/embalagem-fit-dali.jpg')}
              className="relative aspect-[3/4] max-h-80 w-full rounded-2xl overflow-hidden cursor-pointer group bg-gray-100 border border-gray-100 shadow-2xs"
            >
              <Image
                src="/brand/embalagem-fit-dali.jpg"
                alt="Embalagem Oficial Fit DaLi"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-white/95 px-3.5 py-1.5 rounded-full text-xs font-bold text-gray-900 shadow">
                  Clique para ver completo
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Caixa personalizada com logo carmim, selo Marmitas Fitness e etiqueta manuscrita de prato.
            </p>
          </BentoCard>
        </div>
      </div>

      {/* Combos & Pricing Reference Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-gray-900 tracking-tight">Tabela Oficial de Combos & Preços</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {combos.map((combo) => (
            <BentoCard
              key={combo.name}
              className={`p-6 border ${combo.color}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-base">{combo.name}</h3>
                <KokonutBadge variant={combo.badgeColor} dot>
                  Oficial
                </KokonutBadge>
              </div>
              <div className="space-y-3">
                {combo.prices.map((item) => (
                  <div key={item.cat} className="flex items-center justify-between pb-2 border-b border-gray-200/50">
                    <div>
                      <span className="text-sm font-semibold text-gray-800 block">{item.cat}</span>
                      <span className="text-[11px] text-gray-500 font-medium">{item.un}</span>
                    </div>
                    <span className="text-base font-black text-gray-900 font-mono">{item.val}</span>
                  </div>
                ))}
              </div>
            </BentoCard>
          ))}
        </div>
      </div>

      {/* Brand Mission & Quality Guidelines */}
      <BentoCard className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Pilares de Qualidade & Compromisso Fit DaLi</h3>
            <p className="text-xs text-gray-500 font-medium">Marmitas fitness preparadas com ingredientes selecionados e nutrição balanceada</p>
          </div>
          <div className="flex items-center gap-2">
            <KokonutBadge variant="gray">
              Marmitas Fitness
            </KokonutBadge>
            <KokonutBadge variant="pink" dot>
              saudável com sabor!
            </KokonutBadge>
          </div>
        </div>
      </BentoCard>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[90vh] w-full h-[85vh] bg-white rounded-3xl overflow-hidden p-2 shadow-2xl"
          >
            <Image
              src={previewImage}
              alt="Visualização do Material Fit DaLi"
              fill
              className="object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/90 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
