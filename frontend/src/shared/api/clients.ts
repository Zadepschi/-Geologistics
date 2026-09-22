import type { Client } from "@/entities/client";

export async function fetchClients(): Promise<Client[]> {
  const res = await fetch("/api/clients");

  if (!res.ok) {
    throw new Error("Failed to fetch clients");
  }

  return res.json();
}