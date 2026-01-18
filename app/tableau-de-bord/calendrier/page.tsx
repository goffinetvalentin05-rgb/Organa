"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  calendrierAPI,
  EvenementCalendrier,
} from "@/lib/mock-data";
import { Plus, Calendar, CheckCircle, Edit, Trash } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";

type VueCalendrier = "calendrier" | "liste";
type Onglet = "calendrier" | "taches";

export default function CalendrierPage() {
  const { t, locale } = useI18n();
  const [ongletActif, setOngletActif] = useState<Onglet>("calendrier");
  const [vueCalendrier, setVueCalendrier] = useState<VueCalendrier>("calendrier");
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
        toast.success(t("dashboard.calendar.toast.updated"));
      }
    } else {
      calendrierAPI.create(formData);
      if (typeof toast !== "undefined" && toast.success) {
        toast.success(t("dashboard.calendar.toast.created"));
      }
    }
    loadEvenements();
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm(t("dashboard.calendar.deleteConfirm"))) {
      calendrierAPI.delete(id);
      loadEvenements();
      if (typeof toast !== "undefined" && toast.success) {
        toast.success(t("dashboard.calendar.toast.deleted"));
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

  const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
  const monthFormatter = new Intl.DateTimeFormat(localeToIntl[locale], { month: "long" });
  const dayFormatter = new Intl.DateTimeFormat(localeToIntl[locale], { weekday: "short" });
  const nomsMois = Array.from({ length: 12 }, (_, index) =>
    capitalize(monthFormatter.format(new Date(2024, index, 1)))
  );
  const nomsJours = Array.from({ length: 7 }, (_, index) =>
    capitalize(dayFormatter.format(new Date(2024, 0, 1 + index)))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendrier & Tâches</h1>
          <p className="mt-2 text-secondary">
            Gérez vos rendez-vous et tâches
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-3 accent-bg text-white font-medium rounded-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {ongletActif === "taches" ? "Nouvelle tâche" : "Nouvel événement"}
        </button>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b border-subtle">
        <button
          onClick={() => setOngletActif("calendrier")}
          className={`px-6 py-3 font-medium transition-all flex items-center gap-2 ${
            ongletActif === "calendrier"
              ? "border-b-2 accent-border-strong text-primary"
              : "text-secondary hover:text-primary"
          }`}
        >
          <Calendar className="w-5 h-5" />
          Calendrier
        </button>
        <button
          onClick={() => setOngletActif("taches")}
          className={`px-6 py-3 font-medium transition-all flex items-center gap-2 ${
            ongletActif === "taches"
              ? "border-b-2 accent-border-strong text-primary"
              : "text-secondary hover:text-primary"
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
                className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-primary transition-all"
              >
                ←
              </button>
              <button
                onClick={allerAujourdhui}
                className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-primary transition-all"
              >
                Aujourd'hui
              </button>
              <button
                onClick={moisSuivant}
                className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-primary transition-all"
              >
                →
              </button>
              <h2 className="text-2xl font-bold">
                {nomsMois[dateCourante.getMonth()]} {dateCourante.getFullYear()}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setVueCalendrier("calendrier")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  vueCalendrier === "calendrier"
                    ? "accent-bg-light text-primary"
                    : "bg-surface-hover text-secondary hover:text-primary"
                }`}
              >
                Calendrier
              </button>
              <button
                onClick={() => setVueCalendrier("liste")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  vueCalendrier === "liste"
                    ? "accent-bg-light text-primary"
                    : "bg-surface-hover text-secondary hover:text-primary"
                }`}
              >
                Liste
              </button>
            </div>
          </div>

          {/* Vue Calendrier */}
          {vueCalendrier === "calendrier" && (
            <div className="rounded-xl border border-subtle bg-surface overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-surface-hover">
                {nomsJours.map((jour) => (
                  <div key={jour} className="bg-surface p-2 text-center text-sm font-semibold text-primary">
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
                      className={`min-h-[100px] p-2 bg-surface ${
                        !estMoisActuel ? "opacity-30" : ""
                      } ${estAujourdhuiDate ? "border border-accent-border" : ""}`}
                    >
                      <div className={`text-sm mb-1 ${estAujourdhuiDate ? "font-bold accent" : "text-secondary"}`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {evenementsJour.slice(0, 2).map((evt) => (
                          <div
                            key={evt.id}
                            className={`text-xs p-1 rounded truncate ${
                              evt.type === "rdv"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                            title={evt.titre}
                          >
                            {evt.heure ? `${evt.heure} ` : ""}{evt.titre}
                          </div>
                        ))}
                        {evenementsJour.length > 2 && (
                          <div className="text-xs text-tertiary">
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

          {/* Vue Liste - Événements à venir */}
          {vueCalendrier === "liste" && (
            <div className="rounded-xl border border-subtle bg-surface overflow-hidden">
              {evenements.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-secondary text-lg">Aucun événement à venir</p>
                  <button
                    onClick={() => handleOpenModal()}
                    className="mt-4 px-6 py-2 rounded-lg accent-bg text-white font-medium transition-all"
                  >
                    Créer un événement
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-200/70">
                  {evenements
                    .filter((evt) => {
                      const dateEvt = new Date(evt.date);
                      const aujourdhui = new Date();
                      aujourdhui.setHours(0, 0, 0, 0);
                      return dateEvt >= aujourdhui;
                    })
                    .sort((a, b) => {
                      const dateA = new Date(a.date + (a.heure ? `T${a.heure}` : "T00:00"));
                      const dateB = new Date(b.date + (b.heure ? `T${b.heure}` : "T00:00"));
                      return dateA.getTime() - dateB.getTime();
                    })
                    .map((evt) => {
                      const dateEvt = new Date(evt.date);
                      const estAujourdhuiDate = estAujourdhui(dateEvt);
                      const estDemain = (() => {
                        const demain = new Date();
                        demain.setDate(demain.getDate() + 1);
                        return (
                          dateEvt.getDate() === demain.getDate() &&
                          dateEvt.getMonth() === demain.getMonth() &&
                          dateEvt.getFullYear() === demain.getFullYear()
                        );
                      })();

                      return (
                        <div
                          key={evt.id}
                          className="p-6 hover:bg-surface-hover transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="mt-1">
                                {evt.type === "rdv" ? (
                                  <Calendar className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <CheckCircle className={`w-5 h-5 ${evt.statut === "fait" ? "text-green-600" : "text-yellow-600"}`} />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="font-medium text-lg">{evt.titre}</div>
                                  {evt.type === "tache" && evt.statut && (
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      evt.statut === "fait"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-yellow-100 text-yellow-700"
                                    }`}>
                                      {evt.statut === "fait" ? "Terminé" : "À faire"}
                                    </span>
                                  )}
                                </div>
                                {evt.description && (
                                  <div className="text-sm text-secondary mt-1 mb-3">
                                    {evt.description}
                                  </div>
                                )}
                                <div className="flex items-center gap-4 text-sm text-secondary">
                                  <span className="font-medium text-secondary">
                                    {estAujourdhuiDate
                                      ? "Aujourd'hui"
                                      : estDemain
                                      ? "Demain"
                                      : dateEvt.toLocaleDateString("fr-FR", {
                                          weekday: "long",
                                          day: "numeric",
                                          month: "long",
                                          year: "numeric",
                                        })}
                                  </span>
                                  {evt.heure && (
                                    <span className="px-2 py-1 rounded bg-surface-hover">
                                      {evt.heure}
                                    </span>
                                  )}
                                  <span className="px-2 py-1 rounded bg-surface-hover text-xs">
                                    {evt.type === "rdv" ? "Rendez-vous" : "Tâche"}
                                  </span>
                                  {evt.type === "tache" && evt.dateEcheance && (
                                    <span className="text-xs text-tertiary">
                                      Échéance: {new Date(evt.dateEcheance).toLocaleDateString("fr-FR")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {evt.type === "tache" && (
                                  <button
                                    onClick={() => handleToggleStatut(evt.id, evt.statut || "a-faire")}
                                    className={`px-3 py-1.5 rounded-lg transition-all text-sm flex items-center justify-center ${
                                      evt.statut === "fait"
                                        ? "bg-green-100 hover:bg-green-200 text-green-700"
                                        : "bg-surface-hover hover:bg-surface text-secondary hover:text-primary"
                                    }`}
                                    title={evt.statut === "fait" ? "Marquer comme à faire" : "Marquer comme terminé"}
                                  >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenModal(evt)}
                                  className="px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-surface text-secondary hover:text-primary transition-all text-sm flex items-center justify-center"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(evt.id)}
                                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all text-sm flex items-center justify-center"
                                title="Supprimer"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contenu Tâches */}
      {ongletActif === "taches" && (
        <div className="space-y-6">
          {/* Tâches à faire */}
          <div className="rounded-xl border border-subtle bg-surface p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-yellow-600" />
              À faire ({tachesAFaire.length})
            </h2>
            {tachesAFaire.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-secondary mb-4">Aucune tâche à faire</p>
                <button
                  onClick={() => handleOpenModal()}
                  className="px-6 py-2 rounded-lg accent-bg text-white font-medium transition-all"
                >
                  Créer une tâche
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tachesAFaire
                  .sort((a, b) => {
                    // Trier par date d'échéance si disponible, sinon par date
                    const dateA = a.dateEcheance ? new Date(a.dateEcheance) : new Date(a.date);
                    const dateB = b.dateEcheance ? new Date(b.dateEcheance) : new Date(b.date);
                    return dateA.getTime() - dateB.getTime();
                  })
                  .map((tache) => {
                    const dateEcheance = tache.dateEcheance ? new Date(tache.dateEcheance) : null;
                    const dateTache = new Date(tache.date);
                    const aujourdhui = new Date();
                    aujourdhui.setHours(0, 0, 0, 0);
                    const estEnRetard = dateEcheance && dateEcheance < aujourdhui;
                    const estAujourdhuiDate = dateEcheance && estAujourdhui(dateEcheance);

                    return (
                      <div
                        key={tache.id}
                        className="flex items-start justify-between p-4 rounded-lg border border-subtle bg-surface-hover hover:bg-surface transition-all"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <button
                            onClick={() => handleToggleStatut(tache.id, tache.statut || "a-faire")}
                            className="w-5 h-5 rounded border-2 border-subtle-hover hover:border-subtle transition-all mt-0.5 flex-shrink-0"
                            title="Marquer comme terminé"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-lg mb-1">{tache.titre}</div>
                            {tache.description && (
                              <div className="text-sm text-secondary mt-1 mb-3">{tache.description}</div>
                            )}
                            <div className="flex items-center gap-4 flex-wrap">
                              {dateEcheance && (
                                <span
                                  className={`text-sm font-medium ${
                                    estEnRetard
                                      ? "text-red-600"
                                      : estAujourdhuiDate
                                      ? "text-yellow-600"
                                      : "text-secondary"
                                  }`}
                                >
                                  {estEnRetard
                                    ? "⚠️ En retard"
                                    : estAujourdhuiDate
                                    ? "📅 Aujourd'hui"
                                    : `📅 ${dateEcheance.toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}`}
                                </span>
                              )}
                              {!dateEcheance && (
                                <span className="text-sm text-secondary">
                                  {dateTache.toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                              {tache.typeTache && (
                                <span className="px-2 py-1 rounded bg-surface-hover text-xs font-medium text-secondary">
                                  {tache.typeTache === "relance" && "🔔 Relance"}
                                  {tache.typeTache === "rdv" && "📅 Rendez-vous"}
                                  {tache.typeTache === "admin" && "⚙️ Admin"}
                                  {tache.typeTache === "autre" && "📋 Autre"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleOpenModal(tache)}
                            className="px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-surface text-secondary hover:text-primary transition-all text-sm flex items-center justify-center"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tache.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all text-sm flex items-center justify-center"
                            title="Supprimer"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Tâches faites */}
          {tachesFaites.length > 0 && (
            <div className="rounded-xl border border-subtle bg-surface p-6 opacity-70">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Terminées ({tachesFaites.length})
              </h2>
              <div className="space-y-3">
                {tachesFaites
                  .sort((a, b) => {
                    // Trier par date (plus récentes en premier)
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map((tache) => (
                    <div
                      key={tache.id}
                      className="flex items-start justify-between p-4 rounded-lg border border-subtle bg-surface-hover"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <button
                          onClick={() => handleToggleStatut(tache.id, "fait")}
                          className="w-5 h-5 rounded bg-green-500 border-2 border-green-500 flex items-center justify-center mt-0.5 flex-shrink-0"
                          title="Marquer comme à faire"
                        >
                          <CheckCircle className="w-3 h-3 text-white" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium line-through text-tertiary text-lg mb-1">
                            {tache.titre}
                          </div>
                        <div className="flex items-center gap-4 text-sm text-tertiary">
                            <span>
                              {new Date(tache.date).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            {tache.typeTache && (
                            <span className="px-2 py-0.5 rounded bg-surface text-xs text-secondary">
                                {tache.typeTache === "relance" && "Relance"}
                                {tache.typeTache === "rdv" && "Rendez-vous"}
                                {tache.typeTache === "admin" && "Admin"}
                                {tache.typeTache === "autre" && "Autre"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleDelete(tache.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all text-sm flex items-center justify-center"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface border border-subtle rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingEvenement ? "Modifier" : ongletActif === "taches" ? "Nouvelle tâche" : "Nouvel événement"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
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
                  className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                >
                  <option value="rdv">Rendez-vous</option>
                  <option value="tache">Tâche</option>
                </select>
              </div>
              {formData.type === "tache" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
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
                      className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                    >
                      <option value="relance">Relance</option>
                      <option value="rdv">Rendez-vous</option>
                      <option value="admin">Admin</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
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
                      className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                    >
                      <option value="a-faire">À faire</option>
                      <option value="fait">Fait</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Date d'échéance
                    </label>
                    <input
                      type="date"
                      value={formData.dateEcheance}
                      onChange={(e) =>
                        setFormData({ ...formData, dateEcheance: e.target.value })
                      }
                      className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titre}
                  onChange={(e) =>
                    setFormData({ ...formData, titre: e.target.value })
                  }
                  className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Heure (optionnel)
                </label>
                <input
                  type="time"
                  value={formData.heure}
                  onChange={(e) =>
                    setFormData({ ...formData, heure: e.target.value })
                  }
                  className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-primary transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg accent-bg text-white font-medium transition-all"
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




