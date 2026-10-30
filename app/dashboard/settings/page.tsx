'use client'

import { useState } from 'react'
import Image from 'next/image'
import Logo from '@/components/brand/Logo'
import { 
  Palette, 
  Download, 
  Copy, 
  Check, 
  Eye, 
  Phone, 
  Heart, 
  Leaf, 
  Sparkles,
  Package, 
  Clock, 
  Dumbbell,
  ExternalLink
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
      color: 'border-pink-200 bg-pink-50/50',
      badgeColor: 'bg-[#E60067] text-white',
      prices: [
        { cat: 'Arroz Branco', val: 'R$ 199,00', un: 'R$ 19,90/un' },
        { cat: 'Arroz Integral', val: 'R$ 219,00', un: 'R$ 21,90/un' },
        { cat: 'Low Carb', val: 'R$ 239,00', un: 'R$ 23,90/un' },
      ]
    },
    {
      name: 'Combo 20 Marmitas',
      color: 'border-emerald-200 bg-emerald-50/50',
      badgeColor: 'bg-[#38A149] text-white',
      prices: [
        { cat: 'Arroz Branco', val: 'R$ 378,00', un: 'R$ 18,90/un' },
        { cat: 'Arroz Integral', val: 'R$ 418,00', un: 'R$ 20,90/un' },
        { cat: 'Low Carb', val: 'R$ 458,00', un: 'R$ 22,90/un' },
      ]
    },
    {
      name: 'Valor Unitário (Avulso)',
      color: 'border-purple-200 bg-purple-50/50',
      badgeColor: 'bg-purple-600 text-white',
      prices: [
        { cat: 'Arroz Branco', val: 'R$ 21,90', un: 'unidade' },
        { cat: 'Arroz Integral', val: 'R$ 22,90', un: 'unidade' },
        { cat: 'Low Carb', val: 'R$ 24,90', un: 'unidade' },
      ]
    }
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-100 text-[#E60067] rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <Palette className="w-3.5 h-3.5" />
            Brand System Oficial
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Identidade Visual & Configurações</h1>
          <p className="text-gray-600">Guia de aplicação da marca Fit DaLi no sistema e materiais oficiais</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/logo.svg"
            download="fit-dali-logo.svg"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-[#E60067]" />
            Baixar Logo SVG
          </a>
          <a
            href="/logo.png"
            download="fit-dali-logo.png"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Baixar Logo PNG
          </a>
        </div>
      </div>

      {/* Brand Showcase Hero */}
      <div className="bg-gradient-to-r from-pink-50 via-white to-emerald-50 rounded-3xl p-8 border border-pink-100/80 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white rounded-2xl shadow-md border border-pink-100 flex-shrink-0">
              <Logo variant="full" size="lg" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-extrabold text-[#38A149]">Fit</span>
                <span className="text-2xl font-extrabold text-[#E60067]">DaLi</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Marmitas Fitness
                </span>
              </div>
              <p className="text-sm font-medium text-emerald-800 italic mb-3">
                &ldquo;saudável com sabor!&rdquo;
              </p>
              <p className="text-xs text-gray-600 max-w-md">
                Comida de verdade para uma vida mais leve! Equilíbrio, sabor e praticidade em cada refeição.
              </p>
            </div>
          </div>

          {/* Quick Pillars */}
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-xl border border-gray-100 text-xs font-medium text-gray-700">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>Ingredientes Selecionados</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-xl border border-gray-100 text-xs font-medium text-gray-700">
              <Clock className="w-4 h-4 text-[#E60067]" />
              <span>Praticidade no seu dia</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-xl border border-gray-100 text-xs font-medium text-gray-700">
              <Heart className="w-4 h-4 text-red-500" />
              <span>Cuide da sua saúde</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-xl border border-gray-100 text-xs font-medium text-gray-700">
              <Dumbbell className="w-4 h-4 text-purple-600" />
              <span>Mais energia no dia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logos & Assets Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#E60067]" />
          Variações da Logo no Sistema
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Full Logo */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">
                1. Logo Principal (Completa)
              </span>
              <div className="h-32 bg-gray-50/70 rounded-xl flex items-center justify-center p-4 mb-4 border border-dashed border-gray-200">
                <Logo variant="full" size="md" />
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Usada na tela de login, splash screen, cabeçalhos principais e impressões de recibos.
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
              <span className="text-gray-500 font-mono">/logo.svg</span>
              <a href="/logo.svg" target="_blank" className="text-[#E60067] font-semibold hover:underline flex items-center gap-1">
                Visualizar <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 2. Horizontal Navbar Logo */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">
                2. Logo Horizontal (Barra Lateral & Header)
              </span>
              <div className="h-32 bg-gray-50/70 rounded-xl flex items-center justify-center p-4 mb-4 border border-dashed border-gray-200">
                <Logo variant="horizontal" size="md" />
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Otimizada para o topo da barra lateral e cabeçalho responsivo mobile do ERP.
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
              <span className="text-gray-500 font-mono">/logo-icon.svg</span>
              <a href="/logo-icon.svg" target="_blank" className="text-[#E60067] font-semibold hover:underline flex items-center gap-1">
                Visualizar <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 3. Packaging Badge Logo */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">
                3. Selo de Embalagem (Marmitas Fitness)
              </span>
              <div className="h-32 bg-gray-50/70 rounded-xl flex items-center justify-center p-2 mb-4 border border-dashed border-gray-200">
                <Logo variant="packaging" size="sm" />
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Versão impressa nas embalagens: &ldquo;Saúde • Sabor • Praticidade&rdquo; em vermelho carmim.
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
              <span className="text-gray-500 font-mono">/logo-box.svg</span>
              <a href="/logo-box.svg" target="_blank" className="text-[#E60067] font-semibold hover:underline flex items-center gap-1">
                Visualizar <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Official Color Palette */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Palette className="w-5 h-5 text-emerald-600" />
          Paleta de Cores Oficial
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brandColors.map((color) => (
            <div
              key={color.hex}
              className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-start gap-4 hover:border-pink-300 transition-all"
            >
              <div
                className="w-14 h-14 rounded-xl shadow-sm flex-shrink-0 flex items-center justify-center border border-black/5"
                style={{ backgroundColor: color.hex }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{color.name}</h3>
                  <button
                    onClick={() => copyToClipboard(color.hex)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copiar HEX"
                  >
                    {copiedColor === color.hex ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="font-mono text-xs font-semibold text-gray-700">{color.hex}</p>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-tight">{color.use}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Menu Flyer & Packaging Material References */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            Materiais Físicos Oficiais (Fotos & Cardápio)
          </h2>
          <span className="text-xs text-gray-500">Clique para ampliar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cardápio da Semana */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-900">Cardápio da Semana Oficial</span>
              <button
                onClick={() => setPreviewImage('/brand/cardapio-semanal.jpg')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#E60067] hover:underline"
              >
                <Eye className="w-3.5 h-3.5" /> Ampliar
              </button>
            </div>
            <div
              onClick={() => setPreviewImage('/brand/cardapio-semanal.jpg')}
              className="relative aspect-[3/4] max-h-80 w-full rounded-xl overflow-hidden cursor-pointer group bg-gray-100 border border-gray-100"
            >
              <Image
                src="/brand/cardapio-semanal.jpg"
                alt="Cardápio da Semana Oficial Fit DaLi"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-900 shadow">
                  Clique para ver completo
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Arte com todos os pratos (Low Carb, Arroz Branco, Arroz Integral), combos de 10 e 20 unidades e contatos.
            </p>
          </div>

          {/* Embalagem com Logo */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-900">Embalagem Oficial das Marmitas</span>
              <button
                onClick={() => setPreviewImage('/brand/embalagem-fit-dali.jpg')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#E60067] hover:underline"
              >
                <Eye className="w-3.5 h-3.5" /> Ampliar
              </button>
            </div>
            <div
              onClick={() => setPreviewImage('/brand/embalagem-fit-dali.jpg')}
              className="relative aspect-[3/4] max-h-80 w-full rounded-xl overflow-hidden cursor-pointer group bg-gray-100 border border-gray-100"
            >
              <Image
                src="/brand/embalagem-fit-dali.jpg"
                alt="Embalagem Oficial Fit DaLi"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-900 shadow">
                  Clique para ver completo
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Caixa personalizada com logo carmim, selo Marmitas Fitness e etiqueta manuscrita de identificação do prato.
            </p>
          </div>
        </div>
      </div>

      {/* Combos & Pricing Reference Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Tabela Oficial de Combos & Preços</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {combos.map((combo) => (
            <div
              key={combo.name}
              className={`rounded-2xl p-6 border ${combo.color} shadow-sm`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">{combo.name}</h3>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${combo.badgeColor}`}>
                  Cardápio
                </span>
              </div>
              <div className="space-y-3">
                {combo.prices.map((item) => (
                  <div key={item.cat} className="flex items-center justify-between pb-2 border-b border-gray-200/50">
                    <div>
                      <span className="text-sm font-medium text-gray-800 block">{item.cat}</span>
                      <span className="text-[11px] text-gray-500">{item.un}</span>
                    </div>
                    <span className="text-base font-extrabold text-gray-900">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official WhatsApp and Company Data */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Canais Oficiais de Atendimento Fit DaLi</h3>
            <p className="text-sm text-gray-600">Números cadastrados nos panfletos e canais de pedidos via WhatsApp</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://wa.me/5535988323788"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-sm font-semibold transition-colors border border-emerald-200"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              (35) 98832-3788
            </a>
            <a
              href="https://wa.me/5535988511608"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-sm font-semibold transition-colors border border-emerald-200"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              (35) 98851-1608
            </a>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[90vh] w-full h-[85vh] bg-white rounded-3xl overflow-hidden p-2">
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
