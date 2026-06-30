export type FriendshipStatus = "pending" | "accepted" | "declined" | "blocked";

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  respondedAt: string | null;
}
