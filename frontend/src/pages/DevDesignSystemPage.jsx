import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  Input,
  Textarea,
  Select,
  Badge,
  Modal,
  HeroBanner,
  PageBanner
} from '../components';
import { Icon, MaterialIcon, DUO_VECTOR_CATALOG } from '../utils/icons';
import { MADANI_SENTRA_COLOR_PALETTE } from '../data/palette';

export const DevDesignSystemPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#0EA5E9');

  return (
    <div className="min-h-screen bg-white p-6 sm:p-10 lg:p-12 max-w-7xl mx-auto space-y-12">
      {/* Dev Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-[#E5E5E5]">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#D97706] bg-[#FFF5D6] px-3 py-1 rounded-lg border border-[#FFC800] inline-block mb-2">
            DEV-ONLY INSPECTION PAGE
          </span>
          <h1 className="font-duo-display text-3xl sm:text-4xl font-bold text-[#4B4B4B]">
            DuniaMadani Unified Design System
          </h1>
          <p className="text-sm font-extrabold text-[#777777] mt-1">
            Katalog token desain, ukuran baku komponen, palet warna Al Madani, dan status interaksi UI.
          </p>
        </div>
        <Link to="/">
          <Button size="sm" variant="outline" icon={<MaterialIcon name="arrow_back" className="text-base" />}>
            Kembali ke Beranda
          </Button>
        </Link>
      </div>

      {/* 1. SEKSI BUTTON DESIGN SYSTEM (3 UKURAN BAKU) */}
      <section className="space-y-6">
        <h2 className="font-duo-display text-2xl font-bold text-[#334155] flex items-center gap-2.5">
          <MaterialIcon name="smart_button" className="text-3xl text-[#FFC800]" />
          <span>1. Standarisasi Komponen Button (3 Ukuran Baku)</span>
        </h2>
        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#64748B] mb-3">
              A. Tiga Ukuran Baku Berdasarkan Tinggi (Height)
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm" variant="primary">
                Button Small (h: 36px)
              </Button>
              <Button size="md" variant="primary">
                Button Medium (h: 44px - Standar)
              </Button>
              <Button size="lg" variant="primary">
                Button Large (h: 54px - Hero/Kuis)
              </Button>
            </div>
            <p className="text-xs font-extrabold text-[#94A3B8] mt-2">
              * Lebar bersifat dinamis mengikuti panjang teks/ikon, atau gunakan prop <code>fullWidth=true</code>.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#64748B] mb-3">
              B. Seluruh Varian Warna 3D Tactile
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="md" variant="primary">Primary (Yellow)</Button>
              <Button size="md" variant="secondary">Secondary (Emerald)</Button>
              <Button size="md" variant="blue">Blue / Sky</Button>
              <Button size="md" variant="purple">Purple</Button>
              <Button size="md" variant="danger">Danger (Red)</Button>
              <Button size="md" variant="outline">Outline</Button>
              <Button size="md" variant="white">White</Button>
              <Button
                size="md"
                variant="theme-white"
                themeColor="#10B981"
                themeLip="#059669"
              >
                Theme White (Dynamic)
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#64748B] mb-3">
              C. Status Interaksi (UI States)
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="md" variant="primary">Default State</Button>
              <Button size="md" variant="primary" disabled>Disabled State</Button>
              <Button size="md" variant="primary" loading>Loading State</Button>
              <Button
                size="md"
                variant="secondary"
                icon={<MaterialIcon name="play_arrow" className="text-lg" />}
                iconRight={<MaterialIcon name="arrow_forward" className="text-lg" />}
              >
                Dengan Ikon Kiri & Kanan
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* 2. SEKSI PALET WARNA RESMI */}
      <section className="space-y-6">
        <h2 className="font-duo-display text-2xl font-bold text-[#334155] flex items-center gap-2.5">
          <MaterialIcon name="palette" className="text-3xl text-[#10B981]" />
          <span>2. Palet Warna Harmoni Tema Al Madani</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {MADANI_SENTRA_COLOR_PALETTE.map((c) => (
            <div
              key={c.hex}
              onClick={() => setSelectedColor(c.hex)}
              className="duo-card p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:scale-105 transition-transform"
              style={{
                borderColor: c.hex,
                boxShadow: `0 4px 0 0 ${c.lip}`
              }}
            >
              <div
                className="w-full h-16 rounded-xl mb-3 flex items-center justify-center shadow-xs"
                style={{ backgroundColor: c.hex }}
              >
                <span className="text-white text-xs font-black drop-shadow">{c.hex}</span>
              </div>
              <div>
                <p className="font-duo-display text-sm font-bold text-[#334155] line-clamp-2">
                  {c.name}
                </p>
                <p className="text-[11px] font-mono font-bold text-[#94A3B8] mt-1">
                  Lip: {c.lip}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SEKSI FORM INPUTS */}
      <section className="space-y-6">
        <h2 className="font-duo-display text-2xl font-bold text-[#334155] flex items-center gap-2.5">
          <MaterialIcon name="edit_note" className="text-3xl text-[#0EA5E9]" />
          <span>3. Komponen Formulir (Input, Textarea, Select)</span>
        </h2>
        <Card className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Input Standar"
            id="demo-input-1"
            placeholder="Ketik teks di sini..."
          />
          <Input
            label="Input Wajib Diisi"
            id="demo-input-2"
            required
            placeholder="Field wajib bertanda bintang"
          />
          <Input
            label="Input Status Error"
            id="demo-input-3"
            value="Data tidak sesuai"
            error="Format email / input belum tepat"
          />
          <Select
            label="Select Dropdown"
            id="demo-select-1"
            options={[
              { value: '1', label: 'Pilihan Pertama' },
              { value: '2', label: 'Pilihan Kedua' }
            ]}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Textarea Multiline"
              id="demo-textarea-1"
              rows={2}
              placeholder="Tuliskan deskripsi lengkap..."
            />
          </div>
        </Card>
      </section>

      {/* 4. SEKSI MODAL & BADGE */}
      <section className="space-y-6">
        <h2 className="font-duo-display text-2xl font-bold text-[#334155] flex items-center gap-2.5">
          <MaterialIcon name="chat" className="text-3xl text-[#A855F7]" />
          <span>4. Komponen Dialog & Badge</span>
        </h2>
        <Card className="p-6 sm:p-8 flex flex-wrap items-center gap-4">
          <Button size="md" variant="purple" onClick={() => setIsModalOpen(true)}>
            Buka Modal Pratinjau
          </Button>

          <Badge variant="yellow">Status Pending</Badge>
          <Badge variant="emerald">PUBLISHED</Badge>
          <Badge variant="sky">TEMA PROFESI</Badge>
          <Badge variant="purple">EPISODE 1</Badge>
          <Badge variant="red">DRAFT</Badge>
          <Badge variant="gray">OFFLINE</Badge>
        </Card>
      </section>

      {/* 5. SEKSI KATALOG IKON SVG RESMI */}
      <section className="space-y-6">
        <h2 className="font-duo-display text-2xl font-bold text-[#334155] flex items-center gap-2.5">
          <MaterialIcon name="military_tech" className="text-3xl text-[#F97316]" />
          <span>5. Katalog Ikon Vektor SVG (Tanpa Emoji Mentah)</span>
        </h2>
        <Card className="p-6 sm:p-8">
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-4 text-center">
            {DUO_VECTOR_CATALOG.map((item) => (
              <div
                key={item.key}
                className="p-3 rounded-2xl bg-[#F8FAFC] border-2 border-[#E2E8F0] flex flex-col items-center gap-2 hover:border-[#0EA5E9] transition"
              >
                <Icon name={item.key} className="w-12 h-12" />
                <span className="text-[11px] font-extrabold text-[#64748B] truncate max-w-full">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* 6. SEKSI BANNER */}
      <section className="space-y-6">
        <h2 className="font-duo-display text-2xl font-bold text-[#334155] flex items-center gap-2.5">
          <MaterialIcon name="campaign" className="text-3xl text-[#FFC800]" />
          <span>6. Pratinjau Banner Beranda & Banner Halaman</span>
        </h2>
        <HeroBanner />
        <PageBanner
          title="Pratinjau Banner Tema Pembelajaran"
          subtitle="Banner ini otomatis beradaptasi dengan warna asli tema pilihan guru!"
          categoryLabel="BAGIAN 1 • TEMA PROFESI"
          iconName="police"
          color={selectedColor}
        />
      </section>

      {/* Modal Dialog Showcase */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Contoh Dialog Modal Interaktif"
      >
        <p className="text-sm font-extrabold text-[#64748B] leading-relaxed mb-6">
          Modal ini dirancang dengan backdrop blur, animasi pop-in Duolingo yang halus,
          serta dapat ditutup dengan menekan tombol Escape atau tombol silang.
        </p>
        <div className="flex justify-end gap-3 pt-3 border-t-2 border-[#E2E8F0]">
          <Button size="md" variant="outline" onClick={() => setIsModalOpen(false)}>
            Batal
          </Button>
          <Button size="md" variant="secondary" onClick={() => setIsModalOpen(false)}>
            Mengerti
          </Button>
        </div>
      </Modal>
    </div>
  );
};
