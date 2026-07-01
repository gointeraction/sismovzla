import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { VolunteerShift, VolunteerRegistry } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalendarDays, Plus, Download, X, Clock, MapPin } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

const STATUS_COLORS: Record<string, string> = {
  Programado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'En Curso': 'bg-green-500/20 text-green-400 border-green-500/30',
  Completado: 'bg-white/10 text-white/40 border-white/20',
  Cancelado: 'bg-red-500/20 text-red-400 border-red-500/30',
  'No Asistió': 'bg-red-600/20 text-red-400 border-red-600/30',
};

export default function VolunteerShiftsModule() {
  const [shifts, setShifts] = useState<VolunteerShift[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerRegistry[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const { getPosition } = useGeolocation();

  useEffect(() => {
    const q = query(collection(db, 'volunteer_shifts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setShifts(snap.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerShift)));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'volunteers_registry'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setVolunteers(snap.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerRegistry)));
    });
    return unsub;
  }, []);

  const filtered = shifts.filter(s => filterStatus === 'Todos' || s.status === filterStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const volId = formData.get('volunteerId') as string;
      const vol = volunteers.find(v => v.id === volId);
      await addDoc(collection(db, 'volunteer_shifts'), {
        volunteerId: volId,
        volunteerName: vol ? vol.fullName : formData.get('volunteerName') as string,
        shiftType: formData.get('shiftType') as string,
        date: new Date(formData.get('date') as string).getTime(),
        startTime: formData.get('startTime') as string,
        endTime: formData.get('endTime') as string,
        location: formData.get('location') as string,
        role: formData.get('role') as string,
        status: 'Programado',
        reportedBy: auth.currentUser?.email || auth.currentUser?.uid || 'Anon',
        createdAt: Date.now(),
      });
      setShowForm(false);
      setSelectedVolunteer('');
      form.reset();
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'volunteer_shifts', id), { status, updatedAt: Date.now() });
  };

  const exportPDF = () => {
    const docPdf = new jsPDF();
    docPdf.setFontSize(18); docPdf.setTextColor(211, 47, 47);
    docPdf.text('Turnos de Voluntarios - SismoVZLA', 14, 22);
    docPdf.setFontSize(10); docPdf.setTextColor(100);
    docPdf.text(`Fecha: ${new Date().toLocaleDateString('es-VE')}`, 14, 30);
    autoTable(docPdf, {
      startY: 35,
      head: [['Voluntario', 'Turno', 'Fecha', 'Hora', 'Ubicacion', 'Estado']],
      body: filtered.map(s => [s.volunteerName, s.shiftType, new Date(s.date).toLocaleDateString('es-VE'), `${s.startTime} - ${s.endTime}`, s.location, s.status]),
      theme: 'grid', headStyles: { fillColor: [211, 47, 47] },
    });
    docPdf.save('turnos_voluntarios.pdf');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-400" />
          <h2 className="font-mono font-bold text-white text-sm uppercase tracking-wider">Turnos de Voluntarios</h2>
          <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">{filtered.length} turnos</span>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg font-mono text-[10px] border border-white/10 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-[10px] font-bold cursor-pointer">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {showForm ? 'CANCELAR' : 'NUEVO TURNO'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['Todos', 'Programado', 'En Curso', 'Completado', 'Cancelado'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold border cursor-pointer ${filterStatus === s ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}>
            {s}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase block mb-1">Seleccionar Voluntario</label>
              <select name="volunteerId" value={selectedVolunteer} onChange={e => setSelectedVolunteer(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" required>
                <option value="">-- Seleccionar voluntario registrado --</option>
                {volunteers.filter(v => v.status === 'Registrado' || v.status === 'En Campo').map(v => (
                  <option key={v.id} value={v.id}>{v.fullName} (CI: {v.ci}) — {v.availability}</option>
                ))}
              </select>
              {selectedVolunteer && (
                <input type="hidden" name="volunteerName" value={volunteers.find(v => v.id === selectedVolunteer)?.fullName || ''} />
              )}
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase block mb-1">O ingresar manualmente</label>
              <input name="volunteerName" placeholder="Nombre del voluntario" required
                disabled={!!selectedVolunteer}
                value={selectedVolunteer ? volunteers.find(v => v.id === selectedVolunteer)?.fullName || '' : ''}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono disabled:opacity-40" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <select name="shiftType" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              <option>Mañana</option><option>Tarde</option><option>Noche</option><option>24h</option>
            </select>
            <input name="date" type="date" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input name="startTime" type="time" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input name="endTime" type="time" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="location" placeholder="Ubicacion" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input name="role" placeholder="Rol" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          </div>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-bold disabled:opacity-50 cursor-pointer">
            {submitting ? 'CREANDO...' : 'CREAR TURNO'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Voluntario</th>
              <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Turno</th>
              <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Fecha</th>
              <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Hora</th>
              <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Ubicacion</th>
              <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Estado</th>
              <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(shift => (
              <tr key={shift.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-2 text-white text-xs font-mono">{shift.volunteerName}</td>
                <td className="p-2 text-white/70 text-xs font-mono">{shift.shiftType}</td>
                <td className="p-2 text-white/70 text-xs font-mono">{new Date(shift.date).toLocaleDateString('es-VE')}</td>
                <td className="p-2 text-white/50 text-[10px] font-mono flex items-center gap-1"><Clock className="w-3 h-3" />{shift.startTime} - {shift.endTime}</td>
                <td className="p-2 text-white/50 text-[10px] font-mono flex items-center gap-1"><MapPin className="w-3 h-3" />{shift.location}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${STATUS_COLORS[shift.status] || ''}`}>{shift.status}</span>
                </td>
                <td className="p-2">
                  <select value={shift.status} onChange={e => updateStatus(shift.id, e.target.value)}
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-white cursor-pointer">
                    <option>Programado</option><option>En Curso</option><option>Completado</option><option>Cancelado</option><option>No Asistió</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="text-center text-white/30 text-xs font-mono py-8">No hay turnos registrados</p>}
    </div>
  );
}