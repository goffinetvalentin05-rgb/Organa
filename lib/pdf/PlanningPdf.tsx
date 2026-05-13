import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Styles pour le PDF - Simple, noir et blanc, lisible à l'impression
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  logo: {
    maxHeight: 48,
    maxWidth: 120,
    marginRight: 12,
  },
  clubName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  clubDetails: {
    fontSize: 9,
    color: "#333333",
    lineHeight: 1.4,
  },
  planningInfo: {
    alignItems: "flex-end",
  },
  planningTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "right",
  },
  planningDate: {
    fontSize: 12,
    color: "#333333",
    textAlign: "right",
  },
  planningDescription: {
    fontSize: 10,
    color: "#333333",
    marginTop: 4,
    textAlign: "right",
    maxWidth: 200,
  },
  eventBadge: {
    fontSize: 9,
    color: "#333333",
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
  },
  summarySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 8,
    color: "#666666",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  slotsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
    paddingBottom: 6,
  },
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    minHeight: 32,
    alignItems: "flex-start",
  },
  tableRowAlt: {
    backgroundColor: "#F9F9F9",
  },
  tableCell: {
    fontSize: 9,
  },
  colDate: {
    width: "14%",
  },
  colLocation: {
    width: "18%",
  },
  colTime: {
    width: "16%",
  },
  colRequired: {
    width: "12%",
    textAlign: "center",
  },
  colMembers: {
    width: "40%",
  },
  locationName: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  locationNotes: {
    fontSize: 8,
    color: "#666666",
    fontStyle: "italic",
  },
  timeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  membersList: {
    flexDirection: "column",
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  memberBullet: {
    width: 10,
    fontSize: 8,
  },
  memberName: {
    fontSize: 9,
  },
  emptySlot: {
    fontSize: 8,
    color: "#999999",
    fontStyle: "italic",
  },
  statusComplete: {
    color: "#000000",
    fontWeight: "bold",
  },
  statusIncomplete: {
    color: "#666666",
  },
  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#CCCCCC",
  },
  footerText: {
    fontSize: 8,
    color: "#666666",
  },
  pageNumber: {
    fontSize: 8,
    color: "#666666",
  },
});

// Types pour les données
interface Member {
  id: string;
  /** Libellé final (pas d’email dans le PDF) */
  displayName: string;
}

interface Assignment {
  id: string;
  member: Member;
}

interface Slot {
  id: string;
  location: string;
  /** Date du créneau (peut différer de la date principale du planning) */
  slotDate?: string;
  startTime: string;
  endTime: string;
  requiredPeople: number;
  notes?: string;
  assignments: Assignment[];
}

interface PlanningPdfProps {
  club: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
    logoUrl?: string;
  };
  planning: {
    name: string;
    date: string;
    description?: string;
    eventName?: string;
  };
  slots: Slot[];
  summary: {
    totalSlots: number;
    totalRequired: number;
    totalAssigned: number;
    fillRate: number;
  };
}

// Dates longues (en-tête PDF) : midi local pour éviter les décalages fuseau sur YYYY-MM-DD
const formatLongFr = (dateString: string) => {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Fonction pour formater l'heure
const formatTime = (time: string) => {
  return time?.slice(0, 5) || time;
};

const formatSlotDateShort = (dateString: string | undefined) => {
  if (!dateString) return "—";
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export const PlanningPdf: React.FC<PlanningPdfProps> = ({
  club,
  planning,
  slots,
  summary,
}) => {
  const uniqueSlotDates = Array.from(
    new Set(
      slots
        .map((s) => (s.slotDate && String(s.slotDate).trim()) || "")
        .filter(Boolean)
    )
  ).sort();

  const planningHeaderDate =
    uniqueSlotDates.length === 0
      ? planning.date
        ? formatLongFr(planning.date)
        : "—"
      : uniqueSlotDates.length === 1
        ? formatLongFr(uniqueSlotDates[0])
        : `Du ${formatLongFr(uniqueSlotDates[0])} au ${formatLongFr(
            uniqueSlotDates[uniqueSlotDates.length - 1]
          )}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              {club.logoUrl && (
                <Image src={club.logoUrl} style={styles.logo} />
              )}
              <View>
                <Text style={styles.clubName}>{club.name}</Text>
                {club.address && (
                  <Text style={styles.clubDetails}>{club.address}</Text>
                )}
                {club.phone && (
                  <Text style={styles.clubDetails}>{club.phone}</Text>
                )}
              </View>
            </View>
            <View style={styles.planningInfo}>
              <Text style={styles.planningTitle}>{planning.name}</Text>
              <Text style={styles.planningDate}>{planningHeaderDate}</Text>
              {planning.eventName && (
                <Text style={styles.eventBadge}>{planning.eventName}</Text>
              )}
              {planning.description && (
                <Text style={styles.planningDescription}>{planning.description}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Créneaux</Text>
            <Text style={styles.summaryValue}>{summary.totalSlots}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Personnes requises</Text>
            <Text style={styles.summaryValue}>{summary.totalRequired}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Affectées</Text>
            <Text style={styles.summaryValue}>{summary.totalAssigned}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Taux remplissage</Text>
            <Text style={[
              styles.summaryValue,
              summary.fillRate === 100 ? styles.statusComplete : styles.statusIncomplete
            ]}>
              {summary.fillRate}%
            </Text>
          </View>
        </View>

        {/* Slots Table */}
        <View style={styles.slotsSection}>
          <Text style={styles.sectionTitle}>Planning des créneaux</Text>
          
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDate]}>
                Date
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colLocation]}>
                Poste
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colTime]}>
                Horaires
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colRequired]}>
                Requis
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colMembers]}>
                Bénévoles affectés
              </Text>
            </View>

            {/* Table Rows */}
            {slots.map((slot, index) => (
              <View 
                key={slot.id} 
                style={[
                  styles.tableRow,
                  index % 2 === 1 ? styles.tableRowAlt : {}
                ]}
              >
                <View style={styles.colDate}>
                  <Text style={styles.tableCell}>{formatSlotDateShort(slot.slotDate)}</Text>
                </View>

                {/* Location */}
                <View style={styles.colLocation}>
                  <Text style={styles.locationName}>{slot.location}</Text>
                  {slot.notes && (
                    <Text style={styles.locationNotes}>{slot.notes}</Text>
                  )}
                </View>

                {/* Time */}
                <View style={styles.colTime}>
                  <Text style={styles.timeText}>
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </Text>
                </View>

                {/* Required */}
                <View style={styles.colRequired}>
                  <Text style={[
                    styles.tableCell,
                    slot.assignments.length >= slot.requiredPeople 
                      ? styles.statusComplete 
                      : styles.statusIncomplete
                  ]}>
                    {slot.assignments.length}/{slot.requiredPeople}
                  </Text>
                </View>

                {/* Members */}
                <View style={[styles.colMembers, styles.membersList]}>
                  {slot.assignments.length > 0 ? (
                    slot.assignments.map((assignment, idx) => (
                      <View key={assignment.id} style={styles.memberItem}>
                        <Text style={styles.memberBullet}>•</Text>
                        <Text style={styles.memberName}>
                          {assignment.member.displayName}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptySlot}>
                      Aucun bénévole affecté
                    </Text>
                  )}
                  {/* Empty slots indicators */}
                  {slot.assignments.length < slot.requiredPeople && (
                    <Text style={styles.emptySlot}>
                      {slot.requiredPeople - slot.assignments.length} place(s) disponible(s)
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Généré le {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </Text>
          <Text 
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};
