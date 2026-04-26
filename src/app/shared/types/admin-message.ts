export type MessageStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export type MessageIntelligence = {
  classification: string | null;
  sentiment: string | null;
  urgencyScore: number | null;
  priorityScore: number | null;
  suggestedReply: string | null;
};

export type AdminMessage = {
  id: string;
  senderName: string | null;
  senderEmail: string;
  body: string;
  status: MessageStatus;
  createdAt: string;
  intelligence: MessageIntelligence | null;
  session: { id: string; visitorId: string; startedAt: string } | null;
};
