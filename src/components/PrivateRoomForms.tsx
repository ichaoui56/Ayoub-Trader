"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import VipRoomCoverUpload from "./VipRoomCoverUpload";
import {
  assignPlatformRoomCustomer,
  createPlatformRoom,
  deletePlatformRoom,
  updatePlatformRoom,
  type PlatformRoomActionState,
} from "../server/platform-room-actions";

const initialState: PlatformRoomActionState = { success: false, message: "" };

type AssignableCustomer = {
  membershipId: string;
  clientId: string;
  name: string;
  email: string | null;
  expiresAt: string;
};

type DeletionBlockers = { assignments: number; transactions: number; posts: number };

function ActionMessage({ state }: { state: PlatformRoomActionState }) {
  if (!state.message) return null;
  return <p className={`room-action-message ${state.success ? "is-success" : "is-error"}`} role={state.success ? "status" : "alert"}>{state.message}</p>;
}

export function CreatePrivateRoomForm() {
  const [state, action, pending] = useActionState(createPlatformRoom, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.slug) router.push(`/dashboard/rooms/${state.slug}`);
  }, [router, state.slug, state.success]);

  return (
    <section className="dash-panel room-management-panel room-editor-panel">
      <div className="room-editor-section-head"><div><span className="room-editor-step">01</span><div><h2>Create a private room</h2><p>New rooms are published when created and can be assigned to active members.</p></div></div><span className="room-editor-status"><i />Published after creation</span></div>
      <form ref={formRef} action={action} className="platform-entry-form room-create-form">
        <label>Room name<input name="name" maxLength={80} required placeholder="e.g. Premium Signals" /></label>
        <label>Category<input name="category" maxLength={40} required defaultValue="General" /></label>
        <label className="platform-entry-notes">Description<textarea name="description" maxLength={500} rows={4} placeholder="What members will find in this room" /></label>
        <div className="room-cover-field"><span>Cover image</span><VipRoomCoverUpload /></div>
        <div className="room-editor-actions"><button className="dash-primary-button" type="submit" disabled={pending}>{pending ? "Creating…" : "Create room"}</button></div>
      </form>
      <ActionMessage state={state} />
    </section>
  );
}

export function AssignRoomCustomerForm({ roomId, customers }: { roomId: string; customers: AssignableCustomer[] }) {
  const [state, action, pending] = useActionState(assignPlatformRoomCustomer, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);

  return (
    <section className="dash-panel room-management-panel">
      <div className="dash-section-head"><div><h2>Assign a customer</h2><p>Only customers with active, unexpired memberships can be assigned.</p></div></div>
      {customers.length ? <form action={action} className="room-assignment-form">
        <input type="hidden" name="roomId" value={roomId} />
        <label>Customer<select name="membershipId" required defaultValue=""><option value="" disabled>Select an eligible customer</option>{customers.map((customer) => <option key={customer.membershipId} value={customer.membershipId}>{customer.name} · {customer.clientId}{customer.email ? ` · ${customer.email}` : ""}</option>)}</select></label>
        <button className="dash-primary-button" type="submit" disabled={pending}>{pending ? "Assigning…" : "Assign customer"}</button>
      </form> : <div className="room-management-empty">Every customer with an active membership is already assigned, or no active memberships are available.</div>}
      <ActionMessage state={state} />
    </section>
  );
}

export function UpdatePrivateRoomForm({ room }: { room: { id: string; slug: string; name: string; category: string; description: string; coverImage: string; isPublished: boolean } }) {
  const [state, action, pending] = useActionState(updatePlatformRoom, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.slug) router.replace(`/dashboard/rooms/${state.slug}`);
  }, [router, state.slug, state.success]);

  return (
    <section className="dash-panel room-management-panel room-editor-panel">
      <div className="room-editor-section-head"><div><span className="room-editor-step">01</span><div><h2>Room details</h2><p>Update the information and visibility shown to members.</p></div></div><span className="room-editor-status"><i />{room.isPublished ? "Currently published" : "Currently hidden"}</span></div>
      <form action={action} className="platform-entry-form room-edit-form">
        <input type="hidden" name="roomId" value={room.id} />
        <label>Room name<input name="name" maxLength={80} required defaultValue={room.name} /></label>
        <label>Category<input name="category" maxLength={40} required defaultValue={room.category} /></label>
        <label className="platform-entry-notes">Description<textarea name="description" maxLength={500} rows={4} defaultValue={room.description} /></label>
        <div className="room-cover-field"><span>Room cover</span><VipRoomCoverUpload initialImage={room.coverImage} /></div>
        <label className="room-publish-toggle"><span>Room availability</span><span><input type="checkbox" name="isPublished" defaultChecked={room.isPublished} /> Published and available to members</span></label>
        <div className="room-editor-actions"><button className="dash-primary-button" type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button></div>
      </form>
      <ActionMessage state={state} />
    </section>
  );
}

export function DeletePrivateRoomForm({ roomId, roomName, blockers }: { roomId: string; roomName: string; blockers: DeletionBlockers }) {
  const [state, action, pending] = useActionState(deletePlatformRoom, initialState);
  const router = useRouter();
  const hasHistory = blockers.assignments > 0 || blockers.transactions > 0 || blockers.posts > 0;

  useEffect(() => {
    if (state.success) router.replace("/dashboard/rooms");
  }, [router, state.success]);

  return (
    <section className="dash-panel room-delete-panel">
      <div className="dash-section-head"><div><h2>Delete room</h2><p>Room history is protected from deletion.</p></div></div>
      {hasHistory ? <p className="room-delete-note">This room has {blockers.assignments} assignments, {blockers.posts} posts, and {blockers.transactions} financial transactions. Preserve the history by leaving the room in place.</p> : <form action={action} onSubmit={(event) => { if (!window.confirm(`Permanently delete ${roomName}?`)) event.preventDefault(); }}>
        <input type="hidden" name="roomId" value={roomId} />
        <button className="room-delete-button" type="submit" disabled={pending}>{pending ? "Deleting…" : `Delete ${roomName}`}</button>
      </form>}
      <ActionMessage state={state} />
    </section>
  );
}