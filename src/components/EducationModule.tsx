import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { SchoolDamage } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { School, Plus, Download, X } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

const DAMAGE_COLORS: Record<string, string> = {
  Ninguno: 'bg-green-500/20 text-green-400 border-green-500/30',
  Leve: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Moderado: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Severo: 'bg-red-500/20 text-red-400 border-red-500/30',
  Colapso: 'bg-red-600/30 text-red-300 border-red-600/40',
};

export default function EducationModule() {
  const [schools, setSchools] = useState<SchoolDamage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<string>('Todos');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const { getPosition } = useGeolocation();

  useEffect(() => {
    const q = query(collection(db, 'school_damage_reports'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setSchools(snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolDamage)));
    });
    return unsub;
  }, []);

  const filtered = schools.filter(s => {
    if (filterType !== 'Todos' && s.schoolType !== filterType) return false;
    if (filterStatus !== 'Todos' && s.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: schools.length,
    operational: schools.filter(s => s.structuralStatus === 'Operativo').length,
    partial: schools.filter(s => s.structuralStatus === 'Parcial').length,
    nonOperational: schools.filter(s => s.structuralStatus === 'No Operativo').length,
    collapsed: schools.filter(s => s.structuralStatus === 'Colapsado').length,
    totalStudents: schools.reduce((sum, s) => sum + s.studentCount, 0),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const pos = await getPosition();
      await addDoc(collection(db, 'school_damage_reports'), {
        schoolName: formData.get('schoolName') as string,
        schoolType: formData.get('schoolType') as string,
        state: formData.get('state') as string,
        address: formData.get('address') as string,
        latitude: pos?.lat ?? 0, longitude: pos?.lng ?? 0,
        studentCount: parseInt(formData.get('studentCount') as string) || 0,
        structuralStatus: formData.get('structuralStatus') as string,
        damageLevel: formData.get('damageLevel') as string,
        needsAssessment: formData.get('needsAssessment') as string,
        status: 'Registrado', reportedBy: 'Anon', createdAt: Date.now(),
      });
      setShowForm(false); form.reset();
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'school_damage_reports', id), { status, updatedAt: Date.now() });
  };

  const exportPDF = () => {
    const docPdf = new jsPDF();
    docPdf.setFontSize(18); docPdf.setTextColor(211, 47, 47);
    docPdf.text('Reporte de Danos Escolares - SismoVZLA', 14, 22);
    docPdf.setFontSize(10); docPdf.setTextColor(100);
    docPdf.text(`Fecha: ${new Date().toLocaleDateString('es-VE')} | Total: ${stats.total} | Estudiantes: ${stats.totalStudents}`, 14, 30);
    autoTable(docPdf, {
      startY: 35,
      head: [['Escuela', 'Tipo', 'Estado', 'Dano', 'Estudiantes', 'Status']],
      body: filtered.map(s => [s.schoolName, s.schoolType, s.structuralStatus, s.damageLevel, s.studentCount.toString(), s.status]),
      theme: 'grid', headStyles: { fillColor: [211, 47, 47] },
    });
    docPdf.save('danos_escolares.pdf');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <School className="w-5 h-5 text-violet-400" />
          <h2 className="font-mono font-bold text-white text-sm uppercase tracking-wider">Educacion y Escuelas</h2>
          <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">{stats.total} escuelas</span>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg font-mono text-[10px] border border-white/10 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-mono text-[10px] font-bold cursor-pointer">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {showForm ? 'CANCELAR' : 'REPORTAR ESCUELA'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Operativos', value: stats.operational, color: 'text-green-400' },
          { label: 'Parciales', value: stats.partial, color: 'text-yellow-400' },
          { label: 'No Operativos', value: stats.nonOperational, color: 'text-red-400' },
          { label: 'Colapsados', value: stats.collapsed, color: 'text-red-300' },
          { label: 'Estudiantes', value: stats.totalStudents.toLocaleString(), color: 'text-blue-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <div className={`text-xl font-mono font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[9px] font-mono text-white/40 uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-[10px] font-mono cursor-pointer">
          <option value="Todos">Todos los tipos</option>
          <option>Urbana</option><option>Rural</option><option>Privada</option><option>Bolivariana</option><option>Liceo</option><option>Universidad</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-[10px] font-mono cursor-pointer">
          <option value="Todos">Todos los estados</option>
          <option>Registrado</option><option>Evaluado</option><option>En Reparacion</option><option>Operativo</option>
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input name="schoolName" placeholder="Nombre de la escuela" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <select name="schoolType" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              <option>Urbana</option><option>Rural</option><option>Privada</option><option>Bolivariana</option><option>Liceo</option><option>Universidad</option>
            </select>
            <select name="state" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              <option>Caracas</option><option>La Guaira</option><option>Aragua</option><option>Carabobo</option><option>Otros</option>
            </select>
            <input name="studentCount" type="number" placeholder="Estudiantes" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <select name="structuralStatus" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              <option>Operativo</option><option>Parcial</option><option>No Operativo</option><option>Colapsado</option>
            </select>
            <select name="damageLevel" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              <option>Ninguno</option><option>Leve</option><option>Moderado</option><option>Severo</option><option>Colapso</option>
            </select>
          </div>
          <textarea name="needsAssessment" placeholder="Evaluacion de necesidades" rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-mono text-xs font-bold disabled:opacity-50 cursor-pointer">
            {submitting ? 'REGISTRANDO...' : 'REGISTRAR ESCUELA'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Escuela</th>
              <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Tipo</th>
              <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Estado</th>
              <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Dano</th>
              <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Estudiantes</th>
              <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Status</th>
              <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(school => (
              <tr key={school.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-2 text-white text-xs font-mono">{school.schoolName}</td>
                <td className="p-2 text-white/70 text-xs font-mono">{school.schoolType}</td>
                <td className="p-2 text-white/50 text-xs font-mono">{school.structuralStatus}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${DAMAGE_COLORS[school.damageLevel] || ''}`}>{school.damageLevel}</span>
                </td>
                <td className="p-2 text-white/70 text-xs font-mono">{school.studentCount}</td>
                <td className="p-2 text-white/50 text-xs font-mono">{school.status}</td>
                <td className="p-2">
                  <select value={school.status} onChange={e => updateStatus(school.id, e.target.value)}
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-white cursor-pointer">
                    <option>Registrado</option><option>Evaluado</option><option>En Reparacion</option><option>Operativo</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="text-center text-white/30 text-xs font-mono py-8">No hay escuelas registradas</p>}
    </div>
  );
}