import { useLocation } from "wouter";
import { useAdminAuthStore } from "@/lib/store";
import { useListAdminContacts, getListAdminContactsQueryKey, type ContactMessage } from "@workspace/api-client-react";
import { fmtDate } from "@/components/purchase-ui";
import { useState, useEffect } from "react";
import { ChevronRight, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { D, PAGE_SIZE, SearchBar, Pagination, Field } from "./_shared";
import { Modal } from "./_modal";
import { AdminLayout } from "./layout";

/* ─── Contact detail modal ────────────────────────────────────── */
function ContactModal({ contact, onClose }: { contact: ContactMessage; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={`Message from ${contact.name}`} subtitle={fmtDate(contact.createdAt)}>
      {/* Quick actions */}
      <div className="flex gap-2 flex-wrap">
        <a href={`mailto:${contact.email}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#8d6b3d] text-white hover:opacity-90 transition-colors">
          <Mail className="h-4 w-4" />Reply via Email
        </a>
        {contact.phone && (
          <a href={`tel:${contact.phone}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors">
            <Phone className="h-4 w-4" />Call
          </a>
        )}
      </div>

      {/* Details */}
      <div className={cn("rounded-xl p-4 border", "bg-[#111f35]", D.border)}>
        <Field label="Name"     value={contact.name} />
        <Field label="Email"    value={<a href={`mailto:${contact.email}`} className={cn(D.accent, "hover:underline")}>{contact.email}</a>} />
        {contact.phone && <Field label="Phone" value={<a href={`tel:${contact.phone}`} className={cn(D.muted, "hover:underline")}>{contact.phone}</a>} />}
        <Field label="Received" value={fmtDate(contact.createdAt)} />
      </div>

      {/* Message */}
      <div className={cn("rounded-xl p-4 border", "bg-[#111f35]", D.border)}>
        <p className={cn("text-xs font-semibold uppercase tracking-wider mb-3", D.muted)}>Message</p>
        <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", D.sub)}>{contact.message}</p>
      </div>
    </Modal>
  );
}

/* ─── Messages page ───────────────────────────────────────────── */
export default function AdminMessages() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAdminAuthStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  useEffect(() => { setPage(1); }, [search]);

  if (!isAuthenticated) { navigate("/admin/login"); return null; }

  const params = { page, limit: PAGE_SIZE, ...(search ? { search } : {}) };
  const { data: result } = useListAdminContacts(params, {
    query: { queryKey: getListAdminContactsQueryKey(params) },
  });

  const contacts: ContactMessage[] = result?.contacts ?? [];
  const total: number              = result?.total ?? 0;

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Heading */}
        <div className="mb-6">
          <h1 className={cn("text-2xl font-bold", D.text)}>Contact Messages</h1>
          {total > 0 && <p className={cn("text-sm mt-0.5", D.muted)}>{total} total</p>}
        </div>

        {/* Search */}
        <div className="mb-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or message…" />
        </div>

        {/* List */}
        <div className={cn("rounded-2xl border overflow-hidden", D.card, D.border)}>
          <div className={cn("divide-y", D.divide)}>
            {contacts.map((contact) => (
              <div key={contact.id} onClick={() => setSelected(contact)}
                className={cn("p-4 cursor-pointer transition-colors", D.cardHov)}>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="min-w-0">
                    <p className={cn("font-medium text-sm", D.text)}>{contact.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className={cn("text-xs", D.accent)}>{contact.email}</span>
                      {contact.phone && <span className={cn("text-xs", D.muted)}>{contact.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn("text-xs whitespace-nowrap", D.muted)}>{fmtDate(contact.createdAt)}</span>
                    <ChevronRight className={cn("h-4 w-4", D.muted)} />
                  </div>
                </div>
                <p className={cn("text-xs line-clamp-2 leading-relaxed", D.muted)}>{contact.message}</p>
              </div>
            ))}
            {contacts.length === 0 && (
              <div className={cn("py-14 text-center text-sm", D.muted)}>No messages found.</div>
            )}
          </div>
          <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>

      {selected && (
        <ContactModal contact={selected} onClose={() => setSelected(null)} />
      )}
    </AdminLayout>
  );
}
