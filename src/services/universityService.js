import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * RÉGIONS ADMINISTRATIVES DU SÉNÉGAL ET LEURS VILLES UNIVERSITAIRES
 * Synchronisées avec la géographie réelle du Sénégal.
 * Chaque établissement est rattaché STRICTEMENT à sa zone géographique réelle.
 */
export const SENEGAL_REGIONS = [
  {
    id: 'DAKAR',
    nom: 'Dakar',
    description: 'Capitale et Presqu’île',
    villes: [
      { id: 'DAKAR_VILLE', nom: 'Dakar (Fann, Point E, Plateau, Mermoz)', lat: 14.69275, lng: -17.44667 },
      { id: 'GUEDIAWAYE', nom: 'Guédiawaye / Pikine', lat: 14.77000, lng: -17.39000 },
      { id: 'RUFISQUE', nom: 'Rufisque', lat: 14.71670, lng: -17.26670 },
    ],
    defaultUni: 'UCAD',
    defaultVille: 'DAKAR_VILLE',
  },
  {
    id: 'THIES',
    nom: 'Thiès',
    description: 'Thiès, Mbour, Saly et Tivaouane',
    villes: [
      { id: 'THIES_VILLE', nom: 'Thiès Ville', lat: 14.79100, lng: -16.92560 },
      { id: 'MBOUR', nom: 'Mbour / Saly', lat: 14.42200, lng: -16.96340 },
      { id: 'TIVAOUANE', nom: 'Tivaouane', lat: 14.95000, lng: -16.81670 },
    ],
    defaultUni: 'UIDT',
    defaultVille: 'THIES_VILLE',
  },
  {
    id: 'SAINT_LOUIS',
    nom: 'Saint-Louis',
    description: 'Saint-Louis, Richard-Toll et Dagana',
    villes: [
      { id: 'SAINT_LOUIS_VILLE', nom: 'Saint-Louis', lat: 16.03260, lng: -16.48960 },
      { id: 'RICHARD_TOLL', nom: 'Richard-Toll / Dagana', lat: 16.46250, lng: -15.69690 },
      { id: 'PODOR', nom: 'Podor', lat: 16.65400, lng: -14.95800 },
    ],
    defaultUni: 'UGB',
    defaultVille: 'SAINT_LOUIS_VILLE',
  },
  {
    id: 'DIOURBEL',
    nom: 'Diourbel',
    description: 'Bambey (Campus UADB), Diourbel et Touba',
    villes: [
      { id: 'BAMBEY', nom: 'Bambey (Campus UADB)', lat: 14.69890, lng: -16.45280 },
      { id: 'DIOURBEL_VILLE', nom: 'Diourbel Ville', lat: 14.65600, lng: -16.23400 },
      { id: 'TOUBA', nom: 'Touba / Mbacké', lat: 14.86600, lng: -15.88300 },
    ],
    defaultUni: 'UADB',
    defaultVille: 'BAMBEY',
  },
  {
    id: 'DIAMNIADIO',
    nom: 'Diamniadio',
    description: 'Pôle urbain de Diamniadio et environs',
    villes: [
      { id: 'DIAMNIADIO_VILLE', nom: 'Diamniadio Pôle Urbain', lat: 14.72140, lng: -17.18120 },
      { id: 'BARGNY', nom: 'Bargny / Sébikotane', lat: 14.70000, lng: -17.21670 },
    ],
    defaultUni: 'UAM',
    defaultVille: 'DIAMNIADIO_VILLE',
  },
  {
    id: 'ZIGUINCHOR',
    nom: 'Ziguinchor (Casamance)',
    description: 'Ziguinchor, Bignona et Cap Skirring',
    villes: [
      { id: 'ZIGUINCHOR_VILLE', nom: 'Ziguinchor Ville', lat: 12.56840, lng: -16.27330 },
      { id: 'BIGNONA', nom: 'Bignona', lat: 12.81030, lng: -16.22640 },
      { id: 'CAP_SKIRRING', nom: 'Cap Skirring / Oussouye', lat: 12.41670, lng: -16.75000 },
    ],
    defaultUni: 'UASZ',
    defaultVille: 'ZIGUINCHOR_VILLE',
  },
  {
    id: 'KOLDA',
    nom: 'Kolda',
    description: 'Campus UASZ Kolda (rattaché à Ziguinchor)',
    villes: [
      { id: 'KOLDA_VILLE', nom: 'Kolda Ville (Campus UASZ)', lat: 12.88330, lng: -14.95000 },
      { id: 'VELINGARA', nom: 'Vélingara', lat: 13.15000, lng: -14.11670 },
      { id: 'SEDHIOU_VILLE', nom: 'Sédhiou', lat: 12.70810, lng: -15.55690 },
    ],
    defaultUni: 'UASZ_KOLDA',
    defaultVille: 'KOLDA_VILLE',
  },
  {
    id: 'MATAM',
    nom: 'Matam',
    description: 'Matam, Ourossogui et Kanel (Campus USNM)',
    villes: [
      { id: 'MATAM_VILLE', nom: 'Matam Ville (Campus USNM)', lat: 15.65590, lng: -13.25540 },
      { id: 'OUROSSOGUI', nom: 'Ourossogui', lat: 15.60500, lng: -13.31800 },
      { id: 'KANEL', nom: 'Kanel', lat: 15.48330, lng: -13.16670 },
    ],
    defaultUni: 'USNM',
    defaultVille: 'MATAM_VILLE',
  },
  {
    id: 'KAOLACK',
    nom: 'Kaolack (Sine Saloum)',
    description: 'Kaolack, Fatick et Kaffrine',
    villes: [
      { id: 'KAOLACK_VILLE', nom: 'Kaolack Ville', lat: 14.13780, lng: -16.07470 },
      { id: 'FATICK_VILLE', nom: 'Fatick', lat: 14.33950, lng: -16.40420 },
      { id: 'KAFFRINE_VILLE', nom: 'Kaffrine', lat: 14.10590, lng: -15.54140 },
      { id: 'NIORO', nom: 'Nioro du Rip', lat: 13.74370, lng: -15.77330 },
    ],
    defaultUni: 'USSEIN',
    defaultVille: 'KAOLACK_VILLE',
  },
  {
    id: 'TAMBA',
    nom: 'Tambacounda',
    description: 'Tambacounda, Bakel et Kédougou',
    villes: [
      { id: 'TAMBA_VILLE', nom: 'Tambacounda Ville', lat: 13.77120, lng: -13.66730 },
      { id: 'BAKEL', nom: 'Bakel', lat: 14.90000, lng: -12.46000 },
      { id: 'KEDOUGOU_VILLE', nom: 'Kédougou', lat: 12.55600, lng: -12.17500 },
    ],
    defaultUni: 'USO',
    defaultVille: 'TAMBA_VILLE',
  },
  {
    id: 'LOUGA',
    nom: 'Louga',
    description: 'Louga, Kébémer et Linguère',
    villes: [
      { id: 'LOUGA_VILLE', nom: 'Louga Ville', lat: 15.61860, lng: -16.22440 },
      { id: 'KEBEMER', nom: 'Kébémer', lat: 15.36670, lng: -16.45000 },
      { id: 'LINGUERE', nom: 'Linguère', lat: 15.39500, lng: -15.11900 },
    ],
    defaultUni: 'UGB',
    defaultVille: 'LOUGA_VILLE',
  },
];

/**
 * ZONES DU SÉNÉGAL POUR FILTRAGE RAPIDE BAILLEURS & ÉTUDIANTS
 */
export const ZONES_SENEGAL = [
  { id: 'DAKAR', nom: 'Dakar', regionId: 'DAKAR', lat: 14.69275, lng: -17.44667, uniDefault: 'UCAD' },
  { id: 'THIES', nom: 'Thiès', regionId: 'THIES', lat: 14.79100, lng: -16.92560, uniDefault: 'UIDT' },
  { id: 'SAINT_LOUIS', nom: 'Saint-Louis', regionId: 'SAINT_LOUIS', lat: 16.03260, lng: -16.48960, uniDefault: 'UGB' },
  { id: 'DIOURBEL', nom: 'Diourbel / Bambey', regionId: 'DIOURBEL', lat: 14.69890, lng: -16.45280, uniDefault: 'UADB' },
  { id: 'DIAMNIADIO', nom: 'Diamniadio', regionId: 'DIAMNIADIO', lat: 14.72140, lng: -17.18120, uniDefault: 'UAM' },
  { id: 'ZIGUINCHOR', nom: 'Ziguinchor', regionId: 'ZIGUINCHOR', lat: 12.56840, lng: -16.27330, uniDefault: 'UASZ' },
  { id: 'KOLDA', nom: 'Kolda', regionId: 'KOLDA', lat: 12.88330, lng: -14.95000, uniDefault: 'UASZ_KOLDA' },
  { id: 'MATAM', nom: 'Matam', regionId: 'MATAM', lat: 15.65590, lng: -13.25540, uniDefault: 'USNM' },
  { id: 'KAOLACK', nom: 'Kaolack', regionId: 'KAOLACK', lat: 14.13780, lng: -16.07470, uniDefault: 'USSEIN' },
  { id: 'TAMBA', nom: 'Tambacounda', regionId: 'TAMBA', lat: 13.77120, lng: -13.66730, uniDefault: 'USO' },
  { id: 'MBOUR', nom: 'Mbour / Saly', regionId: 'THIES', lat: 14.42200, lng: -16.96340, uniDefault: 'UIDT_MBOUR' },
];

/**
 * LISTE OFFICIELLE DES ÉTABLISSEMENTS D'ENSEIGNEMENT SUPÉRIEUR DU SÉNÉGAL
 * RÈGLE STRICTE : Chaque établissement est rattaché à SA SEULE ET UNIQUE zone géographique réelle.
 * Aucun établissement ne peut apparaître dans une zone différente de sa localisation.
 */
export const UNIVERSITES = [
  // ==========================================
  // --- 1. DAKAR (STRICTEMENT LOCALISÉS À DAKAR) ---
  // ==========================================
  { 
    id: 'UCAD', 
    nom: 'UCAD — Univ. Cheikh Anta Diop', 
    nomComplet: 'Université Cheikh Anta Diop de Dakar',
    ville: 'Dakar', 
    regionId: 'DAKAR', 
    regionNom: 'Dakar', 
    villes: ['DAKAR_VILLE', 'GUEDIAWAYE', 'RUFISQUE'],
    zones: ['DAKAR'],
    type: 'Public' 
  },
  { 
    id: 'ESTM', 
    nom: 'ESTM (Avenue Cheikh Anta Diop / Dakar)', 
    nomComplet: 'École Supérieure de Technologie et de Management',
    ville: 'Dakar', 
    regionId: 'DAKAR', 
    regionNom: 'Dakar', 
    villes: ['DAKAR_VILLE'],
    zones: ['DAKAR'],
    type: 'Privé' 
  },
  { 
    id: 'ESMT', 
    nom: 'ESMT (Rocade Fann Bel-Air / Dakar)', 
    nomComplet: 'École Supérieure Multinationale des Télécommunications',
    ville: 'Dakar', 
    regionId: 'DAKAR', 
    regionNom: 'Dakar', 
    villes: ['DAKAR_VILLE'],
    zones: ['DAKAR'],
    type: 'Public / Inter-États' 
  },
  { 
    id: 'ISM', 
    nom: 'ISM (Point E / Dakar)', 
    nomComplet: 'Institut Supérieur de Management', 
    ville: 'Dakar', 
    regionId: 'DAKAR', 
    regionNom: 'Dakar', 
    villes: ['DAKAR_VILLE'], 
    zones: ['DAKAR'], 
    type: 'Privé' 
  },
  { 
    id: 'IAM', 
    nom: 'IAM (Mermoz / Dakar)', 
    nomComplet: 'Institut Africain de Management', 
    ville: 'Dakar', 
    regionId: 'DAKAR', 
    regionNom: 'Dakar', 
    villes: ['DAKAR_VILLE'], 
    zones: ['DAKAR'], 
    type: 'Privé' 
  },
  { 
    id: 'SupDeCo', 
    nom: 'SupDeCo (Point E / Dakar)', 
    nomComplet: 'Groupe Sup de Co Dakar', 
    ville: 'Dakar', 
    regionId: 'DAKAR', 
    regionNom: 'Dakar', 
    villes: ['DAKAR_VILLE'], 
    zones: ['DAKAR'], 
    type: 'Privé' 
  },
  { 
    id: 'CESAG', 
    nom: 'CESAG (Point E / Dakar)', 
    nomComplet: 'Centre Africain d’Études Supérieures en Gestion', 
    ville: 'Dakar', 
    regionId: 'DAKAR', 
    regionNom: 'Dakar', 
    villes: ['DAKAR_VILLE'], 
    zones: ['DAKAR'], 
    type: 'Public / UEMOA' 
  },
  { 
    id: 'UCAO', 
    nom: 'UCAO (Dakar)', 
    nomComplet: 'Université Catholique de l’Afrique de l’Ouest', 
    ville: 'Dakar', 
    regionId: 'DAKAR', 
    regionNom: 'Dakar', 
    villes: ['DAKAR_VILLE'], 
    zones: ['DAKAR'], 
    type: 'Privé' 
  },
  { 
    id: 'DIT', 
    nom: 'DIT (Dakar)', 
    nomComplet: 'Dakar Institute of Technology', 
    ville: 'Dakar', 
    regionId: 'DAKAR', 
    regionNom: 'Dakar', 
    villes: ['DAKAR_VILLE'], 
    zones: ['DAKAR'], 
    type: 'Privé' 
  },
  { 
    id: 'AFI-UE', 
    nom: 'AFI-UE (Dakar)', 
    nomComplet: 'AFI - L’Université de l’Entreprise', 
    ville: 'Dakar', 
    regionId: 'DAKAR', 
    regionNom: 'Dakar', 
    villes: ['DAKAR_VILLE'], 
    zones: ['DAKAR'], 
    type: 'Privé' 
  },
  { 
    id: 'ESEBAT', 
    nom: 'ESEBAT (Dakar)', 
    nomComplet: 'École Supérieure d’Électricité, Bâtiment et TP', 
    ville: 'Dakar', 
    regionId: 'DAKAR', 
    regionNom: 'Dakar', 
    villes: ['DAKAR_VILLE'], 
    zones: ['DAKAR'], 
    type: 'Privé' 
  },
  { 
    id: 'CEFAS', 
    nom: 'CEFAS (Dakar)', 
    nomComplet: 'Centre de Formation et d’Action Sociale', 
    ville: 'Dakar', 
    regionId: 'DAKAR', 
    regionNom: 'Dakar', 
    villes: ['DAKAR_VILLE'], 
    zones: ['DAKAR'], 
    type: 'Privé' 
  },

  // ==========================================
  // --- 2. SAINT-LOUIS (STRICTEMENT SAINT-LOUIS) ---
  // ==========================================
  { 
    id: 'UGB', 
    nom: 'UGB — Univ. Gaston Berger (Saint-Louis)', 
    nomComplet: 'Université Gaston Berger de Saint-Louis',
    ville: 'Saint-Louis', 
    regionId: 'SAINT_LOUIS', 
    regionNom: 'Saint-Louis', 
    villes: ['SAINT_LOUIS_VILLE', 'RICHARD_TOLL'],
    zones: ['SAINT_LOUIS'],
    type: 'Public' 
  },

  // ==========================================
  // --- 3. THIÈS (STRICTEMENT THIÈS) ---
  // ==========================================
  { 
    id: 'UIDT', 
    nom: 'UIDT — Univ. Iba Der Thiam (Thiès)', 
    nomComplet: 'Université Iba Der Thiam de Thiès',
    ville: 'Thiès', 
    regionId: 'THIES', 
    regionNom: 'Thiès', 
    villes: ['THIES_VILLE', 'TIVAOUANE'],
    zones: ['THIES'],
    type: 'Public' 
  },
  { 
    id: 'EPT', 
    nom: 'EPT — École Polytechnique de Thiès', 
    nomComplet: 'École Polytechnique de Thiès',
    ville: 'Thiès', 
    regionId: 'THIES', 
    regionNom: 'Thiès', 
    villes: ['THIES_VILLE'],
    zones: ['THIES'],
    type: 'Public' 
  },

  // ==========================================
  // --- 4. DIOURBEL / BAMBEY (STRICTEMENT DIOURBEL) ---
  // ==========================================
  { 
    id: 'UADB', 
    nom: 'UADB — Univ. Alioune Diop (Bambey)', 
    nomComplet: 'Université Alioune Diop de Bambey',
    ville: 'Bambey', 
    regionId: 'DIOURBEL', 
    regionNom: 'Diourbel', 
    villes: ['BAMBEY', 'DIOURBEL_VILLE', 'TOUBA'],
    zones: ['DIOURBEL'],
    type: 'Public' 
  },

  // ==========================================
  // --- 5. MATAM (STRICTEMENT MATAM) ---
  // ==========================================
  { 
    id: 'USNM', 
    nom: 'USNM — Univ. Souleymane Niang (Matam)', 
    nomComplet: 'Université Souleymane Niang de Matam',
    ville: 'Matam', 
    regionId: 'MATAM', 
    regionNom: 'Matam', 
    villes: ['MATAM_VILLE', 'OUROSSOGUI', 'KANEL'],
    zones: ['MATAM'],
    type: 'Public' 
  },

  // ==========================================
  // --- 6. ZIGUINCHOR (STRICTEMENT ZIGUINCHOR) ---
  // ==========================================
  { 
    id: 'UASZ', 
    nom: 'UASZ — Univ. Assane Seck (Ziguinchor)', 
    nomComplet: 'Université Assane Seck de Ziguinchor',
    ville: 'Ziguinchor', 
    regionId: 'ZIGUINCHOR', 
    regionNom: 'Ziguinchor', 
    villes: ['ZIGUINCHOR_VILLE', 'BIGNONA', 'CAP_SKIRRING'],
    zones: ['ZIGUINCHOR'],
    type: 'Public' 
  },

  // ==========================================
  // --- 7. KOLDA (CAMPUS DE KOLDA RATTACHÉ À ZIGUINCHOR) ---
  // ==========================================
  { 
    id: 'UASZ_KOLDA', 
    nom: 'UASZ — Campus Universitaire de Kolda', 
    nomComplet: 'Université Assane Seck - Centre Universitaire de Kolda',
    ville: 'Kolda', 
    regionId: 'KOLDA', 
    regionNom: 'Kolda', 
    villes: ['KOLDA_VILLE', 'VELINGARA', 'SEDHIOU_VILLE'],
    zones: ['KOLDA'],
    type: 'Public' 
  },

  // ==========================================
  // --- 8. DIAMNIADIO (STRICTEMENT DIAMNIADIO) ---
  // ==========================================
  { 
    id: 'UAM', 
    nom: 'UAM — Univ. Amadou Mahtar Mbow (Diamniadio)', 
    nomComplet: 'Université Amadou Mahtar Mbow de Diamniadio',
    ville: 'Diamniadio', 
    regionId: 'DIAMNIADIO', 
    regionNom: 'Diamniadio', 
    villes: ['DIAMNIADIO_VILLE'],
    zones: ['DIAMNIADIO'],
    type: 'Public' 
  },
  { 
    id: 'URDFS', 
    nom: 'URDFS — Univ. Rose Dieng (Diamniadio)', 
    nomComplet: 'Université Rose Dieng France-Sénégal',
    ville: 'Diamniadio', 
    regionId: 'DIAMNIADIO', 
    regionNom: 'Diamniadio', 
    villes: ['DIAMNIADIO_VILLE'],
    zones: ['DIAMNIADIO'],
    type: 'Public' 
  },
  { 
    id: 'UNCHK', 
    nom: 'UN-CHK — Univ. Numérique (Diamniadio)', 
    nomComplet: 'Université Numérique Cheikh Hamidou Kane (Pôle Diamniadio)',
    ville: 'Diamniadio', 
    regionId: 'DIAMNIADIO', 
    regionNom: 'Diamniadio', 
    villes: ['DIAMNIADIO_VILLE'],
    zones: ['DIAMNIADIO'],
    type: 'Public' 
  },

  // ==========================================
  // --- 9. KAOLACK (STRICTEMENT KAOLACK) ---
  // ==========================================
  { 
    id: 'USSEIN', 
    nom: 'USSEIN — Univ. Sine Saloum (Kaolack)', 
    nomComplet: 'Université du Sine Saloum El Hadji Ibrahima Niass',
    ville: 'Kaolack', 
    regionId: 'KAOLACK', 
    regionNom: 'Kaolack (Sine Saloum)', 
    villes: ['KAOLACK_VILLE', 'FATICK_VILLE', 'KAFFRINE_VILLE', 'NIORO'],
    zones: ['KAOLACK'],
    type: 'Public' 
  },

  // ==========================================
  // --- 10. TAMBACOUNDA (STRICTEMENT TAMBACOUNDA) ---
  // ==========================================
  { 
    id: 'USO', 
    nom: 'USO — Univ. Sénégal Oriental (Tambacounda)', 
    nomComplet: 'Université du Sénégal Oriental de Tambacounda',
    ville: 'Tambacounda', 
    regionId: 'TAMBA', 
    regionNom: 'Tambacounda', 
    villes: ['TAMBA_VILLE', 'BAKEL', 'KEDOUGOU_VILLE'],
    zones: ['TAMBA'],
    type: 'Public' 
  },

  // ==========================================
  // --- 11. MBOUR / SALY (STRICTEMENT MBOUR) ---
  // ==========================================
  { 
    id: 'UIDT_MBOUR', 
    nom: 'UIDT — Antenne Universitaire de Mbour', 
    nomComplet: 'Université Iba Der Thiam - Pôle Mbour / Saly',
    ville: 'Mbour', 
    regionId: 'THIES', 
    regionNom: 'Thiès', 
    villes: ['MBOUR'],
    zones: ['MBOUR'],
    type: 'Public' 
  },
];

/**
 * Obtenir toutes les universités d'une zone (filtrage strict : chaque établissement appartient à 1 seule zone)
 */
export const getUniversitesByZone = (zoneId) => {
  if (!zoneId || zoneId === 'TOUS') return UNIVERSITES;
  return UNIVERSITES.filter((uni) => uni.zones && uni.zones.includes(zoneId));
};

/**
 * Vérifie si un logement (propriété) appartient à une zone spécifique
 */
export const isPropertyInZone = (bien, zoneId) => {
  if (!bien) return false;
  if (!zoneId || zoneId === 'TOUS') return true;
  
  const zUpper = String(zoneId).trim().toUpperCase();
  
  // 1. Match direct sur localisation.zoneId, regionId ou villeId
  const locZoneId = (bien.localisation?.zoneId || '').toUpperCase();
  const locRegionId = (bien.localisation?.regionId || '').toUpperCase();
  const locVilleId = (bien.localisation?.villeId || '').toUpperCase();
  
  if (locZoneId === zUpper || locRegionId === zUpper || locVilleId === zUpper) return true;
  if (locVilleId.includes(zUpper)) return true;

  // 2. Match textuel sur ville, région ou adresse
  const locRegion = (bien.localisation?.region || '').toUpperCase();
  const locVille = (bien.localisation?.ville || '').toUpperCase();
  const locAdresse = (bien.localisation?.adresse || '').toUpperCase();
  
  if (zUpper === 'DAKAR') {
    if (locRegion.includes('DAKAR') || locVille.includes('DAKAR') || locAdresse.includes('DAKAR') || 
        locAdresse.includes('FANN') || locAdresse.includes('MERMOZ') || locAdresse.includes('PLATEAU') ||
        locAdresse.includes('POINT E') || locAdresse.includes('ALMADIES') || locAdresse.includes('OUAKAM') ||
        locAdresse.includes('YOFF') || locAdresse.includes('MEDINA') || locAdresse.includes('LIBERTE')) return true;
  } else if (zUpper === 'THIES') {
    if (locRegion.includes('THIES') || locRegion.includes('THIÈS') || 
        locVille.includes('THIES') || locVille.includes('THIÈS') || 
        locAdresse.includes('THIES') || locAdresse.includes('THIÈS')) return true;
  } else if (zUpper === 'DIOURBEL') {
    if (locRegion.includes('DIOURBEL') || locVille.includes('BAMBEY') || 
        locVille.includes('DIOURBEL') || locAdresse.includes('BAMBEY') || locAdresse.includes('DIOURBEL')) return true;
  } else if (zUpper === 'SAINT_LOUIS') {
    if (locRegion.includes('SAINT') || locVille.includes('SAINT-LOUIS') || 
        locAdresse.includes('SAINT-LOUIS')) return true;
  } else if (zUpper === 'DIAMNIADIO') {
    if (locVille.includes('DIAMNIADIO') || locAdresse.includes('DIAMNIADIO') || locVille.includes('RUFISQUE')) return true;
  } else if (zUpper === 'ZIGUINCHOR') {
    if (locRegion.includes('ZIGUINCHOR') || locVille.includes('ZIGUINCHOR') || locAdresse.includes('ZIGUINCHOR')) return true;
  } else if (zUpper === 'KOLDA') {
    if (locRegion.includes('KOLDA') || locVille.includes('KOLDA') || locAdresse.includes('KOLDA') || locAdresse.includes('VELINGARA')) return true;
  } else if (zUpper === 'MATAM') {
    if (locRegion.includes('MATAM') || locVille.includes('MATAM') || locAdresse.includes('MATAM') || locAdresse.includes('OUROSSOGUI')) return true;
  } else if (zUpper === 'KAOLACK') {
    if (locRegion.includes('KAOLACK') || locVille.includes('KAOLACK') || locRegion.includes('SALOUM')) return true;
  } else if (zUpper === 'TAMBA') {
    if (locRegion.includes('TAMBA') || locVille.includes('TAMBA')) return true;
  } else if (zUpper === 'MBOUR') {
    if (locVille.includes('MBOUR') || locVille.includes('SALY') || locAdresse.includes('MBOUR') || locAdresse.includes('SALY')) return true;
  }

  // 3. Match via l'établissement rattaché au bien
  const uniId = bien.universiteId || bien.universite;
  if (uniId) {
    if (uniId.toUpperCase() === zUpper) return true;
    const uni = UNIVERSITES.find(u => u.id === uniId || u.nom === uniId);
    if (uni) {
      if (uni.zones && uni.zones.includes(zoneId)) return true;
      if (uni.regionId && uni.regionId.toUpperCase() === zUpper) return true;
    }
  }

  return false;
};

/**
 * Obtenir la région correspondant à un identifiant
 */
export const getRegionById = (regionId) => {
  return SENEGAL_REGIONS.find((r) => r.id === regionId) || SENEGAL_REGIONS[0];
};

/**
 * Obtenir toutes les universités d'une région
 */
export const getUniversitesByRegion = (regionId) => {
  if (!regionId || regionId === 'TOUS') return UNIVERSITES;
  return UNIVERSITES.filter((uni) => uni.regionId === regionId || (uni.zones && uni.zones.includes(regionId)));
};

/**
 * Obtenir toutes les universités associées à une ville précise
 */
export const getUniversitesByVille = (villeId) => {
  if (!villeId) return UNIVERSITES;
  return UNIVERSITES.filter((uni) => uni.villes && uni.villes.includes(villeId));
};

/**
 * Trouver une université par son identifiant
 */
export const getUniversityById = (uniId) => {
  return UNIVERSITES.find((u) => u.id === uniId) || UNIVERSITES[0];
};

/**
 * Synchroniser toutes les universités et régions dans Firestore
 */
export const uploadUniversitiesToFirebase = async () => {
  try {
    for (const uni of UNIVERSITES) {
      const docRef = doc(db, "universities", uni.id);
      await setDoc(docRef, {
        id: uni.id,
        nom: uni.nom,
        nomComplet: uni.nomComplet || uni.nom,
        ville: uni.ville,
        regionId: uni.regionId,
        regionNom: uni.regionNom,
        villes: uni.villes || [],
        zones: uni.zones || [],
        type: uni.type || 'Public',
        updatedAt: new Date()
      }, { merge: true });
    }

    for (const reg of SENEGAL_REGIONS) {
      const regRef = doc(db, "regions", reg.id);
      await setDoc(regRef, {
        id: reg.id,
        nom: reg.nom,
        description: reg.description,
        villes: reg.villes,
        defaultUni: reg.defaultUni,
        defaultVille: reg.defaultVille,
        updatedAt: new Date()
      }, { merge: true });
    }

    return { success: true };
  } catch (error) {
    console.warn("Synchronisation Firestore optionnelle non autorisée :", error?.message || error);
    return { success: false, error: error?.message };
  }
};
