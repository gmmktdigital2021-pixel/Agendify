"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/Button";
import { Toast } from "@/components/Toast";

// --- MOCK DATA ---
type AppointmentStatus = "confirmado" | "pendente" | "cancelado" | "concluido";

interface Appointment {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  durationMinutes: number;
  clientName: string;
  serviceName: string;
  status: AppointmentStatus;
}

// Generate base date as today to ensure we see the mock data easily
const today = new Date();
const todayStr = today.toISOString().split("T")[0];

const mockAppointments: Appointment[] = [
  { id: "1", date: todayStr, startTime: "09:00", durationMinutes: 60, clientName: "Maria Silva", serviceName: "Corte", status: "confirmado" },
  { id: "2", date: todayStr, startTime: "10:30", durationMinutes: 90, clientName: "Ana Souza", serviceName: "Progressiva", status: "pendente" },
  { id: "3", date: todayStr, startTime: "14:00", durationMinutes: 30, clientName: "João Pereira", serviceName: "Corte", status: "cancelado" },
  { id: "4", date: todayStr, startTime: "15:00", durationMinutes: 120, clientName: "Carla Mendes", serviceName: "Coloração", status: "concluido" },
  
  // Another day for testing
  { 
    id: "5", 
    date: new Date(today.getTime() + 86400000).toISOString().split("T")[0], 
    startTime: "09:30", durationMinutes: 60, clientName: "Bia Alves", serviceName: "Manicure", status: "confirmado" 
  },
];

const START_HOUR = 9;
const END_HOUR = 18;
const SLOT_DURATION_MIN = 30;
const SLOT_HEIGHT_PX = 64; // h-16 = 4rem = 64px

const timeSlots: string[] = [];
for (let h = START_HOUR; h < END_HOUR; h++) {
  timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
  timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
}

// --- HELPER FUNC ---
const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Window resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const amount = isMobile ? 1 : 7;
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? amount : -amount));
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const daysToRender = useMemo(() => {
    if (isMobile) {
      return [currentDate];
    } else {
      const monday = getMonday(currentDate);
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      });
    }
  }, [currentDate, isMobile]);

  const weekLabel = useMemo(() => {
    if (isMobile) {
      return currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    }
    const start = daysToRender[0];
    const end = daysToRender[daysToRender.length - 1];
    return `Semana de ${start.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})} a ${end.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}`;
  }, [daysToRender, isMobile, currentDate]);

  const showToast = (msg: string) => setToastMsg(msg);

  // Status Colors for the left border
  const statusColors: Record<AppointmentStatus, string> = {
    confirmado: "bg-green-500",
    pendente: "bg-amber-500",
    cancelado: "bg-red-500",
    concluido: "bg-slate-500"
  };

  const getPosAndHeight = (startTime: string, duration: number) => {
    const [h, m] = startTime.split(":").map(Number);
    const startMinutes = (h - START_HOUR) * 60 + m;
    
    // Position = (startMinutes / duration of one slot) * slot height in pixels
    const top = (startMinutes / SLOT_DURATION_MIN) * SLOT_HEIGHT_PX;
    const height = (duration / SLOT_DURATION_MIN) * SLOT_HEIGHT_PX;
    return { top, height };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Agenda</h2>
        
        <div className="flex items-center gap-2 sm:gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <Button variant="ghost" onClick={() => navigateDate('prev')} className="px-2" title="Anterior">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <Button variant="secondary" onClick={goToToday} className="px-4 font-medium text-sm">
            Hoje
          </Button>

          <span className="text-sm font-medium text-slate-700 min-w-[200px] text-center capitalize">
            {weekLabel}
          </span>
          
          <Button variant="ghost" onClick={() => navigateDate('next')} className="px-2" title="Próxima">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Days Header */}
        <div className="flex border-b border-slate-200 bg-white">
          <div className="w-16 sm:w-20 shrink-0 border-r border-slate-200 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-slate-400" />
          </div>
          <div className={`flex-1 grid ${isMobile ? 'grid-cols-1' : 'grid-cols-7'}`}>
            {daysToRender.map((date, i) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
              
              return (
                <div 
                  key={i} 
                  className={`py-3 flex flex-col items-center justify-center border-l first:border-l-0 border-slate-200 
                    ${isToday ? 'bg-brand/10' : ''}`}
                >
                  <span className={`text-xs font-semibold uppercase mb-1 ${isToday ? 'text-brand' : 'text-slate-500'}`}>
                    {dayName}
                  </span>
                  <span className={`text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full 
                    ${isToday ? 'bg-brand text-white' : 'text-slate-800'}`}>
                    {date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Slots Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 relative custom-scrollbar">
          <div className="flex relative" style={{ minHeight: `${timeSlots.length * SLOT_HEIGHT_PX}px` }}>
            
            {/* Time Labels Column */}
            <div className="w-16 sm:w-20 shrink-0 bg-white border-r border-slate-200 sticky left-0 z-20">
              {timeSlots.map((time, i) => (
                <div 
                  key={i} 
                  className="h-16 border-b border-slate-100 flex items-start justify-center pt-2"
                >
                  {time.endsWith("00") && (
                    <span className="text-xs font-medium text-slate-400 -mt-2 bg-white px-1 relative z-10">{time}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Days Columns */}
            <div className={`flex-1 grid ${isMobile ? 'grid-cols-1' : 'grid-cols-7'} relative`}>
              {/* Horizontal grid lines for all columns */}
              <div className="absolute inset-0 pointer-events-none opacity-50 z-0">
                {timeSlots.map((_, i) => (
                  <div key={i} className="h-16 border-b border-slate-200 w-full" />
                ))}
              </div>

              {daysToRender.map((date, colIndex) => {
                const dateStr = date.toISOString().split("T")[0];
                const dayAppointments = mockAppointments.filter(a => a.date === dateStr);

                return (
                  <div key={colIndex} className="relative border-l first:border-l-0 border-slate-200 z-10 p-1">
                    
                    {/* Empty Slots Interactivity */}
                    <div className="absolute inset-0 z-0 flex flex-col">
                      {timeSlots.map((time, i) => (
                        <div 
                          key={i} 
                          className="h-16 w-full cursor-pointer group hover:bg-[#F5F3FF] transition-colors relative"
                          onClick={() => showToast(`Novo agendamento: ${date.toLocaleDateString()} às ${time}`)}
                        >
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Plus className="w-5 h-5 text-brand" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Appointment Cards */}
                    {dayAppointments.map(app => {
                      const { top, height } = getPosAndHeight(app.startTime, app.durationMinutes);
                      const isCanceled = app.status === "cancelado";

                      return (
                        <div
                          key={app.id}
                          onClick={() => showToast(`Editando agendamento: ${app.clientName}`)}
                          className={`absolute left-1 right-2 rounded-lg bg-white overflow-hidden shadow-sm border border-slate-100 cursor-pointer 
                            transition-transform hover:scale-[1.02] hover:shadow-md z-10 flex
                            ${isCanceled ? 'opacity-50 grayscale' : ''}`}
                          style={{
                            top: `${top}px`,
                            height: `${height - 4}px`, // slight gap between adjacent cards
                          }}
                        >
                          <div className={`w-1 shrink-0 ${statusColors[app.status]}`} />
                          <div className="p-2 overflow-hidden w-full flex flex-col">
                            <span className={`text-sm font-bold text-slate-800 truncate ${isCanceled ? 'line-through text-slate-500' : ''}`}>
                              {app.clientName}
                            </span>
                            <span className={`text-xs truncate ${isCanceled ? 'line-through text-slate-400' : 'text-slate-500'}`}>
                              {app.startTime} • {app.serviceName}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {toastMsg && (
         <Toast message={toastMsg} onClose={() => setToastMsg("")} />
      )}
    </div>
  );
}
