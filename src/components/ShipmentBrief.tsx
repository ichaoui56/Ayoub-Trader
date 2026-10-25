"use client";

import { useState } from "react";
import ShipmentDialog from "./ShipmentDialog";

export default function ShipmentBrief() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="on-light bg-ink px-7 py-4 font-semibold text-paper hover:bg-signal hover:text-ink"
      >
        Prepare your shipment brief ↗
      </button>
      <ShipmentDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
