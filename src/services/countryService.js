/**
 * Service Panafricain des Pays, Indicatifs et Monnaies pour Logetudiant
 * Couvre l'ensemble des pays d'Afrique (Ouest, Centre, Nord, Est, Sud).
 */

export const AFRICAN_COUNTRIES = [
  {
    id: 'SN',
    code: 'SN',
    name: 'Sénégal',
    dialCode: '+221',
    flag: '🇸🇳',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    phoneLength: 9,
    samplePhone: '77 123 45 67',
    primaryCity: 'Dakar',
    aliases: ['senegal', 'sn', 'dakar', 'thies', 'saint-louis', 'ziguinchor'],
  },
  {
    id: 'CI',
    code: 'CI',
    name: 'Côte d\'Ivoire',
    dialCode: '+225',
    flag: '🇨🇮',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    phoneLength: 10,
    samplePhone: '07 01 02 03 04',
    primaryCity: 'Abidjan',
    aliases: ['cote divoire', 'ivory coast', 'ci', 'abidjan', 'yamoussoukro', 'bouake'],
  },
  {
    id: 'GN',
    code: 'GN',
    name: 'Guinée',
    dialCode: '+224',
    flag: '🇬🇳',
    currency: 'GNF',
    currencySymbol: 'GNF',
    phoneLength: 9,
    samplePhone: '620 12 34 56',
    primaryCity: 'Conakry',
    aliases: ['guinee', 'guinea', 'gn', 'conakry', 'kankan'],
  },
  {
    id: 'CM',
    code: 'CM',
    name: 'Cameroun',
    dialCode: '+237',
    flag: '🇨🇲',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    phoneLength: 9,
    samplePhone: '690 12 34 56',
    primaryCity: 'Yaoundé',
    aliases: ['cameroun', 'cameroon', 'cm', 'yaounde', 'douala', 'buea'],
  },
  {
    id: 'ML',
    code: 'ML',
    name: 'Mali',
    dialCode: '+223',
    flag: '🇲🇱',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    phoneLength: 8,
    samplePhone: '70 12 34 56',
    primaryCity: 'Bamako',
    aliases: ['mali', 'ml', 'bamako', 'segou', 'sikasso'],
  },
  {
    id: 'BJ',
    code: 'BJ',
    name: 'Bénin',
    dialCode: '+229',
    flag: '🇧🇯',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    phoneLength: 8,
    samplePhone: '97 12 34 56',
    primaryCity: 'Cotonou',
    aliases: ['benin', 'bj', 'cotonou', 'porto-novo', 'parakou'],
  },
  {
    id: 'TG',
    code: 'TG',
    name: 'Togo',
    dialCode: '+228',
    flag: '🇹🇬',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    phoneLength: 8,
    samplePhone: '90 12 34 56',
    primaryCity: 'Lomé',
    aliases: ['togo', 'tg', 'lome', 'kara'],
  },
  {
    id: 'BF',
    code: 'BF',
    name: 'Burkina Faso',
    dialCode: '+226',
    flag: '🇧🇫',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    phoneLength: 8,
    samplePhone: '70 12 34 56',
    primaryCity: 'Ouagadougou',
    aliases: [
      'burkina',
      'bourkina',
      'burkina faso',
      'bourkina faso',
      'bourkina fasso',
      'burkina fasso',
      'faso',
      'bf',
      'ouagadougou',
      'bobo-dioulasso'
    ],
  },
  {
    id: 'GM',
    code: 'GM',
    name: 'Gambie',
    dialCode: '+220',
    flag: '🇬🇲',
    currency: 'GMD',
    currencySymbol: 'D',
    phoneLength: 7,
    samplePhone: '712 3456',
    primaryCity: 'Banjul',
    aliases: ['gambie', 'gambia', 'the gambia', 'gm', 'banjul', 'serrekunda', 'brikama'],
  },
  {
    id: 'GH',
    code: 'GH',
    name: 'Ghana',
    dialCode: '+233',
    flag: '🇬🇭',
    currency: 'GHS',
    currencySymbol: 'GH₵',
    phoneLength: 9,
    samplePhone: '24 123 4567',
    primaryCity: 'Accra',
    aliases: ['ghana', 'gh', 'accra', 'kumasi', 'legon'],
  },
  {
    id: 'NG',
    code: 'NG',
    name: 'Nigeria',
    dialCode: '+234',
    flag: '🇳🇬',
    currency: 'NGN',
    currencySymbol: '₦',
    phoneLength: 10,
    samplePhone: '803 123 4567',
    primaryCity: 'Lagos',
    aliases: ['nigeria', 'ng', 'lagos', 'abuja', 'ibadan'],
  },
  {
    id: 'CD',
    code: 'CD',
    name: 'RD Congo',
    dialCode: '+243',
    flag: '🇨🇩',
    currency: 'USD',
    currencySymbol: '$',
    phoneLength: 9,
    samplePhone: '81 123 4567',
    primaryCity: 'Kinshasa',
    aliases: ['rdc', 'drc', 'rd congo', 'congo kinshasa', 'cd', 'kinshasa', 'lubumbashi', 'goma'],
  },
  {
    id: 'GA',
    code: 'GA',
    name: 'Gabon',
    dialCode: '+241',
    flag: '🇬🇦',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    phoneLength: 8,
    samplePhone: '74 12 34 56',
    primaryCity: 'Libreville',
    aliases: ['gabon', 'ga', 'libreville', 'port-gentil'],
  },
  {
    id: 'CG',
    code: 'CG',
    name: 'Congo-Brazzaville',
    dialCode: '+242',
    flag: '🇨🇬',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    phoneLength: 9,
    samplePhone: '06 123 4567',
    primaryCity: 'Brazzaville',
    aliases: ['congo', 'congo brazzaville', 'cg', 'brazzaville', 'pointe-noire'],
  },
  {
    id: 'NE',
    code: 'NE',
    name: 'Niger',
    dialCode: '+227',
    flag: '🇳🇪',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    phoneLength: 8,
    samplePhone: '90 12 34 56',
    primaryCity: 'Niamey',
    aliases: ['niger', 'ne', 'niamey', 'maradi', 'zinder'],
  },
  {
    id: 'TD',
    code: 'TD',
    name: 'Tchad',
    dialCode: '+235',
    flag: '🇹🇩',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    phoneLength: 8,
    samplePhone: '66 12 34 56',
    primaryCity: 'N\'Djamena',
    aliases: ['tchad', 'chad', 'td', 'ndjamena', 'moundou'],
  },
  {
    id: 'MR',
    code: 'MR',
    name: 'Mauritanie',
    dialCode: '+222',
    flag: '🇲🇷',
    currency: 'MRU',
    currencySymbol: 'MRU',
    phoneLength: 8,
    samplePhone: '46 12 34 56',
    primaryCity: 'Nouakchott',
    aliases: ['mauritanie', 'mauritania', 'mr', 'nouakchott', 'nouadhibou'],
  },
  {
    id: 'RW',
    code: 'RW',
    name: 'Rwanda',
    dialCode: '+250',
    flag: '🇷🇼',
    currency: 'RWF',
    currencySymbol: 'RWF',
    phoneLength: 9,
    samplePhone: '78 123 4567',
    primaryCity: 'Kigali',
    aliases: ['rwanda', 'rw', 'kigali', 'butare'],
  },
  {
    id: 'KE',
    code: 'KE',
    name: 'Kenya',
    dialCode: '+254',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KSh',
    phoneLength: 9,
    samplePhone: '712 345678',
    primaryCity: 'Nairobi',
    aliases: ['kenya', 'ke', 'nairobi', 'mombasa'],
  },
  {
    id: 'MA',
    code: 'MA',
    name: 'Maroc',
    dialCode: '+212',
    flag: '🇲🇦',
    currency: 'MAD',
    currencySymbol: 'DH',
    phoneLength: 9,
    samplePhone: '6 12 34 56 78',
    primaryCity: 'Rabat',
    aliases: ['maroc', 'morocco', 'ma', 'rabat', 'casablanca', 'marrakech', 'fes'],
  },
  {
    id: 'DZ',
    code: 'DZ',
    name: 'Algérie',
    dialCode: '+213',
    flag: '🇩🇿',
    currency: 'DZD',
    currencySymbol: 'DA',
    phoneLength: 9,
    samplePhone: '550 12 34 56',
    primaryCity: 'Alger',
    aliases: ['algerie', 'algeria', 'dz', 'alger', 'oran', 'constantine'],
  },
  {
    id: 'TN',
    code: 'TN',
    name: 'Tunisie',
    dialCode: '+216',
    flag: '🇹🇳',
    currency: 'TND',
    currencySymbol: 'DT',
    phoneLength: 8,
    samplePhone: '98 123 456',
    primaryCity: 'Tunis',
    aliases: ['tunisie', 'tunisia', 'tn', 'tunis', 'sfax', 'sousse'],
  },
  {
    id: 'GW',
    code: 'GW',
    name: 'Guinée-Bissau',
    dialCode: '+245',
    flag: '🇬🇼',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    phoneLength: 7,
    samplePhone: '955 1234',
    primaryCity: 'Bissau',
    aliases: ['guinee bissau', 'guinea-bissau', 'bissau', 'gw'],
  },
  {
    id: 'CV',
    code: 'CV',
    name: 'Cap-Vert',
    dialCode: '+238',
    flag: '🇨🇻',
    currency: 'CVE',
    currencySymbol: 'Esc',
    phoneLength: 7,
    samplePhone: '991 1234',
    primaryCity: 'Praia',
    aliases: ['cap-vert', 'cape verde', 'cv', 'praia', 'mindelo'],
  },
  {
    id: 'SL',
    code: 'SL',
    name: 'Sierra Leone',
    dialCode: '+232',
    flag: '🇸🇱',
    currency: 'SLE',
    currencySymbol: 'Le',
    phoneLength: 8,
    samplePhone: '76 123456',
    primaryCity: 'Freetown',
    aliases: ['sierra leone', 'sl', 'freetown'],
  },
  {
    id: 'LR',
    code: 'LR',
    name: 'Liberia',
    dialCode: '+231',
    flag: '🇱🇷',
    currency: 'LRD',
    currencySymbol: '$',
    phoneLength: 8,
    samplePhone: '77 123456',
    primaryCity: 'Monrovia',
    aliases: ['liberia', 'lr', 'monrovia'],
  },
  {
    id: 'CF',
    code: 'CF',
    name: 'Centrafrique',
    dialCode: '+236',
    flag: '🇨🇫',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    phoneLength: 8,
    samplePhone: '70 12 34 56',
    primaryCity: 'Bangui',
    aliases: ['centrafrique', 'rca', 'central african republic', 'cf', 'bangui'],
  },
  {
    id: 'BI',
    code: 'BI',
    name: 'Burundi',
    dialCode: '+257',
    flag: '🇧🇮',
    currency: 'BIF',
    currencySymbol: 'FBu',
    phoneLength: 8,
    samplePhone: '79 12 34 56',
    primaryCity: 'Bujumbura',
    aliases: ['burundi', 'bi', 'bujumbura', 'gitega'],
  },
  {
    id: 'MG',
    code: 'MG',
    name: 'Madagascar',
    dialCode: '+261',
    flag: '🇲🇬',
    currency: 'MGA',
    currencySymbol: 'Ar',
    phoneLength: 9,
    samplePhone: '32 12 345 67',
    primaryCity: 'Antananarivo',
    aliases: ['madagascar', 'mg', 'antananarivo', 'tana'],
  },
  {
    id: 'UG',
    code: 'UG',
    name: 'Ouganda',
    dialCode: '+256',
    flag: '🇺🇬',
    currency: 'UGX',
    currencySymbol: 'USh',
    phoneLength: 9,
    samplePhone: '772 123456',
    primaryCity: 'Kampala',
    aliases: ['ouganda', 'uganda', 'ug', 'kampala'],
  },
  {
    id: 'TZ',
    code: 'TZ',
    name: 'Tanzanie',
    dialCode: '+255',
    flag: '🇹🇿',
    currency: 'TZS',
    currencySymbol: 'TSh',
    phoneLength: 9,
    samplePhone: '712 345678',
    primaryCity: 'Dar es Salaam',
    aliases: ['tanzanie', 'tanzania', 'tz', 'dar es salaam', 'dodoma'],
  },
  {
    id: 'EG',
    code: 'EG',
    name: 'Égypte',
    dialCode: '+20',
    flag: '🇪🇬',
    currency: 'EGP',
    currencySymbol: 'E£',
    phoneLength: 10,
    samplePhone: '100 123 4567',
    primaryCity: 'Le Caire',
    aliases: ['egypte', 'egypt', 'eg', 'le caire', 'cairo', 'alexandrie'],
  },
  {
    id: 'ET',
    code: 'ET',
    name: 'Éthiopie',
    dialCode: '+251',
    flag: '🇪🇹',
    currency: 'ETB',
    currencySymbol: 'Br',
    phoneLength: 9,
    samplePhone: '91 123 4567',
    primaryCity: 'Addis-Abeba',
    aliases: ['ethiopie', 'ethiopia', 'et', 'addis abeba', 'addis ababa'],
  },
  {
    id: 'ZA',
    code: 'ZA',
    name: 'Afrique du Sud',
    dialCode: '+27',
    flag: '🇿🇦',
    currency: 'ZAR',
    currencySymbol: 'R',
    phoneLength: 9,
    samplePhone: '82 123 4567',
    primaryCity: 'Johannesburg',
    aliases: ['afrique du sud', 'south africa', 'za', 'johannesburg', 'cape town'],
  },
  {
    id: 'AO',
    code: 'AO',
    name: "Angola",
    dialCode: '+244',
    flag: '🇦🇴',
    currency: 'AOA',
    currencySymbol: "Kz",
    phoneLength: 9,
    samplePhone: '923 123 456',
    primaryCity: "Luanda",
    aliases: ["angola","ao","luanda","huambo","lobito"],
  },
  {
    id: 'BW',
    code: 'BW',
    name: "Botswana",
    dialCode: '+267',
    flag: '🇧🇼',
    currency: 'BWP',
    currencySymbol: "P",
    phoneLength: 8,
    samplePhone: '71 123 456',
    primaryCity: "Gaborone",
    aliases: ["botswana","bw","gaborone","francistown"],
  },
  {
    id: 'KM',
    code: 'KM',
    name: "Comores",
    dialCode: '+269',
    flag: '🇰🇲',
    currency: 'KMF',
    currencySymbol: "CF",
    phoneLength: 7,
    samplePhone: '321 2345',
    primaryCity: "Moroni",
    aliases: ["comores","comoros","km","moroni"],
  },
  {
    id: 'DJ',
    code: 'DJ',
    name: "Djibouti",
    dialCode: '+253',
    flag: '🇩🇯',
    currency: 'DJF',
    currencySymbol: "Fdj",
    phoneLength: 8,
    samplePhone: '77 12 34 56',
    primaryCity: "Djibouti",
    aliases: ["djibouti","dj"],
  },
  {
    id: 'GQ',
    code: 'GQ',
    name: "Guinée équatoriale",
    dialCode: '+240',
    flag: '🇬🇶',
    currency: 'FCFA',
    currencySymbol: "FCFA",
    phoneLength: 9,
    samplePhone: '222 123 456',
    primaryCity: "Malabo",
    aliases: ["guinee equatoriale","equatorial guinea","gq","malabo","bata"],
  },
  {
    id: 'ER',
    code: 'ER',
    name: "Érythrée",
    dialCode: '+291',
    flag: '🇪🇷',
    currency: 'ERN',
    currencySymbol: "Nfk",
    phoneLength: 7,
    samplePhone: '7 123 456',
    primaryCity: "Asmara",
    aliases: ["erythree","eritrea","er","asmara"],
  },
  {
    id: 'SZ',
    code: 'SZ',
    name: "Eswatini",
    dialCode: '+268',
    flag: '🇸🇿',
    currency: 'SZL',
    currencySymbol: "E",
    phoneLength: 8,
    samplePhone: '76 123 456',
    primaryCity: "Mbabane",
    aliases: ["eswatini","swaziland","sz","mbabane","manzini"],
  },
  {
    id: 'LS',
    code: 'LS',
    name: "Lesotho",
    dialCode: '+266',
    flag: '🇱🇸',
    currency: 'LSL',
    currencySymbol: "M",
    phoneLength: 8,
    samplePhone: '58 123 456',
    primaryCity: "Maseru",
    aliases: ["lesotho","ls","maseru"],
  },
  {
    id: 'LY',
    code: 'LY',
    name: "Libye",
    dialCode: '+218',
    flag: '🇱🇾',
    currency: 'LYD',
    currencySymbol: "LD",
    phoneLength: 9,
    samplePhone: '91 123 4567',
    primaryCity: "Tripoli",
    aliases: ["libye","libya","ly","tripoli","benghazi"],
  },
  {
    id: 'MW',
    code: 'MW',
    name: "Malawi",
    dialCode: '+265',
    flag: '🇲🇼',
    currency: 'MWK',
    currencySymbol: "MK",
    phoneLength: 9,
    samplePhone: '99 123 4567',
    primaryCity: "Lilongwe",
    aliases: ["malawi","mw","lilongwe","blantyre"],
  },
  {
    id: 'MU',
    code: 'MU',
    name: "Maurice",
    dialCode: '+230',
    flag: '🇲🇺',
    currency: 'MUR',
    currencySymbol: "Rs",
    phoneLength: 8,
    samplePhone: '57 12 34 56',
    primaryCity: "Port-Louis",
    aliases: ["maurice","ile maurice","mauritius","mu","port-louis"],
  },
  {
    id: 'MZ',
    code: 'MZ',
    name: "Mozambique",
    dialCode: '+258',
    flag: '🇲🇿',
    currency: 'MZN',
    currencySymbol: "MT",
    phoneLength: 9,
    samplePhone: '84 123 4567',
    primaryCity: "Maputo",
    aliases: ["mozambique","mz","maputo","matola","beira"],
  },
  {
    id: 'NA',
    code: 'NA',
    name: "Namibie",
    dialCode: '+264',
    flag: '🇳🇦',
    currency: 'NAD',
    currencySymbol: "N$",
    phoneLength: 9,
    samplePhone: '81 123 4567',
    primaryCity: "Windhoek",
    aliases: ["namibie","namibia","na","windhoek"],
  },
  {
    id: 'ST',
    code: 'ST',
    name: "Sao Tomé-et-Principe",
    dialCode: '+239',
    flag: '🇸🇹',
    currency: 'STN',
    currencySymbol: "Db",
    phoneLength: 7,
    samplePhone: '991 2345',
    primaryCity: "São Tomé",
    aliases: ["sao tome","sao tome et principe","sao tome and principe","st"],
  },
  {
    id: 'SC',
    code: 'SC',
    name: "Seychelles",
    dialCode: '+248',
    flag: '🇸🇨',
    currency: 'SCR',
    currencySymbol: "SR",
    phoneLength: 7,
    samplePhone: '2 512 345',
    primaryCity: "Victoria",
    aliases: ["seychelles","sc","victoria","mahe"],
  },
  {
    id: 'SO',
    code: 'SO',
    name: "Somalie",
    dialCode: '+252',
    flag: '🇸🇴',
    currency: 'SOS',
    currencySymbol: "Sh",
    phoneLength: 9,
    samplePhone: '61 123 4567',
    primaryCity: "Mogadiscio",
    aliases: ["somalie","somalia","so","mogadiscio","mogadishu"],
  },
  {
    id: 'SD',
    code: 'SD',
    name: "Soudan",
    dialCode: '+249',
    flag: '🇸🇩',
    currency: 'SDG',
    currencySymbol: "SDG",
    phoneLength: 9,
    samplePhone: '91 123 4567',
    primaryCity: "Khartoum",
    aliases: ["soudan","sudan","sd","khartoum","omdurman"],
  },
  {
    id: 'SS',
    code: 'SS',
    name: "Soudan du Sud",
    dialCode: '+211',
    flag: '🇸🇸',
    currency: 'SSP',
    currencySymbol: "SSP",
    phoneLength: 9,
    samplePhone: '92 123 4567',
    primaryCity: "Djouba",
    aliases: ["soudan du sud","south sudan","ss","djouba","juba"],
  },
  {
    id: 'ZM',
    code: 'ZM',
    name: "Zambie",
    dialCode: '+260',
    flag: '🇿🇲',
    currency: 'ZMW',
    currencySymbol: "ZK",
    phoneLength: 9,
    samplePhone: '97 123 4567',
    primaryCity: "Lusaka",
    aliases: ["zambie","zambia","zm","lusaka","kitwe"],
  },
  {
    id: 'ZW',
    code: 'ZW',
    name: "Zimbabwe",
    dialCode: '+263',
    flag: '🇿🇼',
    currency: 'ZWL',
    currencySymbol: "$",
    phoneLength: 9,
    samplePhone: '77 123 4567',
    primaryCity: "Harare",
    aliases: ["zimbabwe","zw","harare","bulawayo"],
  },
];

export const DEFAULT_COUNTRY = AFRICAN_COUNTRIES[0]; // Sénégal par défaut

/**
 * Normalise un texte de recherche (retire accents, ponctuation et gère phonétique)
 */
export const normalizeCountrySearch = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents (é -> e, ô -> o...)
    .replace(/bourkina/g, 'burkina')
    .replace(/fasso/g, 'faso')
    .replace(/gambia/g, 'gambie')
    .replace(/rdc/g, 'congo')
    .replace(/drc/g, 'congo')
    .replace(/ivory coast/g, 'cote divoire')
    .replace(/[\s\-_']+/g, ' ')
    .trim();
};

/**
 * Filtre les pays africains avec tolérance phonétique et recherche par indicatif ou ville
 */
export const filterAfricanCountries = (query) => {
  if (!query || !query.trim()) return AFRICAN_COUNTRIES;
  
  const rawQuery = query.toLowerCase().trim();
  const normalizedQuery = normalizeCountrySearch(query);
  const cleanDial = rawQuery.replace(/[^0-9]/g, '');

  return AFRICAN_COUNTRIES.filter((country) => {
    // 1. Recherche par nom direct ou normalisé
    const normName = normalizeCountrySearch(country.name);
    if (normName.includes(normalizedQuery) || normName.includes(rawQuery)) return true;

    // 2. Recherche par code ISO ('SN', 'BF', 'GM'...)
    if (country.code.toLowerCase() === rawQuery || country.id.toLowerCase() === rawQuery) return true;

    // 3. Recherche par indicatif téléphonique (+221, 221, +226...)
    if (country.dialCode.includes(rawQuery)) return true;
    if (cleanDial && country.dialCode.replace(/[^0-9]/g, '').includes(cleanDial)) return true;

    // 4. Recherche par alias connus (ex: "bourkina", "bourkina fasso", "gambia", "drc", etc.)
    if (country.aliases && country.aliases.some((alias) => {
      const normAlias = normalizeCountrySearch(alias);
      if (!normAlias) return false;
      if (normAlias.includes(normalizedQuery)) return true;
      if (normAlias.length >= 3 && normalizedQuery.includes(normAlias)) return true;
      return false;
    })) {
      return true;
    }

    // 5. Recherche par ville principale (Dakar, Ouagadougou, Banjul...)
    if (country.primaryCity && normalizeCountrySearch(country.primaryCity).includes(normalizedQuery)) {
      return true;
    }

    return false;
  });
};

/**
 * Recherche un pays par son identifiant ou code ISO ('SN', 'CI', 'BF', 'GM'...)
 */
export const getCountryById = (countryId) => {
  if (!countryId) return DEFAULT_COUNTRY;
  const upper = String(countryId).toUpperCase().trim();
  return AFRICAN_COUNTRIES.find(c => c.id === upper || c.code === upper) || DEFAULT_COUNTRY;
};

/**
 * Recherche un pays par son indicatif ('+221', '+225', '+226', '+220'...)
 */
export const getCountryByDialCode = (dialCode) => {
  if (!dialCode) return DEFAULT_COUNTRY;
  const clean = String(dialCode).trim();
  return AFRICAN_COUNTRIES.find(c => c.dialCode === clean || c.dialCode === `+${clean.replace('+', '')}`) || DEFAULT_COUNTRY;
};

/**
 * Formate un numéro africain au format international E.164 (+221XXXXXXXXX, +226XXXXXXXX...)
 */
export const formatAfricanPhone = (phone, dialCode = '+221') => {
  if (!phone) return '';
  const digits = String(phone).replace(/[^0-9]/g, '');

  for (const c of AFRICAN_COUNTRIES) {
    const rawDial = c.dialCode.replace('+', '');
    if (digits.startsWith(rawDial) && digits.length >= rawDial.length + 6) {
      return `+${digits}`;
    }
  }

  const cleanDial = String(dialCode).startsWith('+') ? dialCode : `+${dialCode}`;
  return `${cleanDial}${digits}`;
};

/**
 * Obtient le numéro sans le préfixe '+' pour l'API Termii
 */
export const getTermiiPlainPhone = (phone, dialCode = '+221') => {
  const formatted = formatAfricanPhone(phone, dialCode);
  return formatted.replace('+', '');
};

export default {
  AFRICAN_COUNTRIES,
  DEFAULT_COUNTRY,
  normalizeCountrySearch,
  filterAfricanCountries,
  getCountryById,
  getCountryByDialCode,
  formatAfricanPhone,
  getTermiiPlainPhone,
};
