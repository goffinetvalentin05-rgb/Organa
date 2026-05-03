"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Plus,
  Trash,
  Clock,
  MapPin,
  Users,
  Calendar,
  Mail,
  CheckCircle,
  X,
  Edit,
  UserCheck,
  Download,
} from "@/lib/icons";
import toast from "react-hot-toast";
import { localeToIntl } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";

interface Member {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  role?: string;
  category?: string;
  status?: "member" | "public";
}

interface Assignment {
  id: string;
  slotId?: string;
  clientId: string | null;
  source?: "internal_member" | "public_signup";
  /** Inscription publique : linked | unlinked | pending_review ; null si interne */
  memberLinkStatus?: "linked" | "unlinked" | "pending_review" | null;
  member: Member;
  notifiedAt?: string;
  createdAt: string;
}

interface Slot {
  id: string;
  location: string;
  /** Date du créneau (YYYY-MM-DD), indépendante de la date principale du planning si besoin */
  slotDate: string;
  startTime: string;
  endTime: string;
  requiredPeople: number;
  notes?: string;
  ordre: number;
  assignments: Assignment[];
  assignedCount: number;
  isFull: boolean;
}

interface Planning {
  id: string;
  name: string;
  description?: string;
  date: string;
  status: "draft" | "published" | "archived";
  event?: {
    id: string;
    name: string;
  };
  slots: Slot[];
  totalRequired: number;
  totalAssigned: number;
  fillRate: number;
}

interface PublicPlanningLink {
  id: string;
  token: string;
  active: boolean;
  createdAt: string;
  url: string;
  path: string;
}

export default function PlanningDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { locale } = useI18n();
  
  const [planning, setPlanning] = useState<Planning | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Modal d'affectation
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTargetAssignment, setLinkTargetAssignment] = useState<Assignment | null>(null);
  const [linkTargetSlot, setLinkTargetSlot] = useState<Slot | null>(null);
  const [linkSearchTerm, setLinkSearchTerm] = useState("");
  const [linkAssigning, setLinkAssigning] = useState(false);

  // Modal ajout / édition créneau
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotForm, setSlotForm] = useState({
    location: "",
    slotDate: "",
    startTime: "08:00",
    endTime: "10:00",
    requiredPeople: 1,
    notes: "",
  });
  const [savingSlot, setSavingSlot] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [publicLink, setPublicLink] = useState<PublicPlanningLink | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copying, setCopying] = useState(false);

  const formatDate = (value: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(localeToIntl[locale], {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    return time?.slice(0, 5) || time;
  };

  const slotGroups = useMemo(() => {
    if (!planning) return [] as [string, Slot[]][];
    const rawSlots = Array.isArray(planning.slots) ? planning.slots : [];
    const m = new Map<string, Slot[]>();
    const fallbackDay = planning.date || "";
    for (const s of rawSlots) {
      const d =
        (s.slotDate != null && String(s.slotDate).trim() !== "")
          ? String(s.slotDate).trim()
          : fallbackDay;
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push(s);
    }
    const sortByStartTime = (slots: Slot[]) =>
      [...slots].sort((a, b) => {
        const ta = (a.startTime || "00:00:00").slice(0, 8);
        const tb = (b.startTime || "00:00:00").slice(0, 8);
        if (ta !== tb) return ta.localeCompare(tb);
        return (a.ordre ?? 0) - (b.ordre ?? 0);
      });
    return [...m.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, slots]) => [dateKey, sortByStartTime(slots)] as [string, Slot[]]);
  }, [planning]);

  const openAddSlotModal = () => {
    if (!planning) return;
    setEditingSlotId(null);
    setSlotForm({
      location: "",
      slotDate: planning.date,
      startTime: "08:00",
      endTime: "10:00",
      requiredPeople: 1,
      notes: "",
    });
    setShowSlotModal(true);
  };

  const openEditSlotModal = (slot: Slot) => {
    setEditingSlotId(slot.id);
    setSlotForm({
      location: slot.location,
      slotDate: slot.slotDate || planning?.date || "",
      startTime: formatTime(slot.startTime),
      endTime: formatTime(slot.endTime),
      requiredPeople: slot.requiredPeople,
      notes: slot.notes || "",
    });
    setShowSlotModal(true);
  };

  useEffect(() => {
    loadPlanning();
    loadMembers();
    loadPublicLink();
  }, [id]);

  const loadPlanning = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/plannings/${id}`, { cache: "no-store" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Planning non trouvé");
      }
      const data = await response.json();
      setPlanning(data?.planning || null);
    } catch (error: any) {
      console.error("[PlanningDetail] Error:", error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await fetch("/api/clients", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setMembers(data?.clients || []);
      }
    } catch (error) {
      console.error("[PlanningDetail] Erreur chargement membres:", error);
    }
  };

  const loadPublicLink = async () => {
    try {
      const response = await fetch(`/api/plannings/${id}/public-link`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setPublicLink(data?.publicLink || null);
    } catch (loadError) {
      console.error("[PlanningDetail] Erreur chargement lien public:", loadError);
    }
  };

  const handleGeneratePublicLink = async () => {
    setSharing(true);
    try {
      const response = await fetch(`/api/plannings/${id}/public-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requireName: true, requireEmail: false }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Erreur lors de la génération du lien");
      }

      setPublicLink(data?.publicLink || null);
      toast.success("Lien public généré !");
    } catch (shareError: any) {
      console.error("[PlanningDetail] Erreur génération lien public:", shareError);
      toast.error(shareError?.message || "Impossible de générer le lien");
    } finally {
      setSharing(false);
    }
  };

  const handleCopyPublicLink = async () => {
    if (!publicLink?.url) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(publicLink.url);
      toast.success("Lien copié !");
    } catch (copyError) {
      console.error("[PlanningDetail] Erreur copie lien public:", copyError);
      toast.error("Impossible de copier le lien");
    } finally {
      setCopying(false);
    }
  };

  const openAssignModal = (slot: Slot) => {
    setSelectedSlot(slot);
    setSearchTerm("");
    setShowAssignModal(true);
  };

  const openLinkModal = (slot: Slot, assignment: Assignment) => {
    setLinkTargetSlot(slot);
    setLinkTargetAssignment(assignment);
    setLinkSearchTerm("");
    setShowLinkModal(true);
  };

  const handleLinkToMember = async (memberId: string) => {
    if (!linkTargetAssignment) return;
    setLinkAssigning(true);
    try {
      const res = await fetch(`/api/plannings/${id}/assignments/${linkTargetAssignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: memberId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Rattachement impossible");
      }
      toast.success("Inscription rattachée au membre");
      setShowLinkModal(false);
      setLinkTargetAssignment(null);
      setLinkTargetSlot(null);
      await loadPlanning();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur";
      toast.error(msg);
    } finally {
      setLinkAssigning(false);
    }
  };

  const handleAssign = async (memberId: string) => {
    if (!selectedSlot) return;
    
    setAssigning(true);
    try {
      const response = await fetch(`/api/plannings/${id}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          clientId: memberId,
          sendNotification,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Erreur lors de l'affectation");
      }

      const data = await response.json();
      
      if (data.notificationSent) {
        toast.success("Membre affecté et notifié par email !");
      } else {
        toast.success("Membre affecté avec succès !");
      }
      
      setShowAssignModal(false);
      setSelectedSlot(null);
      await loadPlanning();
    } catch (error: any) {
      console.error("[PlanningDetail] Erreur affectation:", error);
      toast.error(error.message || "Erreur lors de l'affectation");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm("Retirer cette affectation ?")) return;
    
    try {
      const response = await fetch(`/api/plannings/${id}/assignments?assignmentId=${assignmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success("Affectation retirée");
      await loadPlanning();
    } catch (error: any) {
      console.error("[PlanningDetail] Erreur suppression:", error);
      toast.error(error.message || "Erreur");
    }
  };

  const handleSaveSlot = async () => {
    if (!slotForm.location.trim()) {
      toast.error("Le lieu/poste est requis");
      return;
    }
    if (!slotForm.slotDate) {
      toast.error("La date du créneau est requise");
      return;
    }

    setSavingSlot(true);
    try {
      const isEdit = Boolean(editingSlotId);
      const response = await fetch(`/api/plannings/${id}/slots`, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? {
                slotId: editingSlotId,
                location: slotForm.location,
                slotDate: slotForm.slotDate,
                startTime: slotForm.startTime,
                endTime: slotForm.endTime,
                requiredPeople: slotForm.requiredPeople,
                notes: slotForm.notes.trim() || null,
              }
            : {
                location: slotForm.location,
                slotDate: slotForm.slotDate,
                startTime: slotForm.startTime,
                endTime: slotForm.endTime,
                requiredPeople: slotForm.requiredPeople,
                notes: slotForm.notes.trim() || null,
              }
        ),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const msg = [data?.error, data?.details].filter(Boolean).join(" — ");
        throw new Error(msg || "Erreur lors de l'enregistrement");
      }

      toast.success(isEdit ? "Créneau mis à jour !" : "Créneau ajouté !");
      setShowSlotModal(false);
      setEditingSlotId(null);
      await loadPlanning();
    } catch (error: any) {
      console.error("[PlanningDetail] Erreur enregistrement slot:", error);
      toast.error(error.message || "Erreur");
    } finally {
      setSavingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Supprimer ce créneau et toutes ses affectations ?")) return;
    
    try {
      const response = await fetch(`/api/plannings/${id}/slots?slotId=${slotId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success("Créneau supprimé");
      await loadPlanning();
    } catch (error: any) {
      console.error("[PlanningDetail] Erreur suppression slot:", error);
      toast.error(error.message || "Erreur");
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/plannings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      toast.success("Statut mis à jour");
      await loadPlanning();
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    }
  };

  // Filtrer les membres disponibles (pas déjà affectés au créneau)
  const availableMembers = members.filter((m) => {
    if (!selectedSlot) return true;
    const alreadyAssigned = selectedSlot.assignments.some((a) => a.clientId === m.id);
    if (alreadyAssigned) return false;
    if (!searchTerm) return true;
    return m.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
           m.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const membersAvailableForLink = useMemo(() => {
    if (!linkTargetSlot) return [];
    return members.filter((m) => {
      const alreadyAssigned = linkTargetSlot.assignments.some((a) => a.clientId === m.id);
      if (alreadyAssigned) return false;
      if (!linkSearchTerm) return true;
      const q = linkSearchTerm.toLowerCase();
      return m.nom.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
    });
  }, [members, linkTargetSlot, linkSearchTerm]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/pdf/planning/download?id=${id}`);
      
      if (!response.ok) {
        throw new Error("Erreur lors de la génération du PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `planning-${planning?.name || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("PDF téléchargé !");
    } catch (error: any) {
      console.error("[PlanningDetail] Erreur téléchargement PDF:", error);
      toast.error(error.message || "Erreur lors du téléchargement");
    } finally {
      setDownloading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-700";
      case "archived": return "bg-slate-100 text-slate-600";
      default: return "bg-amber-100 text-amber-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "published": return "Publié";
      case "archived": return "Archivé";
      default: return "Brouillon";
    }
  };

  const getFillRateColor = (rate: number) => {
    if (rate === 100) return "text-green-600";
    if (rate >= 50) return "text-amber-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center">
        <p className="text-secondary">Chargement...</p>
      </div>
    );
  }

  if (errorMessage || !planning) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center">
        <p className="text-red-600 mb-4">{errorMessage || "Planning non trouvé"}</p>
        <Link
          href="/tableau-de-bord/plannings"
          className="text-accent hover:underline"
        >
          Retour aux plannings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{planning.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(planning.status)}`}>
              {getStatusLabel(planning.status)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-secondary">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(planning.date)}
            </span>
            {planning.event && (
              <Link
                href={`/tableau-de-bord/evenements/${planning.event.id}`}
                className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition-colors"
              >
                {planning.event.name}
              </Link>
            )}
          </div>
          {planning.description && (
            <p className="mt-2 text-secondary">{planning.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGeneratePublicLink}
            disabled={sharing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {sharing ? "Génération..." : publicLink ? "Mettre à jour le partage" : "Partager le planning"}
          </button>
          {publicLink && (
            <button
              onClick={handleCopyPublicLink}
              disabled={copying}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {copying ? "Copie..." : "Copier le lien"}
            </button>
          )}
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Génération..." : "Télécharger PDF"}
          </button>
          <select
            value={planning.status}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-subtle bg-white text-sm"
          >
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="archived">Archivé</option>
          </select>
          <Link
            href="/tableau-de-bord/plannings"
            className="text-secondary hover:text-primary transition-colors"
          >
            Retour
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-subtle bg-surface/80 p-4">
          <p className="text-sm text-tertiary mb-1">Créneaux</p>
          <p className="text-2xl font-bold">{planning.slots?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-subtle bg-surface/80 p-4">
          <p className="text-sm text-tertiary mb-1">Personnes requises</p>
          <p className="text-2xl font-bold">{planning.totalRequired}</p>
        </div>
        <div className="rounded-xl border border-subtle bg-surface/80 p-4">
          <p className="text-sm text-tertiary mb-1">Affectations</p>
          <p className="text-2xl font-bold">{planning.totalAssigned}</p>
        </div>
        <div className="rounded-xl border border-subtle bg-surface/80 p-4">
          <p className="text-sm text-tertiary mb-1">Taux de remplissage</p>
          <p className={`text-2xl font-bold ${getFillRateColor(planning.fillRate)}`}>
            {planning.fillRate}%
          </p>
        </div>
      </div>

      {publicLink && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
          <p className="text-sm text-indigo-900 font-medium">Lien public de recrutement</p>
          <p className="text-sm text-indigo-700 mt-1 break-all">{publicLink.url}</p>
          <p className="text-xs text-indigo-600 mt-2">
            Partagez ce lien (WhatsApp, email, etc.) pour laisser les bénévoles s&apos;inscrire eux-memes.
          </p>
        </div>
      )}

      {/* Grille des créneaux */}
      <div className="rounded-2xl border border-subtle bg-surface/80 overflow-hidden shadow-premium">
        <div className="flex items-center justify-between p-6 border-b border-subtle">
          <h2 className="text-xl font-semibold">Grille d&apos;affectation</h2>
          <button
            type="button"
            onClick={openAddSlotModal}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter un créneau
          </button>
        </div>

        {(planning.slots?.length ?? 0) === 0 ? (
          <div className="p-12 text-center">
            <p className="text-secondary mb-4">Aucun créneau défini</p>
            <button
              type="button"
              onClick={openAddSlotModal}
              className="px-6 py-3 accent-bg text-white font-medium rounded-full transition-all"
            >
              Créer votre premier créneau
            </button>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {slotGroups.map(([dayKey, slotsForDay]) => (
              <section
                key={dayKey}
                className="rounded-2xl border border-subtle bg-surface/90 shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-hidden"
              >
                <header className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-subtle bg-gradient-to-r from-slate-50/95 via-white to-slate-50/40">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div
                      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-subtle bg-white shadow-sm"
                      aria-hidden
                    >
                      <Calendar className="w-5 h-5 text-[var(--obillz-hero-blue)] opacity-90" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-primary leading-snug">
                        {formatDate(dayKey)}
                      </h3>
                    </div>
                  </div>
                </header>

                <div className="space-y-4 p-4 sm:p-5">
            {slotsForDay.map((slot) => (
              <div
                key={slot.id}
                className="rounded-xl border border-subtle bg-white/70 overflow-hidden shadow-sm"
              >
                {/* Header du créneau */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50/80 border-b border-subtle">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent-bg/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary text-[15px] sm:text-base">{slot.location}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {slot.assignedCount} / {slot.requiredPeople}
                        </span>
                        {slot.isFull && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                            Complet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!slot.isFull && (
                      <button
                        type="button"
                        onClick={() => openAssignModal(slot)}
                        className="px-4 py-2 accent-bg text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                      >
                        <UserCheck className="w-4 h-4" />
                        Affecter
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditSlotModal(slot)}
                      className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Modifier ce créneau"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer ce créneau"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grille des affectations */}
                <div className="p-4">
                  {slot.notes && (
                    <p className="text-sm text-secondary mb-4 italic">{slot.notes}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-3">
                    {/* Affectations existantes */}
                    {slot.assignments.map((assignment) => {
                      const isPublic = assignment.source === "public_signup";
                      const linkStatus = assignment.memberLinkStatus;
                      const showLinkButton = isPublic && !assignment.clientId;
                      const linkBadge =
                        !isPublic ? (
                          <span className="mt-1 inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-slate-200/80 text-slate-700">
                            Membre club
                          </span>
                        ) : linkStatus === "pending_review" ? (
                          <span className="mt-1 inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-900">
                            À vérifier
                          </span>
                        ) : linkStatus === "linked" || assignment.clientId ? (
                          <span className="mt-1 inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-emerald-100 text-emerald-900">
                            Lié à un membre
                          </span>
                        ) : (
                          <span className="mt-1 inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-slate-200/80 text-slate-700">
                            Non lié
                          </span>
                        );

                      return (
                        <div
                          key={assignment.id}
                          className="group relative flex flex-col gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg min-w-[200px]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center shrink-0">
                              <CheckCircle className="w-4 h-4 text-green-700" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-green-900 break-words">{assignment.member.nom}</p>
                              {assignment.member.email && (
                                <p className="text-xs text-green-700 break-all">{assignment.member.email}</p>
                              )}
                              {linkBadge}
                              {assignment.notifiedAt && (
                                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  Notifié
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAssignment(assignment.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              title="Retirer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          {showLinkButton && (
                            <button
                              type="button"
                              onClick={() => openLinkModal(slot, assignment)}
                              className="text-left text-xs font-medium text-violet-700 hover:text-violet-900 underline-offset-2 hover:underline"
                            >
                              Rattacher à un membre
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Cases vides */}
                    {Array.from({ length: slot.requiredPeople - slot.assignedCount }).map((_, index) => (
                      <button
                        key={`empty-${index}`}
                        onClick={() => openAssignModal(slot)}
                        className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-accent hover:bg-accent-bg/5 transition-all group"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-accent-bg/20 flex items-center justify-center transition-colors">
                          <Plus className="w-4 h-4 text-slate-400 group-hover:text-accent" />
                        </div>
                        <span className="text-slate-400 group-hover:text-accent text-sm">
                          Affecter un membre
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
                </div>
            </section>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'affectation */}
      {showAssignModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Affecter un membre</h3>
                  <p className="text-secondary text-sm mt-1">
                    {selectedSlot.location} • {formatDate(selectedSlot.slotDate || planning.date)} •{" "}
                    {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 border-b border-subtle">
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all"
                autoFocus
              />
              <label className="flex items-center gap-2 mt-3 text-sm text-secondary">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="rounded border-slate-300 text-accent focus:ring-accent"
                />
                Envoyer une notification par email
              </label>
            </div>

            <div className="overflow-y-auto max-h-[40vh]">
              {availableMembers.length === 0 ? (
                <div className="p-8 text-center text-secondary">
                  {searchTerm ? "Aucun membre trouvé" : "Aucun membre disponible"}
                </div>
              ) : (
                <div className="divide-y divide-subtle">
                  {availableMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleAssign(member.id)}
                      disabled={assigning}
                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-accent-bg/20 flex items-center justify-center">
                        <span className="text-accent font-semibold">
                          {member.nom.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{member.nom}</p>
                        {member.email && (
                          <p className="text-sm text-secondary">{member.email}</p>
                        )}
                        {member.role && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                            {member.role}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showLinkModal && linkTargetSlot && linkTargetAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Rattacher à un membre</h3>
                  <p className="text-secondary text-sm mt-1">
                    {linkTargetAssignment.member.nom} — {linkTargetSlot.location} •{" "}
                    {formatDate(linkTargetSlot.slotDate || planning?.date || "")} •{" "}
                    {formatTime(linkTargetSlot.startTime)} - {formatTime(linkTargetSlot.endTime)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkModal(false);
                    setLinkTargetAssignment(null);
                    setLinkTargetSlot(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 border-b border-subtle">
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={linkSearchTerm}
                onChange={(e) => setLinkSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto max-h-[40vh]">
              {membersAvailableForLink.length === 0 ? (
                <div className="p-8 text-center text-secondary">
                  {linkSearchTerm ? "Aucun membre trouvé" : "Aucun membre disponible"}
                </div>
              ) : (
                <div className="divide-y divide-subtle">
                  {membersAvailableForLink.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleLinkToMember(member.id)}
                      disabled={linkAssigning}
                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                        <span className="text-violet-800 font-semibold">
                          {member.nom.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{member.nom}</p>
                        {member.email && <p className="text-sm text-secondary">{member.email}</p>}
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout / édition créneau */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-subtle">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  {editingSlotId ? "Modifier le créneau" : "Ajouter un créneau"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowSlotModal(false);
                    setEditingSlotId(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Lieu / Poste *
                </label>
                <input
                  type="text"
                  value={slotForm.location}
                  onChange={(e) => setSlotForm({ ...slotForm, location: e.target.value })}
                  placeholder="Ex: Bar, Entrée, Cuisine..."
                  className="w-full px-4 py-3 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={slotForm.slotDate}
                  onChange={(e) => setSlotForm({ ...slotForm, slotDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all"
                />
                <p className="text-xs text-secondary mt-1.5">
                  Peut être différente de la date principale du planning (préparation, rangement…).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Début *
                  </label>
                  <input
                    type="time"
                    value={slotForm.startTime}
                    onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Fin *
                  </label>
                  <input
                    type="time"
                    value={slotForm.endTime}
                    onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Nombre de personnes requises *
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={slotForm.requiredPeople}
                  onChange={(e) => setSlotForm({ ...slotForm, requiredPeople: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-4 py-3 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Notes (optionnel)
                </label>
                <input
                  type="text"
                  value={slotForm.notes}
                  onChange={(e) => setSlotForm({ ...slotForm, notes: e.target.value })}
                  placeholder="Instructions particulières..."
                  className="w-full px-4 py-3 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all"
                />
              </div>
            </div>

            <div className="p-6 border-t border-subtle flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSlotModal(false);
                  setEditingSlotId(null);
                }}
                className="px-6 py-2.5 text-secondary hover:text-primary transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveSlot}
                disabled={savingSlot}
                className="px-6 py-2.5 accent-bg text-white font-medium rounded-lg transition-all disabled:opacity-50"
              >
                {savingSlot ? "Enregistrement..." : editingSlotId ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
