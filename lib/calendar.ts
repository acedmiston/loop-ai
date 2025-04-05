export async function addToGoogleCalendar(event: {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
}) {
  // Future integration with Google Calendar API
  console.log('[calendar] Would sync event to calendar:', event);
}
