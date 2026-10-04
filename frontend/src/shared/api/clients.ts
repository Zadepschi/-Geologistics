import type { Client } from "@/entities/client";

export async function fetchClients(): Promise<Client[]> {
  const res = await fetch("/api/clients");

  if (!res.ok) {
    throw new Error("Failed to fetch clients");
  }

  return res.json();
}

export async function createClient(data: {
  name: string;
  phone: string;
  email: string;
  address: string;
}): Promise<Client> {
  const res = await fetch("/api/clients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create client");
  }

  return res.json();
}

export async function updateClient(
  id: string,
  data: {
    name: string;
    phone: string;
    email: string;
    address: string;
    isArchived?: boolean;
  }
): Promise<Client> {
  const res = await fetch(`/api/clients/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to update client");
  }

  return res.json();
}

export async function archiveClient(
  id: string,
  isArchived = true
): Promise<Client> {
  const res = await fetch(
    `/api/clients/${id}/archive`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isArchived,
      }),
    },
  );

  if (!res.ok) {
    throw new Error(
      isArchived
        ? "Failed to archive client"
        : "Failed to restore client",
    );
  }

  return res.json();
}

export async function deleteClient(
  id: string
): Promise<void> {
  const res = await fetch(
    `/api/clients/${id}`,
    {
      method: "DELETE",
    },
  );

  if (!res.ok) {
    throw new Error("Failed to delete client");
  }
}