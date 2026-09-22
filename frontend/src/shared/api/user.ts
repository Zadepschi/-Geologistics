export type User = {
  id: number;
  name: string;
};

export async function fetchUser(): Promise<User> {
  const res = await fetch("/api/user");

  if (!res.ok) {
    throw new Error("Failed to fetch user");
  }

  return res.json();
}