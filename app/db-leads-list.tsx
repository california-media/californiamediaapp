import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "./components/Toast";
import { DbLead } from "./types";
import { bulkAssignDbLeads, fetchDbLeads, fetchDbLeadSources, fetchDbLeadStatuses, fetchStaff } from "./utils/api";
import type { LeadSource, LeadStatus, StaffMember } from "./utils/api";
import { getStaffInfo } from "./utils/config";
import { useToast } from "./utils/useToast";

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f59e0b", "#10b981", "#06b6d4", "#3b82f6",
];
const avatarColor = (name: string) =>
  AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

const formatBudget = (budget: string) => {
  const n = parseFloat(budget);
  if (!n) return null;
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `AED ${(n / 1_000).toFixed(0)}K`;
  return `AED ${n.toLocaleString()}`;
};

export default function DbLeadsListScreen() {
  const [leads, setLeads] = useState<DbLead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    status: "",
    source: "",
    assigned: "",
    sort_order: "DESC" as "ASC" | "DESC",
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const [apiSources, setApiSources] = useState<LeadSource[]>([]);
  const [apiStatuses, setApiStatuses] = useState<LeadStatus[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { showToast, toastMsg, toastType, toastAnim } = useToast();
  const isAdmin = getStaffInfo()?.admin === "1";
  const canAssign = isAdmin || getStaffInfo()?.is_team_manager === true;

  // ── Bulk / single assign state ────────────────────────────────────────────
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [currentAssignedId, setCurrentAssignedId] = useState<string>("");
  const [assignSearch, setAssignSearch] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    Promise.all([fetchDbLeadSources(), fetchDbLeadStatuses(), fetchStaff()]).then(([src, sta, staff]) => {
      setApiSources(src);
      setApiStatuses(sta);
      setStaffList(staff);
    });
  }, []);

  const loadLeads = async (
    pageNum: number = 1,
    refresh: boolean = false,
    newFilters?: typeof filters,
  ) => {
    const f = newFilters || filters;
    if (pageNum === 1) { setLoading(true); setError(null); }
    else setLoadingMore(true);

    try {
      const params: any = { sort_by: "dateadded", sort_order: f.sort_order, limit: 20, page: pageNum };
      if (searchQuery) params.search = searchQuery;
      if (f.status) params.status = f.status;
      if (f.source) params.source = f.source;
      if (f.assigned) params.assigned = f.assigned;

      const response = await fetchDbLeads(params);
      const newLeads = Array.isArray(response.data) ? response.data : [];
      if (response.total !== undefined) setTotalResults(response.total);

      if (refresh || pageNum === 1) {
        setLeads(newLeads);
      } else {
        setLeads((prev) => {
          const seen = new Set(prev.map((l) => l.id));
          return [...prev, ...newLeads.filter((l) => !seen.has(l.id))];
        });
      }
      setHasMore(newLeads.length === 20);
      setPage(pageNum);
    } catch {
      setError("Failed to load DB leads. Please try again.");
      if (pageNum === 1) setLeads([]);
    } finally {
      if (pageNum === 1) setLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => { loadLeads(1, true); }, [filters]);
  useEffect(() => {
    const t = setTimeout(() => loadLeads(1, true), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeads(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !loading && leads.length > 0) loadLeads(page + 1);
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilterModal(false);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ]).start();
  };

  const clearFilters = () => {
    const reset = { status: "", source: "", assigned: "", sort_order: "DESC" as const };
    setFilters(reset);
    setTempFilters(reset);
    setSearchQuery("");
    setShowFilterModal(false);
  };

  // ── Select / assign helpers ───────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const openQuickAssign = (id: string, assignedId: string = "") => {
    setAssignLeadId(id);
    setCurrentAssignedId(assignedId);
    setAssignSearch("");
    setShowAssignModal(true);
  };

  const openBulkAssign = () => {
    setAssignLeadId(null);
    setCurrentAssignedId("");
    setAssignSearch("");
    setShowAssignModal(true);
  };

  const handleAssign = async (staffId: string) => {
    setAssigning(true);
    const ids = assignLeadId ? [assignLeadId] : [...selectedIds];
    const ok = await bulkAssignDbLeads(staffId, ids);
    setAssigning(false);
    if (ok) {
      setShowAssignModal(false);
      setAssignLeadId(null);
      exitSelectMode();
      loadLeads(1, true);
      showToast(`DB Lead${ids.length > 1 ? "s" : ""} assigned successfully`, "success");
    } else {
      showToast("Failed to assign. Please try again.", "error");
    }
  };

  const handleCall = (phone: string) =>
    Linking.openURL(`tel:${phone.replace(/\D/g, "")}`).catch(() => alert("Could not call"));

  const handleWhatsApp = (phone: string) =>
    Linking.openURL(`https://wa.me/${phone.replace(/\D/g, "")}`).catch(() => alert("Could not open WhatsApp"));

  const getStatusColor = (name: string) =>
    apiStatuses.find((s) => s.name.trim() === name?.trim())?.color ?? "#64748b";

  const hasActiveFilters = () => filters.status !== "" || filters.source !== "" || filters.assigned !== "";
  const getActiveFilterCount = () => [filters.status, filters.source, filters.assigned].filter(Boolean).length;

  /* ── Card ── */
  const renderCard = ({ item }: { item: DbLead }) => {
    const color = avatarColor(item.full_name ?? "");
    const statusColor = getStatusColor(item.status_name);
    const hasPhone = !!item.mobile_number;
    const budget = formatBudget(item.budget);
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.leadCard, isSelected && styles.leadCardSelected]}
        onPress={() => {
          if (isSelectMode) { toggleSelect(item.id); return; }
          router.push({ pathname: "/db-lead-detail", params: { lead: JSON.stringify(item) } });
        }}
        onLongPress={() => {
          if (canAssign && !isSelectMode) {
            setIsSelectMode(true);
            toggleSelect(item.id);
          }
        }}
        activeOpacity={0.72}
      >
        <View style={styles.cardTop}>
          {isSelectMode ? (
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
          ) : (
            <View style={[styles.avatar, { backgroundColor: color + "22" }]}>
              <Text style={[styles.avatarLetter, { color }]}>
                {item.full_name?.charAt(0)?.toUpperCase() ?? "?"}
              </Text>
            </View>
          )}

          <View style={styles.cardMeta}>
            <Text style={styles.leadName} numberOfLines={1}>{item.full_name}</Text>
            {hasPhone && (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={11} color="#94a3b8" />
                <Text style={styles.phoneText}>{item.mobile_number}</Text>
              </View>
            )}
          </View>

          <View style={styles.actionIcons}>
            {canAssign && !isSelectMode && (
              <TouchableOpacity
                style={styles.iconBtnAssign}
                onPress={(e) => { e.stopPropagation(); openQuickAssign(item.id, item.assigned ?? ""); }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="person-add-outline" size={14} color="#6366f1" />
              </TouchableOpacity>
            )}
            {hasPhone && !isSelectMode && (
              <>
                <TouchableOpacity
                  style={styles.iconBtnCall}
                  onPress={(e) => { e.stopPropagation(); handleCall(item.mobile_number); }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="call" size={15} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtnWa}
                  onPress={(e) => { e.stopPropagation(); handleWhatsApp(item.mobile_number); }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="logo-whatsapp" size={15} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBottom}>
          <View style={styles.sourceBadge}>
            <Ionicons name="flash-outline" size={11} color="#6366f1" />
            <Text style={styles.sourcePrefix}>Source: </Text>
            <Text style={styles.sourceText} numberOfLines={1}>
              {item.source_name || "Direct"}
            </Text>
          </View>

          <View style={styles.rightBottom}>
            {budget && (
              <View style={styles.budgetBadge}>
                <Ionicons name="cash-outline" size={10} color="#10b981" />
                <Text style={styles.budgetText}>{budget}</Text>
              </View>
            )}
            <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusLabel, { color: statusColor }]} numberOfLines={1}>
                {item.status_name || "New"}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* ── Header ── */
  const ListHeader = () => (
    <>
      <Animated.View style={[styles.successBanner, { opacity: fadeAnim }]}>
        <Ionicons name="checkmark-circle" size={18} color="#10b981" />
        <Text style={styles.successText}>Filters applied</Text>
      </Animated.View>

      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => isSelectMode ? exitSelectMode() : router.back()}
          style={styles.backBtn}
        >
          <Ionicons name={isSelectMode ? "close" : "arrow-back"} size={22} color={isSelectMode ? "#ef4444" : "#1e293b"} />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search DB leads…"
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {canAssign && (
          <TouchableOpacity
            style={[styles.selectBtn, isSelectMode && styles.selectBtnActive]}
            onPress={() => { setIsSelectMode(!isSelectMode); setSelectedIds(new Set()); }}
          >
            <Ionicons
              name={isSelectMode ? "checkmark-done" : "checkmark-circle-outline"}
              size={20}
              color="#6366f1"
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilterModal(true)}>
          <Ionicons name="options-outline" size={22} color="#6366f1" />
          {hasActiveFilters() && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {leads.length > 0
            ? `${leads.length} of ${totalResults || leads.length} DB leads`
            : "No DB leads found"}
        </Text>
        {hasActiveFilters() && (
          <TouchableOpacity style={styles.clearChip} onPress={clearFilters}>
            <Ionicons name="close-circle" size={13} color="#6366f1" />
            <Text style={styles.clearChipText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  /* ── Filter modal ── */
  const filterModal = (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter DB Leads</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
            <AssignedDropdown
              value={tempFilters.assigned}
              onChange={(v) => setTempFilters({ ...tempFilters, assigned: v })}
              staffList={staffList}
            />

            <FilterSection label="Status">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    key="sta-all"
                    style={[styles.chip, tempFilters.status === "" && styles.chipActive]}
                    onPress={() => setTempFilters({ ...tempFilters, status: "" })}
                  >
                    <Text style={[styles.chipText, tempFilters.status === "" && styles.chipTextActive]}>All Statuses</Text>
                  </TouchableOpacity>
                  {apiStatuses.map((o) => {
                    const color = o.color || "#64748b";
                    const id = String(o.id);
                    return (
                      <TouchableOpacity
                        key={`sta-${o.id}`}
                        style={[styles.chip, tempFilters.status === id && styles.chipActive]}
                        onPress={() => setTempFilters({ ...tempFilters, status: id })}
                      >
                        <View style={[styles.dotSmall, { backgroundColor: color }]} />
                        <Text style={[styles.chipText, tempFilters.status === id && styles.chipTextActive]}>
                          {o.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </FilterSection>

            <FilterSection label="Source">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    key="src-all"
                    style={[styles.chip, tempFilters.source === "" && styles.chipActive]}
                    onPress={() => setTempFilters({ ...tempFilters, source: "" })}
                  >
                    <Text style={[styles.chipText, tempFilters.source === "" && styles.chipTextActive]}>All Sources</Text>
                  </TouchableOpacity>
                  {apiSources.map((o) => {
                    const id = String(o.id);
                    return (
                      <TouchableOpacity
                        key={`src-${o.id}`}
                        style={[styles.chip, tempFilters.source === id && styles.chipActive]}
                        onPress={() => setTempFilters({ ...tempFilters, source: id })}
                      >
                        <Text style={[styles.chipText, tempFilters.source === id && styles.chipTextActive]}>
                          {o.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </FilterSection>

            <FilterSection label="Sort">
              <View style={styles.sortRow}>
                {(["DESC", "ASC"] as const).map((order) => (
                  <TouchableOpacity
                    key={order}
                    style={[styles.sortBtn, tempFilters.sort_order === order && styles.sortBtnActive]}
                    onPress={() => setTempFilters({ ...tempFilters, sort_order: order })}
                  >
                    <Ionicons
                      name={order === "DESC" ? "arrow-down" : "arrow-up"}
                      size={16}
                      color={tempFilters.sort_order === order ? "#fff" : "#64748b"}
                    />
                    <Text style={[styles.sortBtnText, tempFilters.sort_order === order && styles.sortBtnTextActive]}>
                      {order === "DESC" ? "Newest First" : "Oldest First"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </FilterSection>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && leads.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading DB leads…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={40} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={leads}
        keyExtractor={(item, index) => `dbld-${item.id}-${index}`}
        renderItem={renderCard}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.loadingMoreText}>Loading more…</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyBox}>
              <Ionicons name="server-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No DB Leads Found</Text>
              <Text style={styles.emptySubtitle}>
                {hasActiveFilters() ? "Try adjusting your filters" : "Pull down to refresh"}
              </Text>
            </View>
          ) : null
        }
      />

      {filterModal}

      {/* Assign Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.assignSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Assign DB Lead</Text>
                <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  {assignLeadId ? "Quick assign" : `${selectedIds.size} leads selected`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAssignModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#1e293b" />
              </TouchableOpacity>
            </View>

            {assigning ? (
              <View style={styles.assigningBox}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.assigningText}>Assigning…</Text>
              </View>
            ) : (
              <>
                <View style={styles.assignSearchBox}>
                  <Ionicons name="search" size={16} color="#94a3b8" />
                  <TextInput
                    style={styles.assignSearchInput}
                    placeholder="Search agents…"
                    placeholderTextColor="#94a3b8"
                    value={assignSearch}
                    onChangeText={setAssignSearch}
                  />
                  {assignSearch !== "" && (
                    <TouchableOpacity onPress={() => setAssignSearch("")}>
                      <Ionicons name="close-circle" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                  {(() => {
                    const filtered = staffList.filter((s) =>
                      `${s.firstname} ${s.lastname} ${s.email}`
                        .toLowerCase()
                        .includes(assignSearch.toLowerCase())
                    );
                    if (filtered.length === 0)
                      return <Text style={styles.noStaffText}>No agents found</Text>;
                    return filtered.map((staff) => {
                      const isCurrent = String(staff.staffid) === String(currentAssignedId);
                      const color = avatarColor(staff.firstname);
                      return (
                        <TouchableOpacity
                          key={staff.staffid}
                          style={[styles.staffRow, isCurrent && styles.staffRowActive]}
                          onPress={() => handleAssign(String(staff.staffid))}
                        >
                          <View style={[styles.staffAvatar, { backgroundColor: color + "22" }]}>
                            <Text style={[styles.staffAvatarText, { color }]}>
                              {staff.firstname.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.staffName, isCurrent && { color: "#6366f1" }]}>
                              {staff.firstname} {staff.lastname}
                            </Text>
                            <Text style={styles.staffEmail}>{staff.email}</Text>
                          </View>
                          {isCurrent ? (
                            <View style={styles.currentBadge}>
                              <Ionicons name="checkmark" size={12} color="#fff" />
                              <Text style={styles.currentBadgeText}>Assigned</Text>
                            </View>
                          ) : (
                            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                          )}
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Bulk action bar */}
      {isSelectMode && selectedIds.size > 0 && (
        <View style={styles.bulkBar}>
          <Text style={styles.bulkCount}>{selectedIds.size} selected</Text>
          <TouchableOpacity style={styles.bulkAssignBtn} onPress={openBulkAssign}>
            <Ionicons name="person-add-outline" size={16} color="#fff" />
            <Text style={styles.bulkAssignText}>Assign</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bulkCancelBtn} onPress={exitSelectMode}>
            <Text style={styles.bulkCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB — Add DB Lead */}
      {!isSelectMode && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/add-db-lead")}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <Toast msg={toastMsg} type={toastType} anim={toastAnim} />
    </View>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function AssignedDropdown({
  value,
  onChange,
  staffList,
}: {
  value: string;
  onChange: (v: string) => void;
  staffList: StaffMember[];
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selected = staffList.find((s) => String(s.staffid) === value);
  const selectedLabel = selected ? `${selected.firstname} ${selected.lastname}` : null;

  const filtered = staffList.filter((s) =>
    `${s.firstname} ${s.lastname} ${s.email}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <View style={adStyles.wrapper}>
      <Text style={adStyles.sectionLabel}>ASSIGNED TO</Text>

      <TouchableOpacity
        style={[adStyles.trigger, open && adStyles.triggerOpen]}
        onPress={() => { setOpen(!open); setQ(""); }}
        activeOpacity={0.8}
      >
        {selected ? (
          <View style={adStyles.triggerSelected}>
            <View style={[adStyles.triggerAvatar, { backgroundColor: avatarColor(selected.firstname) + "22" }]}>
              <Text style={[adStyles.triggerAvatarText, { color: avatarColor(selected.firstname) }]}>
                {selected.firstname.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={adStyles.triggerName} numberOfLines={1}>{selectedLabel}</Text>
          </View>
        ) : (
          <View style={adStyles.triggerSelected}>
            <Ionicons name="people-outline" size={16} color="#94a3b8" />
            <Text style={adStyles.triggerPlaceholder}>All Agents</Text>
          </View>
        )}
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color="#94a3b8" />
      </TouchableOpacity>

      {open && (
        <View style={adStyles.panel}>
          <View style={adStyles.searchRow}>
            <Ionicons name="search" size={14} color="#94a3b8" />
            <TextInput
              style={adStyles.searchInput}
              placeholder="Search agents…"
              placeholderTextColor="#94a3b8"
              value={q}
              onChangeText={setQ}
              autoFocus
            />
            {q !== "" && (
              <TouchableOpacity onPress={() => setQ("")}>
                <Ionicons name="close-circle" size={15} color="#cbd5e1" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[adStyles.row, value === "" && adStyles.rowSelected]}
            onPress={() => { onChange(""); setOpen(false); setQ(""); }}
          >
            <View style={[adStyles.avatar, { backgroundColor: "#e2e8f0" }]}>
              <Ionicons name="people" size={14} color="#64748b" />
            </View>
            <Text style={[adStyles.rowText, value === "" && adStyles.rowTextSelected]}>All Agents</Text>
            {value === "" && <Ionicons name="checkmark" size={15} color="#6366f1" />}
          </TouchableOpacity>

          <ScrollView
            style={adStyles.list}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {filtered.length === 0 ? (
              <Text style={adStyles.empty}>No agents found</Text>
            ) : (
              filtered.map((s) => {
                const sid = String(s.staffid);
                const isSelected = value === sid;
                const col = avatarColor(s.firstname);
                return (
                  <TouchableOpacity
                    key={sid}
                    style={[adStyles.row, isSelected && adStyles.rowSelected]}
                    onPress={() => { onChange(sid); setOpen(false); setQ(""); }}
                  >
                    <View style={[adStyles.avatar, { backgroundColor: col + "22" }]}>
                      <Text style={[adStyles.avatarText, { color: col }]}>
                        {s.firstname.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[adStyles.rowText, isSelected && adStyles.rowTextSelected]} numberOfLines={1}>
                        {s.firstname} {s.lastname}
                      </Text>
                      <Text style={adStyles.rowEmail} numberOfLines={1}>{s.email}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark" size={15} color="#6366f1" />}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const adStyles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.8, marginBottom: 8 },
  trigger: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#f8fafc", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0",
    paddingHorizontal: 14, paddingVertical: 12,
  },
  triggerOpen: { borderColor: "#6366f1", backgroundColor: "#eef2ff" },
  triggerSelected: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  triggerAvatar: { width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  triggerAvatarText: { fontSize: 13, fontWeight: "700" },
  triggerName: { fontSize: 14, fontWeight: "600", color: "#1e293b", flex: 1 },
  triggerPlaceholder: { fontSize: 14, color: "#94a3b8" },
  panel: {
    backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0",
    marginTop: 6, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9", backgroundColor: "#fafafa",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1e293b" },
  list: { maxHeight: 220 },
  empty: { textAlign: "center", color: "#94a3b8", padding: 20, fontSize: 13 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: "#f8fafc",
  },
  rowSelected: { backgroundColor: "#eef2ff" },
  avatar: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 14, fontWeight: "700" },
  rowText: { fontSize: 13, fontWeight: "500", color: "#1e293b" },
  rowTextSelected: { color: "#6366f1", fontWeight: "700" },
  rowEmail: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f1f5f9" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#64748b" },

  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    backgroundColor: "#fff", gap: 10,
    borderBottomWidth: 1, borderBottomColor: "#e2e8f0",
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "#f8fafc", justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: "#e2e8f0", gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1e293b" },
  filterBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "#eef2ff", justifyContent: "center", alignItems: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: "#6366f1", borderRadius: 9,
    minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", paddingHorizontal: 3,
  },
  filterBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  statsRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  statsText: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  clearChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#eef2ff", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
  },
  clearChipText: { fontSize: 12, color: "#6366f1", fontWeight: "500" },

  successBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#d1fae5", marginHorizontal: 16, marginTop: 12,
    padding: 10, borderRadius: 10,
  },
  successText: { fontSize: 13, color: "#065f46", fontWeight: "500" },

  listContent: { paddingBottom: 90, paddingTop: 4 },

  leadCard: {
    backgroundColor: "#fff", borderRadius: 14,
    marginHorizontal: 16, marginTop: 8,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10,
    shadowColor: "#64748b", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  leadCardSelected: { borderWidth: 1.5, borderColor: "#6366f1", backgroundColor: "#eef2ff" },

  cardTop: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 10 },
  avatarLetter: { fontSize: 18, fontWeight: "700" },
  cardMeta: { flex: 1, marginRight: 8 },
  leadName: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  phoneText: { fontSize: 12, color: "#64748b" },
  actionIcons: { flexDirection: "row", gap: 6 },
  iconBtnAssign: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "#eef2ff", justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#c7d2fe",
  },
  iconBtnCall: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: "#2563eb",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#2563eb", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2,
  },
  iconBtnWa: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: "#25D366",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#25D366", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  cardDivider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 8 },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sourceBadge: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  sourcePrefix: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },
  sourceText: { fontSize: 11, color: "#6366f1", fontWeight: "600" },
  rightBottom: { flexDirection: "row", alignItems: "center", gap: 6 },
  budgetBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#d1fae5", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  budgetText: { fontSize: 10, color: "#065f46", fontWeight: "600" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, maxWidth: 120 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusLabel: { fontSize: 10, fontWeight: "600" },

  // Select mode
  checkbox: {
    width: 26, height: 26, borderRadius: 7,
    borderWidth: 2, borderColor: "#cbd5e1",
    backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginRight: 10,
  },
  checkboxSelected: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  selectBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "#eef2ff", justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  selectBtnActive: { backgroundColor: "#eef2ff", borderColor: "#6366f1" },

  // Bulk bar
  bulkBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1e293b",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32, gap: 10,
  },
  bulkCount: { flex: 1, fontSize: 14, fontWeight: "600", color: "#fff" },
  bulkAssignBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#6366f1", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
  },
  bulkAssignText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  bulkCancelBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  bulkCancelText: { fontSize: 14, color: "#94a3b8", fontWeight: "500" },

  emptyBox: { alignItems: "center", paddingTop: 60, paddingBottom: 40 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#1e293b", marginTop: 14 },
  emptySubtitle: { fontSize: 14, color: "#94a3b8", marginTop: 6 },
  errorBox: { alignItems: "center", padding: 32 },
  errorText: { fontSize: 15, color: "#64748b", textAlign: "center", marginTop: 10, marginBottom: 18 },
  retryBtn: { backgroundColor: "#6366f1", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { fontSize: 14, fontWeight: "600", color: "#fff" },

  footerLoader: { paddingVertical: 20, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  loadingMoreText: { fontSize: 13, color: "#64748b" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, maxHeight: "88%",
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },

  filterSection: { marginBottom: 22 },
  filterSectionLabel: { fontSize: 12, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  chipRow: { flexDirection: "row", gap: 8, paddingRight: 20 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22,
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0",
  },
  chipActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  chipText: { fontSize: 13, color: "#475569" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  dotSmall: { width: 7, height: 7, borderRadius: 4 },

  sortRow: { flexDirection: "row", gap: 10 },
  sortBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, paddingVertical: 12, borderRadius: 12,
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0",
  },
  sortBtnActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  sortBtnText: { fontSize: 13, color: "#475569", fontWeight: "500" },
  sortBtnTextActive: { color: "#fff", fontWeight: "600" },

  modalFooter: { flexDirection: "row", gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  clearBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  clearBtnText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  applyBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: "#6366f1", alignItems: "center" },
  applyBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },

  fab: {
    position: "absolute", bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#6366f1", justifyContent: "center", alignItems: "center",
    shadowColor: "#6366f1", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },

  // Assign modal
  assignSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, maxHeight: "65%",
  },
  assigningBox: { paddingVertical: 40, alignItems: "center" },
  assigningText: { marginTop: 12, fontSize: 14, color: "#64748b" },
  noStaffText: { textAlign: "center", color: "#94a3b8", padding: 32, fontSize: 14 },
  staffRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", gap: 12,
  },
  staffRowActive: { backgroundColor: "#eef2ff", borderRadius: 12, borderColor: "#c7d2fe", borderWidth: 1 },
  staffAvatar: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  staffAvatarText: { fontSize: 17, fontWeight: "700" },
  staffName: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  staffEmail: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  currentBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#6366f1", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  currentBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  assignSearchBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0",
    paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 12,
  },
  assignSearchInput: { flex: 1, fontSize: 14, color: "#1e293b" },
});
