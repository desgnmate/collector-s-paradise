'use client';

import React, { useState } from 'react';
import { 
  TransformWrapper, 
  TransformComponent, 
  useControls 
} from 'react-zoom-pan-pinch';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Search, ZoomIn, ZoomOut, Maximize, User, Info, MapPin, MousePointer2, Move } from 'lucide-react';
import { MOCK_MAP_DATA, Booth } from '@/data/mapData';
import floorplan from '@/public/images/pokemon_floorplan.png';

interface VendorMapProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
}

// Unified Centered Control Hub
const MapControlHub = ({ onClose }: { onClose: () => void }) => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center gap-4 w-full px-4 pointer-events-none">
      <div className="flex flex-wrap items-center justify-center gap-6 bg-[#F3EFE6] border-4 border-[#2E2E2E] shadow-[6px_6px_0px_#2E2E2E] p-4 pointer-events-auto">
        {/* Navigation Tools */}
        <div className="flex items-center gap-1 border-r-4 border-[#2E2E2E] pr-6 mr-2">
          <button 
            onClick={() => zoomIn()} 
            className="p-3 hover:bg-[#F4C542] transition-colors text-[#2E2E2E] active:translate-y-0.5"
            title="Zoom In"
          >
            <ZoomIn size={22} strokeWidth={3} />
          </button>
          <button 
            onClick={() => zoomOut()} 
            className="p-3 hover:bg-[#F4C542] transition-colors text-[#2E2E2E] active:translate-y-0.5"
            title="Zoom Out"
          >
            <ZoomOut size={22} strokeWidth={3} />
          </button>
          <button 
            onClick={() => resetTransform()} 
            className="p-3 hover:bg-[#F4C542] transition-colors text-[#2E2E2E] active:translate-y-0.5"
            title="Reset"
          >
            <Maximize size={22} strokeWidth={3} />
          </button>
        </div>

        {/* Zone Legend (Horizontal) */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-[#5C8FC9] border-2 border-[#2E2E2E] shadow-[2px_2px_0px_#2E2E2E]" />
            <span className="text-[10px] text-[#2E2E2E] font-black tracking-widest uppercase italic leading-none">TCG HUB</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-[#D94B4B] border-2 border-[#2E2E2E] shadow-[2px_2px_0px_#2E2E2E]" />
            <span className="text-[10px] text-[#2E2E2E] font-black tracking-widest uppercase italic leading-none">STAGE</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-[#3D7DCA] border-2 border-[#2E2E2E] shadow-[2px_2px_0px_#2E2E2E]" />
            <span className="text-[10px] text-[#2E2E2E] font-black tracking-widest uppercase italic leading-none">FOOD</span>
          </div>
        </div>

        {/* Interaction Guide */}
        <div className="hidden lg:flex items-center gap-4 pl-6 border-l-4 border-[#2E2E2E]">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-[#F4C542]" />
            <span className="text-[9px] text-[#2E2E2E]/40 font-black uppercase tracking-[0.2em] italic">DRAG·PAN / CLICK·INFO</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function VendorMap({ isOpen, onClose, eventTitle }: VendorMapProps) {
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-[#000000]/95 backdrop-blur-sm flex flex-col overflow-hidden select-none"
      >
        {/* --- FIXED HEADER --- */}
        <header className="h-24 grid grid-cols-[1fr_auto_1fr] items-center px-12 border-b-[6px] border-[#2E2E2E] bg-[#F3EFE6] z-[11000] shrink-0">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.4em] text-[#5C8FC9] font-black mb-1">Live Floor Plan</span>
            <h2 className="text-[#2E2E2E] text-2xl font-black uppercase tracking-tighter italic leading-none">
              {eventTitle}
            </h2>
          </div>

          <div className="hidden lg:flex items-center gap-4 px-8 py-3 bg-white border-4 border-[#2E2E2E] shadow-[4px_4px_0px_#2E2E2E] w-[450px]">
            <Search size={20} className="text-[#2E2E2E]/30" />
            <input 
              type="text" 
              placeholder="SEARCH VENDORS..." 
              className="bg-transparent border-none text-xs text-[#2E2E2E] font-black tracking-widest placeholder:text-[#2E2E2E]/20 focus:ring-0 w-full uppercase"
            />
          </div>

          <div className="flex justify-end items-center">
            <button 
              onClick={onClose}
              className="btn btn-white !bg-white group"
            >
              <span className="text-sm font-black">Close Explorer</span>
              <X size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </header>

        {/* --- MAIN INTERACTIVE CONTAINER --- */}
        <div className="flex-1 relative overflow-hidden flex">
          {/* Map Section with NEW GRAY CANVAS */}
          <div className="flex-1 relative bg-neutral-900 shadow-inner">
            <TransformWrapper
              initialScale={0.7}
              minScale={0.4}
              maxScale={3}
              centerOnInit
              wheel={{ disabled: true }}
              doubleClick={{ disabled: true }}
            >
              {() => (
                <>
                  <TransformComponent wrapperClass="!w-full !h-full" contentClass="flex items-center justify-center p-40">
                    <div 
                      className="relative bg-[#2E2E2E] overflow-hidden border-[8px] border-[#2E2E2E] shadow-[30px_30px_0px_#2E2E2E]"
                      style={{ 
                        width: MOCK_MAP_DATA.width, 
                        height: MOCK_MAP_DATA.height,
                      }}
                    >
                      {/* Base Map Image */}
                      <Image src={floorplan} alt="Event Floor Plan" loading="lazy" className="object-cover opacity-80" />

                      {/* Interactive Booths */}
                      {MOCK_MAP_DATA.booths.map((booth) => (
                        <button
                          key={booth.id}
                          onClick={() => setSelectedBooth(booth)}
                          className={`absolute group transition-all border-4 
                            ${selectedBooth?.id === booth.id 
                              ? 'border-[#F4C542] bg-[#F4C542]/20 scale-110 z-50 shadow-[8px_8px_0px_#2E2E2E]' 
                              : 'border-white/10 bg-white/5 hover:border-[#F4C542] hover:bg-[#F4C542]/10 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_#2E2E2E]'}`}
                          style={{
                            left: booth.position.x,
                            top: booth.position.y,
                            width: booth.size.width,
                            height: booth.size.height,
                          }}
                        >
                          {/* Hover Tooltip (Centered) */}
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-white border-4 border-[#2E2E2E] shadow-[4px_4px_0px_#2E2E2E] text-[10px] font-black text-[#2E2E2E] whitespace-nowrap pointer-events-none transition-all uppercase tracking-widest z-[150]">
                            {booth.vendorName}
                          </div>
                        </button>
                      ))}
                    </div>
                  </TransformComponent>
                  
                  {/* CENTRED CONTROL HUB */}
                  <MapControlHub onClose={onClose} />
                </>
              )}
            </TransformWrapper>
          </div>

          {/* --- SIDEBAR VENDOR PANEL --- */}
          <AnimatePresence>
            {selectedBooth && (
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 40, stiffness: 400 }}
                className="w-[450px] bg-[#F3EFE6] border-l-[6px] border-[#2E2E2E] z-[12000] flex flex-col shadow-[-40px_0_100px_rgba(0,0,0,0.5)]"
              >
                {/* Hero Header */}
                <div className="relative h-64 border-b-[6px] border-[#2E2E2E] overflow-hidden group shrink-0">
                  <div className={`absolute inset-0 transition-transform duration-1000 group-hover:scale-110
                    ${selectedBooth.category === 'tcg' ? 'bg-[#5C8FC9]' : 
                      selectedBooth.category === 'stage' ? 'bg-[#D94B4B]' :
                      selectedBooth.category === 'food' ? 'bg-[#3D7DCA]' :
                      'bg-[#2E2E2E]'}`} 
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User size={140} className="text-white/10" />
                  </div>
                  
                  <button 
                    onClick={() => setSelectedBooth(null)}
                    className="absolute top-10 right-10 p-3 bg-white border-4 border-[#2E2E2E] shadow-[4px_4px_0px_#2E2E2E] transition-all hover:bg-[#F4C542] hover:-translate-y-1 hover:-translate-x-1 active:shadow-none"
                  >
                    <X size={24} strokeWidth={3} />
                  </button>

                  <div className="absolute bottom-10 left-10">
                    <div className="flex gap-2 mb-4">
                      <span className="px-3 py-1 bg-white border-2 border-[#2E2E2E] text-[10px] font-black uppercase tracking-[0.2em] text-[#2E2E2E]">
                        {selectedBooth.category}
                      </span>
                      {selectedBooth.isPremium && (
                        <span className="px-3 py-1 bg-[#F4C542] border-2 border-[#2E2E2E] text-[10px] font-black uppercase tracking-[0.2em] text-[#2E2E2E]">
                          ULTIMATE VENDOR
                        </span>
                      )}
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                      {selectedBooth.vendorName}
                    </h3>
                  </div>
                </div>

                <div className="p-12 flex-1 flex flex-col gap-10 overflow-auto">
                  <div className="flex items-center gap-6 p-6 bg-white border-4 border-[#2E2E2E] shadow-[8px_8px_0px_#2E2E2E]">
                    <div className="p-4 bg-[#F4C542] border-2 border-[#2E2E2E]">
                      <MapPin size={32} strokeWidth={3} />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#2E2E2E]/40 font-black uppercase tracking-[0.3em] block mb-1">Access Point</span>
                      <span className="block text-lg font-black text-[#2E2E2E] tracking-widest uppercase italic">AREA {selectedBooth.id}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <span className="text-[11px] text-[#5C8FC9] font-black uppercase tracking-[0.4em] italic leading-none">Intel Description</span>
                    <p className="text-base text-[#2E2E2E] font-extrabold leading-relaxed uppercase tracking-tight">
                      {selectedBooth.description || "INVESTIGATE ON-SITE FOR EXCLUSIVE EVENT REWARDS AND COLLECTIONS."}
                    </p>
                  </div>

                  <div className="mt-auto">
                    <button className="btn btn-primary w-full py-6 text-base !font-black !rounded-none">
                      ADD TO EXPLORATION LIST
                    </button>
                    <p className="mt-4 text-center text-[9px] text-[#2E2E2E]/40 font-black uppercase tracking-[0.5em]">Intel Recorded 2026</p>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
