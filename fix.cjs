const fs = require('fs');

let c = fs.readFileSync('src/components/ReportsConsoleModule.tsx', 'utf8');

// Eliminar primer exportActiveOccupantsPdf duplicado
const occP1 = c.indexOf('// --- REPORT N° 9: REPORTE DE PERSONAS ACTIVAMENTE ALBERGADAS');
const occP2 = c.lastIndexOf('// --- REPORT N° 9: REPORTE DE PERSONAS ACTIVAMENTE ALBERGADAS');
if (occP1 !== -1 && occP1 !== occP2) {
  const endFirst9 = c.indexOf('// --- REPORT N° 10:', occP1);
  c = c.slice(0, endFirst9) + c.slice(occP2);
}

// Eliminar primer exportActiveOccupantsByRefugioPdf duplicado
const refP1 = c.indexOf('// --- REPORT N° 10: ALBERGADOS ACTIVOS POR REFUGIO');
const refP2 = c.lastIndexOf('// --- REPORT N° 10: ALBERGADOS ACTIVOS POR REFUGIO');
if (refP1 !== -1 && refP1 !== refP2) {
  const endFirst10 = c.indexOf('// --- REPORT N° 11:', refP1);
  c = c.slice(0, endFirst10) + c.slice(refP2);
}

// Eliminar primer exportGraphicalDashboardPdf duplicado
const p1 = c.indexOf('// --- REPORT N° 11: DASHBOARD GRÁFICO ESTADÍSTICO DE ALBERGUES ---');
const p2 = c.lastIndexOf('// --- REPORT N° 11: DASHBOARD GRÁFICO ESTADÍSTICO DE ALBERGUES ---');
if (p1 !== -1 && p1 !== p2) {
  const endOfFirst11 = c.indexOf('// --- GLOBAL REPORT 1:', p1);
  const startOfSecond11 = p2;
  c = c.slice(0, endOfFirst11) + c.slice(c.indexOf('// --- GLOBAL REPORT 1:', startOfSecond11));
}

// Arreglar el botón en el JSX
const brokenJsx = `<Printer className="w-4 h-4" />
                🏨 ACTIVOS X REFUGIO
              </button>
            </div>
          </div>`;

const fixJsx = `<Printer className="w-4 h-4" />
                🏨 ACTIVOS X REFUGIO
              </button>
              <button
                onClick={exportGraphicalDashboardPdf}
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <BarChart3 className="w-4 h-4" />
                📊 DASHBOARD
              </button>
            </div>
          </div>`;

c = c.replace(brokenJsx, fixJsx);

fs.writeFileSync('src/components/ReportsConsoleModule.tsx', c);
console.log('Fixed file.');
