import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Votre liste d'universités gérée depuis VS Code
export const UNIVERSITES = [
  { id: 'UCAD', nom: 'UCAD (Dakar)' },
  { id: 'UGB', nom: 'UGB (Saint-Louis)' },
  { id: 'USSEIN', nom: 'USSEIN (Sine Saloum)' },
  { id: 'UASZ', nom: 'UASZ (Ziguinchor)' },
  { id: 'UIDT', nom: 'UIDT (Thiès)' },
  { id: 'UAM', nom: 'UAM (Diamniadio)' },
  { id: 'URDFS', nom: 'URDFS (Dakar-Plateau)' },
  { id: 'USO', nom: 'USO (Tambacounda)' },
  { id: 'ISM', nom: 'ISM (Dakar)' },
  { id: 'IAM', nom: 'IAM (Dakar)' },
  { id: 'SupDeCo', nom: 'SupDeCo (Dakar)' },
  { id: 'ESMT', nom: 'ESMT (Dakar)' },
  { id: 'CESAG', nom: 'CESAG (Dakar)' },
  { id: 'UCAO', nom: 'UCAO (Dakar)' },
  { id: 'DIT', nom: 'DIT (Dakar)' },
  { id: 'AFI-UE', nom: 'AFI-UE (Dakar)' },
  { id: 'ESEBAT', nom: 'ESEBAT (Dakar)' },
  { id: 'CEFAS', nom: 'CEFAS (Dakar)' },

];

// Fonction pour injecter / synchroniser les universités dans Firestore depuis le code
export const uploadUniversitiesToFirebase = async () => {
  try {
    for (const uni of UNIVERSITES) {
      // On utilise l'ID de l'université comme ID du document Firestore (ex: "UCAD", "UGB")
      const docRef = doc(db, "universities", uni.id);
      
      // setDoc avec { merge: true } permet de créer le document s'il n'existe pas, 
      // ou de le mettre à jour s'il existe déjà sans écraser d'autres champs éventuels.
      await setDoc(docRef, {
        nom: uni.nom,
        updatedAt: new Date()
      }, { merge: true });
    }
    console.log("Synchronisation des universités réussie dans Firebase !");
  } catch (error) {
    console.error("Erreur lors de la synchronisation des universités :", error);
  }
};