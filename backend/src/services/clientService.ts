import {
  getAllClients,
  createClient as createClientRepository,
  updateClient as updateClientRepository,
  archiveClient as archiveClientRepository,
} from "../repositories/clientRepository.js";

export async function getClients() {
  return getAllClients();
}

export async function createClient(data: {
  name: string;
  phone: string;
  email: string;
  address: string;
}) {
  if (
    !data.name ||
    !data.phone ||
    !data.email ||
    !data.address
  ) {
    throw new Error(
      "name, phone, email and address are required",
    );
  }

  const id = `client-${Date.now()}`;

  return createClientRepository({
    id,
    ...data,
  });
}

export async function updateClient(
  id: string,
  data: {
    name: string;
    phone: string;
    email: string;
    address: string;
    isArchived?: boolean;
  },
) {
  if (
    !data.name ||
    !data.phone ||
    !data.email ||
    !data.address
  ) {
    throw new Error(
      "name, phone, email and address are required",
    );
  }

  return updateClientRepository(id, data);
}

export async function archiveClient(
  id: string,
  isArchived: boolean,
) {
  return archiveClientRepository(id, isArchived);
}