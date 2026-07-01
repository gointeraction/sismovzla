import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { VolunteerShift } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalendarDays, Plus, Clock, MapPin, User, Filter } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

export default function VolunteerShiftsModule() {
  const [shifts, setShifts] = useState<VolunteerShift[]>([]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      await addDoc(collection(db, 'volunteer_shifts'), {
        volunteerId: formData.get('volunteerId') as string,
        volunteerName: formData.get('volunteerName') as string,
        shiftType: formData.get('shiftType') as string,
        date: new Date(formData.get('date') as string).getTime(),
        startTime: formData.get('startTime') as string,
        endTime: formData.get('endTime') as string,
        location: formData.get('location') as string,
        role: formData.get('role') as string,
        status: 'Programado',
        reportedBy: 'Anon',
        createdAt: Date.now(),
      });
      setShowForm(false);
      form.reset();
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'volunteer_shifts', id), { status, updatedAt: Date.now() });
  };

  const filteredShifts = shifts.filter(s => filterStatus === 'Todos' || s.status === filterStatus);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Turnos de Voluntarios', 14, 22);
    autoTable(doc, {
      startY: 30,
      head: [['Voluntario', 'Turno', 'Fecha', 'Hora', 'Ubicación', 'Estado']],
      body: filteredShifts.map(s => [
        s.volunteerName,
        s.shiftType,
        new Date(s.date).toLocaleDateString(),
        `${s.startTime} - ${s.endTime}`,
        s.location,
        s.status
      ]),
    });
    doc.save('turnos_voluntarios.pdf');
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Programado': return 'bg-blue-100 text-blue-800';
      case 'En Curso': return 'bg-green-100 text-green-800';
      case 'Completado': return 'bg-gray-100 text-gray-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarDays className="w-5 h-5" /> Turnos de Voluntarios
        </h2>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="px-3 py-1 bg-red-500 text-white rounded text-sm">PDF</button>
          <button onClick={() => setShowForm(true)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Nuevo Turno
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option>Todos</option>
          <option>Programado</option>
          <option>En Curso</option>
          <option>Completado</option>
          <option>Cancelado</option>
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Nuevo Turno</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input name="volunteerName" placeholder="Nombre del voluntario" required className="w-full border rounded px-3 py-2" />
              <input name="volunteerId" placeholder="ID del voluntario" required className="w-full border rounded px-3 py-2" />
              <select name="shiftType" className="w-full border rounded px-3 py-2">
                <option>Mañana</option>
                <option>Tarde</option>
                <option>Noche</option>
                <option>24h</option>
              </select>
              <input name="date" type="date" required className="w-full border rounded px-3 py-2" />
              <div className="grid grid-cols-2 gap-2">
                <input name="startTime" type="time" required className="border rounded px-3 py-2" />
                <input name="endTime" type="time" required className="border rounded px-3 py-2" />
              </div>
              <input name="location" placeholder="Ubicación" required className="w-full border rounded px-3 py-2" />
              <input name="role" placeholder="Rol" required className="w-full border rounded px-3 py-2" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-500 text-white rounded">
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Voluntario</th>
              <th className="text-left p-2">Turno</th>
              <th className="text-left p-2">Fecha</th>
              <th className="text-left p-2">Hora</th>
              <th className="text-left p-2">Ubicación</th>
              <th className="text-left p-2">Estado</th>
              <th className="text-left p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredShifts.map(shift => (
              <tr key={shift.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{shift.volunteerName}</td>
                <td className="p-2">{shift.shiftType}</td>
                <td className="p-2">{new Date(shift.date).toLocaleDateString()}</td>
                <td className="p-2">{shift.startTime} - {shift.endTime}</td>
                <td className="p-2">{shift.location}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${statusColor(shift.status)}`}>
                    {shift.status}
                  </span>
                </td>
                <td className="p-2">
                  <select
                    value={shift.status}
                    onChange={e => updateStatus(shift.id, e.target.value)}
                    className="text-xs border rounded px-1"
                  >
                    <option>Programado</option>
                    <option>En Curso</option>
                    <option>Completado</option>
                    <option>Cancelado</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}