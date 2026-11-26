/**
 * Répertoire Panafricain des Universités, Établissements et Villes pour Logetudiant
 * Structure : Pays -> Villes Universitaires -> Campus et Établissements
 */

export const PANAFRICAN_DATA = {
  // =========================================================================
  // 1. SÉNÉGAL (🇸🇳)
  // =========================================================================
  SN: {
      "countryId": "SN",
      "countryName": "Sénégal",
      "flag": "🇸🇳",
      "currency": "FCFA",
      "villes": [
          {
              "id": "DAKAR",
              "nom": "Dakar",
              "description": "Capitale & Grand Campus",
              "universites": [
                  {
                      "id": "UCAD",
                      "nom": "UCAD",
                      "nomComplet": "Université Cheikh Anta Diop de Dakar (Fann, Point E)",
                      "zones": [
                          "Fann",
                          "Point E",
                          "Mermoz",
                          "Médina",
                          "Fann Résidence"
                      ]
                  },
                  {
                      "id": "ISM",
                      "nom": "ISM",
                      "nomComplet": "Institut Supérieur de Management (Point E)",
                      "zones": [
                          "Point E",
                          "Fann",
                          "Amitié"
                      ]
                  },
                  {
                      "id": "BEM",
                      "nom": "BEM",
                      "nomComplet": "BEM Management School (Sacré-Cœur)",
                      "zones": [
                          "Sacré-Cœur",
                          "Mermoz",
                          "Liberté"
                      ]
                  },
                  {
                      "id": "ESP",
                      "nom": "ESP",
                      "nomComplet": "École Supérieure Polytechnique (Fann)",
                      "zones": [
                          "Fann",
                          "Corniche Ouest",
                          "Gueule Tapée"
                      ]
                  },
                  {
                      "id": "SUPDECO",
                      "nom": "Sup de Co",
                      "nomComplet": "Groupe Sup de Co Dakar (Point E)",
                      "zones": [
                          "Point E",
                          "Fann",
                          "Médina"
                      ]
                  },
                  {
                      "id": "IAM",
                      "nom": "IAM",
                      "nomComplet": "Institut Africain de Management (Mermoz)",
                      "zones": [
                          "Mermoz",
                          "Ouakam",
                          "Sacré-Cœur"
                      ]
                  },
                  {
                      "id": "ESTM",
                      "nom": "ESTM",
                      "nomComplet": "École Supérieure de Technologie et de Management",
                      "zones": [
                          "Fann",
                          "Point E"
                      ]
                  },
                  {
                      "id": "UAM",
                      "nom": "UAM Diamniadio",
                      "nomComplet": "Université Amadou Mahtar Mbow (Diamniadio)",
                      "zones": [
                          "Diamniadio",
                          "Sébikotane",
                          "Rufisque"
                      ]
                  }
              ]
          },
          {
              "id": "SAINT_LOUIS",
              "nom": "Saint-Louis",
              "description": "Pôle d'excellence du Nord",
              "universites": [
                  {
                      "id": "UGB",
                      "nom": "UGB",
                      "nomComplet": "Université Gaston Berger de Saint-Louis (Sanar)",
                      "zones": [
                          "Sanar",
                          "Ngallenka",
                          "Bango",
                          "Khor",
                          "Saint-Louis Ville"
                      ]
                  }
              ]
          },
          {
              "id": "THIES",
              "nom": "Thiès",
              "description": "Carrefour universitaire",
              "universites": [
                  {
                      "id": "UIDT",
                      "nom": "UIDT",
                      "nomComplet": "Université Iba Der Thiam de Thiès",
                      "zones": [
                          "Thiès Ville",
                          "Cité Senghor",
                          "Dixième",
                          "Mbour"
                      ]
                  }
              ]
          },
          {
              "id": "DIOURBEL_BAMBEY",
              "nom": "Bambey / Diourbel",
              "description": "Grand bassin du Baol",
              "universites": [
                  {
                      "id": "UADB",
                      "nom": "UADB",
                      "nomComplet": "Université Alioune Diop de Bambey",
                      "zones": [
                          "Campus UADB",
                          "Bambey Ville",
                          "Diourbel"
                      ]
                  }
              ]
          },
          {
              "id": "ZIGUINCHOR",
              "nom": "Ziguinchor",
              "description": "Pôle universitaire Sud",
              "universites": [
                  {
                      "id": "UASZ",
                      "nom": "UASZ",
                      "nomComplet": "Université Assane Seck de Ziguinchor",
                      "zones": [
                          "Diabir",
                          "Boucotte",
                          "Néma",
                          "Ziguinchor Ville"
                      ]
                  }
              ]
          },
          {
              "id": "KAOLACK",
              "nom": "Kaolack",
              "description": "Bassin Saloum",
              "universites": [
                  {
                      "id": "USSEIN",
                      "nom": "USSEIN",
                      "nomComplet": "Université du Sine Saloum El-Hâdj Ibrahima NIASS",
                      "zones": [
                          "Sing-Sing",
                          "Kaolack Centre",
                          "Kaffrine"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 2. CÔTE D'IVOIRE (🇨🇮)
  // =========================================================================
  CI: {
      "countryId": "CI",
      "countryName": "Côte d'Ivoire",
      "flag": "🇨🇮",
      "currency": "FCFA",
      "villes": [
          {
              "id": "ABIDJAN",
              "nom": "Abidjan",
              "description": "Capitale économique & Grand pôle universitaire",
              "universites": [
                  {
                      "id": "UFHB",
                      "nom": "UFHB Cocody",
                      "nomComplet": "Université Félix Houphouët-Boigny (Cocody)",
                      "zones": [
                          "Cocody",
                          "Riviera",
                          "II Plateaux",
                          "Blokauss",
                          "Anono"
                      ]
                  },
                  {
                      "id": "UNA",
                      "nom": "UNA Abobo-Adjamé",
                      "nomComplet": "Université Nangui Abrogoua (Abobo / Adjamé)",
                      "zones": [
                          "Abobo",
                          "Adjamé",
                          "Williamsville",
                          "Angré"
                      ]
                  },
                  {
                      "id": "ESATIC",
                      "nom": "ESATIC Treichville",
                      "nomComplet": "École Supérieure Africaine des TIC (Treichville)",
                      "zones": [
                          "Treichville",
                          "Marcory",
                          "Zone 4",
                          "Koumassi"
                      ]
                  },
                  {
                      "id": "ISTC",
                      "nom": "ISTC Polytechnique",
                      "nomComplet": "Institut Supérieur des TIC (Cocody)",
                      "zones": [
                          "Cocody Danga",
                          "Riviera 2",
                          "Saint-Jean"
                      ]
                  },
                  {
                      "id": "ENS_ABIDJAN",
                      "nom": "ENS Abidjan",
                      "nomComplet": "École Normale Supérieure d'Abidjan (Cocody)",
                      "zones": [
                          "Cocody",
                          "Saint-Jean"
                      ]
                  },
                  {
                      "id": "UMI_ABIDJAN",
                      "nom": "Univ Méthodiste",
                      "nomComplet": "Université Méthodiste de Côte d'Ivoire (Cocody)",
                      "zones": [
                          "Cocody",
                          "II Plateaux"
                      ]
                  },
                  {
                      "id": "INP_HB_ABIDJAN",
                      "nom": "Antenne INP-HB",
                      "nomComplet": "Institut National Polytechnique FHB (Antenne Abidjan)",
                      "zones": [
                          "Cocody",
                          "Riviera"
                      ]
                  }
              ]
          },
          {
              "id": "BOUAKE",
              "nom": "Bouaké",
              "description": "Deuxième ville universitaire",
              "universites": [
                  {
                      "id": "UAO",
                      "nom": "UAO Bouaké",
                      "nomComplet": "Université Alassane Ouattara (Campus 1 & 2)",
                      "zones": [
                          "Campus 1",
                          "Campus 2",
                          "Air France",
                          "Koko",
                          "Nimbo"
                      ]
                  }
              ]
          },
          {
              "id": "YAMOUSSOUKRO",
              "nom": "Yamoussoukro",
              "description": "Capitale politique & Grandes Écoles d'Ingénieurs",
              "universites": [
                  {
                      "id": "INP_HB_YAKRO",
                      "nom": "INP-HB Yamoussoukro",
                      "nomComplet": "Institut National Polytechnique Houphouët-Boigny (Grandes Écoles)",
                      "zones": [
                          "INP Centre",
                          "INP Sud",
                          "Morofé",
                          "Dioulabougou"
                      ]
                  }
              ]
          },
          {
              "id": "DALOA",
              "nom": "Daloa",
              "description": "Centre-Ouest",
              "universites": [
                  {
                      "id": "UJLoG",
                      "nom": "UJLoG Daloa",
                      "nomComplet": "Université Jean Lorougnon Guédé (Daloa)",
                      "zones": [
                          "Campus UJLoG",
                          "Lobia",
                          "Kennedy",
                          "Tazibouo"
                      ]
                  }
              ]
          },
          {
              "id": "KORHOGO",
              "nom": "Korhogo",
              "description": "Grand Nord Ivoirien",
              "universites": [
                  {
                      "id": "UPGC",
                      "nom": "UPGC Korhogo",
                      "nomComplet": "Université Péléforo Gon Coulibaly",
                      "zones": [
                          "Campus UPGC",
                          "Koko",
                          "Soba",
                          "Sinistré"
                      ]
                  }
              ]
          },
          {
              "id": "SAN_PEDRO",
              "nom": "San-Pédro",
              "description": "Pôle Portuaire & Universitaire du Sud-Ouest",
              "universites": [
                  {
                      "id": "USP_CI",
                      "nom": "Univ San-Pédro",
                      "nomComplet": "Université de San-Pédro (USP)",
                      "zones": [
                          "Seweke",
                          "Bardo",
                          "Zone Industrielle",
                          "Balmer"
                      ]
                  }
              ]
          },
          {
              "id": "MAN_CI",
              "nom": "Man",
              "description": "Cité des Dix-Huit Montagnes & Pôle Minier",
              "universites": [
                  {
                      "id": "U_MAN",
                      "nom": "Univ Polytechnique de Man",
                      "nomComplet": "Université Polytechnique de Man (U-Man)",
                      "zones": [
                          "Campus U-Man",
                          "Kassiapleu",
                          "Doyagouiné"
                      ]
                  }
              ]
          },
          {
              "id": "BONDOUKOU",
              "nom": "Bondoukou",
              "description": "Région du Gontougo",
              "universites": [
                  {
                      "id": "UBONDOUKOU",
                      "nom": "Univ de Bondoukou",
                      "nomComplet": "Université de Bondoukou",
                      "zones": [
                          "Campus Bondoukou",
                          "Zanzan",
                          "Donzosso"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 3. GUINÉE (🇬🇳)
  // =========================================================================
  GN: {
      "countryId": "GN",
      "countryName": "Guinée",
      "flag": "🇬🇳",
      "currency": "GNF",
      "villes": [
          {
              "id": "CONAKRY",
              "nom": "Conakry",
              "description": "Capitale & Plus grand pôle d'études",
              "universites": [
                  {
                      "id": "UGANC",
                      "nom": "UGANC Donka",
                      "nomComplet": "Université Gamal Abdel Nasser de Conakry (Dixinn)",
                      "zones": [
                          "Dixinn",
                          "Donka",
                          "Belle-Vue",
                          "Camayenne",
                          "Madina"
                      ]
                  },
                  {
                      "id": "UGLC",
                      "nom": "UGLC Sonfonia",
                      "nomComplet": "Université Général Lansana Conté de Sonfonia",
                      "zones": [
                          "Sonfonia",
                          "Cosa",
                          "Wanindara",
                          "Enco 5"
                      ]
                  },
                  {
                      "id": "UKAN",
                      "nom": "Kofi Annan Nongo",
                      "nomComplet": "Université Kofi Annan de Guinée (Nongo)",
                      "zones": [
                          "Nongo",
                          "Kipé",
                          "Taouyah",
                          "Ratoma"
                      ]
                  },
                  {
                      "id": "UNC_GN",
                      "nom": "Univ Nongo Conakry",
                      "nomComplet": "Université Nongo Conakry (UNC)",
                      "zones": [
                          "Nongo",
                          "Kaporo"
                      ]
                  },
                  {
                      "id": "ISIC_KUNTIA",
                      "nom": "ISIC Kountia",
                      "nomComplet": "Institut Supérieur de l'Information et de la Communication",
                      "zones": [
                          "Kountia",
                          "Coyah Road"
                      ]
                  }
              ]
          },
          {
              "id": "KANKAN",
              "nom": "Kankan",
              "description": "Haute-Guinée",
              "universites": [
                  {
                      "id": "UJNK",
                      "nom": "UJNK Kankan",
                      "nomComplet": "Université Julius Nyerere de Kankan",
                      "zones": [
                          "Bordo",
                          "Kankan Centre",
                          "Salamani"
                      ]
                  }
              ]
          },
          {
              "id": "KINDIA",
              "nom": "Kindia",
              "description": "Cité des Agrumes",
              "universites": [
                  {
                      "id": "UKINDIA",
                      "nom": "Univ de Kindia",
                      "nomComplet": "Université de Kindia (Campus Foulaya)",
                      "zones": [
                          "Foulaya",
                          "Caravansérail",
                          "Kindia Centre"
                      ]
                  }
              ]
          },
          {
              "id": "MAMOU",
              "nom": "Mamou",
              "description": "Carrefour de Guinée & Pôle Technologique",
              "universites": [
                  {
                      "id": "IST_MAMOU",
                      "nom": "IST Mamou",
                      "nomComplet": "Institut Supérieur de Technologie de Mamou",
                      "zones": [
                          "Téliko",
                          "Mamou Centre"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 4. CAMEROUN (🇨🇲)
  // =========================================================================
  CM: {
      "countryId": "CM",
      "countryName": "Cameroun",
      "flag": "🇨🇲",
      "currency": "FCFA",
      "villes": [
          {
              "id": "YAOUNDE",
              "nom": "Yaoundé",
              "description": "Capitale politique & Haut lieu académique",
              "universites": [
                  {
                      "id": "UY1",
                      "nom": "UY1 Ngoa-Ekélé",
                      "nomComplet": "Université de Yaoundé I (Ngoa-Ekélé)",
                      "zones": [
                          "Ngoa-Ekélé",
                          "Melen",
                          "Biyem-Assi",
                          "Obili",
                          "Château"
                      ]
                  },
                  {
                      "id": "UY2",
                      "nom": "UY2 Soa",
                      "nomComplet": "Université de Yaoundé II (Soa)",
                      "zones": [
                          "Soa",
                          "Nkoabang",
                          "Essos",
                          "Omnisports"
                      ]
                  },
                  {
                      "id": "ENSPY",
                      "nom": "Polytech Yaoundé",
                      "nomComplet": "École Nationale Supérieure Polytechnique de Yaoundé",
                      "zones": [
                          "Melen",
                          "Ngoa-Ekélé"
                      ]
                  },
                  {
                      "id": "UCAC_YDE",
                      "nom": "UCAC Yaoundé",
                      "nomComplet": "Université Catholique d'Afrique Centrale",
                      "zones": [
                          "Nkolbisson",
                          "Ekounou"
                      ]
                  }
              ]
          },
          {
              "id": "DOUALA",
              "nom": "Douala",
              "description": "Capitale économique",
              "universites": [
                  {
                      "id": "UDLA",
                      "nom": "Univ de Douala",
                      "nomComplet": "Université de Douala (Campus Ange Raphaël)",
                      "zones": [
                          "Ange Raphaël",
                          "Ndogbong",
                          "Bépanda",
                          "Akwa",
                          "Bonamoussadi"
                      ]
                  },
                  {
                      "id": "ESSEC_DLA",
                      "nom": "ESSEC Douala",
                      "nomComplet": "École Supérieure des Sciences Économiques et Commerciales",
                      "zones": [
                          "Ange Raphaël",
                          "Ndogbong"
                      ]
                  },
                  {
                      "id": "IUT_DLA",
                      "nom": "IUT de Douala",
                      "nomComplet": "Institut Universitaire de Technologie de Douala",
                      "zones": [
                          "Ndogbong",
                          "Bassa"
                      ]
                  }
              ]
          },
          {
              "id": "BUEA",
              "nom": "Buea",
              "description": "Sud-Ouest (Silicon Mountain)",
              "universites": [
                  {
                      "id": "UB",
                      "nom": "University of Buea",
                      "nomComplet": "University of Buea (UB)",
                      "zones": [
                          "Molyko",
                          "Clerks Quarters",
                          "Bokwango",
                          "Great Soppo"
                      ]
                  }
              ]
          },
          {
              "id": "DSCHANG",
              "nom": "Dschang",
              "description": "Ouest Cameroun",
              "universites": [
                  {
                      "id": "UDS",
                      "nom": "Univ de Dschang",
                      "nomComplet": "Université de Dschang",
                      "zones": [
                          "Foto",
                          "Campus Principal",
                          "Keleng",
                          "Foréké"
                      ]
                  }
              ]
          },
          {
              "id": "NGAOUNDERE",
              "nom": "Ngaoundéré",
              "description": "Château d'eau du Cameroun",
              "universites": [
                  {
                      "id": "UNGAOUNDERE",
                      "nom": "Univ de Ngaoundéré",
                      "nomComplet": "Université de Ngaoundéré (Campus de Dang)",
                      "zones": [
                          "Dang",
                          "Bini",
                          "Ngaoundéré Centre"
                      ]
                  }
              ]
          },
          {
              "id": "MAROUA",
              "nom": "Maroua",
              "description": "Extrême-Nord Camerounais",
              "universites": [
                  {
                      "id": "UMAROUA",
                      "nom": "Univ de Maroua",
                      "nomComplet": "Université de Maroua (Kongola & Ouro-Tchede)",
                      "zones": [
                          "Kongola",
                          "Ouro-Tchede",
                          "Djiddeo",
                          "Maroua Centre"
                      ]
                  }
              ]
          },
          {
              "id": "BAMENDA",
              "nom": "Bamenda",
              "description": "Nord-Ouest",
              "universites": [
                  {
                      "id": "UBAMENDA",
                      "nom": "University of Bamenda",
                      "nomComplet": "University of Bamenda (Bambili Campus)",
                      "zones": [
                          "Bambili",
                          "Bambui",
                          "Mile 4",
                          "Up Station"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 5. MALI (🇲🇱)
  // =========================================================================
  ML: {
      "countryId": "ML",
      "countryName": "Mali",
      "flag": "🇲🇱",
      "currency": "FCFA",
      "villes": [
          {
              "id": "BAMAKO",
              "nom": "Bamako",
              "description": "Capitale & Colline du savoir",
              "universites": [
                  {
                      "id": "USTTB",
                      "nom": "Univ Sciences & Tech",
                      "nomComplet": "Université des Sciences, des Techniques et des Technologies de Bamako",
                      "zones": [
                          "Badalabougou",
                          "Torokorobougou"
                      ]
                  },
                  {
                      "id": "ULSHB",
                      "nom": "ULSHB Bamako",
                      "nomComplet": "Université des Lettres et Sciences Humaines de Bamako",
                      "zones": [
                          "Badalabougou",
                          "Torokorobougou",
                          "Daoudabougou"
                      ]
                  },
                  {
                      "id": "USJPB",
                      "nom": "Univ Sciences Juridiques",
                      "nomComplet": "Université des Sciences Juridiques et Politiques de Bamako",
                      "zones": [
                          "Badalabougou",
                          "Sabalibougou"
                      ]
                  },
                  {
                      "id": "FMOS",
                      "nom": "FMOS Point G",
                      "nomComplet": "Faculté de Médecine et d'Odonto-Stomatologie (Point G)",
                      "zones": [
                          "Point G",
                          "Koulouba",
                          "Darsalam"
                      ]
                  },
                  {
                      "id": "ENI_ABT",
                      "nom": "ENI-ABT Bamako",
                      "nomComplet": "École Nationale d'Ingénieurs Abderhamane Baba Touré",
                      "zones": [
                          "Darsalam",
                          "Hamdallaye"
                      ]
                  },
                  {
                      "id": "IUG_BKO",
                      "nom": "IUG Bamako",
                      "nomComplet": "Institut Universitaire de Gestion de Bamako",
                      "zones": [
                          "Badalabougou",
                          "Niamakoro"
                      ]
                  }
              ]
          },
          {
              "id": "SEGOU",
              "nom": "Ségou",
              "description": "Cité des Balanzans",
              "universites": [
                  {
                      "id": "USEGOU",
                      "nom": "Univ de Ségou",
                      "nomComplet": "Université de Ségou",
                      "zones": [
                          "Ségou Coura",
                          "Sebougou",
                          "Angoulême"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 6. BÉNIN (🇧🇯)
  // =========================================================================
  BJ: {
      "countryId": "BJ",
      "countryName": "Bénin",
      "flag": "🇧🇯",
      "currency": "FCFA",
      "villes": [
          {
              "id": "COTONOU_CALAVI",
              "nom": "Cotonou & Abomey-Calavi",
              "description": "Grand Campus UAC & Écoles d'Excellence",
              "universites": [
                  {
                      "id": "UAC",
                      "nom": "UAC Calavi",
                      "nomComplet": "Université d'Abomey-Calavi (UAC)",
                      "zones": [
                          "Abomey-Calavi",
                          "Zogbadjè",
                          "Tankpè",
                          "Akassato",
                          "Godomey"
                      ]
                  },
                  {
                      "id": "ENEAM",
                      "nom": "ENEAM Cotonou",
                      "nomComplet": "École Nationale d'Économie Appliquée et de Management",
                      "zones": [
                          "Gbégamey",
                          "Cadjehoun",
                          "Haie Vive",
                          "Akpakpa"
                      ]
                  },
                  {
                      "id": "EPAC",
                      "nom": "EPAC Calavi",
                      "nomComplet": "École Polytechnique d'Abomey-Calavi",
                      "zones": [
                          "Abomey-Calavi",
                          "Zogbadjè"
                      ]
                  },
                  {
                      "id": "FSS_COTONOU",
                      "nom": "FSS Cotonou (Médecine)",
                      "nomComplet": "Faculté des Sciences de la Santé de Cotonou",
                      "zones": [
                          "Champ de Foire",
                          "Cadjehoun"
                      ]
                  },
                  {
                      "id": "ISMA_BENIN",
                      "nom": "ISM Adonaï",
                      "nomComplet": "Institut Supérieur de Management Adonaï (Cotonou)",
                      "zones": [
                          "Maromilitaire",
                          "Cadjehoun"
                      ]
                  }
              ]
          },
          {
              "id": "PARAKOU",
              "nom": "Parakou",
              "description": "Grand Nord Béninois",
              "universites": [
                  {
                      "id": "UP_BJ",
                      "nom": "Univ de Parakou",
                      "nomComplet": "Université de Parakou",
                      "zones": [
                          "Camp Guéma",
                          "Zongo",
                          "Titirou",
                          "Banikanni"
                      ]
                  }
              ]
          },
          {
              "id": "PORTO_NOVO",
              "nom": "Porto-Novo",
              "description": "Capitale Administrative & Ingénierie",
              "universites": [
                  {
                      "id": "UNSTIM_PNOVO",
                      "nom": "UNSTIM Porto-Novo",
                      "nomComplet": "Univ Nat des Sciences, Tech, Ingénierie et Maths (UNSTIM)",
                      "zones": [
                          "Porto-Novo Centre",
                          "Ouando",
                          "Dowa"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 7. TOGO (🇹🇬)
  // =========================================================================
  TG: {
      "countryId": "TG",
      "countryName": "Togo",
      "flag": "🇹🇬",
      "currency": "FCFA",
      "villes": [
          {
              "id": "LOME",
              "nom": "Lomé",
              "description": "Capitale & Campus de Lomé",
              "universites": [
                  {
                      "id": "UL_TG",
                      "nom": "Univ de Lomé",
                      "nomComplet": "Université de Lomé (Campus Nord & Sud)",
                      "zones": [
                          "Campus",
                          "Tokoin",
                          "Adidogomé",
                          "Bè",
                          "Agoè"
                      ]
                  },
                  {
                      "id": "EAMAU",
                      "nom": "EAMAU Lomé",
                      "nomComplet": "École Africaine des Métiers de l'Architecture et de l'Urbanisme",
                      "zones": [
                          "Déckon",
                          "Bè-Kpota"
                      ]
                  },
                  {
                      "id": "IAEC_TG",
                      "nom": "IAEC Lomé",
                      "nomComplet": "Institut Africain d'Administration et d'Études Commerciales",
                      "zones": [
                          "Bè",
                          "Hedzranawoé"
                      ]
                  }
              ]
          },
          {
              "id": "KARA",
              "nom": "Kara",
              "description": "Pôle Universitaire du Nord",
              "universites": [
                  {
                      "id": "UK_TG",
                      "nom": "Univ de Kara",
                      "nomComplet": "Université de Kara",
                      "zones": [
                          "Kara Centre",
                          "Pya",
                          "Lama",
                          "Tomdè"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 8. BURKINA FASO (🇧🇫)
  // =========================================================================
  BF: {
      "countryId": "BF",
      "countryName": "Burkina Faso",
      "flag": "🇧🇫",
      "currency": "FCFA",
      "villes": [
          {
              "id": "OUAGADOUGOU",
              "nom": "Ouagadougou",
              "description": "Capitale & Pôle d'excellence",
              "universites": [
                  {
                      "id": "UJKZ",
                      "nom": "Univ Joseph Ki-Zerbo",
                      "nomComplet": "Université Joseph Ki-Zerbo (Ouaga I)",
                      "zones": [
                          "Zogona",
                          "Dapoya",
                          "Wemtenga",
                          "Gounghin",
                          "Pissy"
                      ]
                  },
                  {
                      "id": "UTS",
                      "nom": "Univ Thomas Sankara",
                      "nomComplet": "Université Thomas Sankara (Ouaga II)",
                      "zones": [
                          "Saaba",
                          "Karpala",
                          "Dassasgho",
                          "Wayalghin"
                      ]
                  },
                  {
                      "id": "IAM_OUAGA",
                      "nom": "IAM Ouagadougou",
                      "nomComplet": "Institut Africain de Management Ouaga",
                      "zones": [
                          "Ouaga 2000",
                          "Patte d'Oie"
                      ]
                  },
                  {
                      "id": "ISIG_BF",
                      "nom": "ISIG International",
                      "nomComplet": "Institut Supérieur d'Informatique et de Gestion",
                      "zones": [
                          "Kalgondé",
                          "Wemtenga"
                      ]
                  },
                  {
                      "id": "2IE_OUAGA",
                      "nom": "Institut 2iE",
                      "nomComplet": "Institut International d'Ingénierie de l'Eau et de l'Environnement (2iE)",
                      "zones": [
                          "Kamboinsé",
                          "Ouaga 2000"
                      ]
                  }
              ]
          },
          {
              "id": "BOBO",
              "nom": "Bobo-Dioulasso",
              "description": "Capitale Économique & Deuxième Pôle Universitaire",
              "universites": [
                  {
                      "id": "UNB",
                      "nom": "Univ Nazi Boni",
                      "nomComplet": "Université Nazi Boni de Bobo-Dioulasso",
                      "zones": [
                          "Nasso",
                          "Accart-Ville",
                          "Bindougousso",
                          "Sarfalao"
                      ]
                  },
                  {
                      "id": "ESUP_BOBO",
                      "nom": "ESUP Bobo",
                      "nomComplet": "École Supérieure Polytechnique de Bobo",
                      "zones": [
                          "Secteur 25",
                          "Accart-Ville"
                      ]
                  }
              ]
          },
          {
              "id": "KOUDOUGOU",
              "nom": "Koudougou",
              "description": "Pôle Universitaire du Centre-Ouest",
              "universites": [
                  {
                      "id": "UNZ_BF",
                      "nom": "Univ Norbert Zongo",
                      "nomComplet": "Université Norbert Zongo de Koudougou",
                      "zones": [
                          "Campus UNZ",
                          "Secteur 1",
                          "Nayalgué",
                          "Palogo"
                      ]
                  }
              ]
          },
          {
              "id": "FADA_NGOURMA",
              "nom": "Fada N'Gourma",
              "description": "Région de l'Est",
              "universites": [
                  {
                      "id": "U_FADA",
                      "nom": "Univ de Fada N'Gourma",
                      "nomComplet": "Université de Fada N'Gourma",
                      "zones": [
                          "Secteur 1",
                          "Secteur 7",
                          "Fada Centre"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 9. RD CONGO (🇨🇩)
  // =========================================================================
  CD: {
      "countryId": "CD",
      "countryName": "RD Congo",
      "flag": "🇨🇩",
      "currency": "USD",
      "villes": [
          {
              "id": "KINSHASA",
              "nom": "Kinshasa",
              "description": "Capitale & Colline Inspirée",
              "universites": [
                  {
                      "id": "UNIKIN",
                      "nom": "UNIKIN Mont Amba",
                      "nomComplet": "Université de Kinshasa (Mont Amba)",
                      "zones": [
                          "Lemba",
                          "Livulu",
                          "Matete",
                          "Ngaba",
                          "Mont-Amba"
                      ]
                  },
                  {
                      "id": "UPN_CD",
                      "nom": "UPN Ngaliema",
                      "nomComplet": "Université Pédagogique Nationale (Ngaliema)",
                      "zones": [
                          "Ngaliema",
                          "Camp Militaire",
                          "Delvaux"
                      ]
                  },
                  {
                      "id": "UPC_CD",
                      "nom": "UPC Lingwala",
                      "nomComplet": "Université Protestante au Congo",
                      "zones": [
                          "Lingwala",
                          "Gombe",
                          "Kalamu"
                      ]
                  },
                  {
                      "id": "UCC_CD",
                      "nom": "UCC Limete",
                      "nomComplet": "Université Catholique du Congo (Limete / Mont-Ngafula)",
                      "zones": [
                          "Limete",
                          "Mont-Ngafula",
                          "Rifflart"
                      ]
                  },
                  {
                      "id": "ISC_KIN",
                      "nom": "ISC Gombe",
                      "nomComplet": "Institut Supérieur de Commerce de Kinshasa",
                      "zones": [
                          "Gombe",
                          "Barumbu",
                          "Kinshasa Ville"
                      ]
                  },
                  {
                      "id": "ISTA_KIN",
                      "nom": "ISTA Ndolo",
                      "nomComplet": "Institut Supérieur des Techniques Appliquées",
                      "zones": [
                          "Ndolo",
                          "Barumbu"
                      ]
                  }
              ]
          },
          {
              "id": "LUBUMBASHI",
              "nom": "Lubumbashi",
              "description": "Capitale du Cuivre",
              "universites": [
                  {
                      "id": "UNILU",
                      "nom": "UNILU Kasapa",
                      "nomComplet": "Université de Lubumbashi (Campus Kasapa)",
                      "zones": [
                          "Kasapa",
                          "Bel-Air",
                          "Golf",
                          "Makomeno"
                      ]
                  }
              ]
          },
          {
              "id": "GOMA",
              "nom": "Goma",
              "description": "Nord-Kivu",
              "universites": [
                  {
                      "id": "UNIGOM",
                      "nom": "UNIGOM Goma",
                      "nomComplet": "Université de Goma",
                      "zones": [
                          "Kyeshero",
                          "Himbi",
                          "Katindo"
                      ]
                  }
              ]
          },
          {
              "id": "KISANGANI",
              "nom": "Kisangani",
              "description": "Province Orientale (Boyoma Singa Mwambe)",
              "universites": [
                  {
                      "id": "UNIKIS",
                      "nom": "UNIKIS Kisangani",
                      "nomComplet": "Université de Kisangani",
                      "zones": [
                          "Kisangani Centre",
                          "Makiso",
                          "Tshopo"
                      ]
                  }
              ]
          },
          {
              "id": "BUKAVU",
              "nom": "Bukavu",
              "description": "Sud-Kivu & Lac Kivu",
              "universites": [
                  {
                      "id": "UOB_BUKAVU",
                      "nom": "Univ Officielle de Bukavu",
                      "nomComplet": "Université Officielle de Bukavu (Karhale)",
                      "zones": [
                          "Karhale",
                          "Ibanda",
                          "Kadutu"
                      ]
                  },
                  {
                      "id": "UCB_BUKAVU",
                      "nom": "Univ Catholique de Bukavu",
                      "nomComplet": "Université Catholique de Bukavu (Bugabo)",
                      "zones": [
                          "Bugabo",
                          "Nguba"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 10. GABON (🇬🇦)
  // =========================================================================
  GA: {
      "countryId": "GA",
      "countryName": "Gabon",
      "flag": "🇬🇦",
      "currency": "FCFA",
      "villes": [
          {
              "id": "LIBREVILLE",
              "nom": "Libreville",
              "description": "Capitale & Grand Pôle",
              "universites": [
                  {
                      "id": "UOB",
                      "nom": "Univ Omar Bongo",
                      "nomComplet": "Université Omar Bongo (UOB)",
                      "zones": [
                          "Boulevard Triomphal",
                          "Montagne Sainte",
                          "Ancien Sobraga",
                          "Nkembo"
                      ]
                  },
                  {
                      "id": "USS_LBV",
                      "nom": "Univ des Sciences de la Santé",
                      "nomComplet": "Université des Sciences de la Santé (Owendo)",
                      "zones": [
                          "Owendo",
                          "Alénakiri",
                          "Barracuda"
                      ]
                  }
              ]
          },
          {
              "id": "FRANCEVILLE",
              "nom": "Franceville",
              "description": "Haut-Ogooué",
              "universites": [
                  {
                      "id": "USTM_GA",
                      "nom": "USTM Masuku",
                      "nomComplet": "Université des Sciences et Techniques de Masuku",
                      "zones": [
                          "Masuku",
                          "Franceville Centre",
                          "Mamékou"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 11. CONGO-BRAZZAVILLE (🇨🇬)
  // =========================================================================
  CG: {
      "countryId": "CG",
      "countryName": "Congo-Brazzaville",
      "flag": "🇨🇬",
      "currency": "FCFA",
      "villes": [
          {
              "id": "BRAZZAVILLE",
              "nom": "Brazzaville",
              "description": "Capitale & Campus Historique",
              "universites": [
                  {
                      "id": "UMNG",
                      "nom": "Univ Marien Ngouabi",
                      "nomComplet": "Université Marien Ngouabi (Bayardelle)",
                      "zones": [
                          "Bayardelle",
                          "Bacongo",
                          "Ouenzé",
                          "Moungali",
                          "Poto-Poto"
                      ]
                  },
                  {
                      "id": "UDSN_CG",
                      "nom": "Univ Denis Sassou-Nguesso",
                      "nomComplet": "Université Denis Sassou-Nguesso (Kintélé)",
                      "zones": [
                          "Kintélé",
                          "Manianga",
                          "Talangaï"
                      ]
                  }
              ]
          },
          {
              "id": "POINTE_NOIRE",
              "nom": "Pointe-Noire",
              "description": "Capitale Économique & Océane",
              "universites": [
                  {
                      "id": "IST_PN",
                      "nom": "IST Pointe-Noire",
                      "nomComplet": "Institut Supérieur de Technologie de Pointe-Noire",
                      "zones": [
                          "Tié-Tié",
                          "Lumumba",
                          "Mvou-Mvou"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 12. NIGER (🇳🇪)
  // =========================================================================
  NE: {
      "countryId": "NE",
      "countryName": "Niger",
      "flag": "🇳🇪",
      "currency": "FCFA",
      "villes": [
          {
              "id": "NIAMEY",
              "nom": "Niamey",
              "description": "Capitale & Grand Pôle Universitaire",
              "universites": [
                  {
                      "id": "UAM_NE",
                      "nom": "Univ Abdou Moumouni",
                      "nomComplet": "Université Abdou Moumouni de Niamey (UAM)",
                      "zones": [
                          "Rive Droite",
                          "Harobanda",
                          "Plateau",
                          "Gamkallé"
                      ]
                  },
                  {
                      "id": "EMIG_NE",
                      "nom": "EMIG Niamey",
                      "nomComplet": "École des Mines, de l'Industrie et de la Géologie",
                      "zones": [
                          "Route de Torodi",
                          "Goudel"
                      ]
                  }
              ]
          },
          {
              "id": "MARADI",
              "nom": "Maradi",
              "description": "Capitale Économique du Niger",
              "universites": [
                  {
                      "id": "UDDM_NE",
                      "nom": "Univ Dan Dicko Dankoulodo",
                      "nomComplet": "Université Dan Dicko Dankoulodo de Maradi",
                      "zones": [
                          "Ali Dan Sofo",
                          "Maradi Centre",
                          "Zaria Road"
                      ]
                  }
              ]
          },
          {
              "id": "TAHOUA",
              "nom": "Tahoua",
              "description": "Ader & Pôle Pastoral",
              "universites": [
                  {
                      "id": "UTAHOUA",
                      "nom": "Univ de Tahoua",
                      "nomComplet": "Université de Tahoua",
                      "zones": [
                          "Tahoua Ville",
                          "Guében Zaki"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 13. TCHAD (🇹🇩)
  // =========================================================================
  TD: {
      "countryId": "TD",
      "countryName": "Tchad",
      "flag": "🇹🇩",
      "currency": "FCFA",
      "villes": [
          {
              "id": "NDJAMENA",
              "nom": "N'Djamena",
              "description": "Capitale & Grand Campus",
              "universites": [
                  {
                      "id": "UNDJ",
                      "nom": "Univ de N'Djamena",
                      "nomComplet": "Université de N'Djamena (Ardep-Djoumal, Farcha, Toukra)",
                      "zones": [
                          "Ardep-Djoumal",
                          "Farcha",
                          "Toukra",
                          "Moursal"
                      ]
                  },
                  {
                      "id": "ENA_TD",
                      "nom": "ENA N'Djamena",
                      "nomComplet": "École Nationale d'Administration du Tchad",
                      "zones": [
                          "Sabangali",
                          "Kabalaye"
                      ]
                  }
              ]
          },
          {
              "id": "MOUNDOU",
              "nom": "Moundou",
              "description": "Capitale Économique du Sud",
              "universites": [
                  {
                      "id": "UMOUNDOU",
                      "nom": "Univ de Moundou",
                      "nomComplet": "Université de Moundou (Campus de Djarabé)",
                      "zones": [
                          "Djarabé",
                          "Moundou Centre",
                          "Dombeu"
                      ]
                  }
              ]
          },
          {
              "id": "ABECHE",
              "nom": "Abéché",
              "description": "Pôle Historique de l'Est",
              "universites": [
                  {
                      "id": "U_ABECHE",
                      "nom": "Univ Adam Barka",
                      "nomComplet": "Université Adam Barka d'Abéché",
                      "zones": [
                          "Abéché Centre",
                          "Goz Amir"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 14. MAROC (🇲🇦)
  // =========================================================================
  MA: {
      "countryId": "MA",
      "countryName": "Maroc",
      "flag": "🇲🇦",
      "currency": "MAD",
      "villes": [
          {
              "id": "RABAT",
              "nom": "Rabat",
              "description": "Capitale & Grande Cité Universitaire",
              "universites": [
                  {
                      "id": "UM5",
                      "nom": "Univ Mohammed V",
                      "nomComplet": "Université Mohammed V de Rabat (Agdal & Souissi)",
                      "zones": [
                          "Agdal",
                          "Souissi",
                          "Madinat Al Irfane",
                          "Hassan",
                          "Diour Jamaa"
                      ]
                  },
                  {
                      "id": "INSEA",
                      "nom": "INSEA Rabat",
                      "nomComplet": "Institut National de Statistique et d'Économie Appliquée",
                      "zones": [
                          "Madinat Al Irfane",
                          "Agdal"
                      ]
                  },
                  {
                      "id": "EMI_RABAT",
                      "nom": "EMI Rabat",
                      "nomComplet": "École Mohammadia d'Ingénieurs (Agdal)",
                      "zones": [
                          "Agdal",
                          "Akkari"
                      ]
                  },
                  {
                      "id": "ENSIAS",
                      "nom": "ENSIAS Rabat",
                      "nomComplet": "École Nationale Supérieure d'Informatique et d'Analyse des Systèmes",
                      "zones": [
                          "Madinat Al Irfane",
                          "Souissi"
                      ]
                  },
                  {
                      "id": "IAV_HASSAN2",
                      "nom": "IAV Hassan II",
                      "nomComplet": "Institut Agronomique et Vétérinaire Hassan II",
                      "zones": [
                          "Madinat Al Irfane",
                          "Agdal"
                      ]
                  }
              ]
          },
          {
              "id": "CASABLANCA",
              "nom": "Casablanca & Mohammedia",
              "description": "Capitale Économique & Premier Pôle Industriel",
              "universites": [
                  {
                      "id": "UH2C",
                      "nom": "Univ Hassan II",
                      "nomComplet": "Université Hassan II de Casablanca (Aïn Chock & Ben M'sik)",
                      "zones": [
                          "Aïn Chock",
                          "Ben M'sik",
                          "Maârif",
                          "Gauthier",
                          "Oasis",
                          "Route d'El Jadida"
                      ]
                  },
                  {
                      "id": "ENSEM_CASA",
                      "nom": "ENSEM Casa",
                      "nomComplet": "École Nationale Supérieure d'Électricité et de Mécanique (Oasis)",
                      "zones": [
                          "Oasis",
                          "Route d'El Jadida"
                      ]
                  },
                  {
                      "id": "ENSET_MOHAMMEDIA",
                      "nom": "ENSET Mohammedia",
                      "nomComplet": "École Normale Supérieure de l'Enseignement Technique",
                      "zones": [
                          "Mohammedia Centre",
                          "El Alia"
                      ]
                  },
                  {
                      "id": "FSJES_MOHAMMEDIA",
                      "nom": "FSJES Mohammedia",
                      "nomComplet": "Faculté des Sciences Juridiques, Économiques et Sociales de Mohammedia",
                      "zones": [
                          "Mohammedia",
                          "Kasbah"
                      ]
                  }
              ]
          },
          {
              "id": "AGADIR",
              "nom": "Agadir",
              "description": "Grand Pôle Universitaire du Souss-Massa & Sud Marocain",
              "universites": [
                  {
                      "id": "UIZ_AGADIR",
                      "nom": "Univ Ibn Zohr",
                      "nomComplet": "Université Ibn Zohr d'Agadir (UIZ - Grand Campus)",
                      "zones": [
                          "Hay Dakhla",
                          "Hay Salam",
                          "Tilila",
                          "Bensergao",
                          "Illigh"
                      ]
                  },
                  {
                      "id": "ENCG_AGADIR",
                      "nom": "ENCG Agadir",
                      "nomComplet": "École Nationale de Commerce et de Gestion d'Agadir",
                      "zones": [
                          "Hay Salam",
                          "Hay Dakhla"
                      ]
                  },
                  {
                      "id": "ENSA_AGADIR",
                      "nom": "ENSA Agadir",
                      "nomComplet": "École Nationale des Sciences Appliquées d'Agadir",
                      "zones": [
                          "Tilila",
                          "Hay Dakhla"
                      ]
                  },
                  {
                      "id": "FSA_AGADIR",
                      "nom": "Faculté des Sciences Agadir",
                      "nomComplet": "Faculté des Sciences d'Agadir (FSA)",
                      "zones": [
                          "Hay Dakhla",
                          "Salam"
                      ]
                  }
              ]
          },
          {
              "id": "MARRAKECH",
              "nom": "Marrakech",
              "description": "Cité Impériale & Pôle Régional Marrakech-Safi",
              "universites": [
                  {
                      "id": "UCA_MA",
                      "nom": "Univ Cadi Ayyad",
                      "nomComplet": "Université Cadi Ayyad de Marrakech (Semlalia / Daoudiate)",
                      "zones": [
                          "Semlalia",
                          "Daoudiate",
                          "Guéliz",
                          "Targa",
                          "Amerchich"
                      ]
                  },
                  {
                      "id": "FMPM_MARRAKECH",
                      "nom": "Faculté Médecine Marrakech",
                      "nomComplet": "Faculté de Médecine et de Pharmacie de Marrakech",
                      "zones": [
                          "Semlalia",
                          "Guéliz"
                      ]
                  },
                  {
                      "id": "ENSA_MARRAKECH",
                      "nom": "ENSA Marrakech",
                      "nomComplet": "École Nationale des Sciences Appliquées de Marrakech",
                      "zones": [
                          "Daoudiate",
                          "Semlalia"
                      ]
                  }
              ]
          },
          {
              "id": "FES",
              "nom": "Fès",
              "description": "Capitale Spirituelle & Académique",
              "universites": [
                  {
                      "id": "USMBA",
                      "nom": "Univ Sidi Mohamed Ben Abdellah",
                      "nomComplet": "Université Sidi Mohamed Ben Abdellah de Fès (Dhar El Mahraz & Route d'Imouzzer)",
                      "zones": [
                          "Dhar El Mahraz",
                          "Route d'Imouzzer",
                          "Narjiss",
                          "Atlas",
                          "Montfleuri"
                      ]
                  },
                  {
                      "id": "ENSA_FES",
                      "nom": "ENSA Fès",
                      "nomComplet": "École Nationale des Sciences Appliquées de Fès",
                      "zones": [
                          "Route d'Imouzzer",
                          "Narjiss"
                      ]
                  },
                  {
                      "id": "FMPF_FES",
                      "nom": "Faculté Médecine Fès",
                      "nomComplet": "Faculté de Médecine et de Pharmacie de Fès",
                      "zones": [
                          "Route de Sidi Hrazem",
                          "Atlas"
                      ]
                  }
              ]
          },
          {
              "id": "TANGER_TETOUAN",
              "nom": "Tanger & Tétouan",
              "description": "Pôle Universitaire du Nord (Détroit & Méditerranée)",
              "universites": [
                  {
                      "id": "UAE_TANGER",
                      "nom": "Univ Abdelmalek Essaâdi",
                      "nomComplet": "Université Abdelmalek Essaâdi (Tanger / Tétouan / Martil)",
                      "zones": [
                          "Tanger Ziaten",
                          "Boukhalef",
                          "Tétouan Centre",
                          "Martil Campus",
                          "M'diq"
                      ]
                  },
                  {
                      "id": "ENCG_TANGER",
                      "nom": "ENCG Tanger",
                      "nomComplet": "École Nationale de Commerce et de Gestion de Tanger",
                      "zones": [
                          "Ziaten",
                          "Boukhalef",
                          "Mesnana"
                      ]
                  },
                  {
                      "id": "FST_TANGER",
                      "nom": "FST Tanger",
                      "nomComplet": "Faculté des Sciences et Techniques de Tanger",
                      "zones": [
                          "Boukhalef",
                          "Gzenaya"
                      ]
                  },
                  {
                      "id": "ENSA_TETOUAN",
                      "nom": "ENSA Tétouan",
                      "nomComplet": "École Nationale des Sciences Appliquées de Tétouan",
                      "zones": [
                          "Martil",
                          "Tétouan"
                      ]
                  }
              ]
          },
          {
              "id": "MEKNES",
              "nom": "Meknès",
              "description": "Ville Ismaélienne & Enseignement Supérieur",
              "universites": [
                  {
                      "id": "UMI_MEKNES",
                      "nom": "Univ Moulay Ismaïl",
                      "nomComplet": "Université Moulay Ismaïl de Meknès (Marjane & Zitoune)",
                      "zones": [
                          "Marjane",
                          "Zitoune",
                          "Toulal",
                          "Hamria"
                      ]
                  },
                  {
                      "id": "ENSAM_MEKNES",
                      "nom": "ENSAM Meknès",
                      "nomComplet": "École Nationale Supérieure d'Arts et Métiers de Meknès",
                      "zones": [
                          "Marjane",
                          "Hamria"
                      ]
                  }
              ]
          },
          {
              "id": "OUJDA",
              "nom": "Oujda",
              "description": "Capitale de l'Oriental",
              "universites": [
                  {
                      "id": "UMP_OUJDA",
                      "nom": "Univ Mohammed Premier",
                      "nomComplet": "Université Mohammed Premier d'Oujda (Campus Al Qods)",
                      "zones": [
                          "Al Qods",
                          "Hay Al Hikma",
                          "Lazaret",
                          "Oujda Centre"
                      ]
                  },
                  {
                      "id": "ENSAO_OUJDA",
                      "nom": "ENSA Oujda",
                      "nomComplet": "École Nationale des Sciences Appliquées d'Oujda",
                      "zones": [
                          "Al Qods",
                          "Hay Al Hikma"
                      ]
                  },
                  {
                      "id": "ENCG_OUJDA",
                      "nom": "ENCG Oujda",
                      "nomComplet": "École Nationale de Commerce et de Gestion d'Oujda",
                      "zones": [
                          "Al Qods",
                          "Lazaret"
                      ]
                  }
              ]
          },
          {
              "id": "KENITRA",
              "nom": "Kénitra",
              "description": "Région du Gharb",
              "universites": [
                  {
                      "id": "UIT_KENITRA",
                      "nom": "Univ Ibn Tofail",
                      "nomComplet": "Université Ibn Tofail de Kénitra (Grand Campus)",
                      "zones": [
                          "Campus Universitaire",
                          "Maamora",
                          "Bir Rami",
                          "Val Fleuri"
                      ]
                  },
                  {
                      "id": "ENSA_KENITRA",
                      "nom": "ENSA Kénitra",
                      "nomComplet": "École Nationale des Sciences Appliquées de Kénitra",
                      "zones": [
                          "Campus Universitaire",
                          "Maamora"
                      ]
                  },
                  {
                      "id": "ENCG_KENITRA",
                      "nom": "ENCG Kénitra",
                      "nomComplet": "École Nationale de Commerce et de Gestion de Kénitra",
                      "zones": [
                          "Campus Universitaire",
                          "Bir Rami"
                      ]
                  }
              ]
          },
          {
              "id": "SETTAT",
              "nom": "Settat",
              "description": "Chaouia-Ouardigha",
              "universites": [
                  {
                      "id": "UH1_SETTAT",
                      "nom": "Univ Hassan 1er",
                      "nomComplet": "Université Hassan 1er de Settat (Complexe Universitaire)",
                      "zones": [
                          "Complexe Universitaire",
                          "Maamora Settat",
                          "Sidi Abdelkrim"
                      ]
                  },
                  {
                      "id": "ENCG_SETTAT",
                      "nom": "ENCG Settat",
                      "nomComplet": "École Nationale de Commerce et de Gestion de Settat",
                      "zones": [
                          "Complexe Universitaire",
                          "Route de Casablanca"
                      ]
                  },
                  {
                      "id": "FST_SETTAT",
                      "nom": "FST Settat",
                      "nomComplet": "Faculté des Sciences et Techniques de Settat",
                      "zones": [
                          "Complexe Universitaire",
                          "Hay Salam"
                      ]
                  }
              ]
          },
          {
              "id": "EL_JADIDA",
              "nom": "El Jadida",
              "description": "Pôle Atlantique Doukkala",
              "universites": [
                  {
                      "id": "UCD_ELJADIDA",
                      "nom": "Univ Chouaib Doukkali",
                      "nomComplet": "Université Chouaib Doukkali d'El Jadida",
                      "zones": [
                          "Campus Universitaire",
                          "Al Qods El Jadida",
                          "Plateau",
                          "Sidi Bouzid"
                      ]
                  },
                  {
                      "id": "ENSA_ELJADIDA",
                      "nom": "ENSA El Jadida",
                      "nomComplet": "École Nationale des Sciences Appliquées d'El Jadida",
                      "zones": [
                          "Route de Dar Bouazza",
                          "Al Qods"
                      ]
                  }
              ]
          },
          {
              "id": "BENGUERIR",
              "nom": "Benguerir",
              "description": "Ville Verte Mohammed VI & Pôle d'Excellence",
              "universites": [
                  {
                      "id": "UM6P_BENGUERIR",
                      "nom": "UM6P Benguerir",
                      "nomComplet": "Université Mohammed VI Polytechnique (UM6P)",
                      "zones": [
                          "Ville Verte Mohammed VI",
                          "Campus UM6P",
                          "Benguerir Centre"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 15. MAURITANIE (🇲🇷)
  // =========================================================================
  MR: {
    countryId: 'MR',
    countryName: 'Mauritanie',
    flag: '🇲🇷',
    currency: 'MRU',
    villes: [
      {
        id: 'NOUAKCHOTT',
        nom: 'Nouakchott',
        description: 'Capitale',
        universites: [
          { id: 'UNA_MR', nom: 'Nouakchott Al Aasriya', nomComplet: 'Université de Nouakchott Al Aasriya', zones: ['Tevragh-Zeina', 'Ksar', 'Sebkha'] }
        ]
      }
    ]
  },

  // =========================================================================
  // 16. RWANDA (🇷🇼)
  // =========================================================================
  RW: {
      "countryId": "RW",
      "countryName": "Rwanda",
      "flag": "🇷🇼",
      "currency": "RWF",
      "villes": [
          {
              "id": "KIGALI",
              "nom": "Kigali",
              "description": "Capital & Innovation Hub",
              "universites": [
                  {
                      "id": "UR_KGL",
                      "nom": "Univ of Rwanda (UR)",
                      "nomComplet": "University of Rwanda (College of Business Gikondo & CST Nyarugenge)",
                      "zones": [
                          "Gikondo",
                          "Nyarugenge",
                          "Remera",
                          "Kacyiru"
                      ]
                  },
                  {
                      "id": "ALU_RW",
                      "nom": "ALU Kigali",
                      "nomComplet": "African Leadership University (Kigali Innovation City)",
                      "zones": [
                          "Bumbogo",
                          "Kigali Innovation City",
                          "Kibagabaga"
                      ]
                  },
                  {
                      "id": "CMU_AFRICA",
                      "nom": "CMU-Africa",
                      "nomComplet": "Carnegie Mellon University Africa (Bumbogo)",
                      "zones": [
                          "Bumbogo",
                          "Ndera"
                      ]
                  },
                  {
                      "id": "AUCA_RW",
                      "nom": "AUCA Masoro",
                      "nomComplet": "Adventist University of Central Africa",
                      "zones": [
                          "Masoro",
                          "Gishushu"
                      ]
                  }
              ]
          },
          {
              "id": "HUYE",
              "nom": "Huye (Butare)",
              "description": "Historic Intellectual & Cultural Capital",
              "universites": [
                  {
                      "id": "UR_HUYE",
                      "nom": "Univ of Rwanda (Huye)",
                      "nomComplet": "University of Rwanda (Huye Main Historic Campus)",
                      "zones": [
                          "Taba",
                          "Ngoma",
                          "Rango",
                          "Huye Centre"
                      ]
                  }
              ]
          },
          {
              "id": "MUSANZE",
              "nom": "Musanze (Ruhengeri)",
              "description": "Northern Province Hub",
              "universites": [
                  {
                      "id": "INES_RUHENGERI",
                      "nom": "INES-Ruhengeri",
                      "nomComplet": "INES-Ruhengeri (Institute of Applied Sciences)",
                      "zones": [
                          "Muhoza",
                          "Musanze Town",
                          "Cyuve"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 17. GHANA (🇬🇭)
  // =========================================================================
  GH: {
      "countryId": "GH",
      "countryName": "Ghana",
      "flag": "🇬🇭",
      "currency": "GHS",
      "villes": [
          {
              "id": "ACCRA",
              "nom": "Accra",
              "description": "Capital & Premier Academic Hub",
              "universites": [
                  {
                      "id": "UG_GH",
                      "nom": "Univ of Ghana Legon",
                      "nomComplet": "University of Ghana (Legon Campus)",
                      "zones": [
                          "Legon",
                          "Madina",
                          "East Legon",
                          "Achimota",
                          "Airport Residential"
                      ]
                  },
                  {
                      "id": "UPSA",
                      "nom": "UPSA Madina",
                      "nomComplet": "University of Professional Studies Accra",
                      "zones": [
                          "Madina",
                          "Legon",
                          "Haatso"
                      ]
                  },
                  {
                      "id": "GIMPA",
                      "nom": "GIMPA Greenhill",
                      "nomComplet": "Ghana Institute of Management and Public Administration",
                      "zones": [
                          "Greenhill",
                          "Achimota",
                          "Legon"
                      ]
                  },
                  {
                      "id": "ATU_ACCRA",
                      "nom": "Accra Tech Univ",
                      "nomComplet": "Accra Technical University (Barnes Road)",
                      "zones": [
                          "Barnes Road",
                          "Tudu",
                          "Adabraka"
                      ]
                  },
                  {
                      "id": "ASHESI",
                      "nom": "Ashesi University",
                      "nomComplet": "Ashesi University (Berekuso)",
                      "zones": [
                          "Berekuso",
                          "Kwabenya",
                          "Comet"
                      ]
                  }
              ]
          },
          {
              "id": "KUMASI",
              "nom": "Kumasi",
              "description": "Ashanti Region Academic Hub",
              "universites": [
                  {
                      "id": "KNUST",
                      "nom": "KNUST Kumasi",
                      "nomComplet": "Kwame Nkrumah University of Science and Technology",
                      "zones": [
                          "KNUST Campus",
                          "Ayeduase",
                          "Kotei",
                          "Boadi",
                          "Bomso"
                      ]
                  },
                  {
                      "id": "KsTU",
                      "nom": "Kumasi Tech Univ",
                      "nomComplet": "Kumasi Technical University",
                      "zones": [
                          "Asafo",
                          "Amakom",
                          "Oforikrom"
                      ]
                  }
              ]
          },
          {
              "id": "CAPE_COAST",
              "nom": "Cape Coast",
              "description": "Historic Educational Citadel",
              "universites": [
                  {
                      "id": "UCC_GH",
                      "nom": "Univ of Cape Coast",
                      "nomComplet": "University of Cape Coast (Old & New Site)",
                      "zones": [
                          "UCC Campus",
                          "Apewosika",
                          "Amamoma",
                          "Kwaprow"
                      ]
                  }
              ]
          },
          {
              "id": "TAMALE",
              "nom": "Tamale",
              "description": "Northern Region Hub",
              "universites": [
                  {
                      "id": "UDS_GH",
                      "nom": "Univ for Dev Studies",
                      "nomComplet": "University for Development Studies (Tamale Campus)",
                      "zones": [
                          "Dungu",
                          "Tamale Central",
                          "Nyankpala"
                      ]
                  }
              ]
          },
          {
              "id": "TAKORADI_TARKWA",
              "nom": "Takoradi & Tarkwa",
              "description": "Western Mining & Oil Region",
              "universites": [
                  {
                      "id": "UMAT_TARKWA",
                      "nom": "UMaT Tarkwa",
                      "nomComplet": "University of Mines and Technology (Tarkwa)",
                      "zones": [
                          "Tarkwa Centre",
                          "Brahabobome"
                      ]
                  },
                  {
                      "id": "TTU_TAKORADI",
                      "nom": "Takoradi Tech Univ",
                      "nomComplet": "Takoradi Technical University",
                      "zones": [
                          "Effia Kuma",
                          "Takoradi Central"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // 18. GAMBIE (🇬🇲)
  // =========================================================================
  GM: {
      "countryId": "GM",
      "countryName": "Gambie",
      "flag": "🇬🇲",
      "currency": "GMD",
      "villes": [
          {
              "id": "BANJUL_SERREKUNDA",
              "nom": "Banjul & Serrekunda",
              "description": "Greater Banjul Area",
              "universites": [
                  {
                      "id": "UTG",
                      "nom": "University of The Gambia",
                      "nomComplet": "University of The Gambia (UTG - Brikama / Kanifing)",
                      "zones": [
                          "Kanifing",
                          "Serrekunda",
                          "Brikama",
                          "Banjul Centre",
                          "Kotu"
                      ]
                  },
                  {
                      "id": "GTTI",
                      "nom": "GTTI Kanifing",
                      "nomComplet": "Gambia Technical Training Institute",
                      "zones": [
                          "Kanifing",
                          "Bakau",
                          "Fajara"
                      ]
                  },
                  {
                      "id": "MDI_GM",
                      "nom": "MDI Gambia",
                      "nomComplet": "Management Development Institute",
                      "zones": [
                          "Kanifing",
                          "Kairaba Avenue"
                      ]
                  },
                  {
                      "id": "AIUWA",
                      "nom": "AIUWA Gambia",
                      "nomComplet": "American International University West Africa",
                      "zones": [
                          "Kanifing",
                          "Brusubi"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // NIGERIA (🇳🇬)
  // =========================================================================
  NG: {
      "countryId": "NG",
      "countryName": "Nigeria",
      "flag": "🇳🇬",
      "currency": "NGN",
      "villes": [
          {
              "id": "LAGOS",
              "nom": "Lagos",
              "description": "Commercial Capital & Major Student Hub",
              "universites": [
                  {
                      "id": "UNILAG",
                      "nom": "UNILAG (Akoka)",
                      "nomComplet": "University of Lagos (Akoka Campus)",
                      "zones": [
                          "Akoka",
                          "Yaba",
                          "Bariga",
                          "Surulere"
                      ]
                  },
                  {
                      "id": "LASU",
                      "nom": "LASU (Ojo)",
                      "nomComplet": "Lagos State University (Ojo Main Campus)",
                      "zones": [
                          "Ojo",
                          "Iba",
                          "Festac",
                          "Alaba"
                      ]
                  },
                  {
                      "id": "YABATECH",
                      "nom": "Yabatech",
                      "nomComplet": "Yaba College of Technology (Yaba)",
                      "zones": [
                          "Yaba",
                          "Ebute Metta",
                          "Akoka"
                      ]
                  },
                  {
                      "id": "PAN_ATLANTIC",
                      "nom": "Pan-Atlantic Univ",
                      "nomComplet": "Pan-Atlantic University (Ibeju-Lekki)",
                      "zones": [
                          "Ibeju-Lekki",
                          "Ajah",
                          "Sangotedo"
                      ]
                  }
              ]
          },
          {
              "id": "ABUJA",
              "nom": "Abuja",
              "description": "Federal Capital Territory",
              "universites": [
                  {
                      "id": "UNIABUJA",
                      "nom": "UniAbuja",
                      "nomComplet": "University of Abuja (Gwagwalada Main Campus)",
                      "zones": [
                          "Gwagwalada",
                          "Airport Road",
                          "Kuje"
                      ]
                  },
                  {
                      "id": "BAZE",
                      "nom": "Baze University",
                      "nomComplet": "Baze University (Jabi)",
                      "zones": [
                          "Jabi",
                          "Utako",
                          "Wuye"
                      ]
                  },
                  {
                      "id": "NILE_UNIV",
                      "nom": "Nile University",
                      "nomComplet": "Nile University of Nigeria (Jabi)",
                      "zones": [
                          "Jabi",
                          "Kado",
                          "Lugbe"
                      ]
                  }
              ]
          },
          {
              "id": "IBADAN",
              "nom": "Ibadan",
              "description": "Premier University City of Nigeria",
              "universites": [
                  {
                      "id": "UI",
                      "nom": "University of Ibadan",
                      "nomComplet": "University of Ibadan (Agbowo Campus)",
                      "zones": [
                          "Agbowo",
                          "Bodija",
                          "Samonda",
                          "Sango"
                      ]
                  },
                  {
                      "id": "THE_POLY_IBADAN",
                      "nom": "The Polytechnic Ibadan",
                      "nomComplet": "The Polytechnic Ibadan (Sango)",
                      "zones": [
                          "Sango",
                          "Eleyele",
                          "Bodija"
                      ]
                  }
              ]
          },
          {
              "id": "NSUKKA_ENUGU",
              "nom": "Nsukka & Enugu",
              "description": "South-East Premier Academic Center",
              "universites": [
                  {
                      "id": "UNN",
                      "nom": "Univ of Nigeria Nsukka",
                      "nomComplet": "University of Nigeria (Nsukka Campus & UNEC Enugu)",
                      "zones": [
                          "Nsukka Town",
                          "Odenigwe",
                          "Independence Layout",
                          "New Haven"
                      ]
                  },
                  {
                      "id": "ESUT",
                      "nom": "ESUT Enugu",
                      "nomComplet": "Enugu State University of Science and Technology (Agbani)",
                      "zones": [
                          "Agbani",
                          "Gariki",
                          "Achara Layout"
                      ]
                  }
              ]
          },
          {
              "id": "ZARIA",
              "nom": "Zaria",
              "description": "Northern Premier Academic Center",
              "universites": [
                  {
                      "id": "ABU_ZARIA",
                      "nom": "Ahmadu Bello Univ",
                      "nomComplet": "Ahmadu Bello University (Samaru & Kongo Campus)",
                      "zones": [
                          "Samaru",
                          "Kongo",
                          "Tudun Wada",
                          "Palladan"
                      ]
                  }
              ]
          },
          {
              "id": "ILE_IFE",
              "nom": "Ile-Ife",
              "description": "Cradle of Yoruba & Great Academic Hub",
              "universites": [
                  {
                      "id": "OAU_IFE",
                      "nom": "Obafemi Awolowo Univ",
                      "nomComplet": "Obafemi Awolowo University (Great Ife Campus)",
                      "zones": [
                          "Campus",
                          "Mayfair",
                          "Asherifa",
                          "Lagere"
                      ]
                  }
              ]
          },
          {
              "id": "BENIN_CITY",
              "nom": "Benin City",
              "description": "Mid-West Academic Center",
              "universites": [
                  {
                      "id": "UNIBEN",
                      "nom": "Univ of Benin",
                      "nomComplet": "University of Benin (Ugbowo & Ekehuan Campus)",
                      "zones": [
                          "Ugbowo",
                          "Ekehuan",
                          "BDPA",
                          "Siluko"
                      ]
                  }
              ]
          },
          {
              "id": "PORT_HARCOURT",
              "nom": "Port Harcourt",
              "description": "Niger Delta Oil City & Student Hub",
              "universites": [
                  {
                      "id": "UNIPORT",
                      "nom": "Univ of Port Harcourt",
                      "nomComplet": "University of Port Harcourt (Choba & Abuja Campus)",
                      "zones": [
                          "Choba",
                          "Alakahia",
                          "Rumuokoro",
                          "Diobu"
                      ]
                  },
                  {
                      "id": "RSU_PH",
                      "nom": "Rivers State Univ",
                      "nomComplet": "Rivers State University (Nkpolu-Oroworukwo)",
                      "zones": [
                          "Nkpolu",
                          "Mile 3",
                          "Rumuola"
                      ]
                  }
              ]
          },
          {
              "id": "KANO",
              "nom": "Kano",
              "description": "Historic Commercial City",
              "universites": [
                  {
                      "id": "BUK_KANO",
                      "nom": "Bayero Univ Kano",
                      "nomComplet": "Bayero University Kano (Old & New Campus Gwarzo Road)",
                      "zones": [
                          "Gwarzo Road",
                          "Kabuga",
                          "Janbulo",
                          "Rijiyar Zaki"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // KENYA (🇰🇪)
  // =========================================================================
  KE: {
      "countryId": "KE",
      "countryName": "Kenya",
      "flag": "🇰🇪",
      "currency": "KES",
      "villes": [
          {
              "id": "NAIROBI",
              "nom": "Nairobi",
              "description": "Capital & Premier Academic Hub",
              "universites": [
                  {
                      "id": "UON",
                      "nom": "Univ of Nairobi (UoN)",
                      "nomComplet": "University of Nairobi (Main, Chiromo, Lower Kabete, Parklands)",
                      "zones": [
                          "CBD",
                          "Parklands",
                          "Chiromo",
                          "Westlands",
                          "Kilimani",
                          "Lower Kabete"
                      ]
                  },
                  {
                      "id": "KU",
                      "nom": "Kenyatta Univ (KU)",
                      "nomComplet": "Kenyatta University (Main Campus Kahawa)",
                      "zones": [
                          "Kahawa Sukari",
                          "Kahawa Wendani",
                          "Ruiru",
                          "Roysambu"
                      ]
                  },
                  {
                      "id": "STRATHMORE",
                      "nom": "Strathmore Univ",
                      "nomComplet": "Strathmore University (Madaraka)",
                      "zones": [
                          "Madaraka",
                          "Nairobi West",
                          "Langata",
                          "South B"
                      ]
                  },
                  {
                      "id": "JKUAT",
                      "nom": "JKUAT Juja",
                      "nomComplet": "Jomo Kenyatta University of Agriculture and Technology (Juja)",
                      "zones": [
                          "Juja",
                          "Thika Road",
                          "Gachororo"
                      ]
                  },
                  {
                      "id": "USIU",
                      "nom": "USIU-Africa",
                      "nomComplet": "United States International University Africa (Roysambu)",
                      "zones": [
                          "Roysambu",
                          "Zimmerman",
                          "Mirema"
                      ]
                  },
                  {
                      "id": "TUK_KENYA",
                      "nom": "Technical Univ of Kenya",
                      "nomComplet": "Technical University of Kenya (Haile Selassie Avenue)",
                      "zones": [
                          "CBD",
                          "Ngara",
                          "South B"
                      ]
                  }
              ]
          },
          {
              "id": "ELDORET",
              "nom": "Eldoret",
              "description": "North Rift Academic Hub",
              "universites": [
                  {
                      "id": "MOI",
                      "nom": "Moi University",
                      "nomComplet": "Moi University (Main Campus Kesses & Town Campus)",
                      "zones": [
                          "Kesses",
                          "Eldoret Town",
                          "Elgon View",
                          "Pioneer"
                      ]
                  },
                  {
                      "id": "UOE_ELDORET",
                      "nom": "Univ of Eldoret",
                      "nomComplet": "University of Eldoret (Chepkoilel)",
                      "zones": [
                          "Chepkoilel",
                          "Marura",
                          "Maili Nne"
                      ]
                  }
              ]
          },
          {
              "id": "MOMBASA",
              "nom": "Mombasa",
              "description": "Coastal Hub & Blue Economy",
              "universites": [
                  {
                      "id": "TUM_MOMBASA",
                      "nom": "Tech Univ of Mombasa",
                      "nomComplet": "Technical University of Mombasa (Tudor)",
                      "zones": [
                          "Tudor",
                          "Nyali",
                          "Mombasa CBD"
                      ]
                  }
              ]
          },
          {
              "id": "NAKURU",
              "nom": "Nakuru",
              "description": "Rift Valley Agricultural Academic Center",
              "universites": [
                  {
                      "id": "EGERTON",
                      "nom": "Egerton University",
                      "nomComplet": "Egerton University (Main Campus Njoro)",
                      "zones": [
                          "Njoro",
                          "Nakuru Town",
                          "Ngata"
                      ]
                  }
              ]
          },
          {
              "id": "KISUMU",
              "nom": "Kisumu",
              "description": "Lake Victoria Region Hub",
              "universites": [
                  {
                      "id": "MASENO",
                      "nom": "Maseno University",
                      "nomComplet": "Maseno University (Siriba & College Campus)",
                      "zones": [
                          "Maseno Town",
                          "Kisumu City",
                          "Milimani"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // ALGÉRIE (🇩🇿)
  // =========================================================================
  DZ: {
      "countryId": "DZ",
      "countryName": "Algérie",
      "flag": "🇩🇿",
      "currency": "DZD",
      "villes": [
          {
              "id": "ALGER",
              "nom": "Alger",
              "description": "Capitale & Grand Pôle Universitaire",
              "universites": [
                  {
                      "id": "UNIV_ALGER1",
                      "nom": "Univ Alger 1 Benkhedda",
                      "nomComplet": "Université Alger 1 Benyoucef Benkhedda (Faculté Centrale & Médecine)",
                      "zones": [
                          "Alger Centre",
                          "Bab El Oued",
                          "Didouche Mourad",
                          "Zighout Youcef"
                      ]
                  },
                  {
                      "id": "USTHB",
                      "nom": "USTHB Bab Ezzouar",
                      "nomComplet": "Université des Sciences et de la Technologie Houari Boumediene",
                      "zones": [
                          "Bab Ezzouar",
                          "El Harrach",
                          "Dar El Beida",
                          "Bordj El Kiffan"
                      ]
                  },
                  {
                      "id": "UNIV_ALGER2",
                      "nom": "Univ Alger 2 Bouzaréah",
                      "nomComplet": "Université Alger 2 Abou El Kacem Saâdallah (Bouzaréah)",
                      "zones": [
                          "Bouzaréah",
                          "Chevalley",
                          "El Biar",
                          "Béni Messous"
                      ]
                  },
                  {
                      "id": "UNIV_ALGER3",
                      "nom": "Univ Alger 3 Dely Ibrahim",
                      "nomComplet": "Université Alger 3 Brahim Soltane Chaibout (Dely Ibrahim)",
                      "zones": [
                          "Dely Ibrahim",
                          "Ben Aknoun",
                          "Chéraga",
                          "Ouled Fayet"
                      ]
                  },
                  {
                      "id": "ENP_ALGER",
                      "nom": "Polytech Alger (ENP)",
                      "nomComplet": "École Nationale Polytechnique d'Alger (El Harrach)",
                      "zones": [
                          "El Harrach",
                          "Belfort",
                          "Mohammadia"
                      ]
                  }
              ]
          },
          {
              "id": "ORAN",
              "nom": "Oran",
              "description": "Capitale de l'Ouest Algérien",
              "universites": [
                  {
                      "id": "UNIV_ORAN1",
                      "nom": "Univ Oran 1 Ben Bella",
                      "nomComplet": "Université d'Oran 1 Ahmed Ben Bella (Es Sénia)",
                      "zones": [
                          "Es Sénia",
                          "Maraval",
                          "Courbet",
                          "Plateau"
                      ]
                  },
                  {
                      "id": "USTO_MB",
                      "nom": "USTO Oran (Mohamed Boudiaf)",
                      "nomComplet": "Université des Sciences et de la Technologie d'Oran Mohamed Boudiaf",
                      "zones": [
                          "Bir El Djir",
                          "El Menzah",
                          "USTO"
                      ]
                  },
                  {
                      "id": "UNIV_ORAN2",
                      "nom": "Univ Oran 2 Ben Ahmed",
                      "nomComplet": "Université d'Oran 2 Mohamed Ben Ahmed (Belgaïd)",
                      "zones": [
                          "Belgaïd",
                          "Bir El Djir",
                          "Canastel"
                      ]
                  }
              ]
          },
          {
              "id": "CONSTANTINE",
              "nom": "Constantine",
              "description": "Ville des Ponts & Cité du Savoir",
              "universites": [
                  {
                      "id": "UNIV_CONST1",
                      "nom": "Univ Constantine 1 (Mentouri)",
                      "nomComplet": "Université Frères Mentouri Constantine 1 (Campus Chaab Ersas)",
                      "zones": [
                          "Zouaghi",
                          "Ain El Bey",
                          "Sidi Mabrouk",
                          "Chaab Ersas"
                      ]
                  },
                  {
                      "id": "UNIV_CONST2",
                      "nom": "Univ Constantine 2 (Mehri)",
                      "nomComplet": "Université Constantine 2 Abdelhamid Mehri (Nouvelle Ville Ali Mendjeli)",
                      "zones": [
                          "Ali Mendjeli",
                          "El Khroub"
                      ]
                  },
                  {
                      "id": "UNIV_CONST3",
                      "nom": "Univ Constantine 3 (Boubnider)",
                      "nomComplet": "Université Constantine 3 Salah Boubnider (Ali Mendjeli)",
                      "zones": [
                          "Ali Mendjeli",
                          "Ain Smara"
                      ]
                  }
              ]
          },
          {
              "id": "ANNABA",
              "nom": "Annaba",
              "description": "Cité Coquette & Pôle Universitaire de l'Est",
              "universites": [
                  {
                      "id": "UNIV_ANNABA",
                      "nom": "Univ Badji Mokhtar",
                      "nomComplet": "Université Badji Mokhtar d'Annaba (Sidi Amar & Chaïba)",
                      "zones": [
                          "Sidi Amar",
                          "Chaïba",
                          "El Bouni",
                          "Plaine Ouest"
                      ]
                  }
              ]
          },
          {
              "id": "SETIF",
              "nom": "Sétif",
              "description": "Capitale des Hauts Plateaux",
              "universites": [
                  {
                      "id": "UNIV_SETIF1",
                      "nom": "Univ Ferhat Abbas Sétif 1",
                      "nomComplet": "Université Ferhat Abbas Sétif 1 (Campus El Bez)",
                      "zones": [
                          "El Bez",
                          "Ain Tebinet",
                          "Sétif Centre"
                      ]
                  },
                  {
                      "id": "UNIV_SETIF2",
                      "nom": "Univ Lamine Debaghine Sétif 2",
                      "nomComplet": "Université Sétif 2 Mohamed Lamine Debaghine (El Bez)",
                      "zones": [
                          "El Bez",
                          "Tandja"
                      ]
                  }
              ]
          },
          {
              "id": "TIZI_OUZOU",
              "nom": "Tizi Ouzou",
              "description": "Grande Kabylie",
              "universites": [
                  {
                      "id": "UNIV_TIZI",
                      "nom": "Univ Mouloud Mammeri",
                      "nomComplet": "Université Mouloud Mammeri de Tizi Ouzou (Hasnaoua & Tamda)",
                      "zones": [
                          "Hasnaoua",
                          "Tamda",
                          "Bastos",
                          "Boukhalfa"
                      ]
                  }
              ]
          },
          {
              "id": "TLEMCEN",
              "nom": "Tlemcen",
              "description": "Cité d'Histoire et d'Art",
              "universites": [
                  {
                      "id": "UNIV_TLEMCEN",
                      "nom": "Univ Abou Bekr Belkaïd",
                      "nomComplet": "Université Abou Bekr Belkaïd de Tlemcen (Chetouane & Imama)",
                      "zones": [
                          "Chetouane",
                          "Imama",
                          "Kiffane",
                          "Mansourah"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // TUNISIE (🇹🇳)
  // =========================================================================
  TN: {
      "countryId": "TN",
      "countryName": "Tunisie",
      "flag": "🇹🇳",
      "currency": "TND",
      "villes": [
          {
              "id": "TUNIS",
              "nom": "Tunis & Grand Tunis",
              "description": "Capitale & Grand Pôle Universitaire",
              "universites": [
                  {
                      "id": "UTUNIS",
                      "nom": "Univ de Tunis",
                      "nomComplet": "Université de Tunis (Centre-Ville, Montfleury, Bab Souika)",
                      "zones": [
                          "Montfleury",
                          "Bab Souika",
                          "Lafayette",
                          "Menzah"
                      ]
                  },
                  {
                      "id": "UTM",
                      "nom": "Tunis El Manar",
                      "nomComplet": "Université de Tunis El Manar (Campus Universitaire El Manar)",
                      "zones": [
                          "El Manar",
                          "Menzah",
                          "Ariana",
                          "Ennasr",
                          "Mutuelleville"
                      ]
                  },
                  {
                      "id": "UCARTHAGE",
                      "nom": "Univ de Carthage",
                      "nomComplet": "Université de Carthage (INSAT, IHEC, Sup'Com, Amilcar)",
                      "zones": [
                          "Centre Urbain Nord",
                          "Carthage",
                          "Amilcar",
                          "Sidi Bou Saïd"
                      ]
                  },
                  {
                      "id": "UMA_TUNIS",
                      "nom": "Univ de la Manouba",
                      "nomComplet": "Université de la Manouba (Campus de la Manouba, ISCAE, ESEN)",
                      "zones": [
                          "Campus Manouba",
                          "Denden",
                          "Bardo"
                      ]
                  },
                  {
                      "id": "INSAT_TUNIS",
                      "nom": "INSAT Tunis",
                      "nomComplet": "Institut National des Sciences Appliquées et de Technologie",
                      "zones": [
                          "Centre Urbain Nord",
                          "Cité El Khadra"
                      ]
                  }
              ]
          },
          {
              "id": "SOUSSE",
              "nom": "Sousse",
              "description": "Perle du Sahel & Pôle Médical/Technologique",
              "universites": [
                  {
                      "id": "USOUSSE",
                      "nom": "Univ de Sousse",
                      "nomComplet": "Université de Sousse (Erriadh, Sahloul & Faculté de Médecine)",
                      "zones": [
                          "Sahloul",
                          "Cité Erriadh",
                          "Kantaoui",
                          "Hammam Sousse"
                      ]
                  },
                  {
                      "id": "ENIS_SOUSSE",
                      "nom": "ENISO Sousse",
                      "nomComplet": "École Nationale d'Ingénieurs de Sousse",
                      "zones": [
                          "Technopôle de Sousse",
                          "Sahloul"
                      ]
                  }
              ]
          },
          {
              "id": "SFAX",
              "nom": "Sfax",
              "description": "Capitale Économique du Sud & Cité Scientifique",
              "universites": [
                  {
                      "id": "USFAX",
                      "nom": "Univ de Sfax",
                      "nomComplet": "Université de Sfax (Route de Soukra & Route de l'Aéroport)",
                      "zones": [
                          "Route de Soukra",
                          "Route de l'Aéroport",
                          "Sakiet Ezzit",
                          "Sakiet Eddaier"
                      ]
                  },
                  {
                      "id": "ENIS_SFAX",
                      "nom": "ENIS Sfax",
                      "nomComplet": "École Nationale d'Ingénieurs de Sfax (Route de Soukra)",
                      "zones": [
                          "Route de Soukra",
                          "Route de Téniour"
                      ]
                  }
              ]
          },
          {
              "id": "MONASTIR",
              "nom": "Monastir",
              "description": "Cité Médicale et Technologique du Sahel",
              "universites": [
                  {
                      "id": "UMONASTIR",
                      "nom": "Univ de Monastir",
                      "nomComplet": "Université de Monastir (Faculté de Pharmacie, Dentaire, ENIM)",
                      "zones": [
                          "Skanès",
                          "Centre-Ville Monastir",
                          "Khniss"
                      ]
                  },
                  {
                      "id": "ENIM_MONASTIR",
                      "nom": "ENIM Monastir",
                      "nomComplet": "École Nationale d'Ingénieurs de Monastir",
                      "zones": [
                          "Route de Kairouan",
                          "Skanès"
                      ]
                  }
              ]
          },
          {
              "id": "KAIROUAN",
              "nom": "Kairouan",
              "description": "Capitale Historique & Centre Universitaire",
              "universites": [
                  {
                      "id": "UKAIROUAN",
                      "nom": "Univ de Kairouan",
                      "nomComplet": "Université de Kairouan (Rakada & Dar El Amen)",
                      "zones": [
                          "Rakada",
                          "Dar El Amen",
                          "Kairouan Centre"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // GUINÉE-BISSAU (🇬🇼)
  // =========================================================================
  GW: {
      "countryId": "GW",
      "countryName": "Guinée-Bissau",
      "flag": "🇬🇼",
      "currency": "FCFA",
      "villes": [
          {
              "id": "BISSAU",
              "nom": "Bissau",
              "description": "Capitale & Centre Universitaire",
              "universites": [
                  {
                      "id": "UAC_GW",
                      "nom": "Univ Amílcar Cabral",
                      "nomComplet": "Universidade Amílcar Cabral (UAC)",
                      "zones": [
                          "Bissau Velho",
                          "Santa Luzia",
                          "Bairro Militar",
                          "Antula"
                      ]
                  },
                  {
                      "id": "ULUSOFONA_GW",
                      "nom": "Univ Lusófona",
                      "nomComplet": "Universidade Lusófona da Guiné",
                      "zones": [
                          "Bairro de Penha",
                          "Praça dos Heróis"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // CAP-VERT (🇨🇻)
  // =========================================================================
  CV: {
      "countryId": "CV",
      "countryName": "Cap-Vert",
      "flag": "🇨🇻",
      "currency": "CVE",
      "villes": [
          {
              "id": "PRAIA",
              "nom": "Praia",
              "description": "Île de Santiago",
              "universites": [
                  {
                      "id": "UNICV",
                      "nom": "Uni-CV Praia",
                      "nomComplet": "Universidade de Cabo Verde (Campus Palmarejo Grande)",
                      "zones": [
                          "Palmarejo Grande",
                          "Palmarejo",
                          "Cidadela",
                          "Achada Santo António"
                      ]
                  },
                  {
                      "id": "UNIPIAGET_CV",
                      "nom": "UniPiaget",
                      "nomComplet": "Universidade Jean Piaget de Cabo Verde",
                      "zones": [
                          "Palmarejo",
                          "Quebra Canela"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // SIERRA LEONE (🇸🇱)
  // =========================================================================
  SL: {
      "countryId": "SL",
      "countryName": "Sierra Leone",
      "flag": "🇸🇱",
      "currency": "SLE",
      "villes": [
          {
              "id": "FREETOWN",
              "nom": "Freetown",
              "description": "Capital City & Mount Aureol",
              "universites": [
                  {
                      "id": "FBC",
                      "nom": "Fourah Bay College",
                      "nomComplet": "Fourah Bay College (USL - Mount Aureol)",
                      "zones": [
                          "Mount Aureol",
                          "Kissy",
                          "Tower Hill",
                          "Congo Cross"
                      ]
                  },
                  {
                      "id": "IPAM",
                      "nom": "IPAM Freetown",
                      "nomComplet": "Institute of Public Administration and Management",
                      "zones": [
                          "Tower Hill",
                          "George Street",
                          "Central Freetown"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // LIBERIA (🇱🇷)
  // =========================================================================
  LR: {
      "countryId": "LR",
      "countryName": "Liberia",
      "flag": "🇱🇷",
      "currency": "LRD",
      "villes": [
          {
              "id": "MONROVIA",
              "nom": "Monrovia",
              "description": "Montserrado County",
              "universites": [
                  {
                      "id": "ULIBERIA",
                      "nom": "University of Liberia",
                      "nomComplet": "University of Liberia (Capitol Hill & Fendall)",
                      "zones": [
                          "Capitol Hill",
                          "Fendall",
                          "Sinkor",
                          "Paynesville"
                      ]
                  },
                  {
                      "id": "STELLA_MARIS",
                      "nom": "Stella Maris Polytech",
                      "nomComplet": "Stella Maris Polytechnic University",
                      "zones": [
                          "Capitol Hill",
                          "Crown Hill"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // CENTRAFRIQUE (🇨🇫)
  // =========================================================================
  CF: {
      "countryId": "CF",
      "countryName": "Centrafrique",
      "flag": "🇨🇫",
      "currency": "FCFA",
      "villes": [
          {
              "id": "BANGUI",
              "nom": "Bangui",
              "description": "Capitale & Grand Pôle",
              "universites": [
                  {
                      "id": "UBANGUI",
                      "nom": "Univ de Bangui",
                      "nomComplet": "Université de Bangui (Campus Central)",
                      "zones": [
                          "Centre-Ville",
                          "Lakouanga",
                          "Fattis",
                          "Gobongo"
                      ]
                  },
                  {
                      "id": "ENS_BANGUI",
                      "nom": "ENS Bangui",
                      "nomComplet": "École Normale Supérieure de Bangui",
                      "zones": [
                          "Boy-Rabe",
                          "Galabadja"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // BURUNDI (🇧🇮)
  // =========================================================================
  BI: {
      "countryId": "BI",
      "countryName": "Burundi",
      "flag": "🇧🇮",
      "currency": "BIF",
      "villes": [
          {
              "id": "BUJUMBURA",
              "nom": "Bujumbura",
              "description": "Capitale Économique",
              "universites": [
                  {
                      "id": "UBURUNDI",
                      "nom": "Univ du Burundi",
                      "nomComplet": "Université du Burundi (Mutanga, Rohero, Kamenge)",
                      "zones": [
                          "Mutanga",
                          "Rohero",
                          "Kamenge",
                          "Kiriri",
                          "Nyakabiga"
                      ]
                  },
                  {
                      "id": "ULUMIERE",
                      "nom": "Univ Lumière",
                      "nomComplet": "Université Lumière de Bujumbura",
                      "zones": [
                          "Kinindo",
                          "Mutanga Nord"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // MADAGASCAR (🇲🇬)
  // =========================================================================
  MG: {
      "countryId": "MG",
      "countryName": "Madagascar",
      "flag": "🇲🇬",
      "currency": "MGA",
      "villes": [
          {
              "id": "ANTANANARIVO",
              "nom": "Antananarivo",
              "description": "Capitale des Hautes Terres & Grand Pôle",
              "universites": [
                  {
                      "id": "UANTANANARIVO",
                      "nom": "Univ d'Antananarivo",
                      "nomComplet": "Université d'Antananarivo (Campus d'Ankatso & Ambohitsaina)",
                      "zones": [
                          "Ankatso",
                          "Ambohitsaina",
                          "Tsimbazaza",
                          "Ankadifotsy",
                          "Mahamasina"
                      ]
                  },
                  {
                      "id": "ISPM_MG",
                      "nom": "ISPM Madagascar",
                      "nomComplet": "Institut Supérieur Polytechnique de Madagascar",
                      "zones": [
                          "Antsobolo",
                          "Ampandrianomby"
                      ]
                  },
                  {
                      "id": "CNTEMAD_MG",
                      "nom": "CNTEMAD",
                      "nomComplet": "Centre National de Télé-Enseignement de Madagascar",
                      "zones": [
                          "Besarety",
                          "Antanimena"
                      ]
                  }
              ]
          },
          {
              "id": "TOAMASINA",
              "nom": "Toamasina (Tamatave)",
              "description": "Grand Port de l'Est",
              "universites": [
                  {
                      "id": "UTOAMASINA",
                      "nom": "Univ de Toamasina",
                      "nomComplet": "Université de Toamasina (Campus de Barikadimy)",
                      "zones": [
                          "Barikadimy",
                          "Salazamay",
                          "Ankirihiry"
                      ]
                  }
              ]
          },
          {
              "id": "FIANARANTSOA",
              "nom": "Fianarantsoa",
              "description": "Capitale Intellectuelle Betsileo",
              "universites": [
                  {
                      "id": "UFIANARANTSOA",
                      "nom": "Univ de Fianarantsoa",
                      "nomComplet": "Université de Fianarantsoa (Campus d'Andrainjato)",
                      "zones": [
                          "Andrainjato",
                          "Ambalapaiso",
                          "Isaha"
                      ]
                  }
              ]
          },
          {
              "id": "MAHAJANGA",
              "nom": "Mahajanga (Majunga)",
              "description": "Cité des Fleurs & Côte Ouest",
              "universites": [
                  {
                      "id": "UMAJUNGA",
                      "nom": "Univ de Mahajanga",
                      "nomComplet": "Université de Mahajanga (Campus d'Ambondrona)",
                      "zones": [
                          "Ambondrona",
                          "Mahabibo",
                          "Mangarivotra"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // OUGANDA (🇺🇬)
  // =========================================================================
  UG: {
      "countryId": "UG",
      "countryName": "Ouganda",
      "flag": "🇺🇬",
      "currency": "UGX",
      "villes": [
          {
              "id": "KAMPALA",
              "nom": "Kampala",
              "description": "Capital & Premier Academic Center",
              "universites": [
                  {
                      "id": "MAKERERE",
                      "nom": "Makerere University",
                      "nomComplet": "Makerere University (Makerere Hill)",
                      "zones": [
                          "Makerere Hill",
                          "Kikoni",
                          "Wandegeya",
                          "Nakulabye"
                      ]
                  },
                  {
                      "id": "KYAMBOGO",
                      "nom": "Kyambogo Univ",
                      "nomComplet": "Kyambogo University (Kyambogo Hill)",
                      "zones": [
                          "Kyambogo",
                          "Banda",
                          "Ntinda",
                          "Kireka"
                      ]
                  },
                  {
                      "id": "KIU_KAMPALA",
                      "nom": "Kampala Int Univ (KIU)",
                      "nomComplet": "Kampala International University (Kansanga)",
                      "zones": [
                          "Kansanga",
                          "Ggaba",
                          "Kabalagala"
                      ]
                  },
                  {
                      "id": "MUBS",
                      "nom": "MUBS Business School",
                      "nomComplet": "Makerere University Business School (Nakawa)",
                      "zones": [
                          "Nakawa",
                          "Bugolobi",
                          "Mbuya"
                      ]
                  }
              ]
          },
          {
              "id": "MBARARA",
              "nom": "Mbarara",
              "description": "Western Academic Center",
              "universites": [
                  {
                      "id": "MUST_UG",
                      "nom": "Mbarara Univ of Sci & Tech",
                      "nomComplet": "Mbarara University of Science and Technology (Kihumuro)",
                      "zones": [
                          "Kihumuro",
                          "Kakoba",
                          "Kamukuzi"
                      ]
                  }
              ]
          },
          {
              "id": "GULU",
              "nom": "Gulu",
              "description": "Northern Hub",
              "universites": [
                  {
                      "id": "GULU_UNIV",
                      "nom": "Gulu University",
                      "nomComplet": "Gulu University (Laroo Campus)",
                      "zones": [
                          "Laroo",
                          "Pece",
                          "Layibi"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // TANZANIE (🇹🇿)
  // =========================================================================
  TZ: {
      "countryId": "TZ",
      "countryName": "Tanzanie",
      "flag": "🇹🇿",
      "currency": "TZS",
      "villes": [
          {
              "id": "DAR_ES_SALAAM",
              "nom": "Dar es Salaam",
              "description": "Commercial Capital & Coastal Academic Hub",
              "universites": [
                  {
                      "id": "UDSM",
                      "nom": "Univ of Dar es Salaam",
                      "nomComplet": "University of Dar es Salaam (Mlimani Main Campus)",
                      "zones": [
                          "Mlimani",
                          "Mwenge",
                          "Ubungo",
                          "Sinza",
                          "Kijitonyama"
                      ]
                  },
                  {
                      "id": "ARDHI",
                      "nom": "Ardhi University",
                      "nomComplet": "Ardhi University (Observation Hill)",
                      "zones": [
                          "Observation Hill",
                          "Makongo",
                          "Mwenge"
                      ]
                  },
                  {
                      "id": "MUHAS",
                      "nom": "MUHAS Health Sciences",
                      "nomComplet": "Muhimbili University of Health and Allied Sciences (Upanga)",
                      "zones": [
                          "Upanga",
                          "Ilala",
                          "Muhimbili"
                      ]
                  },
                  {
                      "id": "DIT_TZ",
                      "nom": "DIT Dar es Salaam",
                      "nomComplet": "Dar es Salaam Institute of Technology",
                      "zones": [
                          "City Centre",
                          "Posta",
                          "Kariakoo"
                      ]
                  }
              ]
          },
          {
              "id": "DODOMA",
              "nom": "Dodoma",
              "description": "National Capital",
              "universites": [
                  {
                      "id": "UDOM_TZ",
                      "nom": "Univ of Dodoma (UDOM)",
                      "nomComplet": "University of Dodoma (UDOM Campus)",
                      "zones": [
                          "UDOM Hill",
                          "Chimwaga",
                          "Kikuyu"
                      ]
                  }
              ]
          },
          {
              "id": "ARUSHA",
              "nom": "Arusha",
              "description": "East African Community Hub & Science Pôle",
              "universites": [
                  {
                      "id": "NM_AIST",
                      "nom": "Nelson Mandela Inst (NM-AIST)",
                      "nomComplet": "Nelson Mandela African Institution of Science and Technology",
                      "zones": [
                          "Tengeru",
                          "Njiro",
                          "Usa River"
                      ]
                  }
              ]
          },
          {
              "id": "MOROGORO",
              "nom": "Morogoro",
              "description": "Agricultural Capital",
              "universites": [
                  {
                      "id": "SUA_MORO",
                      "nom": "Sokoine Univ of Agriculture",
                      "nomComplet": "Sokoine University of Agriculture (SUA Main & Solomon Mahlangu)",
                      "zones": [
                          "Mazimbu",
                          "Forest Hill",
                          "Kilakala"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // ÉGYPTE (🇪🇬)
  // =========================================================================
  EG: {
      "countryId": "EG",
      "countryName": "Égypte",
      "flag": "🇪🇬",
      "currency": "EGP",
      "villes": [
          {
              "id": "LE_CAIRE",
              "nom": "Le Caire & Gizeh",
              "description": "Grand Caire & Premier Pôle Universitaire du Monde Arabe",
              "universites": [
                  {
                      "id": "CAIRO_UNIV",
                      "nom": "Cairo University",
                      "nomComplet": "Cairo University (Main Campus Giza & Kasr Al Ainy Medical)",
                      "zones": [
                          "Giza",
                          "Dokki",
                          "Mohandessin",
                          "Manial",
                          "Zamalek"
                      ]
                  },
                  {
                      "id": "AIN_SHAMS",
                      "nom": "Ain Shams Univ",
                      "nomComplet": "Ain Shams University (Abbassia Campus & Heliopolis)",
                      "zones": [
                          "Abbassia",
                          "Heliopolis",
                          "Nasr City",
                          "Roxy"
                      ]
                  },
                  {
                      "id": "AL_AZHAR",
                      "nom": "Al-Azhar University",
                      "nomComplet": "Al-Azhar University (Nasr City & Darrasa)",
                      "zones": [
                          "Nasr City",
                          "Al-Darrasa",
                          "Abbassia"
                      ]
                  },
                  {
                      "id": "AUC",
                      "nom": "American Univ Cairo",
                      "nomComplet": "The American University in Cairo (New Cairo Campus)",
                      "zones": [
                          "New Cairo",
                          "Tagamoa El Khames",
                          "Rehab City"
                      ]
                  },
                  {
                      "id": "HELWAN_UNIV",
                      "nom": "Helwan University",
                      "nomComplet": "Helwan University (Ain Helwan & Zamalek)",
                      "zones": [
                          "Ain Helwan",
                          "Maadi",
                          "Zamalek"
                      ]
                  }
              ]
          },
          {
              "id": "ALEXANDRIE",
              "nom": "Alexandrie",
              "description": "Perle de la Méditerranée & Grand Campus Côtier",
              "universites": [
                  {
                      "id": "ALEX_UNIV",
                      "nom": "Alexandria Univ",
                      "nomComplet": "Alexandria University (Shatby Campus & Medical Complex)",
                      "zones": [
                          "Shatby",
                          "Camp Caesar",
                          "Sidi Gaber",
                          "Roushdy",
                          "Smouha"
                      ]
                  },
                  {
                      "id": "AASTMT",
                      "nom": "Arab Academy (AASTMT)",
                      "nomComplet": "Arab Academy for Science, Technology and Maritime Transport (Abu Qir)",
                      "zones": [
                          "Abu Qir",
                          "Miami",
                          "Mandara"
                      ]
                  }
              ]
          },
          {
              "id": "MANSOURA",
              "nom": "Mansourah",
              "description": "Capitale Médicale du Delta du Nil",
              "universites": [
                  {
                      "id": "MANSOURA_UNIV",
                      "nom": "Mansoura University",
                      "nomComplet": "Mansoura University (Gomhoria Campus)",
                      "zones": [
                          "Gomhoria",
                          "Gelea",
                          "Toriel",
                          "Hai El Gamaa"
                      ]
                  }
              ]
          },
          {
              "id": "ASSIOUT",
              "nom": "Assiout",
              "description": "Capitale Universitaire de Haute-Égypte",
              "universites": [
                  {
                      "id": "ASSIUT_UNIV",
                      "nom": "Assiut University",
                      "nomComplet": "Assiut University (Al Azhar Street Campus)",
                      "zones": [
                          "Al Hamra",
                          "El Walidia",
                          "Assiut Centre"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // ÉTHIOPIE (🇪🇹)
  // =========================================================================
  ET: {
      "countryId": "ET",
      "countryName": "Éthiopie",
      "flag": "🇪🇹",
      "currency": "ETB",
      "villes": [
          {
              "id": "ADDIS_ABEBA",
              "nom": "Addis-Abeba",
              "description": "Diplomatic & Academic Capital of Africa",
              "universites": [
                  {
                      "id": "AAU",
                      "nom": "Addis Ababa Univ",
                      "nomComplet": "Addis Ababa University (Sidist Kilo & Arat Kilo)",
                      "zones": [
                          "Sidist Kilo",
                          "Arat Kilo",
                          "Piazza",
                          "Bole",
                          "Kazanchis"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // AFRIQUE DU SUD (🇿🇦)
  // =========================================================================
  ZA: {
      "countryId": "ZA",
      "countryName": "Afrique du Sud",
      "flag": "🇿🇦",
      "currency": "ZAR",
      "villes": [
          {
              "id": "JOHANNESBURG",
              "nom": "Johannesburg",
              "description": "Gauteng Commercial & Academic Powerhouse",
              "universites": [
                  {
                      "id": "WITS",
                      "nom": "Wits University",
                      "nomComplet": "University of the Witwatersrand (Braamfontein & Parktown)",
                      "zones": [
                          "Braamfontein",
                          "Parktown",
                          "Auckland Park",
                          "Melville",
                          "Berea"
                      ]
                  },
                  {
                      "id": "UJ",
                      "nom": "Univ of Johannesburg",
                      "nomComplet": "University of Johannesburg (Auckland Park, Doornfontein, Soweto)",
                      "zones": [
                          "Auckland Park",
                          "Brixton",
                          "Westdene",
                          "Doornfontein",
                          "Soweto"
                      ]
                  }
              ]
          },
          {
              "id": "CAPE_TOWN",
              "nom": "Cape Town & Stellenbosch",
              "description": "Western Cape World-Class Academic Hub",
              "universites": [
                  {
                      "id": "UCT",
                      "nom": "Univ of Cape Town",
                      "nomComplet": "University of Cape Town (Rondebosch Upper/Middle/Lower)",
                      "zones": [
                          "Rondebosch",
                          "Rosebank",
                          "Mowbray",
                          "Observatory",
                          "Claremont"
                      ]
                  },
                  {
                      "id": "UWC_ZA",
                      "nom": "Univ of Western Cape",
                      "nomComplet": "University of the Western Cape (Bellville)",
                      "zones": [
                          "Bellville",
                          "Modderdam",
                          "Parow"
                      ]
                  },
                  {
                      "id": "CPUT",
                      "nom": "CPUT Cape Town",
                      "nomComplet": "Cape Peninsula University of Technology (District Six & Bellville)",
                      "zones": [
                          "District Six",
                          "Zonnebloem",
                          "Bellville"
                      ]
                  },
                  {
                      "id": "STELLENBOSCH",
                      "nom": "Stellenbosch Univ",
                      "nomComplet": "Stellenbosch University (Main Campus & Tygerberg Health)",
                      "zones": [
                          "Stellenbosch Central",
                          "Dalsig",
                          "Idas Valley",
                          "Tygerberg"
                      ]
                  }
              ]
          },
          {
              "id": "PRETORIA",
              "nom": "Pretoria",
              "description": "Administrative Capital",
              "universites": [
                  {
                      "id": "UP_ZA",
                      "nom": "Univ of Pretoria",
                      "nomComplet": "University of Pretoria (Hatfield, Hillcrest, Prinshof Medical)",
                      "zones": [
                          "Hatfield",
                          "Brooklyn",
                          "Hillcrest",
                          "Sunnyside",
                          "Menlo Park"
                      ]
                  },
                  {
                      "id": "UNISA",
                      "nom": "UNISA Pretoria",
                      "nomComplet": "University of South Africa (Muckleneuk & Sunnyside Campus)",
                      "zones": [
                          "Muckleneuk",
                          "Sunnyside",
                          "Groenkloof"
                      ]
                  },
                  {
                      "id": "TUT_PRETORIA",
                      "nom": "Tshwane Tech (TUT)",
                      "nomComplet": "Tshwane University of Technology (Pretoria West)",
                      "zones": [
                          "Pretoria West",
                          "Philip Nel Park",
                          "Danville"
                      ]
                  }
              ]
          },
          {
              "id": "DURBAN",
              "nom": "Durban",
              "description": "KwaZulu-Natal Coastal Academic Hub",
              "universites": [
                  {
                      "id": "UKZN",
                      "nom": "Univ of KwaZulu-Natal",
                      "nomComplet": "University of KwaZulu-Natal (Howard College, Westville, Medical)",
                      "zones": [
                          "Howard College",
                          "Glenwood",
                          "Westville",
                          "Manor Gardens",
                          "Berea"
                      ]
                  },
                  {
                      "id": "DUT_DURBAN",
                      "nom": "Durban Tech (DUT)",
                      "nomComplet": "Durban University of Technology (Steve Biko & Ritson Campus)",
                      "zones": [
                          "Berea",
                          "Musgrave",
                          "Durban CBD"
                      ]
                  }
              ]
          },
          {
              "id": "BLOEMFONTEIN",
              "nom": "Bloemfontein",
              "description": "Free State Judicial Capital",
              "universites": [
                  {
                      "id": "UFS_BLOEM",
                      "nom": "Univ of Free State",
                      "nomComplet": "University of the Free State (Bloemfontein Campus)",
                      "zones": [
                          "Universitas",
                          "Brandwag",
                          "Willows",
                          "Westdene"
                      ]
                  }
              ]
          },
          {
              "id": "GQEBERHA",
              "nom": "Gqeberha (Port Elizabeth)",
              "description": "Eastern Cape Hub",
              "universites": [
                  {
                      "id": "NMU_PE",
                      "nom": "Nelson Mandela Univ",
                      "nomComplet": "Nelson Mandela University (Summerstrand South & North Campus)",
                      "zones": [
                          "Summerstrand",
                          "Humewood",
                          "Forest Hill"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // ANGOLA (🇦🇴)
  // =========================================================================
  AO: {
      "countryId": "AO",
      "countryName": "Angola",
      "flag": "🇦🇴",
      "currency": "AOA",
      "villes": [
          {
              "id": "LUANDA",
              "nom": "Luanda",
              "description": "Capitale & Grand Pôle Universitaire",
              "universites": [
                  {
                      "id": "UAN",
                      "nom": "Univ Agostinho Neto",
                      "nomComplet": "Universidade Agostinho Neto (Camama / Belas)",
                      "zones": [
                          "Camama",
                          "Belas",
                          "Maianga",
                          "Ingombota",
                          "Talatona"
                      ]
                  },
                  {
                      "id": "UCAN_AO",
                      "nom": "Univ Católica de Angola",
                      "nomComplet": "Universidade Católica de Angola (Palanca)",
                      "zones": [
                          "Palanca",
                          "Kilamba Kiaxi",
                          "Viana"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // BOTSWANA (🇧🇼)
  // =========================================================================
  BW: {
      "countryId": "BW",
      "countryName": "Botswana",
      "flag": "🇧🇼",
      "currency": "BWP",
      "villes": [
          {
              "id": "GABORONE",
              "nom": "Gaborone",
              "description": "Capital City Hub",
              "universites": [
                  {
                      "id": "UB_BW",
                      "nom": "Univ of Botswana",
                      "nomComplet": "University of Botswana (Notwane)",
                      "zones": [
                          "Extension 4",
                          "Village",
                          "Broadhurst",
                          "G-West"
                      ]
                  },
                  {
                      "id": "BOTHO",
                      "nom": "Botho University",
                      "nomComplet": "Botho University (Kgale)",
                      "zones": [
                          "Kgale View",
                          "Game City",
                          "Phase 2"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // COMORES (🇰🇲)
  // =========================================================================
  KM: {
      "countryId": "KM",
      "countryName": "Comores",
      "flag": "🇰🇲",
      "currency": "KMF",
      "villes": [
          {
              "id": "MORONI",
              "nom": "Moroni",
              "description": "Grande Comore (Ngazidja)",
              "universites": [
                  {
                      "id": "UDDC",
                      "nom": "Univ des Comores",
                      "nomComplet": "Université des Comores (Campus de Mvouni & Corniche)",
                      "zones": [
                          "Mvouni",
                          "Corniche",
                          "Coulée",
                          "Badjanani"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // DJIBOUTI (🇩🇯)
  // =========================================================================
  DJ: {
      "countryId": "DJ",
      "countryName": "Djibouti",
      "flag": "🇩🇯",
      "currency": "DJF",
      "villes": [
          {
              "id": "DJIBOUTI_VILLE",
              "nom": "Djibouti-Ville",
              "description": "Capitale Universitaire",
              "universites": [
                  {
                      "id": "UDJIBOUTI",
                      "nom": "Univ de Djibouti",
                      "nomComplet": "Université de Djibouti (Campus de Balbala)",
                      "zones": [
                          "Balbala",
                          "Heron",
                          "Marabout",
                          "Ambouli"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // GUINÉE ÉQUATORIALE (🇬🇶)
  // =========================================================================
  GQ: {
      "countryId": "GQ",
      "countryName": "Guinée équatoriale",
      "flag": "🇬🇶",
      "currency": "FCFA",
      "villes": [
          {
              "id": "MALABO",
              "nom": "Malabo",
              "description": "Île de Bioko",
              "universites": [
                  {
                      "id": "UNGE_MALABO",
                      "nom": "UNGE Malabo",
                      "nomComplet": "Universidad Nacional de Guinea Ecuatorial (Campus Malabo)",
                      "zones": [
                          "Caracolas",
                          "Malabo II",
                          "Ela Nguema",
                          "Sampaka"
                      ]
                  }
              ]
          },
          {
              "id": "BATA",
              "nom": "Bata",
              "description": "Région Continentale",
              "universites": [
                  {
                      "id": "UNGE_BATA",
                      "nom": "UNGE Bata",
                      "nomComplet": "Universidad Nacional de Guinea Ecuatorial (Campus Bata)",
                      "zones": [
                          "Asonga",
                          "Niefang Road",
                          "Bomudi"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // ÉRYTHRÉE (🇪🇷)
  // =========================================================================
  ER: {
      "countryId": "ER",
      "countryName": "Érythrée",
      "flag": "🇪🇷",
      "currency": "ERN",
      "villes": [
          {
              "id": "ASMARA",
              "nom": "Asmara",
              "description": "Capital City",
              "universites": [
                  {
                      "id": "EIT_ER",
                      "nom": "Eritrea Inst of Tech",
                      "nomComplet": "Eritrea Institute of Technology (Mai Nefhi)",
                      "zones": [
                          "Mai Nefhi",
                          "Godaif",
                          "Tiravolo",
                          "Sembel"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // ESWATINI (🇸🇿)
  // =========================================================================
  SZ: {
      "countryId": "SZ",
      "countryName": "Eswatini",
      "flag": "🇸🇿",
      "currency": "SZL",
      "villes": [
          {
              "id": "KWALUSENI_MBABANE",
              "nom": "Kwaluseni / Mbabane",
              "description": "Academic Corridor",
              "universites": [
                  {
                      "id": "UNESWA",
                      "nom": "Univ of Eswatini",
                      "nomComplet": "University of Eswatini (Kwaluseni Campus)",
                      "zones": [
                          "Kwaluseni",
                          "Matsapha",
                          "Manzini",
                          "Mbabane"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // LESOTHO (🇱🇸)
  // =========================================================================
  LS: {
      "countryId": "LS",
      "countryName": "Lesotho",
      "flag": "🇱🇸",
      "currency": "LSL",
      "villes": [
          {
              "id": "ROMA_MASERU",
              "nom": "Roma / Maseru",
              "description": "Maseru District",
              "universites": [
                  {
                      "id": "NUL_LS",
                      "nom": "National Univ of Lesotho",
                      "nomComplet": "National University of Lesotho (Roma Campus)",
                      "zones": [
                          "Roma Valley",
                          "Maseru Central",
                          "Ha Thetsane"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // LIBYE (🇱🇾)
  // =========================================================================
  LY: {
      "countryId": "LY",
      "countryName": "Libye",
      "flag": "🇱🇾",
      "currency": "LYD",
      "villes": [
          {
              "id": "TRIPOLI",
              "nom": "Tripoli",
              "description": "Capital & University City",
              "universites": [
                  {
                      "id": "UNIV_TRIPOLI",
                      "nom": "Univ of Tripoli",
                      "nomComplet": "University of Tripoli (Al Fernaj)",
                      "zones": [
                          "Al Fernaj",
                          "Ain Zara",
                          "Gargarish",
                          "Souq Al Jumaa"
                      ]
                  }
              ]
          },
          {
              "id": "BENGHAZI",
              "nom": "Benghazi",
              "description": "Cyrenaica Academic Hub",
              "universites": [
                  {
                      "id": "UNIV_BENGHAZI",
                      "nom": "Univ of Benghazi",
                      "nomComplet": "University of Benghazi (Garyounis Campus)",
                      "zones": [
                          "Garyounis",
                          "Al Hawari",
                          "Tabbalino"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // MALAWI (🇲🇼)
  // =========================================================================
  MW: {
      "countryId": "MW",
      "countryName": "Malawi",
      "flag": "🇲🇼",
      "currency": "MWK",
      "villes": [
          {
              "id": "LILONGWE",
              "nom": "Lilongwe",
              "description": "Capital City",
              "universites": [
                  {
                      "id": "LUANAR",
                      "nom": "LUANAR Lilongwe",
                      "nomComplet": "Lilongwe University of Agriculture and Natural Resources",
                      "zones": [
                          "Bunda",
                          "Area 47",
                          "Area 18",
                          "Old Town"
                      ]
                  }
              ]
          },
          {
              "id": "BLANTYRE_ZOMBA",
              "nom": "Blantyre / Zomba",
              "description": "Southern Academic Region",
              "universites": [
                  {
                      "id": "UNIMA",
                      "nom": "Univ of Malawi",
                      "nomComplet": "University of Malawi (Chirunga, Zomba)",
                      "zones": [
                          "Chirunga",
                          "Zomba Town",
                          "Chichiri",
                          "Ndirande"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // MAURICE (🇲🇺)
  // =========================================================================
  MU: {
      "countryId": "MU",
      "countryName": "Maurice",
      "flag": "🇲🇺",
      "currency": "MUR",
      "villes": [
          {
              "id": "REDUIT_PORT_LOUIS",
              "nom": "Réduit & Plaines Wilhems",
              "description": "Campus Universitaire Central",
              "universites": [
                  {
                      "id": "UOM_MU",
                      "nom": "Univ of Mauritius",
                      "nomComplet": "University of Mauritius (Campus de Réduit)",
                      "zones": [
                          "Réduit",
                          "Moka",
                          "Rose Hill",
                          "Ebène Cybercity"
                      ]
                  },
                  {
                      "id": "UDM_MU",
                      "nom": "Univ des Mascareignes",
                      "nomComplet": "Université des Mascareignes (Rose Hill / Camp Levieux)",
                      "zones": [
                          "Rose Hill",
                          "Camp Levieux",
                          "Quatre Bornes"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // MOZAMBIQUE (🇲🇿)
  // =========================================================================
  MZ: {
      "countryId": "MZ",
      "countryName": "Mozambique",
      "flag": "🇲🇿",
      "currency": "MZN",
      "villes": [
          {
              "id": "MAPUTO",
              "nom": "Maputo",
              "description": "Capital & Academic Center",
              "universites": [
                  {
                      "id": "UEM_MZ",
                      "nom": "Univ Eduardo Mondlane",
                      "nomComplet": "Universidade Eduardo Mondlane (Campus Principal)",
                      "zones": [
                          "Sommerschield",
                          "Polana",
                          "Bairro Central",
                          "Alto Maé"
                      ]
                  },
                  {
                      "id": "UP_MAPUTO",
                      "nom": "Univ Pedagógica",
                      "nomComplet": "Universidade Pedagógica de Maputo",
                      "zones": [
                          "Maxaquene",
                          "Malhangalene"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // NAMIBIE (🇳🇦)
  // =========================================================================
  NA: {
      "countryId": "NA",
      "countryName": "Namibie",
      "flag": "🇳🇦",
      "currency": "NAD",
      "villes": [
          {
              "id": "WINDHOEK",
              "nom": "Windhoek",
              "description": "Khomas Region",
              "universites": [
                  {
                      "id": "UNAM_NA",
                      "nom": "Univ of Namibia",
                      "nomComplet": "University of Namibia (Main Campus Pioneers Park)",
                      "zones": [
                          "Pioneers Park",
                          "Hochland Park",
                          "Windhoek West",
                          "Katutura"
                      ]
                  },
                  {
                      "id": "NUST_NA",
                      "nom": "NUST Namibia",
                      "nomComplet": "Namibia University of Science and Technology",
                      "zones": [
                          "Windhoek West",
                          "Windhoek Central",
                          "Klein Windhoek"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // SAO TOMÉ-ET-PRINCIPE (🇸🇹)
  // =========================================================================
  ST: {
      "countryId": "ST",
      "countryName": "Sao Tomé-et-Principe",
      "flag": "🇸🇹",
      "currency": "STN",
      "villes": [
          {
              "id": "SAO_TOME_VILLE",
              "nom": "São Tomé",
              "description": "Capitale Insulaire",
              "universites": [
                  {
                      "id": "USTP",
                      "nom": "Univ de São Tomé",
                      "nomComplet": "Universidade de São Tomé e Príncipe (USTP)",
                      "zones": [
                          "Centro da Cidade",
                          "Quinta de Santo António",
                          "Madre Deus",
                          "Pantufo"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // SEYCHELLES (🇸🇨)
  // =========================================================================
  SC: {
      "countryId": "SC",
      "countryName": "Seychelles",
      "flag": "🇸🇨",
      "currency": "SCR",
      "villes": [
          {
              "id": "VICTORIA_MAHE",
              "nom": "Victoria & Mahé",
              "description": "Île Principale de Mahé",
              "universites": [
                  {
                      "id": "UNISEY",
                      "nom": "Univ of Seychelles",
                      "nomComplet": "University of Seychelles (Anse Royale & Mont Fleuri)",
                      "zones": [
                          "Anse Royale",
                          "Mont Fleuri",
                          "Victoria Centre",
                          "Bel Air"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // SOMALIE (🇸🇴)
  // =========================================================================
  SO: {
      "countryId": "SO",
      "countryName": "Somalie",
      "flag": "🇸🇴",
      "currency": "SOS",
      "villes": [
          {
              "id": "MOGADISCIO",
              "nom": "Mogadiscio",
              "description": "Banaadir Academic Center",
              "universites": [
                  {
                      "id": "SNU_SO",
                      "nom": "Somali National Univ",
                      "nomComplet": "Somali National University (Gaheyr Campus)",
                      "zones": [
                          "Gaheyr",
                          "Hodan",
                          "Wadajir",
                          "KM4",
                          "Hamar Weyne"
                      ]
                  },
                  {
                      "id": "MOGADISHU_UNIV",
                      "nom": "Mogadishu University",
                      "nomComplet": "Mogadishu University (Main Campus)",
                      "zones": [
                          "Yaqshid",
                          "Waberi"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // SOUDAN (🇸🇩)
  // =========================================================================
  SD: {
      "countryId": "SD",
      "countryName": "Soudan",
      "flag": "🇸🇩",
      "currency": "SDG",
      "villes": [
          {
              "id": "KHARTOUM",
              "nom": "Khartoum",
              "description": "Nile Confluence Academic Hub",
              "universites": [
                  {
                      "id": "UNIV_KHARTOUM",
                      "nom": "Univ of Khartoum",
                      "nomComplet": "University of Khartoum (Main Campus Nile Street)",
                      "zones": [
                          "Nile Avenue",
                          "Amirat",
                          "Riyadh",
                          "Omdurman"
                      ]
                  },
                  {
                      "id": "SUST_SD",
                      "nom": "Sudan Univ of Sci & Tech",
                      "nomComplet": "Sudan University of Science and Technology",
                      "zones": [
                          "Mogran",
                          "Al-Amarat"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // SOUDAN DU SUD (🇸🇸)
  // =========================================================================
  SS: {
      "countryId": "SS",
      "countryName": "Soudan du Sud",
      "flag": "🇸🇸",
      "currency": "SSP",
      "villes": [
          {
              "id": "DJOUBA",
              "nom": "Djouba (Juba)",
              "description": "Central Equatoria",
              "universites": [
                  {
                      "id": "UNIV_JUBA",
                      "nom": "University of Juba",
                      "nomComplet": "University of Juba (Main Campus)",
                      "zones": [
                          "Hai Malakal",
                          "Kator",
                          "Munuki",
                          "Gudele",
                          "Atlabara"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // ZAMBIE (🇿🇲)
  // =========================================================================
  ZM: {
      "countryId": "ZM",
      "countryName": "Zambie",
      "flag": "🇿🇲",
      "currency": "ZMW",
      "villes": [
          {
              "id": "LUSAKA",
              "nom": "Lusaka",
              "description": "Capital Academic Hub",
              "universites": [
                  {
                      "id": "UNZA",
                      "nom": "Univ of Zambia",
                      "nomComplet": "University of Zambia (Great East Road Campus)",
                      "zones": [
                          "Great East Road",
                          "Kalingalinga",
                          "Munali",
                          "Jesmondine",
                          "Olympia"
                      ]
                  }
              ]
          },
          {
              "id": "KITWE",
              "nom": "Kitwe",
              "description": "Copperbelt Academic Hub",
              "universites": [
                  {
                      "id": "CBU_ZM",
                      "nom": "Copperbelt Univ",
                      "nomComplet": "Copperbelt University (Riverside)",
                      "zones": [
                          "Riverside",
                          "Parklands",
                          "Nkana"
                      ]
                  }
              ]
          }
      ]
  },

  // =========================================================================
  // ZIMBABWE (🇿🇼)
  // =========================================================================
  ZW: {
      "countryId": "ZW",
      "countryName": "Zimbabwe",
      "flag": "🇿🇼",
      "currency": "ZWL",
      "villes": [
          {
              "id": "HARARE",
              "nom": "Harare",
              "description": "Capital City Academic Hub",
              "universites": [
                  {
                      "id": "UZ_ZW",
                      "nom": "Univ of Zimbabwe",
                      "nomComplet": "University of Zimbabwe (Mount Pleasant)",
                      "zones": [
                          "Mount Pleasant",
                          "Avondale",
                          "Belgravia",
                          "Avenues"
                      ]
                  }
              ]
          },
          {
              "id": "BULAWAYO",
              "nom": "Bulawayo",
              "description": "Matabeleland Hub",
              "universites": [
                  {
                      "id": "NUST_ZW",
                      "nom": "NUST Zimbabwe",
                      "nomComplet": "National University of Science and Technology",
                      "zones": [
                          "Ascot",
                          "Matsheumhlope",
                          "Suburbs"
                      ]
                  }
              ]
          }
      ]
  },
};

/**
 * Récupérer tous les pays enregistrés
 */
export const getAvailableCountries = () => {
  return Object.values(PANAFRICAN_DATA).map(c => ({
    id: c.countryId,
    name: c.countryName,
    flag: c.flag,
    currency: c.currency,
  }));
};

/**
 * Récupérer les données complètes d'un pays
 */
export const getCountryData = (countryId = 'SN') => {
  const code = String(countryId || 'SN').toUpperCase();
  return PANAFRICAN_DATA[code] || PANAFRICAN_DATA['SN'];
};

/**
 * Récupérer les villes d'un pays
 */
export const getVillesByCountry = (countryId = 'SN') => {
  const cData = getCountryData(countryId);
  return cData.villes || [];
};

/**
 * Récupérer les universités d'une ville
 */
export const getUniversitesByCountryAndVille = (countryId = 'SN', villeId) => {
  const villes = getVillesByCountry(countryId);
  const targetVille = villes.find(v => v.id === villeId) || villes[0];
  return targetVille ? targetVille.universites : [];
};

/**
 * Toutes les universités d'un pays donné
 */
export const getAllUniversitesByCountry = (countryId = 'SN') => {
  const villes = getVillesByCountry(countryId);
  const list = [];
  villes.forEach(v => {
    if (v.universites) {
      v.universites.forEach(u => {
        list.push({ ...u, villeId: v.id, villeNom: v.nom });
      });
    }
  });
  return list;
};
