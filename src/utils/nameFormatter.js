/**
 * Utilitaire de formatage et nettoyage des noms d'utilisateurs
 * Supprime les doublons de prénoms (ex: "Daouda Daouda GUISSE" -> "Daouda GUISSE")
 */
export const formatCleanFullName = (userOrName) => {
  if (!userOrName) return 'Utilisateur';

  let rawString = '';

  if (typeof userOrName === 'string') {
    rawString = userOrName.trim();
  } else if (typeof userOrName === 'object') {
    const prenom = (userOrName.prenom || '').trim();
    const nom = (userOrName.nom || '').trim();
    const nomComplet = (userOrName.nomComplet || '').trim();

    if (nomComplet) {
      rawString = nomComplet;
    } else if (prenom && nom) {
      if (nom.toLowerCase().startsWith(prenom.toLowerCase())) {
        rawString = nom;
      } else {
        rawString = `${prenom} ${nom}`;
      }
    } else {
      rawString = nom || prenom || 'Utilisateur';
    }
  }

  if (!rawString) return 'Utilisateur';

  // Découpe les mots et supprime les doublons consécutifs (insensible à la casse)
  const words = rawString.replace(/\s+/g, ' ').split(' ');
  const cleanWords = [];

  for (let i = 0; i < words.length; i++) {
    const current = words[i];
    if (i === 0 || current.toLowerCase() !== words[i - 1].toLowerCase()) {
      cleanWords.push(current);
    }
  }

  return cleanWords.join(' ') || 'Utilisateur';
};

/**
 * Nettoie les champs prénom et nom lors de l'enregistrement
 * Si le nom commence déjà par le prénom, on retire le prénom du nom de famille
 */
export const cleanRegistrationNames = (prenomRaw, nomRaw) => {
  let prenom = (prenomRaw || '').trim().replace(/\s+/g, ' ');
  let nom = (nomRaw || '').trim().replace(/\s+/g, ' ');

  // Si l'utilisateur a tapé son prénom au début de son nom de famille (ex: prenom="Daouda", nom="Daouda GUISSE")
  if (prenom && nom.toLowerCase().startsWith(prenom.toLowerCase())) {
    nom = nom.substring(prenom.length).trim();
  }

  const nomComplet = formatCleanFullName(`${prenom} ${nom}`);

  return { prenom, nom, nomComplet };
};
