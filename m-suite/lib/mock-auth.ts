// Mock auth for local development without Azure AD
// Replace with real Auth.js when deploying for IEs

export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: "IE" | "REVIEWER" | "ADMIN";
};

const MOCK_USERS: MockUser[] = [
  { id: "admin-1", name: "Angelus Morningstar", email: "angelus@whitewater.com", role: "ADMIN" },
  { id: "ie-1", name: "Priya Sharma", email: "priya@whitewater.com", role: "IE" },
  { id: "reviewer-1", name: "Bernard Leung", email: "bernard@whitewater.com", role: "REVIEWER" },
  { id: "reviewer-2", name: "Adam Salzer", email: "adam@whitewater.com", role: "REVIEWER" },
];

// Default to Angelus for local dev
let currentUserId = "admin-1";

export function getCurrentUser(): MockUser {
  return MOCK_USERS.find((u) => u.id === currentUserId) ?? MOCK_USERS[0];
}

export function setCurrentUser(id: string) {
  currentUserId = id;
}

export function getAllUsers(): MockUser[] {
  return MOCK_USERS;
}
