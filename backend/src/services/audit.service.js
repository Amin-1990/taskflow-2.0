const db = require('../config/database');

async function logAction({
  ID_Utilisateur,
  Username,
  Action,
  Table_concernee,
  ID_Enregistrement,
  Ancienne_valeur,
  Nouvelle_valeur,
  IP_address,
  User_agent
}) {
  try {
    await db.query(
      `INSERT INTO logs_audit (
        ID_Utilisateur, Username, Action, Table_concernee,
        ID_Enregistrement, Ancienne_valeur, Nouvelle_valeur,
        IP_address, User_agent, Date_action
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        ID_Utilisateur || null,
        Username || null,
        Action,
        Table_concernee,
        ID_Enregistrement || null,
        Ancienne_valeur ? JSON.stringify(Ancienne_valeur) : null,
        Nouvelle_valeur ? JSON.stringify(Nouvelle_valeur) : null,
        IP_address || null,
        User_agent || null
      ]
    );
  } catch (error) {
    console.error('Erreur audit log:', error);
    // Ne pas bloquer l'application si l'audit échoue
  }
}

module.exports = { logAction };