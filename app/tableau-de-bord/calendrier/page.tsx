"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  calendrierAPI,
  EvenementCalendrier,
} from "@/lib/mock-data";
import { Plus, Calendar, CheckCircle, Edit, Trash } from "@/lib/icons";

type VueCalendrier = "mois" | "semaine" | "jour";
type Onglet = "calendrier" | "taches";

export default function CalendrierPage() {
  const [ongletActif, setOngletActif] = useState<Onglet>("calendrier");
  const [vueCalendrier, setVueCalendrier] = useState<VueCalendrier>("mois");
  const [dateCourante, setDateCourante] = useState(new Date());
  const [evenements, setEvenements] = useState<EvenementCalendrier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvenement, setEditingEvenement] = useState<EvenementCalendrier | null>(null);
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    date: "",
    heure: "",
    type: "rdv" as "rdv" | "tache",
    statut: "a-faire" as "a-faire" | "fait",
    typeTache: "autre" as "relance" | "rdv" | "admin" | "autre",
    dateEcheance: "",
    factureId: "",
  });

  useEffect(() => {
    loadEvenements();
  }, []);

  const loadEvenements = () => {
    setEvenements(calendrierAPI.getAll());
  };

  const handleOpenModal = (evenement?: EvenementCalendrier) => {
    if (evenement) {
      setEditingEvenement(evenement);
      setFormData({
        titre: evenement.titre,
        description: evenement.description || "",
        date: evenement.date,
        heure: evenement.heure || "",
        type: evenement.type,
        statut: evenement.statut || "a-faire",
        typeTache: evenement.typeTache || "autre",
        dateEcheance: evenement.dateEcheance || "",
        factureId: evenement.factureId || "",
      });
    } else {
      setEditingEvenement(null);
      setFormData({
        titre: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        heure: "",
        type: ongletActif === "taches" ? "tache" : "rdv",
        statut: "a-faire",
        typeTache: "autre",
        dateEcheance: "",
        factureId: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEvenement(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvenement) {
      calendrierAPI.update(editingEvenement.id, formData);
      if (typeof toast !== "undefined" && toast.success) {
        toast.success("Événement modifié");
      }
    } else {
      calendrierAPI.create(formData);
      if (typeof toast !== "undefined" && toast.success) {
        toast.success("Événement créé");
      }
    }
    loadEvenements();
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      calendrierAPI.delete(id);
      loadEvenements();
      if (typeof toast !== "undefined" && toast.success) {
        toast.success("Événement supprimé");
      }
    }
  };

  const handleToggleStatut = (id: string, statut: "a-faire" | "fait") => {
    calendrierAPI.update(id, { statut: statut === "a-faire" ? "fait" : "a-faire" });
    loadEvenements();
  };

  // Navigation calendrier
  const allerAujourdhui = () => setDateCourante(new Date());
  const moisPrecedent = () => {
    const nouveau = new Date(dateCourante);
    nouveau.setMonth(nouveau.getMonth() - 1);
    setDateCourante(nouveau);
  };
  const moisSuivant = () => {
    const nouveau = new Date(dateCourante);
    nouveau.setMonth(nouveau.getMonth() + 1);
    setDateCourante(nouveau);
  };

  // Générer les jours du mois
  const genererJoursMois = () => {
    const annee = dateCourante.getFullYear();
    const mois = dateCourante.getMonth();
    const premierJour = new Date(annee, mois, 1);
    const dernierJour = new Date(annee, mois + 1, 0);
    const jours: Date[] = [];
    
    // Ajouter les jours du mois précédent pour compléter la première semaine
    const jourDebut = premierJour.getDay() === 0 ? 6 : premierJour.getDay() - 1;
    for (let i = jourDebut - 1; i >= 0; i--) {
      const date = new Date(annee, mois, -i);
      jours.push(date);
    }
    
    // Ajouter les jours du mois
    for (let jour = 1; jour <= dernierJour.getDate(); jour++) {
      jours.push(new Date(annee, mois, jour));
    }
    
    // Ajouter les jours du mois suivant pour compléter la dernière semaine
    const joursRestants = 42 - jours.length;
    for (let jour = 1; jour <= joursRestants; jour++) {
      jours.push(new Date(annee, mois + 1, jour));
    }
    
    return jours;
  };

  const joursMois = genererJoursMois();
  const evenementsParDate = evenements.reduce((acc, evt) => {
    const date = evt.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(evt);
    return acc;
  }, {} as Record<string, EvenementCalendrier[]>);

  const estAujourdhui = (date: Date) => {
    const aujourdhui = new Date();
    return (
      date.getDate() === aujourdhui.getDate() &&
      date.getMonth() === aujourdhui.getMonth() &&
      date.getFullYear() === aujourdhui.getFullYear()
    );
  };

  const estMoisCourant = (date: Date) => {
    return date.getMonth() === dateCourante.getMonth() && date.getFullYear() === dateCourante.getFullYear();
  };

  const getEvenementsJour = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return evenementsParDate[dateStr] || [];
  };

  // Filtrer les tâches
  const taches = evenements.filter((e) => e.type === "tache");
  const tachesAFaire = taches.filter((t) => t.statut !== "fait");
  const tachesFaites = taches.filter((t) => t.statut === "fait");

  const nomsMois = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  const nomsJours = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendrier & Tâches</h1>
          <p className="mt-2 text-white/70">
            Gérez vos rendez-vous et tâches
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {ongletActif === "taches" ? "Nouvelle tâche" : "Nouvel événement"}
        </button>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setOngletActif("calendrier")}
          className={`px-6 py-3 font-medium transition-all flex items-center gap-2 ${
            ongletActif === "calendrier"
              ? "border-b-2 border-[#7C5CFF] text-white"
              : "text-white/70 hover:text-white"
          }`}
        >
          <Calendar className="w-5 h-5" />
          Calendrier
        </button>
        <button
          onClick={() => setOngletActif("taches")}
          className={`px-6 py-3 font-medium transition-all flex items-center gap-2 ${
            ongletActif === "taches"
              ? "border-b-2 border-[#7C5CFF] text-white"
              : "text-white/70 hover:text-white"
          }`}
        >
          <CheckCircle className="w-5 h-5" />
          Tâches
        </button>
      </div>

      {/* Contenu Calendrier */}
      {ongletActif === "calendrier" && (
        <div className="space-y-4">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={moisPrecedent}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                ←
              </button>
              <button
                onClick={allerAujourdhui}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                Aujourd'hui
              </button>
              <button
                onClick={moisSuivant}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                →
              </button>
              <h2 className="text-2xl font-bold">
                {nomsMois[dateCourante.getMonth()]} {dateCourante.getFullYear()}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setVueCalendrier("mois")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  vueCalendrier === "mois"
                    ? "bg-[#7C5CFF]/20 text-white"
                    : "bg-white/10 text-white/70 hover:text-white"
                }`}
              >
                Mois
              </button>
              <button
                onClick={() => setVueCalendrier("semaine")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  vueCalendrier === "semaine"
                    ? "bg-[#7C5CFF]/20 text-white"
                    : "bg-white/10 text-white/70 hover:text-white"
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setVueCalendrier("jour")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  vueCalendrier === "jour"
                    ? "bg-[#7C5CFF]/20 text-white"
                    : "bg-white/10 text-white/70 hover:text-white"
                }`}
              >
                Jour
              </button>
            </div>
          </div>

          {/* Vue Mois */}
          {vueCalendrier === "mois" && (
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-white/10">
                {nomsJours.map((jour) => (
                  <div key={jour} className="bg-white/5 p-2 text-center text-sm font-semibold text-white/90">
                    {jour}
                  </div>
                ))}
                {joursMois.map((date, index) => {
                  const evenementsJour = getEvenementsJour(date);
                  const estMoisActuel = estMoisCourant(date);
                  const estAujourdhuiDate = estAujourdhui(date);
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 bg-[#0B0B0F] ${
                        !estMoisActuel ? "opacity-30" : ""
                      } ${estAujourdhuiDate ? "ring-2 ring-[#7C5CFF]" : ""}`}
                    >
                      <div className={`text-sm mb-1 ${estAujourdhuiDate ? "font-bold text-[#7C5CFF]" : "text-white/70"}`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {evenementsJour.slice(0, 2).map((evt) => (
                          <div
                            key={evt.id}
                            className={`text-xs p-1 rounded truncate ${
                              evt.type === "rdv"
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-green-500/20 text-green-300"
                            }`}
                            title={evt.titre}
                          >
                            {evt.heure ? `${evt.heure} ` : ""}{evt.titre}
                          </div>
                        ))}
                        {evenementsJour.length > 2 && (
                          <div className="text-xs text-white/50">
                            +{evenementsJour.length - 2} autre(s)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vue Semaine/Jour - Liste simplifiée */}
          {(vueCalendrier === "semaine" || vueCalendrier === "jour") && (
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
              <div className="divide-y divide-white/10">
                {Object.keys(evenementsParDate)
                  .sort()
                  .filter((date) => {
                    const dateEvt = new Date(date);
                    if (vueCalendrier === "jour") {
                      return estAujourdhui(dateEvt);
                    }
                    // Semaine: afficher les 7 prochains jours
                    const aujourdhui = new Date();
                    const dans7Jours = new Date(aujourdhui);
                    dans7Jours.setDate(dans7Jours.getDate() + 7);
                    return dateEvt >= aujourdhui && dateEvt <= dans7Jours;
                  })
                  .map((date) => (
                    <div key={date} className="p-6">
                      <h3 className="text-lg font-semibold mb-4 text-white/90">
                        {new Date(date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>
                      <div className="space-y-3">
                        {evenementsParDate[date].map((evt) => (
                          <div
                            key={evt.id}
                            className="flex items-start justify-between p-4 rounded-lg border border-white/10 bg-black/20 hover:bg-black/30 transition-all"
                          >
                            <div className="flex items-start gap-4 flex-1">
                              <div className="mt-1">
                                {evt.type === "rdv" ? (
                                  <Calendar className="w-5 h-5 text-blue-300" />
                                ) : (
                                  <CheckCircle className="w-5 h-5 text-green-300" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{evt.titre}</div>
                                {evt.description && (
                                  <div className="text-sm text-white/70 mt-1">
                                    {evt.description}
                                  </div>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
                                  {evt.heure && <span>à {evt.heure}</span>}
                                  <span className="px-2 py-0.5 rounded bg-white/10 text-xs">
                                    {evt.type === "rdv" ? "Rendez-vous" : "Tâche"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenModal(evt)}
                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-sm flex items-center justify-center"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(evt.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all text-sm flex items-center justify-center"
                                title="Supprimer"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contenu Tâches */}
      {ongletActif === "taches" && (
        <div className="space-y-6">
          {/* Tâches à faire */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4">À faire ({tachesAFaire.length})</h2>
            {tachesAFaire.length === 0 ? (
              <p className="text-white/70">Aucune tâche à faire</p>
            ) : (
              <div className="space-y-3">
                {tachesAFaire.map((tache) => (
                  <div
                    key={tache.id}
                    className="flex items-start justify-between p-4 rounded-lg border border-white/10 bg-black/20 hover:bg-black/30 transition-all"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <button
                        onClick={() => handleToggleStatut(tache.id, tache.statut || "a-faire")}
                        className="w-5 h-5 rounded border-2 border-white/30 hover:border-[#7C5CFF] transition-all mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{tache.titre}</div>
                        {tache.description && (
                          <div className="text-sm text-white/70 mt-1">{tache.description}</div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
                          {tache.dateEcheance && (
                            <span>Échéance: {tache.dateEcheance}</span>
                          )}
                          {tache.typeTache && (
                            <span className="px-2 py-0.5 rounded bg-white/10 text-xs">
                              {tache.typeTache === "relance" && "Relance"}
                              {tache.typeTache === "rdv" && "Rendez-vous"}
                              {tache.typeTache === "admin" && "Admin"}
                              {tache.typeTache === "autre" && "Autre"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(tache)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-sm flex items-center justify-center"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tache.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all text-sm flex items-center justify-center"
                        title="Supprimer"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tâches faites */}
          {tachesFaites.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm opacity-60">
              <h2 className="text-xl font-semibold mb-4">Faites ({tachesFaites.length})</h2>
              <div className="space-y-3">
                {tachesFaites.map((tache) => (
                  <div
                    key={tache.id}
                    className="flex items-start justify-between p-4 rounded-lg border border-white/10 bg-black/20"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <button
                        onClick={() => handleToggleStatut(tache.id, "fait")}
                        className="w-5 h-5 rounded bg-green-500 border-2 border-green-500 flex items-center justify-center mt-0.5"
                      >
                        ✓
                      </button>
                      <div className="flex-1">
                        <div className="font-medium line-through text-white/50">{tache.titre}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(tache.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all text-sm flex items-center justify-center"
                        title="Supprimer"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0B0B0F] border border-white/10 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingEvenement ? "Modifier" : ongletActif === "taches" ? "Nouvelle tâche" : "Nouvel événement"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "rdv" | "tache",
                    })
                  }
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                >
                  <option value="rdv">Rendez-vous</option>
                  <option value="tache">Tâche</option>
                </select>
              </div>
              {formData.type === "tache" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Type de tâche
                    </label>
                    <select
                      value={formData.typeTache}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          typeTache: e.target.value as "relance" | "rdv" | "admin" | "autre",
                        })
                      }
                      className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                    >
                      <option value="relance">Relance</option>
                      <option value="rdv">Rendez-vous</option>
                      <option value="admin">Admin</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Statut
                    </label>
                    <select
                      value={formData.statut}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          statut: e.target.value as "a-faire" | "fait",
                        })
                      }
                      className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                    >
                      <option value="a-faire">À faire</option>
                      <option value="fait">Fait</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Date d'échéance
                    </label>
                    <input
                      type="date"
                      value={formData.dateEcheance}
                      onChange={(e) =>
                        setFormData({ ...formData, dateEcheance: e.target.value })
                      }
                      className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titre}
                  onChange={(e) =>
                    setFormData({ ...formData, titre: e.target.value })
                  }
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Heure (optionnel)
                </label>
                <input
                  type="time"
                  value={formData.heure}
                  onChange={(e) =>
                    setFormData({ ...formData, heure: e.target.value })
                  }
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all"
                >
                  {editingEvenement ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
