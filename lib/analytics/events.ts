/** Product events. Keep names stable: dashboards depend on them. */
export type AnalyticsEvent =
  | "signed_up"
  | "signed_in"
  | "onboarding_completed"
  | "profile_updated"
  | "friend_request_sent"
  | "friend_request_accepted"
  | "friend_invite_link_shared"
  | "trip_created"
  | "expense_added"
  | "payment_marked";
