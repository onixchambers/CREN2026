export interface BancoSPEI {
  clave: string;
  nombre: string;
  razonSocial: string;
}

export const BANCOS_MEXICO: BancoSPEI[] = [
  { clave: "40002", nombre: "BANAMEX", razonSocial: "Banco Nacional de México, S.A." },
  { clave: "40012", nombre: "BBVA MEXICO", razonSocial: "BBVA México, S.A." },
  { clave: "40072", nombre: "BANORTE", razonSocial: "Banco Mercantil del Norte, S.A." },
  { clave: "40014", nombre: "SANTANDER", razonSocial: "Banco Santander México, S.A." },
  { clave: "40021", nombre: "HSBC", razonSocial: "HSBC México, S.A." },
  { clave: "40127", nombre: "BANCO AZTECA", razonSocial: "Banco Azteca, S.A." },
  { clave: "40846", nombre: "STP (Sistema de Transferencias y Pagos)", razonSocial: "STP System, S.A." },
  { clave: "40653", nombre: "NU MEXICO", razonSocial: "Nu México Financiera, S.A. de C.V." },
  { clave: "40652", nombre: "MERCADO PAGO", razonSocial: "Mercado Pago Institución de Fondos de Pago Electrónico" },
  { clave: "40044", nombre: "SCOTIABANK", razonSocial: "Scotiabank Inverlat, S.A." },
  { clave: "40036", nombre: "INBURSA", razonSocial: "Banco Inbursa, S.A." },
  { clave: "40058", nombre: "BANREGIO", razonSocial: "Banco Regional de Monterrey, S.A." },
  { clave: "40062", nombre: "AFIRME", razonSocial: "Banco Afirme, S.A." },
  { clave: "40130", nombre: "COMPARTAMOS", razonSocial: "Banco Compartamos, S.A." },
  { clave: "40042", nombre: "MIFEL", razonSocial: "Banca Mifel, S.A." },
  { clave: "40030", nombre: "BAJIO", razonSocial: "Banco del Bajío, S.A." },
  { clave: "40060", nombre: "INBAM", razonSocial: "Bansi, S.A." },
  { clave: "40137", nombre: "DONDÉ", razonSocial: "Fundación Dondé Banco, S.A." },
  { clave: "40138", nombre: "BANCOPPEL", razonSocial: "BanCoppel, S.A." },
  { clave: "40140", nombre: "VALA", razonSocial: "SEFIN, S.A." },
  { clave: "99999", nombre: "OTRO BANCO", razonSocial: "Otro banco o entidad financiera" }
];

export const CREN_BANK_INFO = {
  banco: "BANAMEX",
  claveSpei: "40002",
  cuentaBeneficiaria: "002180700861407112",
  titular: "CREN Centro de Rehabilitación y Estimulación Neuropsicológica"
};
