import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { SchoolDamage } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { School, Plus, Filter, MapPin } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

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
        latitude: pos?.lat ?? 0,
        longitude: pos?.lng ?? 0,
        studentCount: parseInt(formData.get('studentCount') as string) || 0,
        structuralStatus: formData.get('structuralStatus') as string,
        damageLevel: formData.get('damageLevel') as string,
        needsAssessment: formData.get('needsAssessment') as string,
        status: 'Registrado',
        reportedBy: 'Anon',
        createdAt: Date.now(),
      });
      setShowForm(false);
      form.reset();
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'school_damage_reports', id), { status, updatedAt: Date.now() });
  };

  const filteredSchools = schools.filter(s => {
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

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Daños Escolares', 14, 22);
    doc.setFontSize(12);
    doc.text(`Total: ${stats.total} | Operativos: ${stats.operational} | Parciales: ${stats.partial} | No Operativos: ${stats.nonOperational} | Colapsados: ${stats.collapsed}`, 14, 30);
    doc.text(`Total Estudiantes: ${stats.totalStudents}`, 14, 36);
    autoTable(doc, {
      startY: 44,
      head: [['Escuela', 'Tipo', 'Estado', 'Daño', 'Estudiantes', 'Status']],
      body: filteredSchools.map(s => [
        s.schoolName,
        s.schoolType,
        s.structuralStatus,
        s.damageLevel,
        s.studentCount.toString(),
        s.status
      ]),
    });
    doc.save('danos_escolares.pdf');
  };

  const damageColor = (level: string) => {
    switch (level) {
      case 'Ninguno': return 'bg-green-100 text-green-800';
      case 'Leve': return 'bg-yellow-100 text-yellow-800';
      case 'Moderado': return 'bg-orange-100 text-orange-800';
      case 'Severo': return 'bg-red-100 text-red-800';
      case 'Colapso': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <School className="w-5 h-5" /> Educación y Escuelas
        </h2>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="px-3 py-1 bg-red-500 text-white rounded text-sm">PDF</button>
          <button onClick={() => setShowForm(true)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Reportar Escuela
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
        <div className="bg-white p-3 rounded border text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="bg-green-50 p-3 rounded border text-center">
          <div className="text-2xl font-bold text-green-600">{stats.operational}</div>
          <div className="text-xs text-gray-500">Operativos</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded border text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.partial}</div>
          <div className="text-xs text-gray-500">Parciales</div>
        </div>
        <div className="bg-red-50 p-3 rounded border text-center">
          <div className="text-2xl font-bold text-red-600">{stats.nonOperational}</div>
          <div className="text-xs text-gray-500">No Operativos</div>
        </div>
        <div className="bg-red-100 p-3 rounded border text-center">
          <div className="text-2xl font-bold text-red-800">{stats.collapsed}</div>
          <div className="text-xs text-gray-500">Colapsados</div>
        </div>
        <div className="bg-blue-50 p-3 rounded border text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalStudents.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Estudiantes</div>
        </div>
      </div>

      <div className="flex gap-2">
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option>Todos</option>
          <option>Urbana</option>
          <option>Rural</option>
          <option>Privada</option>
          <option>Bolivariana</option>
          <option>Liceo</option>
          <option>Universidad</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option>Todos</option>
          <option>Registrado</option>
          <option>Evaluado</option>
          <option>En Reparación</option>
          <option>Operativo</option>
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Reportar Escuela</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input name="schoolName" placeholder="Nombre de la escuela" required className="w-full border rounded px-3 py-2" />
              <select name="schoolType" className="w-full border rounded px-3 py-2">
                <option>Urbana</option>
                <option>Rural</option>
                <option>Privada</option>
                <option>Bolivariana</option>
                <option>Liceo</option>
                <option>Universidad</option>
              </select>
              <select name="state" className="w-full border rounded px-3 py-2">
                <option>Caracas</option>
                <option>La Guaira</option>
                <option>Aragua</option>
                <option>Carabobo</option>
                <option>Otros</option>
              </select>
              <input name="address" placeholder="Dirección" required className="w-full border rounded px-3 py-2" />
              <input name="studentCount" type="number" placeholder="Número de estudiantes" required className="w-full border rounded px-3 py-2" />
              <select name="structuralStatus" className="w-full border rounded px-3 py-2">
                <option>Operativo</option>
                <option>Parcial</option>
                <option>No Operativo</option>
                <option>Colapsado</option>
              </select>
              <select name="damageLevel" className="w-full border rounded px-3 py-2">
                <option>Ninguno</option>
                <option>Leve</option>
                <option>Moderado</option>
                <option>Severo</option>
                <option>Colapso</option>
              </select>
              <textarea name="needsAssessment" placeholder="Evaluación de necesidades" className="w-full border rounded px-3 py-2" />
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
              <th className="text-left p-2">Escuela</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Estado</th>
              <th className="text-left p-2">Daño</th>
              <th className="text-left p-2">Estudiantes</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchools.map(school => (
              <tr key={school.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{school.schoolName}</td>
                <td className="p-2">{school.schoolType}</td>
                <td className="p-2">{school.structuralStatus}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${damageColor(school.damageLevel)}`}>
                    {school.damageLevel}
                  </span>
                </td>
                <td className="p-2">{school.studentCount}</td>
                <td className="p-2">{school.status}</td>
                <td className="p-2">
                  <select
                    value={school.status}
                    onChange={e => updateStatus(school.id, e.target.value)}
                    className="text-xs border rounded px-1"
                  >
                    <option>Registrado</option>
                    <option>Evaluado</option>
                    <option>En Reparación</option>
                    <option>Operativo</option>
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